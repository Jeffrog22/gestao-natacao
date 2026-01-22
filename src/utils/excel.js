import * as ExcelJS from 'exceljs';

/**
 * Normaliza cabeçalhos de colunas para aceitar variações comuns
 * @param {string} h - Cabeçalho da coluna
 * @returns {string} - Nome normalizado da coluna
 */
function normalizeHeader(h) {
  const lower = h.toLowerCase().trim();
  
  // Nome/Atleta
  if (lower.includes('nome') || lower.includes('atleta')) return 'nome';
  
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
  
  return h; // Retorna original se não reconhecer
}

/**
 * Converte data do Excel (número serial ou string ou Date) para formato ISO (YYYY-MM-DD)
 * @param {number|string|Date} excelVal - Valor da data
 * @returns {string} - Data no formato YYYY-MM-DD
 */
function excelDateToISO(excelVal) {
  if (!excelVal) return '';
  
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
    // Se é um número maior, pode ser apenas segundos
    if (val < 10000) {
      const result = formatSecondsToTempo(val);
      console.log('parseTempoCell - número convertido para:', result);
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
    
    // Formato "ss.S" ou "ss.SS" (apenas segundos)
    if (trimmed.match(/^\d{1,3}\.\d{1,2}$/)) {
      const seconds = parseFloat(trimmed);
      const result = formatSecondsToTempo(seconds);
      console.log('parseTempoCell - string ss.SS convertido para:', result);
      return result;
    }
    
    // Formato "ss" (apenas segundos inteiros)
    if (trimmed.match(/^\d{1,3}$/)) {
      const seconds = parseInt(trimmed, 10);
      const result = formatSecondsToTempo(seconds);
      console.log('parseTempoCell - string ss convertido para:', result);
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
      
      const nome = row.getCell(colMap.nome || 1).value;
      const nomeStr = nome ? String(nome).trim() : '';
      
      const tempoVal = row.getCell(colMap.tempo || 4).value;
      console.log(`Linha ${rowNumber} - Nome: ${nomeStr}, Tempo raw:`, tempoVal);
      const tempo = parseTempoCell(tempoVal);
      console.log(`Linha ${rowNumber} - Tempo processado:`, tempo);
      
      // Filtrar linhas vazias (sem nome e sem tempo)
      if (!nomeStr && !tempo) {
        return;
      }
      
      const dataNascimentoVal = row.getCell(colMap.dataNascimento || 2).value;
      const dataRegistroVal = row.getCell(colMap.dataRegistro || 3).value;
      const provaVal = row.getCell(colMap.prova || 5).value;
      const estiloVal = row.getCell(colMap.estilo || 6).value;
      const modoVal = row.getCell(colMap.modo || 7).value;
      
      registros.push({
        nome: nomeStr,
        dataNascimento: excelDateToISO(dataNascimentoVal),
        dataRegistro: excelDateToISO(dataRegistroVal),
        tempo: tempo,
        prova: provaVal ? String(provaVal).trim() : '',
        estilo: estiloVal ? String(estiloVal).trim() : '',
        modo: modoVal ? String(modoVal).trim() : ''
      });
    });
    
    return registros;
  } catch (error) {
    throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
  }
}

