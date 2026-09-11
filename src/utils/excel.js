import * as ExcelJS from 'exceljs';

/**
 * Normaliza cabeçalhos de colunas para aceitar variações comuns
 * @param {string} h - Cabeçalho da coluna
 * @returns {string} - Nome normalizado da coluna
 */
function normalizeHeader(h) {
  const lower = h.toLowerCase().trim();
  if (lower.includes('nome') || lower.includes('atleta') || lower.includes('aluno')) return 'nome';
  if (lower.includes('nascimento') || lower.includes('aniversário') || lower.includes('aniversario')) return 'dataNascimento';
  if (lower.includes('registro') || (lower.includes('data') && lower.includes('reg'))) return 'dataRegistro';
  if (lower.includes('tempo')) return 'tempo';
  if (lower.includes('prova') || lower.includes('distância') || lower.includes('distancia')) return 'prova';
  if (lower.includes('estilo') || lower.includes('nado')) return 'estilo';
  if (lower.includes('modo') || lower.includes('evento') || lower.includes('tipo')) return 'modo';
  return h;
}

/**
 * Converte data do Excel (número serial ou string ou Date) para formato ISO (YYYY-MM-DD)
 */
function excelDateToISO(excelVal) {
  if (!excelVal && excelVal !== 0) return '';

  if (excelVal && typeof excelVal === 'object') {
    if (excelVal.text) excelVal = excelVal.text;
    else if (excelVal.result !== undefined) excelVal = excelVal.result;
    else if (excelVal.richText && Array.isArray(excelVal.richText)) {
      excelVal = excelVal.richText.map(t => t.text || '').join('');
    }
  }

  if (excelVal instanceof Date) {
    const year = excelVal.getFullYear();
    const month = String(excelVal.getMonth() + 1).padStart(2, '0');
    const day = String(excelVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof excelVal === 'string') {
    const parts = excelVal.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    if (excelVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return excelVal;
    }
  }

  if (typeof excelVal === 'number') {
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

/**
 * Converte segundos (número decimal) para formato mm:ss.SS
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
 */
function parseTempoCell(val) {
  if (!val && val !== 0) return '';

  if (val instanceof Date) {
    const hours = val.getUTCHours();
    const minutes = val.getUTCMinutes();
    const seconds = val.getUTCSeconds();
    const milliseconds = val.getUTCMilliseconds();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    return formatSecondsToTempo(totalSeconds);
  }

  if (typeof val === 'number') {
    if (val < 1) {
      return formatSecondsToTempo(val * 86400);
    }
    if (val >= 1 && val < 1000000) {
      const numStr = String(Math.floor(val)).padStart(6, '0');
      return `${numStr.substring(0, 2)}:${numStr.substring(2, 4)}.${numStr.substring(4, 6)}`;
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.match(/^\d{1,2}:\d{2}\.\d{1,2}$/)) {
      const parts = trimmed.split(':');
      const mm = parts[0].padStart(2, '0');
      const [ss, cs] = parts[1].split('.');
      return `${mm}:${ss}.${cs.padStart(2, '0')}`;
    }
    if (trimmed.match(/^\d{4,6}$/)) {
      const numStr = trimmed.padStart(6, '0');
      return `${numStr.substring(0, 2)}:${numStr.substring(2, 4)}.${numStr.substring(4, 6)}`;
    }
    if (trimmed.match(/^\d{1,3}\.\d{1,2}$/)) {
      return formatSecondsToTempo(parseFloat(trimmed));
    }
    if (trimmed.match(/^\d{2}:\d{2}\.\d{2}$/)) {
      return trimmed;
    }
  }

  return '';
}

/**
 * Lê arquivo Excel e retorna array de registros normalizados
 * Planilha simples com 7 colunas: Nome, Data_nascimento, Data_registro, Tempo, Prova, Estilo, Modo/Evento
 * @param {File} file - Arquivo Excel (.xlsx)
 * @returns {Promise<Object>} - { registros, alunos }
 */
export async function parseExcelFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Nenhuma planilha encontrada no arquivo');
    }

    // Lê cabeçalhos da linha 1
    const headerRow = worksheet.getRow(1);
    const colMap = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerValue = cell.value ? String(cell.value).trim() : '';
      if (headerValue) {
        const normalized = normalizeHeader(headerValue);
        colMap[normalized] = colNumber;
      }
    });

    // Processa cada linha (a partir da linha 2)
    const registros = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const nomeRaw = row.getCell(colMap.nome || 1).value;
      const nomeStr = String(flattenCellValue(nomeRaw)).trim();

      const tempoRaw = row.getCell(colMap.tempo || 4).value;
      const tempoVal = flattenCellValue(tempoRaw);
      const tempo = parseTempoCell(tempoVal);

      // Pular linhas vazias
      if (!nomeStr && !tempo) return;

      const dataNascimentoVal = flattenCellValue(row.getCell(colMap.dataNascimento || 2).value);
      const dataRegistroVal = flattenCellValue(row.getCell(colMap.dataRegistro || 3).value);
      const provaVal = flattenCellValue(row.getCell(colMap.prova || 5).value);
      const estiloVal = flattenCellValue(row.getCell(colMap.estilo || 6).value);
      const modoVal = flattenCellValue(row.getCell(colMap.modo || 7).value);

      const dataNiso = excelDateToISO(dataNascimentoVal);
      const dataRiso = excelDateToISO(dataRegistroVal);

      registros.push({
        nome: nomeStr,
        dataNascimento: dataNiso,
        dataRegistro: dataRiso,
        tempo,
        genero: '-',
        prova: provaVal ? String(provaVal).trim() : '',
        estilo: estiloVal ? String(estiloVal).trim() : '',
        modo: modoVal ? String(modoVal).trim() : ''
      });
    });

    // Derivar alunos dos registros (nomes únicos)
    const nomesVistos = new Set();
    const alunos = [];
    let idCounter = 0;
    for (const reg of registros) {
      if (!reg.nome || nomesVistos.has(reg.nome)) continue;
      nomesVistos.add(reg.nome);
      idCounter++;
      alunos.push({
        id: `ID-${String(idCounter).padStart(4, '0')}`,
        nome: reg.nome,
        dataNascimento: reg.dataNascimento,
        genero: '-',
        categoria: '',
        origem: 'excel',
        status: 'ativo'
      });
    }

    return { registros, alunos };
  } catch (error) {
    throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
  }
}
