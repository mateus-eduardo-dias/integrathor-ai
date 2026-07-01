class ContextHandler {
    constructor() {
        this.messages_ctx = [],
        this.system_ctx = {role: 'system', content: 'You are a helpfull assistant.'}
    }
    getMessageContext() {
        return this.messages_ctx
    }
    //addMessage(messages) {
    //    this.messages_ctx.push(messages)
    //}
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


    addUserMessage(text) {
        this.messages_ctx.push({role: 'user', content: [{type: 'text', text}]})
    }
    addMessage(message) {
        this.messages_ctx.push(message)
    }
}

export default new ContextHandler