import { Entry } from "@napi-rs/keyring"
import config from "./config.js"
import inquirer from "inquirer"

const supported_services = ["groq"]

const models = {
    groq: [
        "groq/openai/gpt-oss-120b", "groq/openai/gpt-oss-20b",
        "groq/llama-3.3-70b-versatile",
        "groq/qwen/qwen3-32b"
    ],
}

export default {
    getAPIKeys: (services) => {
        if (services.length == 0) {
            console.warn("Warning: No API Keys found.")
            return {}
        }
        const credentials = {}
        for (let service of services) {
            if (typeof service != 'string' || !supported_services.includes(service)) {
                console.error(`Invalid service: ${service}.`)
                config.removeService(service)
                credentials.update = true
                continue
            }
            let entry = new Entry('integrathor-ai', service)
            try {
                let credential = entry.getPassword()
                if (credential == null) {
                    console.error(`Invalid credential for ${service}.`)
                    config.removeService(service)
                    credentials.update = true
                    continue
                }
                credentials[service] = credential
            } catch (err) {
                console.error(`Keyring error: ${err.message}`)
                config.removeService(service)
            }
        }
        return credentials
    },
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