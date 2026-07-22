# Tuner

Chromatic tuner in the browser — **Vite + React + TypeScript**. Uses the microphone via `getUserMedia` and Web Audio, with pitch detection.

Any pitched sound: voice, instrument, whistle. Shows the nearest note and whether you’re sharp, flat, or in tune (A4 = 440 Hz).

## Local development

```bash
npm install
npm run dev
```

Open the local URL (usually `http://localhost:5173`). Microphone access works on **localhost** without HTTPS.

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deploy

### 1. GitHub

This repo is meant to live on GitHub. If you are creating it fresh:

```bash
git init
gh repo create tuner --public --source=. --remote=origin --push
```

### 2. Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub `tuner` repository
3. Framework preset: **Vite** (build command `vite build`, output `dist`)
4. Deploy

Every push to `main` auto-deploys. The live site is served over **HTTPS**, which is required for microphone access outside localhost.

You can also deploy from the CLI after linking:

```bash
npx vercel
```

## How it works

1. User taps **Start listening** (required gesture for `AudioContext`)
2. Mic stream → `AnalyserNode` time-domain samples
3. Pitch detection (`pitchfinder`) estimates fundamental frequency
4. Frequency maps to nearest equal-tempered note + cents offset

## Browser notes

- Grant microphone permission when prompted
- Use Chrome, Safari, Firefox, or Edge on a secure context (HTTPS / localhost)
- Quiet rooms and a clear single pitch work best
