# Visão Geral - ABF Eventos

O ABF Eventos é um sistema de gerenciamento de eventos desenvolvido com Next.js 15, construído como um monolito modular 
baseado em features. O sistema permite o cadastro e administração completa de eventos, incluindo gerenciamento de 
palestrantes, patrocinadores, empresas e participantes, com controle granular de permissões.

## Diagrama de Arquitetura

```mermaid
graph TD
    subgraph Frontend [Interface do Usuário]
        ClientComponents[Componentes Cliente]
        ServerComponents[Componentes Servidor]
    end

    subgraph Backend [Camada de Servidor]
        ServerActions[Server Actions]
        CacheValidation[Revalidação de Cache]
        QueryLayer[Camada de Queries]
        Auth[Autenticação/Autorização]
    end

    subgraph PersistenceLayer [Camada de Persistência]
        Prisma[Prisma ORM]
        Database[(PostgreSQL)]
        MinIO[(Armazenamento MinIO)]
    end

    ClientComponents --> ServerActions
    ServerComponents --> QueryLayer
    ServerActions --> QueryLayer
    ServerActions --> CacheValidation
    QueryLayer --> Prisma
    ServerActions --> Auth
    Prisma --> Database
    ServerActions --> MinIO
</graph>
```

## Stack de Tecnologias

| Categoria                | Tecnologias                                      |
|--------------------------|--------------------------------------------------|
| **Frontend**             | Next.js 15, React 19, TailwindCSS 4, shadcn/ui   |
| **Backend**              | Next.js (App Router, Server Actions)             |
| **Banco de Dados**       | PostgreSQL, Prisma ORM                           |
| **Autenticação**         | Lucia                                            |
| **Armazenamento**        | MinIO (S3 Compatible)                            |
| **Gestão de Estado**     | React Query (TanStack Query)                     |
| **Validação de Dados**   | Zod                                              |
| **Email**                | Resend                                           |
| **Implantação**          | Docker                                           |
| **Linguagem**            | TypeScript                                       |