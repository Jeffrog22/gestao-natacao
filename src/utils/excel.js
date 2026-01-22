import * as XLSX from 'xlsx';

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
 * @param {number|string} val - Valor da célula de tempo
 * @returns {string} - Tempo no formato mm:ss.SS
 */
function parseTempoCell(val) {
  if (!val && val !== 0) return '';
  
  // Se é número (fração de dia do Excel: 0.0003 = 26 segundos)
  if (typeof val === 'number') {
    // Excel armazena tempo como fração de dia (1 dia = 86400 segundos)
    // Se o número é muito pequeno (< 1), é provavelmente um tempo
    if (val < 1) {
      const seconds = val * 86400;
      return formatSecondsToTempo(seconds);
    }
    // Se é um número maior, pode ser apenas segundos
    if (val < 10000) {
      return formatSecondsToTempo(val);
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
      return `${mm}:${ss}.${cs.padStart(2, '0')}`;
    }
    
    // Formato "ss.S" ou "ss.SS" (apenas segundos)
    if (trimmed.match(/^\d{1,3}\.\d{1,2}$/)) {
      const seconds = parseFloat(trimmed);
      return formatSecondsToTempo(seconds);
    }
    
    // Formato "ss" (apenas segundos inteiros)
    if (trimmed.match(/^\d{1,3}$/)) {
      const seconds = parseInt(trimmed, 10);
      return formatSecondsToTempo(seconds);
    }
    
    // Se já está no formato correto
    if (trimmed.match(/^\d{2}:\d{2}\.\d{2}$/)) {
      return trimmed;
    }
  }
  
  return '';
}

/**
 * Lê arquivo Excel e retorna array de registros normalizados
 * @param {File} file - Arquivo Excel (.xlsx)
 * @returns {Promise<Array>} - Array de registros { nome, dataNascimento, dataRegistro, tempo, prova, estilo, modo }
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pega a primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converte para JSON mantendo valores brutos (números, datas)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: true,
          defval: ''
        });
        
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }
        
        // Identifica os índices das colunas normalizadas
        const headers = Object.keys(jsonData[0]);
        const colMap = {};
        
        headers.forEach(h => {
          const normalized = normalizeHeader(h);
          colMap[normalized] = h;
        });
        
        // Processa cada linha
        const registros = jsonData
          .map(row => {
            const nome = row[colMap.nome] || '';
            const tempo = parseTempoCell(row[colMap.tempo]);
            
            // Filtrar linhas vazias (sem nome e sem tempo)
            if (!nome.trim() && !tempo) {
              return null;
            }
            
            return {
              nome: nome.trim(),
              dataNascimento: excelDateToISO(row[colMap.dataNascimento]),
              dataRegistro: excelDateToISO(row[colMap.dataRegistro]),
              tempo: tempo,
              prova: row[colMap.prova] || '',
              estilo: row[colMap.estilo] || '',
              modo: row[colMap.modo] || ''
            };
          })
          .filter(r => r !== null); // Remove linhas vazias
        
        resolve(registros);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
