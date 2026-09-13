<!-- última-sessão: 13/09/2026 — padronização gênero (v0.2.7) -->
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
- **Versão atual:** 0.2.7
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

---

## Sessão: 10/09/2026 — Modelo de importação simplificado (v0.2.2)

### O que foi feito
- **excel.js simplificado**: de 482 linhas para ~200 linhas
- Removida lógica de aba DBalunos (cross-references, código, lookup)
- Removidas funções mortas: `looksLikeCode`, `normalizeGenero`
- Planilha agora tem 7 colunas fixas: Nome, Data_nascimento, Data_registro, Tempo, Prova, Estilo, Modo/Evento
- Categoria **não salva** na importação — sempre calculada em runtime por `App.jsx`
- Alunos derivados automaticamente dos registros (nomes únicos, ID-XXXX sequencial)

### Decisões
- Categoria sempre calculada: `year(dataRegistro) - year(dataNascimento)` → CBDA thresholds
- Alunos Excel são nomes únicos extraídos dos registros
- `calcularCategoria` definida apenas no `App.jsx` (duplicata do excel.js removida)

### Arquivos
- `src/utils/excel.js` (reescrito — simplificado)
- `CHANGELOG.md` (v0.2.2)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK

---

## Sessão: 12/09/2026 — Categorias CBDA + Gênero + IDs Excel (v0.2.3)

### O que foi feito
- **Categorias CBDA reescritas**: de 6 categorias genéricas para 24 categorias baseadas em idade mínima
  - Tabela `CATEGORIAS_CBDA` com lookup reverso (maior idade mínima ≤ idade do atleta)
  - Cálculo de idade agora considera mês e dia (não apenas ano de nascimento)
  - Categorias: Pré-Mirim, Mirim I/II, Petiz I/II, Infantil I/II, Juvenil I/II, Júnior I/II/Sênior, A20+ até M80+
  - Dropdown de filtro de categorias atualizado com todas as 24 opções
- **Gênero no grid**: adicionado campo de seleção de gênero (M/F/O) no formulário de registro
  - Corrigido anti-pattern: `genero` agora faz parte do state inicial de `filtros` (removida mutação direta)
  - Alunos do Fiz! mantêm seus dados de gênero; alunos Excel/Manual podem definir via formulário
- **IDs de alunos Excel**: corrigido bug onde IDs gerados pelo Excel (`ID-0001`) eram descartados durante merge no localStorage
  - Campo `id` agora é preservado ao adicionar alunos importados ao `alunosLocais`

### Decisões
- Categorias usam lookup reverso (itera de trás para frente) para encontrar a maior categoria aplicável
- Gênero no formulário é opcional (não required) para manter compatibilidade com registros existentes
- IDs Excel mantêm o padrão `ID-XXXX` já existente no `excel.js`

### Arquivos
- `src/App.jsx` (modificado — categorias, gênero, merge IDs)
- `CHANGELOG.md` (v0.2.3)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK

---

## Sessão: 12/09/2026 — Ordenação Excel-like + Busca GestaoAlunos (v0.2.4)

### O que foi feito
- **Ordenação Excel-like**: todos os grids agora usam ciclo de 3 estados (asc → desc → sem ordenação)
  - `handleSort` modificado para suportar `direcao: null` (sem ordenação)
  - `dadosExibidos` só ordena quando `direcao !== null`
  - Cabeçalhos de coluna só mostram setas quando ordenação está ativa
  - Records Grid: colunas Aluno, Data Reg., Prova, Estilo, Tempo agora são ordenáveis
  - Gestão de Alunos: colunas Nome, Data Nasc., Gênero, Categoria, Status são ordenáveis
- **Busca Gestão de Alunos**: adicionado campo de busca por nome com botão de limpar (X)
  - Filtra alunos por nome (case-insensitive, includes)
  - Botão X reseta o termo de busca
- **Records Grid Search**: adicionado botão de limpar (X) no campo "Buscar Aluno"
  - Aparece apenas quando há texto no campo
  - Reseta `filtros.nome` ao clicar

### Decisões
- Gestão de Alunos: busca somente por nome (decisão do usuário)
- Colunas ordenáveis na gestão: todas as 7 colunas agora são ordenáveis
- Ciclo de ordenação: mesma coluna clicada 3 vezes volta ao estado sem ordenação
- Origem também ordenável (adicionado posteriormente)

### Arquivos
- `src/App.jsx` (modificado — handleSort, dadosExibidos, clear button search)
- `src/components/GestaoAlunos.jsx` (reescrito — ordenação, busca, clear button)
- `CHANGELOG.md` (v0.2.4)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK

---

## Sessão: 12/09/2026 — Propagação Gênero + IDs Retroativos (v0.2.5)

### O que foi feito
- **Propagação de gênero**: ao editar gênero de uma aluna na gestão, o valor é propagado para todos os registros dela
  - `handleAtualizarAluno` atualiza `alunosLocais` E `registros` com `nome` correspondente
  - `GestaoAlunos.jsx`: célula de gênero agora é editável inline (clique → dropdown M/F/O)
- **Fallback de gênero**: grid de registros exibe gênero do aluno quando o registro não possui
  - `alunosMap` (nome → aluno) usado como fallback em `dadosExibidos`
  - Registros antigos com `genero: '-'` agora mostram o gênero do aluno
- **IDs retroativos**: alunos importados de Excel sem ID recebem `ID-XXXX` sequencial automaticamente
  - Normalização no `useState` inicial de `alunosLocais`
  - IDs ausentes são detectados, sequência é calculada, e dados são salvos de volta no localStorage

### Decisões
- Propagação usa `nome` como chave (não `id`) porque registros e alunos compartilham o mesmo nome
- Fallback de gênero é transparente: se o registro já tem gênero próprio, usa ele; senão usa o da aluna
- IDs retroativos são persistidos no localStorage (sobrevivem refresh)

### Arquivos
- `src/App.jsx` (modificado — handleAtualizarAluno, alunosMap, normalização IDs, fallback gênero)
- `src/components/GestaoAlunos.jsx` (modificado — edição inline de gênero, prop onAtualizarAluno)
- `CHANGELOG.md` (v0.2.5)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK

---

## Sessão: 13/09/2026 — Unificação Gênero/Categoria nos Grids (v0.2.6)

### O que foi feito
- **Categoria unificada**: ambos os grids agora calculam `calcularCategoria()` em runtime
  - Grid de Registros (App.jsx): usa `dataRegistro` do item (já existia)
  - Grid de Gestão (GestaoAlunos.jsx): usa data atual como referência (nova prop `onCalcularCategoria`)
- **Gênero unificado**: ambos os grids exibem `item.genero || '-'` diretamente
  - Grid de Registros: removido fallback `alunosMap[item.nome]?.genero`
  - Grid de Gestão: já usava campo direto (sem mudança)
- **Removido `alunosMap`**: não era mais necessário (era usado apenas no fallback de gênero)
- **Removida variável `generoItem`** do filtro `dadosExibidos`: agora usa `(item.genero || '-') === filtros.genero`

### Decisões
- Na gestão de alunos, `onCalcularCategoria` usa **data atual** como `dataRegistro` para exibir a categoria atual do atleta
- Gênero é campo direto (sem fallback) — registros antigos com `genero: '-'` mostram `-`
- `alunosMap` removido para manter código limpo (não tinha mais uso)

### Arquivos
- `src/components/GestaoAlunos.jsx` (modificado — prop `onCalcularCategoria`, cálculo de categoria em runtime)
- `src/App.jsx` (modificado — prop `onCalcularCategoria`, removido fallback gênero, removido `alunosMap`)
- `CHANGELOG.md` (v0.2.6)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK (6 erros pré-existentes: `SortIcon` definido dentro do render)

---

## Sessão: 13/09/2026 — Padronização de Gênero (v0.2.7)

### O que foi feito
- **Normalização de gênero**: adicionada função `normalizarGenero()` em `supabase.js`
  - Mapeia valores do banco: `masculino`/`masc`→`M`, `feminino`/`fem`→`F`, `outro`→`O`
  - Remove `'-'` (traço) e normaliza para `''` (vazio)
  - Case-insensitive (aceita `Masculino`, `MASCULINO`, etc.)
- **Filtro de gênero simplificado**: removida opção `'-'` das opções do filtro
  - Antes: `['', 'M', 'F', 'O', '-']`
  - Agora: `['', 'M', 'F', 'O']`
  - `'-'` nunca foi um valor válido no formulário — era apenas resíduo de importações antigas

### Decisões
- Valor vazio (`''`) representa "sem gênero" em todos os contexts
- Display visual continua mostrando `-` quando vazio (`|| '-'`) — apenas cosmético
- `normalizarGenero()` é defensiva: qualquer valor não reconhecido vira `''`

### Arquivos
- `src/lib/supabase.js` (modificado — `normalizarGenero()`, mapeamento de `genero`)
- `src/App.jsx` (modificado — removido `'-'` do filtro de gênero)
- `CHANGELOG.md` (v0.2.7)
- `AGENTS.md` (sessão adicionada)

### Typecheck
- Build: OK
- Lint: OK (6 erros pré-existentes)
