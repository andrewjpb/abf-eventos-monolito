FROM node:21.7.3-alpine AS base

# Definir diretório de trabalho
WORKDIR /app

# Configurar npm para melhor handling de rede
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Copiar arquivos de configuração de dependências
COPY package*.json ./

# Limpar cache do npm e instalar dependências com retry
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --verbose || \
    (sleep 5 && npm install --legacy-peer-deps --verbose) || \
    (sleep 10 && npm install --legacy-peer-deps --verbose)

# Copiar todos os arquivos do projeto
COPY . .

# Gerar o Prisma Client para o ambiente correto
RUN npx prisma generate

# Definir variáveis para o build do Next.js
ARG DEPLOYMENT_ID
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV DEPLOYMENT_ID=${DEPLOYMENT_ID}
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}

# Construir a aplicação
RUN npm run build

# Expor a porta 3000
EXPOSE 3000

# Iniciar a aplicação
CMD ["npm", "start"]