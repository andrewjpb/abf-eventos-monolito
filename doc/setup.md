# Configuração do Ambiente - ABF Eventos

## Pré-requisitos

| Requisito     | Versão               | Descrição                                  |
|---------------|----------------------|--------------------------------------------|
| Node.js       | >= 18.17 (LTS)       | Ambiente de execução JavaScript            |
| PostgreSQL    | >= 14.0              | Banco de dados relacional                  |
| npm/yarn/pnpm | Última versão estável| Gerenciador de pacotes                     |
| MinIO         | Última versão        | Storage compatível com S3 para arquivos    |
| Docker        | Última versão        | Opcional, para implantação containerizada  |

## Instalação Local

1. Clone o repositório e navegue até a pasta do projeto:

```bash
git clone <repository-url>
cd abf-eventos-monolito
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` com base nos requisitos de variáveis abaixo.

4. Execute as migrações do banco de dados:

```bash
npx prisma migrate dev
```

5. Seed de permissões e papéis iniciais:

```bash
npm run seed:permissions
# ou
yarn seed:permissions
```

## Scripts Disponíveis

| Comando                | Descrição                                                   |
|------------------------|-------------------------------------------------------------|
| `npm run dev`          | Inicia o servidor de desenvolvimento com Turbopack          |
| `npm run build`        | Compila o projeto para produção                             |
| `npm run start`        | Inicia o servidor em modo produção                          |
| `npm run lint`         | Executa a verificação de linting                            |
| `npm run docker:build` | Constrói a imagem Docker do projeto                         |
| `npm run docker:push`  | Envia a imagem Docker para o repositório remoto             |
| `npm run seed:permissions` | Popula o banco com permissões e papéis iniciais         |

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

| Variável              | Descrição                                    | Exemplo                                        |
|-----------------------|----------------------------------------------|------------------------------------------------|
| DATABASE_URL          | URL de conexão com o PostgreSQL              | `postgresql://user:pass@localhost:5432/eventos`|
| S3_ACCESS_KEY_ID      | Chave de acesso para MinIO/S3                | `minio_access_key`                             |
| S3_SECRET_ACCESS_KEY  | Chave secreta para MinIO/S3                  | `minio_secret_key`                             |
| S3_BUCKET_NAME        | Nome do bucket para armazenamento de arquivos| `eventos`                                      |
| S3_ENDPOINT           | Endpoint do serviço S3 compatível            | `https://s3.example.com` ou `http://localhost:9000` |
| S3_PORT               | Porta para conexão S3                        | `9000`                                         |
| S3_USE_SSL            | Usar SSL para conexão S3                     | `true` ou `false`                              |
| RESEND_API_KEY        | Chave API para serviço de email Resend       | `re_123456789`                                 |

## Executando com Docker

Para executar a aplicação com Docker:

```bash
# Construir a imagem
npm run docker:build
# ou
yarn docker:build

# Iniciar o container
docker run -p 3000:3000 --env-file .env andrewjpb/abf-eventos-monolito
```

## Acesso Inicial

Após iniciar a aplicação e executar o seed:

1. Acesse: http://localhost:3000
2. O seed cria um usuário admin inicial:
   - Email: `admin@example.com` 
   - Senha: `senha_segura_123`