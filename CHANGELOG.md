# Changelog - Registro de Tempos

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
