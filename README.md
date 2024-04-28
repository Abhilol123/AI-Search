## How It Works

Given a query, fetches relevant, up-to-date information from the web and uses Ollama's API to generate an answer.

The app works as follows:

1. Get query from user
2. Scrape Google for relevant webpages
3. Parse webpages for text
4. Build prompt using query + webpage text
5. Call Ollama API to generate answer
6. Stream answer back to user

## Running Locally

1. Install dependencies

```bash
npm i
```

2. Run app

```bash
npm run dev
```
