# Development Guidelines - Registro de Tempos

Este documento estabelece as convenções de versionamento, commits e a rotina obrigatória de documentação para o projeto.

## 1. Versionamento Semântico (SemVer)

O projeto segue o padrão **SemVer 2.0.0**:

- **MAJOR (vX.0.0):** Mudanças incompatíveis no layout ou comportamento
- **MINOR (v0.X.0):** Adição de funcionalidades retrocompatíveis
- **PATCH (v0.0.X):** Correções de bugs e pequenas melhorias

## 2. Convenção de Commits (Conventional Commits)

Todos os commits devem seguir o padrão:

```text
<tipo>(<escopo>): <descrição sucinta>
```

Tipos permitidos:

| Tipo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Alterações na documentação |
| `style:` | Formatação, sem mudança lógica |
| `refactor:` | Refatoração sem mudar comportamento |
| `perf:` | Melhoria de performance |
| `chore:` | Dependências, configurações |

## 3. Rotina de Registros

Toda sessão de desenvolvimento DEVE gerar registros no `AGENTS.md`.

### 3.1. Arquivo AGENTS.md

O `AGENTS.md` é a **memória permanente do projeto**. Ele deve ser atualizado **ao final de cada sessão**.

Estrutura de cada sessão:
- Nova seção `## Sessão: DD/MM/YYYY — Título`
- O que foi feito
- Decisões técnicas relevantes
- Arquivos alterados
- Blockers ou problemas

### 3.2. Commits e pushes

Ao final de cada etapa:
1. Verificar as alterações
2. Atualizar `CHANGELOG.md` e `AGENTS.md`
3. Formular mensagem seguindo Conventional Commits
4. Executar `git add`, `git commit` e `git push`

## 3. Boas Práticas
- **Commits Atômicos:** cada commit com uma mudança lógica única
- **Documente tudo:** atualizar `AGENTS.md` e `CHANGELOG.md`

## 4. Estrutura do Projeto

```
gestao-natacao/
├── src/
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Entry point React
│   ├── index.css            # Estilos globais (Tailwind)
│   ├── lib/
│   │   └── supabase.js      # Cliente REST API Supabase
│   ├── hooks/
│   │   └── useAlunosSupabase.js  # Hook de busca de alunos
│   └── utils/
│       └── excel.js         # Utilitários Excel
├── public/
├── .env.local.example       # Template variáveis de ambiente
├── package.json
├── vite.config.js
├── tailwind.config.js
├── AGENTS.md
├── CHANGELOG.md
└── DEVELOPMENT.md
```

## 5. Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3
- **Ícones:** Lucide React
- **Excel:** ExcelJS
- **Dados:** Supabase REST API (alunos) + localStorage (registros)
- **Deploy:** Cloudflare Pages
