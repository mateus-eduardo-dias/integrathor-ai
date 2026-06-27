import fs from 'fs'

export default {
    load: readFile,
    addService: (service) => {
        if (typeof service != 'string') {
            return false
        }
        let file = readFile()
        if (!Array.isArray(file.connected)) {
            file.connected = [service]
        } else if (!file.connected.includes(service)) {
            file.connected.push(service)
        }

        updateFile(file)

        return true
    },
    removeService: (service) => {
        let file = readFile()
        if (!Array.isArray(file.connected)) {
            file.connected = []
        }
        file.connected = file.connected.filter(svc => svc != service)

        updateFile(file)

        return true
    }
}

function readFile() {
    let configExists = fs.existsSync('config.json')
    if (!configExists) {
        generateConfig()
        return getBoilerplateConfig()
    } else {
        try {
            return JSON.parse(fs.readFileSync('config.json'))
        } catch (err) {
            generateConfig();
            return getBoilerplateConfig()
        }
    }
}

function updateFile(config) {
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4))
}

function generateConfig() {
    console.log("Building config.json...")
    updateFile(getBoilerplateConfig())
}

function getBoilerplateConfig() {
    return {
        NODE_ENVIRONMENT: "production",
        MAX_CTX: 512,
        connected: []
    }
}