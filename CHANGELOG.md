# Changelog - Registro de Tempos

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
