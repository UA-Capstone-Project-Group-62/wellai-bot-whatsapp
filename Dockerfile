FROM node:24.14.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Use the same pnpm version pinned in package.json
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS runner
ENV NODE_ENV=production

ARG TARGETARCH
RUN apk add --no-cache ca-certificates curl \
	&& curl -fsSL "https://github.com/grpc-ecosystem/grpc-health-probe/releases/latest/download/grpc_health_probe-linux-${TARGETARCH}" -o /usr/local/bin/grpc_health_probe \
	&& chmod +x /usr/local/bin/grpc_health_probe

COPY --from=deps /app/node_modules ./node_modules
COPY . .

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD grpc_health_probe -addr=127.0.0.1:${GRPC_PORT:-50051} || exit 1

CMD ["pnpm", "start"]
