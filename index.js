import Groq from "groq-sdk"
import dotenv from 'dotenv'
import inquirer from "inquirer"
dotenv.config()

const groq = new Groq({apiKey: process.env.GROQ_KEY})
const DEBUG_MODE = process.argv.includes('-d') || process.env.NODE_ENVIRONMENT == 'development'

const custom_vars = {
    MAX_CTX: parseInt(process.env.MAX_CTX) || 4096
}

console.log()
DEBUG_MODE ? console.warn("WARNING: Debug Mode is active.") : console.log("Welcome to your terminal")


let config
try {
    config = await inquirer.prompt([
        {
            type: "rawlist",
            name: "model",
            message: "Choose a model:",
            choices: ["qwen/qwen3-32b", "openai/gpt-oss-20b"],
            default: "qwen/qwen3-32b"
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

const tools = [
    {
        type: 'function',
        function: {
            name: 'get_temperature',
            description: 'Get the temperature of a certain city',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'City name'
                    },
                },
                required: ['city']
            }
        }
    }
]

const tools_fn = {
    get_temperature: (args) => {
        let parsed_args = JSON.parse(args)
        return JSON.stringify({city: parsed_args.city, temperature: 22, unit: 'Celsius'})
    }
}

console.log(`Talking with: ${config.model}`)

const messages_ctx = []

do {
    try {
        const prompt = await inquirer.prompt([{type: 'input', name: 'content', message: '> '}])
        console.log()
        if (prompt.content.charAt(0) == '/') {
            runSlashCommand(prompt.content)
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

async function runAI(prompt, ctx_tools=[]) {
    let messages = [...messages_ctx, { role: "user", content: prompt }, ...ctx_tools]
    const isToolCall = ctx_tools.length > 0
    const chat = await groq.chat.completions.create({
        messages,
        model: "openai/gpt-oss-20b",
        tools
    })

    const requiresToolCall = chat.choices[0]?.message?.tool_calls != null

    if (!isToolCall) {
        messages_ctx.push({role: "user", content: prompt})
    } else {
        messages_ctx.push(...ctx_tools)
    }

    if (DEBUG_MODE) {
        console.log(chat.choices[0]?.message)
        console.log(chat.choices[0]?.message?.tool_calls)
    }

    if (!requiresToolCall) {
        console.log()
        console.log(chat.choices[0]?.message?.content || "")
        messages_ctx.push({role: "assistant", content: chat.choices[0].message.content})
    } else {
        messages_ctx.push({role: 'assistant', content: '', tool_calls: chat.choices[0].message.tool_calls})
        for (let call of chat.choices[0]?.message?.tool_calls) {
            console.log(`Running: ${call.function.name}`)
            const returnValue = tools_fn[call.function.name](call.function.arguments)
            const tool_message = {role: 'tool', content: returnValue, tool_call_id: call.id}
            ctx_tools.push(tool_message)
        }
        await runAI(prompt, ctx_tools)
    }
}

function runSlashCommand(prompt) {
    if (prompt == '/quit') {
        console.log("Quitting...")
        process.exit(0)
    } else if (prompt == '/clear') {
        messages_ctx.length = 0
    } else if (prompt == '/context') {
        console.log(messages_ctx)
    } else if (prompt == '/context size') {
        console.log(`Estimated tokens: ${estimateTokens(messages_ctx)}`)
    } else {
        console.error("ERROR: Command not found")
    }
}

function estimateTokens(messages) {
    return messages.reduce((n, m) =>
        n + Math.ceil(m.content.length / 4) + 4, 0);
}