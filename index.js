import Groq from "groq-sdk"
import dotenv from 'dotenv'
import inquirer from "inquirer"
dotenv.config()

const groq = new Groq({apiKey: process.env.GROQ_KEY})

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
        console.log(`${err.name}: Quitting...`)
        process.exit(0)
    } else {
        throw err
    }
}

console.log(`Welcome to your terminal, talking with: ${config.model}`)

do {
    try {
        const prompt = await inquirer.prompt([{type: 'input', name: 'content', message: '> '}])
        if (prompt.content.charAt(0) == '/') {
            runSlashCommand(prompt.content)
        } else {
            await runAI(prompt.content)
        }
    } catch (err) {
        if (err.name == "ExitPromptError") {
            console.log(`${err.name}: Quitting...`)
            process.exit(0)
        } else {
            throw err
        }
    }
} while (true)

async function runAI(prompt) {
    const chat = await groq.chat.completions.create({
        messages: [
            { role: "user", content: prompt }
        ],
        model: "openai/gpt-oss-20b"
    })
    console.log(chat.choices[0]?.message?.content || "")
}

function runSlashCommand(prompt) {
    if (prompt == '/quit') {
        console.log("Quitting...")
        process.exit(0)
    } else {
        console.error("ERROR: Command not found")
    }
}

