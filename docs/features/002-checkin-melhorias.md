# Feature: Melhorias no Check-in

**Status:** Aguardando Aprovação
**Data:** 11/02/2026
**Versão:** 1.0

---

## Resumo

Melhorias na funcionalidade de check-in do evento, incluindo correção de navegação entre páginas e nova funcionalidade de check-in em lote via upload de planilha.

---

## Regras de Negócio

### 1. Correção de Navegação (Bug Fix)

- **RN-001:** Ao realizar check-in em uma página diferente da primeira (ex: página 2, 3, etc.), o sistema deve **manter o usuário na mesma página** após a ação.

- **RN-002:** Atualmente o sistema está redirecionando para a primeira página após qualquer ação de check-in. Este comportamento deve ser corrigido.

### 2. Check-in em Lote via Planilha

- **RN-003:** Deve existir um botão/área para **upload de planilha Excel (.xlsx)** na tela de check-in.

- **RN-004:** A planilha deve conter obrigatoriamente a coluna **"cpf"** no cabeçalho. Outras colunas serão ignoradas.

- **RN-004.1:** O CPF pode estar **sem formatação** (ex: "12345678900"). O sistema deve normalizar e validar o CPF.

- **RN-004.2:** O CPF deve ser **válido** (passar na validação de dígitos verificadores). CPFs inválidos serão reportados no log de erro.

- **RN-005:** O sistema deve ler a planilha e buscar as inscrições do evento correspondentes aos CPFs informados.

- **RN-006:** Para cada CPF encontrado com inscrição válida no evento, o sistema deve realizar o check-in automaticamente.

- **RN-007:** Deve ser exibida uma **tela de log/resultado** mostrando o status de cada linha processada:
  - **Sucesso:** CPF encontrado e check-in realizado
  - **Já com check-in:** CPF encontrado mas já tinha check-in
  - **Não encontrado:** CPF não possui inscrição neste evento
  - **CPF inválido:** Formato de CPF inválido na planilha

- **RN-008:** O log deve exibir um resumo no final:
  - Total de linhas processadas
  - Total de check-ins realizados com sucesso
  - Total de erros/não encontrados

---

## Definições Confirmadas

- **Formato da planilha:** Apenas Excel (.xlsx)
- **Coluna CPF:** Aceita sem formatação, mas deve ser um CPF válido
- **Outras colunas:** Serão ignoradas (apenas a coluna "cpf" é processada)
- **Limite de linhas:** Sem limite
- **Exportar log:** Não necessário
- **Desfazer em lote:** Não necessário

---

## Fluxo do Usuário (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                CHECK-IN EM LOTE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin acessa página de check-in do evento                   │
│                     │                                            │
│                     ▼                                            │
│  2. Clica em "Check-in em Lote" ou "Importar Planilha"          │
│                     │                                            │
│                     ▼                                            │
│  3. Seleciona arquivo Excel (.xlsx) com coluna "cpf"            │
│                     │                                            │
│                     ▼                                            │
│  4. Sistema processa a planilha                                  │
│     ┌──────────────────────────────────┐                        │
│     │  Processando... 45/100           │                        │
│     │  ████████████░░░░░░░░ 45%        │                        │
│     └──────────────────────────────────┘                        │
│                     │                                            │
│                     ▼                                            │
│  5. Exibe tela de resultado/log                                  │
│     ┌──────────────────────────────────┐                        │
│     │  RESULTADO DO CHECK-IN EM LOTE   │                        │
│     │                                   │                        │
│     │  ✓ 123.456.789-00 - Sucesso      │                        │
│     │  ✓ 987.654.321-00 - Sucesso      │                        │
│     │  ⚠ 111.222.333-44 - Já com check │                        │
│     │  ✗ 000.000.000-00 - Não encontr. │                        │
│     │                                   │                        │
│     │  ─────────────────────────────── │                        │
│     │  Total: 100 | Sucesso: 85        │                        │
│     │  Já check-in: 10 | Erros: 5      │                        │
│     │                                   │                        │
│     │           [ Fechar ]             │                        │
│     └──────────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Exemplo de Planilha Esperada (.xlsx)

| cpf |
|-----|
| 12345678909 |
| 98765432100 |
| 11122233344 |
| 55566677788 |

**Notas:**
- CPF sem formatação (apenas números)
- CPF deve ser válido (dígitos verificadores corretos)
- Outras colunas na planilha serão ignoradas

---

## Observações

- A correção de navegação (RN-001/RN-002) é um bug fix e pode ser priorizada.
- O check-in em lote é uma feature nova que requer mais desenvolvimento.
- Todos os pontos técnicos foram definidos e confirmados.
- O esforço de desenvolvimento será estimado após aprovação dos requisitos.

---

**Próximos Passos:**
1. Cliente valida e aprova os requisitos
2. Estimativa de esforço
3. Desenvolvimento
