import auth from "./auth.js"
import definitions from "./definitions.js"
import inquirer from "inquirer"

export default {
    serviceAuth: async (allowExit=false) => {
        try {
            let configAuth = await inquirer.prompt([
                {
                    type: "rawlist",
                    name: "provider",
                    message: "Choose a provider: ",
                    choices: allowExit ? [...definitions.getSupportedServices, 'exit'] : definitions.getSupportedServices,
                    default: definitions.getSupportedServices[0]
                },
                {
                    type: "password",
                    name: "key",
                    message: "API Key: ",
                    mask: true
                }
            ])

            if (configAuth.provider == 'exit') {
                return false
            }

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