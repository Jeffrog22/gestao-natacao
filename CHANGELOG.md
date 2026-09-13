# Changelog - Registro de Tempos

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [v0.2.9] - 13/09/2026
### Fixed
- **Gênero '-' em registros Excel**: raiz do problema identificada — `excel.js` gravava `genero: '-'` (traço literal)
  - Corrigido para `genero: ''` (string vazia) em registros e alunos derivados
  - **Migração one-time**: registros e alunos carregados do `localStorage` com `genero: '-'` são convertidos automaticamente para `''`
  - Resolve o problema de "alguns registros mantêm '-' em gênero"

## [v0.2.8] - 13/09/2026
### Fixed
- **Propagação de gênero corrigida**: `handleAtualizarAluno` agora normaliza nomes com `normalizarNome()` antes de comparar
  - Espaços internos duplos agora são colapsados ("Maria  Silva" → "Maria Silva")
  - Comparação case-insensitive com normalização completa

### Changed
- **`normalizarNome()`**: nova função utilitária que normaliza nomes (trim + lowercase + colapsa espaços)
  - Aplicada em: `handleAtualizarAluno`, `dadosExibidos`, `alunosSugeridos`, `nomesBuscaSugeridos`, `GestaoAlunos`
  - Remove inconsistências de formatação entre nomes de alunos e registros

## [v0.2.7] - 13/09/2026
### Changed
- **Padronização de gênero**: todos os valores normalizados para `M`/`F`/`O` (ou `''` para vazio)
  - `supabase.js`: adicionada função `normalizarGenero()` que mapeia valores do banco (`masculino`→`M`, `feminino`→`F`, etc.)
  - Filtro de gênero: removida opção `'-'` (traço) — agora apenas `Todos`/`M`/`F`/`O`
  - Valor vazio (`''`) representa "sem gênero" em todos os contexts

## [v0.2.6] - 13/09/2026
### Changed
- **Categoria unificada**: ambos os grids (Registros e Gestão) agora calculam `calcularCategoria()` em runtime
  - Grid de Registros: usa `dataRegistro` do item
  - Grid de Gestão: usa data atual (categoria atual do atleta)
- **Gênero unificado**: ambos os grids exibem `item.genero || '-'` diretamente, sem fallback
- Removido `alunosMap` (era usado apenas no fallback de gênero removido)

## [v0.2.5] - 12/09/2026
### Fixed
- **Propagação de gênero**: ao editar gênero de uma aluna na gestão, o valor é propagado para todos os registros dela
- **Fallback de gênero**: grid de registros exibe gênero do aluno quando o registro não possui (registros antigos)
- **IDs retroativos**: alunos importados de Excel sem ID recebem `ID-XXXX` sequencial automaticamente ao carregar

### Changed
- **Gestão de Alunos**: célula de gênero agora é editável inline (clique → dropdown M/F/O)

## [v0.2.4] - 12/09/2026
### Changed
- **Ordenação Excel-like**: todos os grids agora usam ciclo de 3 estados (asc → desc → sem ordenação)
  - Records Grid: colunas Aluno, Data Reg., Prova, Estilo, Tempo são ordenáveis
  - Gestão de Alunos: colunas Nome, Data Nasc., Gênero, Categoria, Status são ordenáveis
- **Gestão de Alunos**: adicionado campo de busca por nome com botão de limpar (X)
- **Records Grid**: adicionado botão de limpar (X) no campo de busca "Buscar Aluno"

## [v0.2.3] - 12/09/2026
### Changed
- **Categorias CBDA**: tabela de cálculo completamente reescrita com 24 categorias baseadas em idade mínima
  - De 6 categorias genéricas para: Pré-Mirim, Mirim I/II, Petiz I/II, Infantil I/II, Juvenil I/II, Júnior I/II/Sênior, A20+ até M80+
  - Cálculo de idade agora considera mês e dia (não apenas ano)
  - Dropdown de filtro de categorias atualizado com todas as 24 opções

### Fixed
- **Gênero no grid**: adicionado campo de seleção de gênero (M/F/O) no formulário de registro
- **IDs de alunos Excel**: corrigido bug onde IDs gerados pelo Excel (`ID-0001`) eram descartados durante merge no localStorage
- Removida mutação direta de state do React (anti-pattern) no filtro de gênero

## [v0.2.2] - 10/09/2026
### Changed
- Modelo de importação Excel simplificado: 7 colunas fixas (Nome, Data_nascimento, Data_registro, Tempo, Prova, Estilo, Modo/Evento)
- Categoria sempre calculada internamente (não mais lida da planilha)
- Alunos derivados automaticamente dos registros (nomes únicos)
- Removida lógica de aba DBalunos e cross-references de código

## [v0.2.1] - 10/09/2026
### Fixed
- Categorias não filtravam corretamente: `ModalAluno` usava `'Senior'` (sem acento) enquanto o resto do app usava `'Sênior'`
- Alunos importados de Excel perdiam o campo `categoria` durante merge no localStorage

### Changed
- Aba "Alunos" agora é somente leitura (sem CRUD manual)
- Botão "Novo Aluno" e `ModalAluno.jsx` removidos
- Origem Supabase exibida como "Fiz!" ao invés de "Banco"

## [v0.2.0] - 10/09/2026
### Added
- **Aba "Alunos"**: gerenciamento completo de alunos com CRUD
  - Tabela com ID, Nome, Data Nasc., Gênero, Categoria, Status, Origem
  - Toggle de status (ativo/inativo) para alunos Excel/Manual
  - Alunos Supabase somente leitura (status determinado pelo banco)
  - Botão "Novo Aluno" com modal de cadastro
  - Edição e exclusão de alunos Excel/Manual
  - Duplo-clique carrega registros do aluno na aba Registros
- **Aba "Gráficos"**: comparação visual entre 2-3 alunos
  - Gráfico de linha temporal (evolução do tempo ao longo das datas)
  - Gráfico de barras comparativas (melhor tempo por prova)
  - Filtros por estilo e prova
  - SVG puro (zero dependências novas)
- **Modelo unificado de aluno**: ID sequencial (ID-0001, SUP-0001), origem (supabase/excel/manual), status
- Supabase agora busca todos os alunos (ativos e inativos)
- Merge Supabase + Excel (não mais substituir)
- Componentes separados: GestaoAlunos, ModalAluno, Graficos

### Changed
- Abas expandidas: Registros Ativos | Alunos | Gráficos | Lixeira
- Status de alunos do Supabase reflete o campo `ativo` do banco
- Alunos Excel/Manual têm toggle de status editável

### Fixed
- Alunos inativos do Supabase agora aparecem na lista (para registros históricos)

## [v0.1.2] - 10/09/2026
### Fixed
- URL duplicada `/rest/v1/rest/v1/` causada por env var `VITE_SUPABASE_URL` com path `/rest/v1/` no Cloudflare Pages
- Código agora remove `/rest/v1/` do final da URL antes de montar o endpoint REST

## [v0.1.0] - 10/09/2026
### Added
- Integração com Supabase para busca de alunos (REST API direta)
- Hook `useAlunosSupabase` para busca automática de atletas
- Botão "Limpar Dados Locais" para remover alunos modelo importados de Excel
- Indicador de status de sincronização no cabeçalho
- Variáveis de ambiente para configuração do Supabase
- Deploy no Cloudflare Pages (`https://registro-tempos.pages.dev/`)
- Documentação do projeto (AGENTS.md, CHANGELOG.md, DEVELOPMENT.md)

### Changed
- Autocomplete de alunos busca dados do Supabase como fonte primária
- Alunos importados de Excel funcionam como fallback offline

## [v0.0.1] - 09/2026
### Added
- Estrutura inicial do projeto (React + Vite + Tailwind)
- Cadastro manual de registros de tempo
- Importação de registros a partir de arquivo Excel
- Cálculo automático de categoria CBDA
- Filtros por nome, prova, estilo, modo, categoria e gênero
- Ordenação de colunas
- Lixeira com restauração
- Exportação de dados filtrados para Excel
- Autocomplete de alunos com navegação por setas
- PWA com ícones e webmanifest
