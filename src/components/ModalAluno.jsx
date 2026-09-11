import React, { useState } from 'react';
import { X } from 'lucide-react';

function getFormInicial(aluno) {
  if (aluno) {
    return {
      nome: aluno.nome || '',
      dataNascimento: aluno.dataNascimento || '',
      genero: aluno.genero || '',
      categoria: aluno.categoria || '',
    };
  }
  return { nome: '', dataNascimento: '', genero: '', categoria: '' };
}

/**
 * Modal de cadastro/edição de aluno
 * @param {object} props
 * @param {boolean} props.aberto
 * @param {Function} props.onFechar
 * @param {Function} props.onSalvar
 * @param {object|null} props.aluno - Aluno para edição (null = novo)
 */
export default function ModalAluno({ aberto, onFechar, onSalvar, aluno }) {
  const [form, setForm] = useState(() => getFormInicial(aluno));

  const resetForm = (novoAluno) => {
    setForm(getFormInicial(novoAluno));
  };

  if (!aberto) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onSalvar({
      ...form,
      nome: form.nome.trim(),
    });
  };

  const categorias = ['Mirim', 'Petiz', 'Infantil', 'Juvenil', 'Junior', 'Senior'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {aluno ? 'Editar Aluno' : 'Novo Aluno'}
          </h2>
          <button onClick={() => { resetForm(null); onFechar(); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <form key={aluno?.id || 'novo'} onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              required
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={form.nome}
              onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo do aluno"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={form.dataNascimento}
              onChange={e => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                defaultValue={form.genero}
                onChange={e => setForm(prev => ({ ...prev, genero: e.target.value }))}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                defaultValue={form.categoria}
                onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <option value="">Selecione</option>
                {categorias.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { resetForm(null); onFechar(); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {aluno ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
