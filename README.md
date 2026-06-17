# Curematics Business Model Atlas

A Netlify-ready React + Netlify Functions app that uses OpenAI APIs to find businesses, enrich public information, generate Business Model Canvases, and export branded shareable graphics.

## What it does

- Known Business Canvas: enter a business name, website, location, and vertical.
- AI Business Finder: ask AI to find candidate businesses by vertical, location, and maturity stage.
- Daily Vertical Atlas: generate stage-based canvases for Startup, 1–3 years, 4–6 years, and 7+ years.
- Graphic Export: render a Curematics-branded strategy card and download as PNG.
- OpenAI-only intelligence layer: no Google Places, Yelp, Apollo, Crunchbase, Clearbit, or scraping APIs.

## Local setup

```bash
npm install
cp .env.example .env
# add your OPENAI_API_KEY
npm run dev
```

For local functions that mimic Netlify production:

```bash
npm install -g netlify-cli
netlify dev
```

## Deploy to Netlify

Recommended: deploy the repo/project folder through Netlify so the serverless functions are included.

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

Functions directory:

```bash
netlify/functions
```

Add environment variables in Netlify:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.5
OPENAI_FAST_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
```

## Important deployment note

A static-only drag-and-drop of `dist` will show the UI, but the live AI features require Netlify Functions and the server-side `OPENAI_API_KEY`. Use Netlify CLI, Git deploy, or a Netlify project deploy so the functions are included.
