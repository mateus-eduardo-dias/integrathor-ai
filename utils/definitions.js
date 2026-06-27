import inquirer from "inquirer"

const supported_services = ["groq", "gemini"]

const models = {
    groq: [
        "groq/openai/gpt-oss-120b", "groq/openai/gpt-oss-20b",
        "groq/llama-3.3-70b-versatile",
        "groq/qwen/qwen3-32b"
    ],
}

export default {
    getSupportedServices: supported_services,
    getAvailableModels: (services) => {
        const availableModels = []
        for (let service of services) {
            let serviceModels = models[service] || []
            if (serviceModels.length != 0) {
                availableModels.push(serviceModels)
                availableModels.push(new inquirer.Separator())
            }
        }
        return availableModels
    }
}