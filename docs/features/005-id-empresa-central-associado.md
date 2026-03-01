# Feature: ID de Empresa (Central de Associado)

**Status:** Aguardando Análise de Impacto
**Data:** 11/02/2026
**Versão:** 1.0
**Prioridade:** Sensível

---

## ⚠️ ATENÇÃO: FEATURE SENSÍVEL

Esta feature envolve **alteração estrutural** no modelo de dados de empresas. Requer análise detalhada de impacto antes de qualquer desenvolvimento.

**Riscos identificados:**
- Alteração na forma de identificação de empresas
- Possível impacto em integrações existentes
- Necessidade de migração de dados
- Pode afetar relatórios e buscas existentes

---

## Resumo

Adicionar um novo campo **ID** para empresas, funcionando como identificador único vindo da **Central de Associado**. Este ID substituirá o CNPJ como chave de identificação, permitindo que CNPJ e Marca possam ser repetidos no sistema.

---

## Situação Atual

- Empresas são identificadas/buscadas pelo **CNPJ**
- CNPJ e Marca são únicos (não permitem duplicação)

---

## Situação Desejada

- Novo campo **ID** (Central de Associado) como identificador único
- **ID não pode ser repetido** (nova chave única)
- **CNPJ pode ser repetido**
- **Marca pode ser repetida**

---

## Regras de Negócio

- **RN-001:** Criar novo campo **"ID Central"** na entidade de Empresa.

- **RN-002:** O campo ID Central deve ser **somente números** (numérico).

- **RN-003:** O campo ID Central deve ser **único** (não permite duplicação), porém **não obrigatório** (empresas existentes ficarão sem).

- **RN-004:** O campo **CNPJ passa a permitir duplicação** (remover constraint de unicidade).

- **RN-005:** O campo **Marca passa a permitir duplicação** (remover constraint de unicidade).

- **RN-006:** O ID Central será preenchido via **integração** (não manual).

- **RN-007:** Empresas já cadastradas **não terão** o ID Central (campo vazio/null).

---

## Análise de Impacto Necessária

Antes do desenvolvimento, é necessário mapear:

### 1. Banco de Dados
- [ ] Identificar tabelas que referenciam empresa por CNPJ
- [ ] Planejar migração de dados existentes
- [ ] Definir valor do ID Central para empresas já cadastradas

### 2. Backend/API
- [ ] Endpoints que buscam empresa por CNPJ
- [ ] Validações de unicidade existentes
- [ ] Integrações com sistemas externos

### 3. Frontend
- [ ] Telas de cadastro de empresa (ANALISAR TODO O CADASTRO)
- [ ] Telas de busca/listagem
- [ ] Formulários que referenciam empresa
- [ ] Tela que mostra se empresa é associada ou não (exibir ID Central)

### 4. Relatórios
- [ ] Relatórios que agrupam por CNPJ
- [ ] Exportações que usam CNPJ como chave

### 5. Integrações
- [ ] Central de Associado (origem do ID) - **ID virá desta integração**
- [ ] Outras integrações que usam CNPJ
- [ ] Endpoint/webhook para receber o ID Central

---

## Definições Confirmadas

- **Nome do campo:** ID Central (a confirmar nome final)
- **Formato:** Somente números (numérico)
- **Empresas existentes:** Não terão ID Central (campo vazio)
- **Origem dos dados:** Via integração (não manual)
- **Visualização:** Onde mostra se empresa é associada ou não

---

## Pontos Pendentes

1. **Nome final do campo:** Confirmar se "ID Central" é o nome definitivo

2. **Análise completa:** Necessário analisar todo o sistema e cadastro de empresas para garantir que não haverá problemas

---

## Observações

- **Esta é uma alteração estrutural sensível** que pode impactar diversas partes do sistema.
- Recomenda-se uma análise técnica detalhada antes de estimar esforço.
- Pode ser necessário um plano de migração para dados existentes.
- O esforço de desenvolvimento será estimado **após análise de impacto**.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. **Análise técnica de impacto no sistema**
3. Plano de migração de dados
4. Estimativa de esforço
5. Desenvolvimento em fases (se necessário)
