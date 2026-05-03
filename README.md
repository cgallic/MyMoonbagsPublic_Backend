# MyMoonbags Public Backend

Backend/API layer for MyMoonbags: headless Shopify, Web3, and storefront integrations built with Next.js.

## What this is

This repo contains the server-side companion to [`MyMoonbagsPublic`](https://github.com/cgallic/MyMoonbagsPublic). It handles backend flows for the storefront and integrations.

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Common scripts

```bash
npm run dev    # development server
npm run build  # production build
npm start      # run built app
```

## Configuration

Use local environment variables for Shopify, Web3, checkout, and API credentials. Do not commit `.env` files or wallet/private-key material.

## Frontend

See [`MyMoonbagsPublic`](https://github.com/cgallic/MyMoonbagsPublic) for the public React frontend.

## Related links

- [MeetKai](https://meetkai.xyz) — the operator layer behind Kai CMO workflows.
- [KaiCalls](https://kaicalls.com) — AI voice agents for small-business phone answering and lead capture.
- [Connor Gallic](https://connorgallic.com) — founder building Kai, KaiCalls, and AI automation systems.
