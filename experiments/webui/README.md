# Retro AI Online - Standalone Version

A simple web UI for chatting with locally hosted Large Language Models via an OpenAI-compatible API.

## Features

- Chat with AI characters
- Create and customize characters
- Import characters from JSON files
- Save and manage conversations
- Responsive design for desktop and mobile
- Dark and light themes
- Direct connection to any OpenAI API-compatible server

### Usage with local LLM servers

This UI is designed to connect to local LLM servers that expose an OpenAI-compatible API endpoint, such as:

- [llama.cpp server](https://github.com/ggerganov/llama.cpp/tree/master/examples/server)
- [oobabooga's Text Generation WebUI](https://github.com/oobabooga/text-generation-webui)
- [LM Studio](https://lmstudio.ai/)
- [LocalAI](https://github.com/localai/localai)

By default, the UI connects to `http://localhost:5001/v1`. Change this in the settings panel to match your LLM server's endpoint.