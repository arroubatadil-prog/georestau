GeoResto AI Proxy

This repository contains a minimal server-side AI proxy at `server/api.js`.

Why use a proxy?
- Keeps AI API keys off the client bundle (safer for production).
- Allows switching between OpenAI/Gemini server-side without exposing keys.

Quick start (local development)
1. Install dependencies (express):

   npm install express cors

If you want server-side Gemini support, also install the Google GenAI client:

   npm install @google/genai

2. Provide an OpenAI API key in your environment (or `.env.local`):

   # Windows PowerShell example
   $env:OPENAI_API_KEY = "sk-REPLACE_ME"

3. Start the proxy:

   node server/api.js

4. Start the frontend in another terminal:

   npm run dev

Notes
- The proxy currently prefers `OPENAI_API_KEY`. If you want Gemini server-side, we can extend the proxy to call Google GenAI REST or use `@google/genai`.
   If you installed `@google/genai`, set `GEMINI_API_KEY` in your environment and the proxy will attempt to use Gemini when OpenAI is not configured.
 - The proxy accepts a `mode` parameter in the POST body to choose behavior:
    - `mode: 'contextual'` (default) — the proxy builds a strict prompt using provided restaurant data and instructs the model to use only those data.
    - `mode: 'general'` — the proxy asks the model to answer the question freely (useful for general knowledge or when contextual data isn't available).
- For production, run the proxy in a secure environment (Heroku, Vercel Serverless, Render, etc.) and never commit API keys.
