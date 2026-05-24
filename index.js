import { Ollama } from "ollama"
import readline from 'readline/promises'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

console.log(process.argv)

const model = await rl.question('Model: ')
const think = await rl.question('Thinking? y/n [y]: ')
const ollama = new Ollama()

do {
    const text = await rl.question('> ')

    if (text == '/quit') {
        break;
    }

    let response
    try {
        response = await ollama.chat({
            model,
            messages: [{role: 'user', content: text}],
            think: think.toUpperCase() == 'Y',
            stream: false,
        })
    } catch (err) {
        console.error(`ERROR: ${err.status_code}`)
        console.log(err.error)
        process.exit(1)
    }

    /*
    if (process.argv[2] == '-d') {
        for await (const part of response) {
            console.log(part.message)
        }
    } else {
        for await (const part of response) {
            process.stdout.write(part.message.content)
        }
        process.stdout.write(Buffer.from(String.fromCharCode(10)))
    }
    */
    if (process.argv[2] == '-d') {
        console.warn("-- ANSWERING IN DEBUG MODE --")
        console.log(response.message)
    } else {
        console.log(response.message.content)
    }
} while (true)

process.exit(0)