import { browserSearch, createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import context from "../utils/context.js";
import tools from "../tools.js";

class GroqHandler {
    constructor() {
        this.groq = undefined
    }
    createClient(credential) {
        this.groq = createGroq({apiKey: credential})
    }
    async ask(model, prompt, DEBUG_MODE, isToolCall=false) {
        if (!isToolCall) {
            context.addUserMessage(prompt)
        }
        const message_ctx = context.getMessageContext()

        const chat = await generateText({
            model: this.groq(model),
            instructions: context.getSystemContext(),
            tools: {
                browserSearch: this.groq.tools.browserSearch({}),
                ...tools.data
            },
            toolChoice: 'auto',
            providerOptions: {
                groq: {
                    reasoningFormat: 'hidden'
                }
            },
            messages: message_ctx
        })

        let recall = false

        for (let message of chat.responseMessages) {
            if (DEBUG_MODE) {
                console.log(message.content)
            }
            if (message.content[0].type == 'text') {
                console.log(message.content[0].text)
            } else if (message.role == 'tool') {
                recall = true
            }
            context.addMessage(message)
        }

        if (recall) {
            await this.ask(model, prompt, DEBUG_MODE, true)
        }
    }
}

export default new GroqHandler