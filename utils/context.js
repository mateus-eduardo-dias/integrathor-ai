class ContextHandler {
    constructor() {
        this.messages_ctx = [],
        this.system_ctx = [{role: 'system', content: 'You are a helpfull assistant.'}]
    }
    getMessageContext() {
        return this.messages_ctx
    }
    addMessage(messages) {
        this.messages_ctx.push(messages)
    }
    getLastMessage() {
        return this.messages_ctx[this.messages_ctx.length - 1]
    }
    removeLastMessage() {
        this.messages_ctx.pop()
    }
    clearMessageContext() {
        this.messages_ctx.length = 0
    }
    getSystemContext() {
        return this.system_ctx
    }
}

export default new ContextHandler