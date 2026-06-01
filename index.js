import Groq from "groq-sdk"
import dotenv from 'dotenv'
import inquirer from "inquirer"
import tools from "./tools.js"
dotenv.config()

const groq = new Groq({apiKey: process.env.GROQ_KEY})
const DEBUG_MODE = process.argv.includes('-d') || process.env.NODE_ENVIRONMENT == 'development'

// Todo: Setup for custom_vars
const custom_vars = {
    MAX_CTX: parseInt(process.env.MAX_CTX) || 4096
}

console.log()
DEBUG_MODE ? console.warn("WARNING: Debug Mode is active.") : console.log("Welcome to your terminal")

const modelChoices = [
    "openai/gpt-oss-120b", "openai/gpt-oss-20b", new inquirer.Separator(),
    "llama-3.3-70b-versatile", "llama-3.1-8b-instant", new inquirer.Separator(),
    "qwen/qwen3-32b", new inquirer.Separator(), 
    "groq/compound", "groq/compound-mini",
]

let config
try {
    config = await inquirer.prompt([
        {
            type: "rawlist",
            name: "model",
            message: "Choose a model:",
            choices: modelChoices,
            default: "openai/gpt-oss-120b"
        }
    ])
} catch (err) {
    if (err.name == "ExitPromptError") {
        console.log(`\n${err.name}: Quitting...`)
        process.exit(0)
    } else {
        throw err
    }
}

console.log(`Talking with: ${config.model}`)

const messages_ctx = []
const system_ctx = [{role: 'system', content: 'You are a helpfull assistant.'}]

let model_usage

do {
    try {
        console.log()
        const prompt = await inquirer.prompt([{type: 'input', name: 'content', message: '> '}])
        console.log()
        if (prompt.content.charAt(0) == '/') {
            await runSlashCommand(prompt.content)
        } else {
            await runAI(prompt.content)
        }
    } catch (err) {
        if (err.name == "ExitPromptError") {
            console.log(`\n${err.name}: Quitting...`)
            process.exit(0)
        } else {
            throw err
        }
    }
} while (true)

async function runAI(prompt, ctx_tools=[], save_ctx_tools=true) {
    const isToolCall = ctx_tools.length > 0
    let messages = isToolCall ? [...system_ctx, ...messages_ctx, ...ctx_tools] : [...system_ctx, ...messages_ctx, { role: "user", content: prompt }, ...ctx_tools]
    const chat = await groq.chat.completions.create({
        messages,
        model: config.model,
        tools: tools.config,
        tool_choice: 'auto',
        parallel_tool_calls: true
    })
    model_usage = chat.usage

    const requiresToolCall = chat.choices[0]?.message?.tool_calls != null

    if (!isToolCall) {
        messages_ctx.push({role: "user", content: prompt})
    } else if (save_ctx_tools) {
        messages_ctx.push(...ctx_tools)
        ctx_tools.length = 0
    }

    if (!save_ctx_tools && !requiresToolCall) {
        while (messages_ctx[messages_ctx.length - 1].role != 'user') {
            messages_ctx.pop()
        }
        messages_ctx.pop()
    }

    if (DEBUG_MODE) {
        console.log(chat.choices[0]?.message)
        console.log(chat.choices[0]?.message?.tool_calls)
    }

    if (!requiresToolCall) {
        if (isToolCall) {
            console.log()
        }
        console.log(chat.choices[0]?.message?.content || "")
        messages_ctx.push({role: "assistant", content: chat.choices[0].message.content})
    } else {
        ctx_tools.push({role: 'assistant', content: '', tool_calls: chat.choices[0].message.tool_calls})
        let saveCalls = true
        for (let call of chat.choices[0]?.message?.tool_calls) {
            console.log(`Running: ${call.function.name}`)
            if (!tools.hasContext[call.function.name]) {
                saveCalls = false
            }
            const returnValue = await tools.functions[call.function.name](JSON.parse(call.function.arguments))
            const tool_message = {role: 'tool', content: returnValue, tool_call_id: call.id}
            ctx_tools.push(tool_message)
        }

        await runAI(prompt, ctx_tools, saveCalls)
    }
}

async function runSlashCommand(prompt) {
    const prompt_divided = prompt.split(' ')
    const command = prompt_divided[0]
    const command_args = prompt_divided.slice(1)
    if (command == '/help') {
        console.log("Commands:")
        console.log('/quit                    ----- Exit the terminal')
        console.log('/clear                   ----- Clear the context window')
        console.log('/context                 ----- Show the context window')
        console.log('/context size            ----- Show the estimated size (tokens) of the context window')
        console.log("/rss <light|medium|full> ----- Summarizes a RSS Feed")
    } else if (command == '/quit') {
        console.log("Quitting...")
        process.exit(0)
    } else if (command == '/clear') {
        messages_ctx.length = 0
    } else if (command == '/context') {
        if (command_args[0] == 'size') {
            console.log(`Estimated tokens: ${estimateTokens(messages_ctx)}`)
        } else {
            console.log(messages_ctx)
        }
    } else if (command == '/rss') {
        if (command_args[0] == 'light') {
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to 4000.`)
        } else if (command_args[0] == 'full') {
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to 8000.`)
        } else if (command_args[0] == 'medium' || command_args[0] == null) { // Medium
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to default.`)
        } else {
            console.log(`Invalid size: ${command_args[0]}. Possible options: light, medium, full`)
        }
    } else if (command == '/usage') {
        console.log(model_usage)
    } else {
        console.error("ERROR: Command not found")
    }
}

function estimateTokens(messages) {
    return messages.reduce((n, m) =>
        n + Math.ceil(m.content.length / 4) + 4, 0);
}