# Registro de Tempos

Aplicativo web para registro e gestão de tempos de natação de atletas.

## Tecnologias

- **React 19** — interface de usuário
- **Vite** — bundler e servidor de desenvolvimento
- **Tailwind CSS** — estilização
- **ExcelJS** — importação de planilhas `.xlsx`
- **Lucide React** — ícones

## Funcionalidades

- Cadastro manual de registros de tempo por atleta, prova, estilo e modo
- Importação de registros a partir de arquivo Excel (`.xlsx`)
  - Leitura automática das abas `DBregistros` e `DBalunos`
  - Normalização de cabeçalhos e formatos de data/tempo
- Cálculo automático de categoria CBDA (Mirim, Petiz, Infantil, Juvenil, Junior, Sênior) com base na idade do atleta no ano do registro
- Filtros por nome, prova, estilo, modo, categoria e gênero
- Ordenação de colunas
- Lixeira com possibilidade de restauração de registros excluídos
- Exportação de dados filtrados para Excel

## Instalação e uso

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Pré-visualização do build
npm run preview
```

## Estrutura do projeto

```
registro-de-tempos/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── src/
    ├── main.jsx        # Ponto de entrada React
    ├── App.jsx         # Componente principal com toda a lógica de UI
    ├── index.css       # Estilos globais (Tailwind)
    ├── App.css         # Estilos do componente App
    ├── assets/
    └── utils/
        └── excel.js    # Utilitários de importação de planilha Excel
```

## Formato da planilha de importação

A planilha `.xlsx` deve conter a aba **`DBregistros`** com as colunas:

| Coluna | Descrição |
|---|---|
| Nome / Atleta / Aluno | Nome do atleta |
| Data de Nascimento / Aniversário | Data de nascimento |
| Data do Registro | Data em que o tempo foi registrado |
| Tempo | Tempo no formato `mm:ss.cc` |
| Prova / Distância | Ex: `50m`, `100m` |
| Estilo / Nado | Ex: `Livre`, `Costas` |
| Modo / Evento / Tipo | Ex: `Aula`, `Festival`, `Competição` |

Opcionalmente, a aba **`DBalunos`** pode conter uma base de atletas com código, nome, data de nascimento, categoria e gênero para enriquecer os registros importados.

