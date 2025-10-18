# Kilter Board Toolkit

This project recreates the blog example from [bazun.me/kiterboard](https://bazun.me/blog/kiterboard/) in
React. The main module renders an interactive Kilter Board overlay where you can toggle holds and see
the exact BLE payload that would light them up. A small Gemini helper is also included for
experimenting with AI-generated route suggestions.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. You will see:

- **Interactive board sandbox** – click holds to cycle through the same color mapping described in the
  blog post. The Bluetooth payload updates instantly so you can copy it into a BLE console.
- **Gemini helper (optional)** – helper utilities live under `src/lib/gemini.ts` and a CLI example at
  `scripts/gemini-example.mjs` for experimenting without the UI.

## Configure Gemini access (optional)

1. Create an API key in the [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env` and add your key:

   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

3. Restart any running dev server. The Gemini features will fall back to a static response when the
   key is missing.

Run the CLI sample once the key is set:

```bash
npm run gemini:example
```

## Build for production

```bash
npm run build
```

The build artefacts are written to `dist/`.
