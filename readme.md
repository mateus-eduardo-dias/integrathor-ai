# Integrator AI

Integrathor is a CLI App that communicates with AI Models via [Groq](https://groq.com/) and can integrate with other services by using Tool Calls.

## Instalation

1. Download the project:
```bash
git clone https://github.com/mateus-eduardo-dias/integrathor-ai.git
```

2. Install the dependencies at the root directory:
```bash
npm install
```

3. Create a .env files and set your environment variables:
```env
# Required:
GROQ_KEY="Your Groq API Key"
# Optional:
NODE_ENVIRONMENT="development" # development mode allows debug. Every other mode is considered production
```