<!-- última-sessão: 10/09/2026 — fix categorias + remove CRUD + Banco→Fiz! -->
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
- **Versão atual:** 0.2.0
- **Stack:** React 19 + Vite 7 + Tailwind CSS 3 + ExcelJS
- **Deploy:** Cloudflare Pages (`https://registro-tempos.pages.dev/`)
- **Backend de dados:** Supabase (tabela `alunos` do Fiz App)
- **Ferramenta de IA:** opencode (lê este arquivo automaticamente)

---

## Sumário de Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `src/App.jsx` | Componente principal com orquestração e estados globais |
| `src/components/GestaoAlunos.jsx` | Aba de consulta de alunos (somente leitura) |
| `src/components/Graficos.jsx` | Aba de gráficos comparativos (SVG) |
| `src/lib/supabase.js` | Cliente HTTP para REST API do Supabase |
| `src/hooks/useAlunosSupabase.js` | Hook React para buscar alunos do Supabase |
| `src/utils/excel.js` | Utilitários de importação de planilha Excel |
| `AGENTS.md` | Histórico completo do projeto |
| `CHANGELOG.md` | Histórico de versões |

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

---

## Sessão: 10/09/2026 — Gestão de Alunos + Gráficos (v0.2.0)

### O que foi feito
- **Modelo de dados unificado**: alunos têm `id` (ID-0001/SUP-0001), `origem` (supabase/excel/manual), `status` (ativo/inativo)
- **Supabase**: busca todos os alunos (ativos + inativos), campo `ativo` mapeado para `status`
- **Aba "Alunos"**: tabela CRUD com toggle de status, edição, exclusão, duplo-clique para filtrar registros
- **Aba "Gráficos"**: SVG charts comparativos (linha temporal + barras) para 2-3 alunos
- **Componentes separados**: GestaoAlunos.jsx, ModalAluno.jsx, Graficos.jsx
- **Merge Supabase + Excel**: não mais substituir, agora combina listas

### Decisões
- Alunos Supabase são somente leitura (status determinado pelo banco)
- Alunos Excel/Manual têm toggle de status editável
- Gráficos em SVG puro (zero dependências novas)
- IDs sequenciais (ID-0001) para Excel/Manual, SUP-XXXX para Supabase
- Duplo-clique em aluno na aba gestão carrega registros na aba Registros

### Arquivos
- `src/App.jsx` (modificado — abas, estados, funções CRUD)
- `src/components/GestaoAlunos.jsx` (novo)
- `src/components/ModalAluno.jsx` (novo)
- `src/components/Graficos.jsx` (novo)
- `src/lib/supabase.js` (modificado — busca todos, mapeia status)
- `src/utils/excel.js` (modificado — ID sequencial, origem)
- `src/hooks/useAlunosSupabase.js` (modificado — comentário)

### Typecheck
- Frontend: 0 erros (build OK)
- Lint: 0 erros

---

## Sessão: 10/09/2026 — Fix categorias + Remove CRUD + Banco→Fiz! (v0.2.1)

### O que foi feito
- **Fix categorias**: `ModalAluno` usava `'Senior'` (sem acento) mas o resto do app usa `'Sênior'` — agora removido
- **Fix merge Excel**: campo `categoria` era perdido durante importação Excel → adicionado no push para `alunosLocais`
- **Banco → Fiz!**: label de origem do Supabase agora exibe "Fiz!" ao invés de "Banco"
- **Removido ModalAluno.jsx**: CRUD manual de alunos removido (alunos vêm apenas de Fiz! e Excel)
- **Aba "Alunos" somente leitura**: sem botão "Novo Aluno", sem coluna Ações

### Arquivos
- `src/components/ModalAluno.jsx` (excluído)
- `src/components/GestaoAlunos.jsx` (simplificado — somente leitura)
- `src/App.jsx` (removidos imports, estados, funções do ModalAluno; fix categoria merge)

### Typecheck
- Build: OK
- Lint: OK
