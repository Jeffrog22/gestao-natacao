import * as ExcelJS from 'exceljs';

/**
 * Normaliza cabeçalhos de colunas para aceitar variações comuns
 * @param {string} h - Cabeçalho da coluna
 * @returns {string} - Nome normalizado da coluna
 */
function normalizeHeader(h) {
  const lower = h.toLowerCase().trim();
  
  // Nome/Atleta/Aluno
  if (lower.includes('nome') || lower.includes('atleta') || lower.includes('aluno')) return 'nome';
  
  // Data de Nascimento / Aniversário
  if (lower.includes('nascimento') || lower.includes('aniversário') || lower.includes('aniversario')) {
    return 'dataNascimento';
  }
  
  // Data do Registro
  if (lower.includes('registro') || (lower.includes('data') && lower.includes('reg'))) {
    return 'dataRegistro';
  }
  
  // Tempo
  if (lower.includes('tempo')) return 'tempo';
  
  // Prova
  if (lower.includes('prova') || lower.includes('distância') || lower.includes('distancia')) {
    return 'prova';
  }
  
  // Estilo
  if (lower.includes('estilo') || lower.includes('nado')) return 'estilo';
  
  // Modo
  if (lower.includes('modo') || lower.includes('evento') || lower.includes('tipo')) {
    return 'modo';
  }

  // Código / ID / Matrícula / NC
  if (lower.includes('codigo') || lower.includes('código') || lower === 'id' || lower.includes('matr') || lower.includes('nc')) return 'codigo';
  // Gênero
  if (lower.includes('genero') || lower.includes('gênero')) return 'genero';
  // Categoria
  if (lower.includes('categoria') || lower === 'cat') return 'categoria';
  
  return h; // Retorna original se não reconhecer
}

/**
 * Converte data do Excel (número serial ou string ou Date) para formato ISO (YYYY-MM-DD)
 * @param {number|string|Date} excelVal - Valor da data
 * @returns {string} - Data no formato YYYY-MM-DD
 */
function excelDateToISO(excelVal) {
  if (!excelVal && excelVal !== 0) return '';

  // Se for objeto complexo do ExcelJS, tentar extrair o valor interno
  if (excelVal && typeof excelVal === 'object') {
    if (excelVal.text) excelVal = excelVal.text;
    else if (excelVal.result !== undefined) excelVal = excelVal.result;
    else if (excelVal.richText && Array.isArray(excelVal.richText)) {
      excelVal = excelVal.richText.map(t => t.text || '').join('');
    }
  }

  // Se é um objeto Date do JavaScript
  if (excelVal instanceof Date) {
    const year = excelVal.getFullYear();
    const month = String(excelVal.getMonth() + 1).padStart(2, '0');
    const day = String(excelVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Se já é uma string no formato esperado
  if (typeof excelVal === 'string') {
    // Tenta converter DD/MM/YYYY para YYYY-MM-DD
    const parts = excelVal.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    // Se já está em formato YYYY-MM-DD
    if (excelVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return excelVal;
    }
  }

  // Se é número serial do Excel (dias desde 1900-01-01)
  if (typeof excelVal === 'number') {
    // Excel serial date: dias desde 30/12/1899 (com bug do ano 1900)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + excelVal * 86400000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Extrai um valor simples de células complexas do ExcelJS
 * Retorna Date/number/string quando possível.
 */
function flattenCellValue(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (val.text) return val.text;
    if (val.result !== undefined) return val.result;
    if (val.richText && Array.isArray(val.richText)) return val.richText.map(t => t.text || '').join('');
    if (val.hyperlink && val.text) return val.text;
    return '';
  }
  return '';
}

function normalizeName(name) {
  if (!name) return '';
  try {
    return String(name)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ');
  } catch (e) {
    return String(name).trim().toLowerCase();
  }
}

function normalizeGenero(val) {
  if (val === null || val === undefined) return '';
  const v = String(val).trim();
  if (!v) return '';
  const s = v.toLowerCase();
  if (s.startsWith('m')) return 'M';
  if (s.startsWith('f')) return 'F';
  if (s.startsWith('o') || s.startsWith('x')) return 'O';
  return v.charAt(0).toUpperCase();
}

// Calcula categoria CBDA com mesma lógica usada na UI (idade no ano do registro)
function calcularCategoria(dataNascimento, dataRegistro) {
  if (!dataNascimento || !dataRegistro) return '-';
  const nasc = new Date(dataNascimento);
  const reg = new Date(dataRegistro);
  const idadeNaEpoca = reg.getFullYear() - nasc.getFullYear();

  if (idadeNaEpoca <= 8) return 'Mirim';
  if (idadeNaEpoca <= 10) return 'Petiz';
  if (idadeNaEpoca <= 12) return 'Infantil';
  if (idadeNaEpoca <= 14) return 'Juvenil';
  if (idadeNaEpoca <= 16) return 'Junior';
  return 'Sênior';
}
/**
 * Converte segundos (número decimal) para formato mm:ss.SS
 * @param {number} seconds - Tempo em segundos
 * @returns {string} - Tempo no formato mm:ss.SS
 */
function formatSecondsToTempo(seconds) {
  const totalCentiseconds = Math.round(seconds * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const secs = Math.floor((totalCentiseconds % 6000) / 100);
  const centisecs = totalCentiseconds % 100;
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`;
}

/**
 * Parseia célula de tempo que pode estar em vários formatos
 * @param {number|string|Date} val - Valor da célula de tempo
 * @returns {string} - Tempo no formato mm:ss.SS
 */
function parseTempoCell(val) {
  if (!val && val !== 0) return '';
  
  // Log para debug (remover em produção se necessário)
  console.log('parseTempoCell - tipo:', typeof val, 'valor:', val);
  
  // ExcelJS retorna Date para valores de tempo
  if (val instanceof Date) {
    // Extrair horas, minutos, segundos e milissegundos
    const hours = val.getUTCHours();
    const minutes = val.getUTCMinutes();
    const seconds = val.getUTCSeconds();
    const milliseconds = val.getUTCMilliseconds();
    
    // Converter tudo para segundos totais
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    const result = formatSecondsToTempo(totalSeconds);
    console.log('parseTempoCell - Date convertido para:', result);
    return result;
  }
  
  // Se é número (fração de dia do Excel: 0.0003 = 26 segundos)
  if (typeof val === 'number') {
    // Excel armazena tempo como fração de dia (1 dia = 86400 segundos)
    // Se o número é muito pequeno (< 1), é provavelmente um tempo
    if (val < 1) {
      const seconds = val * 86400;
      const result = formatSecondsToTempo(seconds);
      console.log('parseTempoCell - número < 1 convertido para:', result);
      return result;
    }
    // Se é um número maior, tratar como formato MMSSCC (ex: 003633 = 00:36.33, 13545 = 01:35.45)
    if (val >= 1 && val < 1000000) {
      const numStr = String(Math.floor(val)).padStart(6, '0');
      const mm = numStr.substring(0, 2);
      const ss = numStr.substring(2, 4);
      const cc = numStr.substring(4, 6);
      const result = `${mm}:${ss}.${cc}`;
      console.log('parseTempoCell - número MMSSCC convertido para:', result);
      return result;
    }
  }
  
  // Se é string
  if (typeof val === 'string') {
    const trimmed = val.trim();
    
    // Formato "mm:ss.SS" ou "mm:ss.S" - já está no formato esperado ou próximo
    if (trimmed.match(/^\d{1,2}:\d{2}\.\d{1,2}$/)) {
      const parts = trimmed.split(':');
      const mm = parts[0].padStart(2, '0');
      const [ss, cs] = parts[1].split('.');
      const result = `${mm}:${ss}.${cs.padStart(2, '0')}`;
      console.log('parseTempoCell - string mm:ss.SS convertido para:', result);
      return result;
    }
    
    // Formato MMSSCC como string (ex: "003633" = 00:36.33, "13545" = 01:35.45)
    if (trimmed.match(/^\d{4,6}$/)) {
      const numStr = trimmed.padStart(6, '0');
      const mm = numStr.substring(0, 2);
      const ss = numStr.substring(2, 4);
      const cc = numStr.substring(4, 6);
      const result = `${mm}:${ss}.${cc}`;
      console.log('parseTempoCell - string MMSSCC convertido para:', result);
      return result;
    }
    
    // Formato "ss.S" ou "ss.SS" (apenas segundos)
    if (trimmed.match(/^\d{1,3}\.\d{1,2}$/)) {
      const seconds = parseFloat(trimmed);
      const result = formatSecondsToTempo(seconds);
      console.log('parseTempoCell - string ss.SS convertido para:', result);
      return result;
    }
    
    // Se já está no formato correto
    if (trimmed.match(/^\d{2}:\d{2}\.\d{2}$/)) {
      console.log('parseTempoCell - já no formato correto:', trimmed);
      return trimmed;
    }
  }
  
  console.log('parseTempoCell - não conseguiu parsear, retornando vazio');
  return '';
}

/**
 * Lê arquivo Excel e retorna array de registros normalizados
 * @param {File} file - Arquivo Excel (.xlsx)
 * @returns {Promise<Array>} - Array de registros { nome, dataNascimento, dataRegistro, tempo, prova, estilo, modo }
 */
export async function parseExcelFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Log de todas as abas disponíveis para debug
    console.log('Abas disponíveis no arquivo:', workbook.worksheets.map(ws => ws.name));
    
    // Procura pela aba "DBregistros" ou "DB_registros" especificamente
    let worksheet = workbook.getWorksheet('DBregistros');
    
    // Se não encontrar, tenta variações comuns
    if (!worksheet) {
      worksheet = workbook.getWorksheet('DB_registros') || 
                  workbook.getWorksheet('DB_Registros') ||
                  workbook.getWorksheet('db_registros') ||
                  workbook.getWorksheet('Registros') ||
                  workbook.getWorksheet('registros');
    }
    
    // Se ainda não encontrou, usa a primeira planilha
    if (!worksheet) {
      console.warn('Aba "DBregistros" ou "DB_registros" não encontrada, usando primeira planilha');
      worksheet = workbook.worksheets[0];
    }
    
    if (!worksheet) {
      throw new Error('Nenhuma planilha encontrada no arquivo');
    }
    
    console.log('Usando planilha:', worksheet.name);

    // --- Tentar carregar DBalunos para mapear código/nome -> dataNascimento ---
    const alunosSheetNames = ['DBalunos','DB_alunos','DB_Alunos','db_alunos','Alunos','alunos','DBAlunos'];
    let alunosSheet = null;
    for (const n of alunosSheetNames) {
      const s = workbook.getWorksheet(n);
      if (s) { alunosSheet = s; break; }
    }

    const alunosByCode = {};
    const alunosByName = {};

    if (alunosSheet) {
      try {
        const headerRowA = alunosSheet.getRow(1);
        const colMapA = {};
        headerRowA.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const headerValue = cell.value ? String(cell.value).trim() : '';
          if (headerValue) {
            const normalized = normalizeHeader(headerValue);
            colMapA[normalized] = colNumber;
          }
        });

        alunosSheet.eachRow({ includeEmpty: false }, (row, rn) => {
          if (rn === 1) return;
          const codeVal = flattenCellValue(row.getCell(colMapA.codigo || 1).value);
          const nameVal = flattenCellValue(row.getCell(colMapA.nome || 2).value);
          const birthVal = flattenCellValue(row.getCell(colMapA.dataNascimento || 3).value);
          const catVal = flattenCellValue(row.getCell(colMapA.categoria || 4).value);
          const genderVal = flattenCellValue(row.getCell(colMapA.genero || 5).value);
          const birthIso = excelDateToISO(birthVal);

          const info = { birth: birthIso || '', categoria: catVal ? String(catVal).trim() : '', genero: normalizeGenero(genderVal) };

          if (codeVal) {
            const key = String(codeVal).trim();
            alunosByCode[key] = info;
            alunosByCode[key.toUpperCase()] = info;
            alunosByCode[key.toLowerCase()] = info;
          }
          if (nameVal) {
            alunosByName[normalizeName(nameVal)] = info;
          }
        });

        console.log('Mapeamento DBalunos carregado: codes=', Object.keys(alunosByCode).length, 'names=', Object.keys(alunosByName).length);
      } catch (err) {
        console.warn('Falha ao processar DBalunos:', err.message);
      }
    } else {
      console.log('Aba DBalunos não encontrada — fallback por nome estará indisponível');
    }
    
    // Lê os cabeçalhos da primeira linha
    const headerRow = worksheet.getRow(1);
    const headers = [];
    const colMap = {};
    
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerValue = cell.value ? String(cell.value).trim() : '';
      if (headerValue) {
        const normalized = normalizeHeader(headerValue);
        colMap[normalized] = colNumber;
        headers.push(headerValue);
      }
    });
    
    if (headers.length === 0) {
      return [];
    }
    
    // Processa cada linha (começando da linha 2)
    const registros = [];
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // Pula a linha de cabeçalho
      if (rowNumber === 1) return;
      const nomeRaw = row.getCell(colMap.nome || 1).value;
      const nomeStr = String(flattenCellValue(nomeRaw)).trim();

      const tempoRaw = row.getCell(colMap.tempo || 4).value;
      const tempoVal = flattenCellValue(tempoRaw);
      console.log(`Linha ${rowNumber} - Nome: ${nomeStr}, Tempo raw:`, tempoVal);
      const tempo = parseTempoCell(tempoVal);
      console.log(`Linha ${rowNumber} - Tempo processado:`, tempo);

      // Filtrar linhas vazias (sem nome e sem tempo)
      if (!nomeStr && !tempo) {
        return;
      }

      const dataNascimentoVal = flattenCellValue(row.getCell(colMap.dataNascimento || 2).value);
      const dataRegistroVal = flattenCellValue(row.getCell(colMap.dataRegistro || 3).value);
      const provaVal = flattenCellValue(row.getCell(colMap.prova || 5).value);
      const estiloVal = flattenCellValue(row.getCell(colMap.estilo || 6).value);
      const modoVal = flattenCellValue(row.getCell(colMap.modo || 7).value);

      // Normaliza datas vindas da planilha
      let dataNiso = excelDateToISO(dataNascimentoVal);
      const dataRiso = excelDateToISO(dataRegistroVal);

      // Se não houver data de nascimento definida, tentar lookup em DBalunos por código ou nome
      if ((!dataNiso || dataNiso === '') && dataNascimentoVal) {
        const cand = String(dataNascimentoVal).trim();
        // Se parece com código (ex: NC-0002, ID-0003) tentar por código
        if (cand && (cand.match(/^[A-Za-z]{1,3}-?\d+/) || cand.toUpperCase().startsWith('NC') || cand.toUpperCase().startsWith('ID'))) {
          const found = alunosByCode[cand] || alunosByCode[cand.toUpperCase()] || alunosByCode[cand.toLowerCase()];
          if (found && found.birth) {
            dataNiso = found.birth;
            console.log(`Fallback: preenchi dataNascimento por código ${cand} -> ${dataNiso}`);
          }
          // Também tentar preencher categoria e gênero a partir do DBalunos
          var categoriaFromAluno = found && found.categoria ? found.categoria : undefined;
          var generoFromAluno = found && found.genero ? found.genero : undefined;
        }
      }

      if ((!dataNiso || dataNiso === '') && nomeStr) {
        const nameKey = normalizeName(nomeStr);
        const foundByName = alunosByName[nameKey];
        if (foundByName && foundByName.birth) {
          dataNiso = foundByName.birth;
          console.log(`Fallback: preenchi dataNascimento por nome ${nomeStr} -> ${dataNiso}`);
        }
        if (foundByName && foundByName.categoria) {
          categoriaFromAluno = foundByName.categoria;
        }
        if (foundByName && foundByName.genero) {
          generoFromAluno = foundByName.genero;
        }
      }

      // Se não foi preenchido categoria a partir do DBalunos, checar se já havia valor na célula de registros (em caso de coluna já existir)
      let categoriaFromCell = '';
      try {
        const rawCat = flattenCellValue(row.getCell(colMap.categoria || 8).value);
        categoriaFromCell = rawCat ? String(rawCat).trim() : '';
      } catch (e) {
        categoriaFromCell = '';
      }

      // Tentar ler gênero a partir da célula de registros
      let generoFromCell = '';
      try {
        const rawGen = flattenCellValue(row.getCell(colMap.genero || 9).value);
        generoFromCell = rawGen ? normalizeGenero(rawGen) : '';
      } catch (e) {
        generoFromCell = '';
      }

      const categoriaCalc = calcularCategoria(dataNiso, dataRiso);
      // Preferir: 1) categoria do DBalunos (autoridade do usuário) 2) categoria presente na célula de registros 3) categoria calculada
      const finalCategoria = (typeof categoriaFromAluno === 'string' && categoriaFromAluno.trim() !== '') ? categoriaFromAluno : (categoriaFromCell || categoriaCalc);
      // Preferir gênero do DBalunos > célula > '-' (abreviação aplicável)
      const finalGenero = (typeof generoFromAluno === 'string' && generoFromAluno.trim() !== '') ? generoFromAluno : (generoFromCell || '-');

      const registroObj = {
        nome: nomeStr,
        dataNascimento: dataNiso,
        dataRegistro: dataRiso,
        tempo: tempo,
        categoria: finalCategoria,
        genero: finalGenero,
        prova: provaVal ? String(provaVal).trim() : '',
        estilo: estiloVal ? String(estiloVal).trim() : '',
        modo: modoVal ? String(modoVal).trim() : ''
      };

      registros.push(registroObj);
      // Log completo para debug: valores de data e categoria
      console.log(`Linha ${rowNumber} - dataNascimento raw:`, dataNascimentoVal, '->', dataNiso, 'dataRegistro raw:', dataRegistroVal, '->', dataRiso, 'categoria:', categoriaCalc);
      console.log('Registro importado:', registroObj);
    });
    
    return registros;
  } catch (error) {
    throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
  }
}

