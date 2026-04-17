# WellAI Bot WhatsApp Service

## Prerequisites

- macOS/Linux shell
- fnm
- WhatsApp Cloud API credentials

## Install Node.js with fnm

Install fnm from: <https://github.com/Schniz/fnm>

Use Node.js version `v24.14.0`:

```bash
fnm install v24.14.0
fnm use v24.14.0
node -v
```

## Enable Corepack and use pnpm

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm -v
```

## Install dependencies

```bash
pnpm install
```

## Configure env

```bash
cp .env.example .env
```

Update `.env` with your real values based on `.env.example`.

## Configure WhatsApp bot

1. Create or open your Meta app and add WhatsApp product.
2. Get credentials from Meta and set them in `.env`.
3. Run the WhatsApp service:

```bash
pnpm start
```

1. Expose your local server with ngrok:

```bash
ngrok http <WHATSAPP_PORT> # default: 5000
```

1. Copy the generated public URL from ngrok (for example `https://abc123.ngrok-free.app`).
2. In WhatsApp Developer Dashboard webhook settings:
   - Callback URL: `<ngrok-public-url>/webhook`
   - Verify token: same value as your `WHATSAPP_VERIFY_TOKEN` in `.env`
3. Subscribe to the needed webhook fields in the dashboard.
