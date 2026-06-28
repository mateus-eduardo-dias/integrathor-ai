import Groq from "groq-sdk"
import contextHandler from "../utils/context.js"
import tools from "../tools.js"

class GroqHandler {
    constructor() {
        this.groq = undefined
    }
    createClient(credential) {
        if (!credential) {
            console.error("Error: Groq credential not sent.")
            process.exit(0)
        }
        this.groq = new Groq({apiKey: credential})
    }
    async ask(model, DEBUG_MODE, prompt, ctx_tools, save_ctx_tools) {
        const isToolCall = ctx_tools.length > 0
        let messages_ctx = contextHandler.getMessageContext()
        let system_ctx = contextHandler.getSystemContext()
        let messages = isToolCall ? [...system_ctx, ...messages_ctx, ...ctx_tools] : [...system_ctx, ...messages_ctx, { role: "user", content: prompt }, ...ctx_tools]
        const chat = await this.groq.chat.completions.create({
            messages,
            model: model,
            tools: tools.config,
            tool_choice: 'auto',
            parallel_tool_calls: true
        })

        const requiresToolCall = chat.choices[0]?.message?.tool_calls != null

        if (!isToolCall) {
            contextHandler.addMessage({role: "user", content: prompt})
        } else if (save_ctx_tools) {
            contextHandler.addMessage(...ctx_tools)
            ctx_tools.length = 0
        }

        if (!save_ctx_tools && !requiresToolCall) {
            while (contextHandler.getLastMessage().role != 'user') {
                contextHandler.removeLastMessage()
            }
            contextHandler.removeLastMessage()
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
            contextHandler.addMessage({role: "assistant", content: chat.choices[0].message.content})
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

            await this.ask(model, DEBUG_MODE, prompt, ctx_tools, saveCalls)
        }
    }
}

export default new GroqHandler