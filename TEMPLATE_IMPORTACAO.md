# Template de Importação - Registro de Tempos

## Abas necessárias no Excel

### 1?? Aba: DBregistros (ou variações)
Contém os tempos de cada aluno em cada treino/competição.

| Nome | Data Nascimento | Data Registro | Tempo | Prova | Estilo | Modo |
|---|---|---|---|---|---|---|
| João Silva | 15/03/2010 | 2026-01-15 | 01:35.45 | 100m Livre | Livre | Treino |
| Maria Santos | 20/05/2009 | 2026-01-15 | 01:42.33 | 100m Livre | Livre | Treino |
| Pedro Costa | 08/11/2010 | 2026-01-15 | 01:38.12 | 100m Costas | Costas | Competição |

**Formatos aceitos para Tempo:**
- `MM:SS.CC` (minutos:segundos.centésimos) — ex: `01:35.45`
- `MMSSCC` (formato numérico) — ex: `013545` = 01:35.45
- Fração Excel (<1) — ex: `0.000733` = ~1min

### 2?? Aba: DBalunos (OPCIONAL - banco de dados)
Se presente, preenche automaticamente dados faltantes por código/nome.

| Código | Nome | Data Nascimento | Categoria | Gênero |
|---|---|---|---|---|
| NC-0001 | João Silva | 15/03/2010 | Infantil | M |
| NC-0002 | Maria Santos | 20/05/2009 | Infantil | F |
| NC-0003 | Pedro Costa | 08/11/2010 | Infantil | M |

## Regras de Normalização

? **Cabeçalhos flexíveis** — Reconhece variações:
- `Nome` / `Aluno` / `Atleta`
- `Data Nascimento` / `Aniversário`
- `Data Registro` / `Data Reg`
- `Prova` / `Distância`
- `Estilo` / `Nado`
- `Modo` / `Evento` / `Tipo`
- `Gênero` / `Sexo`
- `Categoria` / `Cat`

? **Datas:** Aceita `DD/MM/YYYY`, `YYYY-MM-DD` ou números Excel

? **Gênero:** Normaliza para `M`, `F`, `O` (qualquer um com base no 1º caractere)

## Exemplo Mínimo (FUNCIONA)

Precisa só de **Nome + Tempo**:

| Nome | Tempo |
|---|---|
| João Silva | 01:35.45 |
| Maria Santos | 01:42.33 |

## Download Template

Veja o arquivo `tempoRegistro.xlsx` no projeto para um exemplo real pronto para usar.
