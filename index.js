import inquirer from "inquirer"
import configUtils from './utils/config.js'
import auth from "./utils/auth.js"
import screens from "./utils/ui.js"
import definitions from "./utils/definitions.js"
import groqHandler from "./providers/groq.js"
import contextHandler from "./utils/context.js"

let config = configUtils.load()
let credentials = auth.getAPIKeys(Array.isArray(config.connected) ? config.connected : [])
if (credentials.update === true) {
    console.log("Updating config...")
    config = configUtils.load()
}

const modelChoices = definitions.getAvailableModels(config.connected)

if (modelChoices.length == 0) {
    console.log("No available models, authentication required.")
    let newProvider = await screens.serviceAuth()
    configUtils.addService(newProvider)
    console.log("Updating config...")
    config = configUtils.load()
    credentials = auth.getAPIKeys(Array.isArray(config.connected) ? config.connected : [])
}

console.log()
let model_config
try {
    model_config = await inquirer.prompt([
        {
            type: "rawlist",
            name: "model",
            message: "Choose a model:",
            choices: modelChoices,
            default: modelChoices[0]
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

const DEBUG_MODE = process.argv.includes('-d') || config.NODE_ENVIRONMENT == 'development'
DEBUG_MODE ? console.warn("\nWARNING: Debug Mode is active.\n") : console.log("\nWelcome to your terminal\n")
console.log(`Talking with: ${model_config.model}`)

let modelProvider = model_config.model.split('/')[0]
let modelName = model_config.model.split('/').slice(1).join('/')
const providersLoaded = {modelProvider: true}

if (modelProvider == 'groq') {
    groqHandler.createClient(credentials.groq)
}

// Todo: Setup for custom_vars
const custom_vars = {
    MAX_CTX: parseInt(config.MAX_CTX) || 4096
}

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
    if (modelProvider == 'groq') {
        await groqHandler.ask(modelName, DEBUG_MODE, prompt, ctx_tools, save_ctx_tools)
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
        contextHandler.clearMessageContext()
    } else if (command == '/context') {
        if (command_args[0] == 'size') {
            console.log(`Estimated tokens: ${estimateTokens(contextHandler.getMessageContext())}`)
        } else {
            console.log(contextHandler.getMessageContext())
        }
    } else if (command == '/rss') {
        if (command_args[0] == 'full') {
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to 9000.`)
        } else if (command_args[0] == 'medium') {
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to 6000.`)
        } else if (command_args[0] == 'light' || command_args[0] == null) { // Medium
            await runAI(`You are a senior journalist writing a morning briefing.
            Write many paragraphs synthesizing all the news from the RSS feed. Between 5-10 10 tight paragraphs.
            No bullet points. No headers. Journalistic, concise tone. Set max rss to default.`)
        } else {
            console.log(`Invalid size: ${command_args[0]}. Possible options: light, medium, full`)
        }
    } else {
        console.error("ERROR: Command not found")
    }
}

function estimateTokens(messages) {
    return messages.reduce((n, m) =>
        n + Math.ceil(m.content.length / 4) + 4, 0);
}