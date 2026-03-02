# ---- Stage 1: Build ----
FROM node:21.7.3-alpine AS builder

WORKDIR /app

# Configurar npm para melhor handling de rede
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Instalar dependências
COPY package*.json ./
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --verbose || \
    (sleep 5 && npm install --legacy-peer-deps --verbose) || \
    (sleep 10 && npm install --legacy-peer-deps --verbose)

# Copiar source e gerar Prisma Client
COPY . .
RUN npx prisma generate

# Variáveis para o build
ARG DEPLOYMENT_ID
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV DEPLOYMENT_ID=${DEPLOYMENT_ID}
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}

# Build da aplicação
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:21.7.3-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar apenas o necessário do build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar Prisma (schema + engine gerada)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "server.js"]
