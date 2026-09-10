const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos nas variáveis de ambiente');
}

/**
 * Busca alunos ativos do Supabase via REST API
 * @param {object} opts - Opções de filtro
 * @param {string} opts.nome - Filtro parcial por nome (ILIKE)
 * @param {number} opts.limit - Limite de resultados
 * @returns {Promise<Array>} Lista de alunos mapeados
 */
export async function fetchAlunos({ nome, limit = 500 } = {}) {
  const params = new URLSearchParams({
    select: 'nome,data_nascimento,genero,categoria,nivel',
    tenant_id: `eq.${TENANT_ID}`,
    ativo: 'eq.true',
    order: 'nome.asc',
  });

  if (nome) {
    params.set('nome', `ilike.*${nome}*`);
  }

  if (limit) {
    params.set('limit', String(limit));
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/alunos?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar alunos: ${res.status} ${res.statusText}`);
  }

  const rows = await res.json();

  return rows.map((r) => ({
    nome: r.nome || '',
    dataNascimento: r.data_nascimento || '',
    genero: r.genero || '',
    categoria: r.categoria || '',
    nivel: r.nivel || '',
  }));
}
