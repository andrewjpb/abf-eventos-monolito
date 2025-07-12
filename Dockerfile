FROM node:21.7.3-alpine AS base

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package*.json ./

# Instalar dependências usando --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copiar todos os arquivos do projeto
COPY . .

# Gerar o Prisma Client para o ambiente correto
RUN npx prisma generate

# Construir a aplicação
RUN npm run build

# Expor a porta 3000
EXPOSE 3000

# Iniciar a aplicação
CMD ["npm", "start"]