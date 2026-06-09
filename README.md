# WellAI Bot WhatsApp Service

## Prerequisites

- Docker and Docker Compose v2
- WhatsApp Cloud API credentials
- ngrok (for local webhook testing)

## Docker Setup (Recommended)

### 1. Configure environment

```bash
cp .env.example .env
```

Update `.env` with your WhatsApp credentials:
- `WHATSAPP_VERIFY_TOKEN` - any random string for webhook verification
- `WHATSAPP_ACCESS_TOKEN` - from Meta API dashboard
- `WHATSAPP_PHONE_NUMBER_ID` - from WhatsApp Business config

### 2. Start services

Start MongoDB and the app:

```bash
docker compose up -d
```

Or start only MongoDB (for manual development):

```bash
docker compose up -d mongodb
```

### 3. Verify services

Check service health:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f app
```

## Configure WhatsApp Webhook

1. Expose your local server with ngrok:

```bash
ngrok http <WHATSAPP_PORT> # default: 5000
```

2. Copy the generated public URL from ngrok (for example `https://abc123.ngrok-free.app`).
3. In WhatsApp Developer Dashboard webhook settings (Use cases -> Customize -> Step 2 -> Configure Webhooks):
   - Callback URL: `<ngrok-public-url>/webhook`
   - Verify token: same value as your `WHATSAPP_VERIFY_TOKEN` in `.env`
4. Subscribe to the needed webhook fields in the dashboard.

## Manual Development Setup

### Install Node.js with fnm

Install fnm from: <https://github.com/Schniz/fnm>

Use Node.js version `v24.14.0`:

```bash
fnm install v24.14.0
fnm use v24.14.0
node -v
```

### Enable Corepack and use pnpm

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm -v
```

### Install dependencies

```bash
pnpm install
```

### Configure env

```bash
cp .env.example .env
```

Update `.env` with your real values. For manual setup, ensure `MONGO_URI` points to your MongoDB instance (e.g., `mongodb://localhost:27017`).

### Run the service

```bash
pnpm start
```