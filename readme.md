# Integrator AI

Integrathor is a CLI App made in Node.js that can communicate with AI Models on [Groq](https://groq.com/) and integrate them with other services or APIs.

## Instalation

1. Install [Node.js](https://nodejs.org/)

2. Download the project:
```bash
git clone https://github.com/mateus-eduardo-dias/integrathor-ai.git
```

3. Install all dependencies:
```bash
npm install
```

4. Create a .env file and set your environment variables:
```env
# Required:
GROQ_KEY="Your Groq API Key"
# Optional:
NODE_ENVIRONMENT="development" # development mode allows debug. Every other mode is considered production
```

## Usage

Run `npm run start` or `node .` at the project's root directory.

By default the following models are available:
- openai/gpt-oss-120b
- openai/gpt-oss-20b
- llama-3.3-70b-versatile
- llama-3.1-8b-instant
- qwen/qwen3-32b
- meta-llama/llama-4-scout-17b-16e-instruct
- groq/compound
- groq/compound-mini

You can add/remove models on `index.js`, on future version you will be able to do it inside the app.
**Warning:** If adding new models, be aware that it has to be in [Groq's model list](https://console.groq.com/docs/models)

### Communicating with AI

When running the app you will be prompted to choose a model, you can switch between them using the arrow keys or by typing a number/name.
You will se a space where you can talk with the model (`? >`).

#### Tool Calling

Tools are still under development, you can see them at `tools.js`.
The file exports 3 objects:
- config: the list of tools that is sent to Groq.
- functions: the object literal containing all the functions that are executed when a tool is called (key: tool name, value: function).
- hasContext: the object literal that defines if the tool request/response should be added to context window (key: tool name, value: boolean)

#### Slash Commands

You can see all slash commands by typing `/help`.
- `/quit`: Exit the terminal/app
- `/clear`: Clear the context window
- `/context`: Show the context window
    - `/context size`: Show the estimated size (tokens) of the context window
- `/rss <light|medium|full>`: Summarizes a whole RSS feed.
    - light: 4k tokens
    - medium: 6k tokens
    - high: 9k tokens