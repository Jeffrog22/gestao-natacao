import React, { useMemo } from 'react';
import { Edit2, Trash2, UserPlus } from 'lucide-react';

/**
 * Aba de gerenciamento de alunos
 * @param {object} props
 * @param {Array} props.alunos - Lista unificada de alunos
 * @param {Function} props.onToggleStatus - Alterna status do aluno
 * @param {Function} props.onEditar - Abre modal de edição (apenas excel/manual)
 * @param {Function} props.onExcluir - Exclui aluno (apenas excel/manual)
 * @param {Function} props.onNovoAluno - Abre modal de cadastro
 * @param {Function} props.onSelecionarAluno - Duplo-clique: carrega registros do aluno
 */
export default function GestaoAlunos({ alunos, onToggleStatus, onEditar, onExcluir, onNovoAluno, onSelecionarAluno }) {
  const alunosOrdenados = useMemo(() => {
    return [...alunos].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ativo' ? -1 : 1;
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    });
  }, [alunos]);

  const stats = useMemo(() => {
    const ativos = alunos.filter(a => a.status === 'ativo').length;
    const inativos = alunos.filter(a => a.status === 'inativo').length;
    return { total: alunos.length, ativos, inativos };
  }, [alunos]);

  const podeEditar = (aluno) => aluno.origem !== 'supabase';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestão de Alunos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} aluno(s) • {stats.ativos} ativo(s) • {stats.inativos} inativo(s)
          </p>
        </div>
        <button
          onClick={onNovoAluno}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          Novo Aluno
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data Nasc.</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Gênero</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Origem</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alunosOrdenados.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400">
                  Nenhum aluno cadastrado.
                </td>
              </tr>
            ) : (
              alunosOrdenados.map((aluno) => (
                <tr
                  key={aluno.id}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                  onDoubleClick={() => onSelecionarAluno(aluno.nome)}
                  title="Duplo-clique para ver registros deste aluno"
                >
                  <td className="p-3 font-mono text-xs text-gray-600">{aluno.id}</td>
                  <td className="p-3 font-medium text-gray-900">{aluno.nome}</td>
                  <td className="p-3 text-gray-600">
                    {aluno.dataNascimento ? new Date(aluno.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-3 text-gray-600">{aluno.genero || '-'}</td>
                  <td className="p-3 text-gray-600">{aluno.categoria || '-'}</td>
                  <td className="p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (podeEditar(aluno)) onToggleStatus(aluno.id);
                      }}
                      disabled={!podeEditar(aluno)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                        aluno.status === 'ativo'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      } ${!podeEditar(aluno) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      aluno.origem === 'supabase' ? 'bg-blue-100 text-blue-700' :
                      aluno.origem === 'excel' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {aluno.origem === 'supabase' ? 'Banco' : aluno.origem === 'excel' ? 'Excel' : 'Manual'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {podeEditar(aluno) ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditar(aluno); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onExcluir(aluno.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400" title="Aluno do banco — somente leitura">Somente leitura</span>
                    )}
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
