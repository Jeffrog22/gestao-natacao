<!-- última-sessão: 10/09/2026 — fix URL duplicada Supabase -->
# AGENTS.md — Histórico Completo do Projeto

## Regras de Ouro

- **Report style**: ao finalizar, responder com `Done.` + bullets do que foi feito.
- **AGENTS.md é o único histórico**: toda sessão registrada aqui.

## Versionamento Semântico (SemVer 2.0.0)

| Mensagem do commit | Bump | Exemplo |
|---|---|---|
| `BREAKING CHANGE` no body ou `!:` no subject | **MAJOR** (vX.0.0) | `feat!: remove deprecated endpoint` |
| `feat:` no subject | **MINOR** (v0.X.0) | `feat: add new feature` |
| `fix:`, `refactor:`, `chore:`, `docs:`, etc | **PATCH** (v0.0.X) | `fix: corrige calculo` |

## Identidade
- **Nome:** Registro de Tempos
- **Descrição:** Aplicativo web para registro e gestão de tempos de natação de atletas
- **Repositório:** `https://github.com/Jeffrog22/gestao-natacao`
- **Versão atual:** 0.1.2
- **Stack:** React 19 + Vite 7 + Tailwind CSS 3 + ExcelJS
- **Deploy:** Cloudflare Pages (`https://registro-tempos.pages.dev/`)
- **Backend de dados:** Supabase (tabela `alunos` do Fiz App)
- **Ferramenta de IA:** opencode (lê este arquivo automaticamente)

---

## Sumário de Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `src/App.jsx` | Componente principal com toda a lógica de UI |
| `src/lib/supabase.js` | Cliente HTTP para REST API do Supabase |
| `src/hooks/useAlunosSupabase.js` | Hook React para buscar alunos do Supabase |
| `src/utils/excel.js` | Utilitários de importação de planilha Excel |
| `AGENTS.md` | Histórico completo do projeto |
| `CHANGELOG.md` | Histórico de versões |
| `DEVELOPMENT.md` | Diretrizes de desenvolvimento |

---

## Contexto Crítico

- O app usa Supabase REST API (não o JS client) para buscar alunos — ver `src/lib/supabase.js`
- A anon key do Supabase é uma JWT pública, configurada via variáveis de ambiente Vite
- `alunos.turma_id` no Supabase referencia `turmas.grupo_id` (TEXT), não `turmas.id` (UUID)
- RLS está desabilitado na tabela `alunos` — a anon key permite leitura direta
- O app funciona offline: se Supabase falhar, usa alunos do localStorage (fallback)
- Dados de registros ficam apenas no localStorage (sem backend)

---

## Sessão: 10/09/2026 — Integração Supabase + Deploy Cloudflare Pages

### O que foi feito
- Criado `src/lib/supabase.js` — cliente HTTP direto para REST API do Supabase
- Criado `src/hooks/useAlunosSupabase.js` — hook React que busca alunos ativos
- Modificado `src/App.jsx` — integrado hook, merge Supabase/localStorage, botão "Limpar Dados Locais"
- Criado `.env.local.example` — template de variáveis de ambiente
- Atualizado `.gitignore` — protege `.env.local` e `.env.production`
- App deployado em `https://registro-tempos.pages.dev/`

### Decisões
- Usar fetch direto contra REST API em vez de `@supabase/supabase-js` (zero dependências extras)
- Supabase como fonte primária de alunos; localStorage como fallback offline
- Botão "Limpar Dados Locais" para remover alunos importados de Excel do modelo
- Variáveis de ambiente configuradas no Cloudflare Dashboard (não no repo)

### Arquivos
- `src/lib/supabase.js` (novo)
- `src/hooks/useAlunosSupabase.js` (novo)
- `src/App.jsx` (modificado)
- `.env.local.example` (novo)
- `.gitignore` (modificado)

### Typecheck
- Frontend: 0 erros (build OK)

---

## Sessão: 10/09/2026 — Fix URL duplicada Supabase

### O que foi feito
- Diagnosticado bug: env var `VITE_SUPABASE_URL` no Cloudflare Pages continha `/rest/v1/` no final, causando URL duplicada `/rest/v1/rest/v1/alunos`
- Corrigido `src/lib/supabase.js` — adicionado `.replace(/\/rest\/v1\/?$/, '')` para remover path duplicado
- Bump versão para v0.1.2

### Causa raiz
- O bundle deployado (`index-DfoDh3B0.js`) tinha `em="https://ciemcfibkmzqcfvavvsb.supabase.co/rest/v1/"` (com `/rest/v1/`)
- O código fazia `fetch(${baseUrl}/rest/v1/alunos)` → URL final com `/rest/v1/` duplicado → 404

### Arquivos
- `src/lib/supabase.js` (modificado)
- `src/App.jsx` (versão → v0.1.2)
- `CHANGELOG.md` (modificado)
- `AGENTS.md` (modificado)

### Ação manual necessária
- Remover ou corrigir env var `VITE_SUPABASE_URL` no Cloudflare Pages Dashboard (deve ser `https://ciemcfibkmzqcfvavvsb.supabase.co` sem `/rest/v1/`)

### Typecheck
- Frontend: 0 erros (build OK)
