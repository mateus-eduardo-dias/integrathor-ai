import { Entry } from "@napi-rs/keyring"
import config from "./config.js"
import inquirer from "inquirer"
import definitions from "./definitions.js"

export default {
    getAPIKeys: (services) => {
        if (services.length == 0) {
            console.warn("Warning: No API Keys found.")
            return {}
        }
        const credentials = {}
        for (let service of services) {
            if (typeof service != 'string' || !definitions.getSupportedServices.includes(service)) {
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
    setApiKey: ({provider, key}) => {
        let entry = new Entry('integrathor-ai', provider)
        entry.setPassword(key)
    }
}