import React, { useState, useMemo } from 'react';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';

const GENERO_OPTIONS = [
  { value: '', label: '-' },
  { value: 'M', label: 'M' },
  { value: 'F', label: 'F' },
  { value: 'O', label: 'O' },
];

const normalizarNome = (nome) =>
  (nome || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Aba de consulta de alunos com edição inline de gênero
 * @param {object} props
 * @param {Array} props.alunos - Lista unificada de alunos
 * @param {Function} props.onSelecionarAluno - Duplo-clique: carrega registros do aluno
 * @param {Function} props.onAtualizarAluno - Atualiza aluno + propaga para registros
 * @param {Function} props.onCalcularCategoria - Calcula categoria CBDA (dataNascimento, dataRegistro)
 */
export default function GestaoAlunos({ alunos, onSelecionarAluno, onAtualizarAluno, onCalcularCategoria }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'nome', direcao: 'asc' });
  const [editandoGenero, setEditandoGenero] = useState(null);

  const handleSort = (campo) => {
    setOrdenacao(prev => {
      if (prev.campo !== campo) return { campo, direcao: 'asc' };
      if (prev.direcao === 'asc') return { campo, direcao: 'desc' };
      if (prev.direcao === 'desc') return { campo, direcao: null };
      return { campo, direcao: 'asc' };
    });
  };

  const SortIcon = ({ campo }) => {
    if (ordenacao.campo !== campo || !ordenacao.direcao) return null;
    return ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const dadosFiltrados = useMemo(() => {
    const termo = normalizarNome(termoBusca);
    if (!termo) return alunos;
    return alunos.filter(a =>
      normalizarNome(a.nome).includes(termo)
    );
  }, [alunos, termoBusca]);

  const alunosOrdenados = useMemo(() => {
    if (!ordenacao.direcao) return dadosFiltrados;
    return [...dadosFiltrados].sort((a, b) => {
      let valA = a[ordenacao.campo] ?? '';
      let valB = b[ordenacao.campo] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }, [dadosFiltrados, ordenacao]);

  const stats = useMemo(() => {
    const ativos = alunos.filter(a => a.status === 'ativo').length;
    const inativos = alunos.filter(a => a.status === 'inativo').length;
    return { total: alunos.length, ativos, inativos };
  }, [alunos]);

  const thClass = "p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none";

  const handleGeneroChange = (aluno, novoGenero) => {
    if (onAtualizarAluno) {
      onAtualizarAluno(aluno.id, { genero: novoGenero });
    }
    setEditandoGenero(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Gestão de Alunos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.total} aluno(s) • {stats.ativos} ativo(s) • {stats.inativos} inativo(s)
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Buscar aluno..."
            className="w-64 pl-9 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
          />
          {termoBusca && (
            <button
              type="button"
              onClick={() => setTermoBusca('')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th onClick={() => handleSort('nome')} className={thClass}>
                <span className="flex items-center gap-1">Nome <SortIcon campo="nome" /></span>
              </th>
              <th onClick={() => handleSort('dataNascimento')} className={thClass}>
                <span className="flex items-center gap-1">Data Nasc. <SortIcon campo="dataNascimento" /></span>
              </th>
              <th onClick={() => handleSort('genero')} className={thClass}>
                <span className="flex items-center gap-1">Gênero <SortIcon campo="genero" /></span>
              </th>
              <th onClick={() => handleSort('categoria')} className={thClass}>
                <span className="flex items-center gap-1">Categoria <SortIcon campo="categoria" /></span>
              </th>
              <th onClick={() => handleSort('status')} className={thClass}>
                <span className="flex items-center gap-1">Status <SortIcon campo="status" /></span>
              </th>
              <th onClick={() => handleSort('origem')} className={thClass}>
                <span className="flex items-center gap-1">Origem <SortIcon campo="origem" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {alunosOrdenados.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 dark:text-gray-500">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              alunosOrdenados.map((aluno) => (
                <tr
                  key={aluno.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onDoubleClick={() => onSelecionarAluno(aluno.nome)}
                  title="Duplo-clique para ver registros deste aluno"
                >
                  <td className="p-3 font-mono text-xs text-gray-600 dark:text-gray-400">{aluno.id}</td>
                  <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{aluno.nome}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {aluno.dataNascimento ? new Date(aluno.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 relative">
                    {editandoGenero === aluno.id ? (
                      <select
                        autoFocus
                        className="border border-primary-400 dark:border-primary-500 rounded px-1 py-0.5 text-xs bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={aluno.genero || ''}
                        onChange={e => handleGeneroChange(aluno, e.target.value)}
                        onBlur={() => setEditandoGenero(null)}
                      >
                        {GENERO_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditandoGenero(aluno.id); }}
                        className="hover:bg-primary-100 dark:hover:bg-primary-900/30 px-1 rounded cursor-pointer transition-colors"
                        title="Clique para editar gênero"
                      >
                        {aluno.genero || '-'}
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {onCalcularCategoria
                      ? onCalcularCategoria(aluno.dataNascimento, new Date().toISOString().split('T')[0])
                      : (aluno.categoria || '-')}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      aluno.status === 'ativo'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      aluno.origem === 'supabase' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' :
                      aluno.origem === 'excel' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {aluno.origem === 'supabase' ? 'Fiz!' : aluno.origem === 'excel' ? 'Excel' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
