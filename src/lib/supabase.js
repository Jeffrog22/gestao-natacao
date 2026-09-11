const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://ciemcfibkmzqcfvavvsb.supabase.co').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZW1jZmlia216cWNmdmF2dnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzQ1MjQsImV4cCI6MjA5Nzc1MDUyNH0.Tw5tMGmPUrg5k77NKFv-FQqWvQ2bQsx2OdSL2krnWEg';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'bela-vista';

let supabaseIdCounter = 0;

/**
 * Busca todos os alunos do Supabase via REST API (ativos e inativos)
 * @param {object} opts - Opções de filtro
 * @param {string} opts.nome - Filtro parcial por nome (ILIKE)
 * @param {number} opts.limit - Limite de resultados
 * @returns {Promise<Array>} Lista de alunos mapeados no modelo unificado
 */
export async function fetchAlunos({ nome, limit = 500 } = {}) {
  const params = new URLSearchParams({
    select: 'nome,data_nascimento,genero,categoria,nivel,ativo',
    tenant_id: `eq.${TENANT_ID}`,
    order: 'nome.asc',
  });

  if (nome) {
    params.set('nome', `ilike.*${nome}*`);
  }

  if (limit) {
    params.set('limit', String(limit));
  }

  const baseUrl = SUPABASE_URL.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/rest/v1/alunos?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar alunos: ${res.status} ${res.statusText}`);
  }

  const rows = await res.json();

  return rows.map((r) => {
    supabaseIdCounter++;
    return {
      id: `SUP-${String(supabaseIdCounter).padStart(4, '0')}`,
      nome: r.nome || '',
      dataNascimento: r.data_nascimento || '',
      genero: r.genero || '',
      categoria: r.categoria || '',
      nivel: r.nivel || '',
      origem: 'supabase',
      status: r.ativo ? 'ativo' : 'inativo',
    };
  });
}
