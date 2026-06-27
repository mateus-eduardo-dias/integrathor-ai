import auth from "./auth.js"
import definitions from "./definitions.js"
import inquirer from "inquirer"

export default {
    serviceAuth: async () => {
        try {
            let configAuth = await inquirer.prompt([
                {
                    type: "rawlist",
                    name: "provider",
                    message: "Choose a provider: ",
                    choices: definitions.getSupportedServices,
                    default: definitions.getSupportedServices[0]
                },
                {
                    type: "password",
                    name: "key",
                    message: "API Key: ",
                    mask: true
                }
            ])
            
            auth.setApiKey(configAuth)
            return configAuth.provider
        }
        catch (err) {
            if (err.name == "ExitPromptError") {
                console.log(`\n${err.name}: Quitting...`)
                process.exit(0)
            } else {
                throw err
            }
        }
    }
}