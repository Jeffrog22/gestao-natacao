import { useState, useEffect } from 'react';
import { fetchAlunos } from '../lib/supabase';

/**
 * Hook que busca alunos ativos do Supabase
 * @returns {{ alunos: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export function useAlunosSupabase() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlunos();
      setAlunos(data);
    } catch (err) {
      console.warn('Falha ao buscar alunos do Supabase:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { alunos, loading, error, refetch: load };
}
