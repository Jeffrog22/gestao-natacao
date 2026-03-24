import React, { useState, useMemo, useRef } from 'react';
import { 
  Trash2, 
  RefreshCcw, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Edit2, 
  X,
  FileUp
} from 'lucide-react';
import { parseExcelFile } from './utils/excel';
import * as ExcelJS from 'exceljs';

// --- Configurações e Constantes ---

const PROVAS = ['25m', '50m', '100m', '200m', '400m', '800m', '1500m'];
const ESTILOS = ['Livre', 'Costas', 'Peito', 'Borboleta', 'Medley'];
const MODOS = ['Aula', 'Festival', 'Competição']; 

// Base de dados Mock de Atletas
const BASE_ATLETAS = [
  { id: 1, nome: 'Ana Silva', Aniversário: '2010-05-15' },
  { id: 2, nome: 'Carlos Souza', Aniversário: '2008-02-10' },
  { id: 3, nome: 'Beatriz Costa', Aniversário: '2012-08-20' },
  { id: 4, nome: 'Daniel Oliveira', Aniversário: '2009-11-05' },
];

// Lógica de Categorias CBDA (Baseada na idade na época do registro)
const calcularCategoria = (dataNascimento, dataRegistro) => {
  if (!dataNascimento || !dataRegistro) return '-';
  
  const nasc = new Date(dataNascimento);
  const reg = new Date(dataRegistro);
  
  // Cálculo: Ano do Registro - Ano de Nascimento
  const idadeNaEpoca = reg.getFullYear() - nasc.getFullYear();

  if (idadeNaEpoca <= 8) return 'Mirim';
  if (idadeNaEpoca <= 10) return 'Petiz';
  if (idadeNaEpoca <= 12) return 'Infantil';
  if (idadeNaEpoca <= 14) return 'Juvenil';
  if (idadeNaEpoca <= 16) return 'Junior';
  return 'Sênior';
};

// --- Componente Principal ---

export default function App() {
  // Estado dos Dados Iniciais
  const [registros, setRegistros] = useState([
    { id: 1, nome: 'Ana Silva', dataNascimento: '2010-05-15', dataRegistro: '2021-06-20', tempo: '00:32.50', prova: '50m', estilo: 'Livre', modo: 'Competição', genero: 'F' },
    { id: 2, nome: 'Ana Silva', dataNascimento: '2010-05-15', dataRegistro: '2023-11-10', tempo: '00:29.10', prova: '50m', estilo: 'Livre', modo: 'Competição', genero: 'F' },
    { id: 3, nome: 'Carlos Souza', dataNascimento: '2008-02-10', dataRegistro: '2023-05-05', tempo: '01:05.20', prova: '100m', estilo: 'Costas', modo: 'Aula', genero: 'M' },
  ]);

  const [alunos, setAlunos] = useState(BASE_ATLETAS.map(a => ({ nome: a.nome, dataNascimento: a.Aniversário || '', codigo: a.id, genero: '' })));

  const [lixeira, setLixeira] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('ativos'); // 'ativos' | 'lixeira'

  // Estado de Filtros e Ordenação
  const [filtros, setFiltros] = useState({ nome: '', prova: '', estilo: '', modo: '', categoria: '' });
  const [generoDropdownOpen, setGeneroDropdownOpen] = useState(false);
  // add genero to filtros
  if (!('genero' in filtros)) filtros.genero = '';
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [ordenacao, setOrdenacao] = useState({ campo: 'dataRegistro', direcao: 'desc' });

  // Estado do Formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: '', dataNascimento: '', dataRegistro: '', tempo: '', prova: '', estilo: '', modo: '', genero: ''
  });

  // Ref para input de arquivo
  const fileInputRef = useRef(null);

  // --- Lógica de Negócio e Manipuladores ---

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      // parseExcelFile agora retorna { registros, alunos }
      const registrosImportados = parsed.registros || [];
      const alunosImportados = parsed.alunos || [];

      console.log('registrosImportados (preview):', JSON.stringify(registrosImportados.slice(0, 5), null, 2));
      console.log('alunosImportados (preview):', JSON.stringify(alunosImportados.slice(0, 5), null, 2));

      if (alunosImportados.length > 0) {
        setAlunos(prev => {
          // merge unique by normalized name or codigo
          const existing = [...prev];
          const names = new Set(existing.map(x => x.nome));
          alunosImportados.forEach(a => {
            if (a.nome && !names.has(a.nome)) existing.push({ nome: a.nome, dataNascimento: a.dataNascimento || '', codigo: a.codigo || '', genero: a.genero || '' });
          });
          return existing;
        });
      }

      if (registrosImportados.length === 0) {
        alert('Nenhum registro válido encontrado no arquivo.');
        return;
      }

      // Atribuir IDs únicos aos registros importados
      const registrosComIds = registrosImportados.map((reg, idx) => ({ ...reg, id: Date.now() + idx }));

      // Adicionar aos registros existentes
      setRegistros(prev => [...prev, ...registrosComIds]);

      alert(`${registrosComIds.length} registro(s) importado(s) com sucesso!`);
    } catch (error) {
      alert(`Erro ao importar arquivo: ${error.message}`);
    } finally {
      // Limpar o input para permitir reimportar o mesmo arquivo
      e.target.value = '';
    }
  };

  // Exportar registros para arquivo XLSX
  const exportRegistrosToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DBregistros');

      // Cabeçalhos
      sheet.addRow(['Nome','DataNascimento','DataRegistro','Tempo','Prova','Estilo','Modo','Categoria','Genero']);

      registros.forEach(r => {
        sheet.addRow([r.nome || '', r.dataNascimento || '', r.dataRegistro || '', r.tempo || '', r.prova || '', r.estilo || '', r.modo || '', r.categoria || '', r.genero || '']);
      });

      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registros_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Falha ao exportar XLSX: ' + err.message);
    }
  };

  const handleSort = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const limparFiltros = () => {
    setFiltros({ nome: '', prova: '', estilo: '', modo: '', categoria: '', genero: '' });
  };

  const handleTempoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (!valor) {
      setForm(prev => ({ ...prev, tempo: '' }));
      return;
    }
    const padded = valor.padStart(6, '0').slice(-6);
    const mm = padded.slice(0, 2);
    const ss = padded.slice(2, 4);
    const ms = padded.slice(4, 6);
    setForm(prev => ({ ...prev, tempo: `${mm}:${ss}.${ms}` }));
  };

  const salvarRegistro = (e) => {
    e.preventDefault();
    if (editandoId) {
      setRegistros(prev => prev.map(r => r.id === editandoId ? { ...form, id: editandoId } : r));
    } else {
      setRegistros(prev => [...prev, { ...form, id: Date.now() }]);
    }
    fecharModal();
  };

  const moverParaLixeira = (id) => {
    const item = registros.find(r => r.id === id);
    if (!item) return;
    const ok = window.confirm(`Mover "${item.nome}" para a lixeira?`);
    if (!ok) return;
    setRegistros(prev => prev.filter(r => r.id !== id));
    setLixeira(prev => [...prev, item]);
  };

  const restaurarDaLixeira = (id) => {
    const item = lixeira.find(r => r.id === id);
    setLixeira(prev => prev.filter(r => r.id !== id));
    setRegistros(prev => [...prev, item]);
  };

  const excluirDefinitivamente = (id) => {
    const item = lixeira.find(r => r.id === id);
    if (!item) return;
    const ok = window.confirm(`Excluir definitivamente "${item.nome}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    setLixeira(prev => prev.filter(r => r.id !== id));
  };

  const limparLixeiraCompleta = () => {
    const ok = window.confirm('Esvaziar completamente a lixeira? Todos os registros serão removidos permanentemente.');
    if (!ok) return;
    setLixeira([]);
  };

  const abrirModalEdicao = (registro) => {
    setForm(registro);
    setEditandoId(registro.id);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoId(null);
    setForm({ nome: '', dataNascimento: '', dataRegistro: '', tempo: '', prova: '', estilo: '', modo: '', genero: '' });
  };

  // --- Processamento de Dados (Memoized) ---

  const dadosExibidos = useMemo(() => {
    const fonte = abaAtiva === 'ativos' ? registros : lixeira;

    let dadosFiltrados = fonte.filter(item => {
      const categoriaHistorica = item.categoria || calcularCategoria(item.dataNascimento, item.dataRegistro);
      const generoItem = item.genero || '-';
      return (
        item.nome.toLowerCase().includes(filtros.nome.toLowerCase()) &&
        (filtros.prova === '' || item.prova === filtros.prova) &&
        (filtros.estilo === '' || item.estilo === filtros.estilo) &&
        (filtros.modo === '' || item.modo === filtros.modo) &&
        (filtros.categoria === '' || categoriaHistorica === filtros.categoria) &&
        (filtros.genero === '' || generoItem === filtros.genero)
      );
    });

    return dadosFiltrados.sort((a, b) => {
      const valA = a[ordenacao.campo];
      const valB = b[ordenacao.campo];
      
      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }, [registros, lixeira, abaAtiva, filtros, ordenacao]);

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Gestão de Tempos de Natação</h1>
            <p className="text-gray-500">Acompanhamento histórico e evolução de atletas</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            <button 
              onClick={handleImportClick}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileUp size={20} /> Importar XLSX
            </button>
            <button 
              onClick={exportRegistrosToExcel}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              Exportar XLSX
            </button>
            <button 
              onClick={() => setModalAberto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={20} /> Novo Registro
            </button>
          </div>
        </header>

        {/* Abas de Navegação */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setAbaAtiva('ativos')}
            className={`pb-2 px-4 font-medium ${abaAtiva === 'ativos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Registros Ativos ({registros.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('lixeira')}
            className={`pb-2 px-4 font-medium flex items-center gap-2 ${abaAtiva === 'lixeira' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Trash2 size={16} /> Lixeira ({lixeira.length})
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar Aluno</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Nome do atleta..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={filtros.nome}
                onChange={e => setFiltros({...filtros, nome: e.target.value})}
              />
            </div>
          </div>
          
          {['prova', 'estilo', 'modo'].map(campo => (
            <div key={campo} className="w-40">
              <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">{campo}</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filtros[campo]}
                onChange={e => setFiltros({...filtros, [campo]: e.target.value})}
              >
                <option value="">Todos</option>
                {(campo === 'prova' ? PROVAS : campo === 'estilo' ? ESTILOS : MODOS).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          <button 
            onClick={limparFiltros}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
          >
            Limpar Filtros
          </button>
          
          {abaAtiva === 'lixeira' && lixeira.length > 0 && (
             <button 
             onClick={limparLixeiraCompleta}
             className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors text-sm font-medium flex items-center gap-2"
           >
             <Trash2 size={16} /> Esvaziar Lixeira
           </button>
          )}
        </div>

        {/* Grid de Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {
                  // Cabeçalhos customizados para tratar categoria e genero
                }
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider relative">Aluno</th>
                <th onClick={() => handleSort('dataRegistro')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative">Data Reg.
                  {ordenacao.campo === 'dataRegistro' && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider relative">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCategoriaDropdownOpen(prev => !prev); }}
                      className={`flex items-center gap-2 ${filtros.categoria ? 'text-white bg-indigo-600 px-2 py-1 rounded' : ''}`}
                    >
                      CATEGORIA
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </button>

                    {categoriaDropdownOpen && (
                      <div className="absolute z-50 mt-2 right-0 bg-white border rounded shadow-lg w-40 p-2">
                        <div className="text-xs text-gray-500 mb-1">Filtrar por Categoria</div>
                        {['', 'Mirim','Petiz','Infantil','Juvenil','Junior','Sênior','-'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setFiltros({...filtros, categoria: opt}); setCategoriaDropdownOpen(false); }}
                            className={`block w-full text-left px-2 py-1 rounded text-sm ${filtros.categoria === opt ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {opt === '' ? 'Todos' : opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('prova')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative">Prova {ordenacao.campo === 'prova' && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th onClick={() => handleSort('estilo')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative">Estilo {ordenacao.campo === 'estilo' && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th onClick={() => handleSort('tempo')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative">Tempo {ordenacao.campo === 'tempo' && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider relative">Modo</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider relative">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setGeneroDropdownOpen(prev => !prev); }}
                      className={`flex items-center gap-2 ${filtros.genero ? 'text-white bg-indigo-600 px-2 py-1 rounded' : ''}`}
                    >
                      GÊNERO
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </button>

                    {generoDropdownOpen && (
                      <div className="absolute z-50 mt-2 right-0 bg-white border rounded shadow-lg w-32 p-2">
                        <div className="text-xs text-gray-500 mb-1">Filtrar por Gênero</div>
                        {['', 'M','F','O','-'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setFiltros({...filtros, genero: opt}); setGeneroDropdownOpen(false); }}
                            className={`block w-full text-left px-2 py-1 rounded text-sm ${filtros.genero === opt ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {opt === '' ? 'Todos' : opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dadosExibidos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                dadosExibidos.map((item) => {
                  const categoriaHistorica = item.categoria || calcularCategoria(item.dataNascimento, item.dataRegistro);
                  
                  return (
                    <tr key={item.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="p-4 font-medium text-gray-900">{item.nome}</td>
                      <td className="p-4 text-gray-600">{new Date(item.dataRegistro).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setFiltros({...filtros, categoria: categoriaHistorica})}
                          className={`px-2 py-1 rounded text-xs font-bold focus:outline-none ${filtros.categoria === categoriaHistorica ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                          title={`Filtrar por ${categoriaHistorica}`}
                        >
                          {categoriaHistorica}
                        </button>
                      </td>
                      <td className="p-4 text-gray-600">{item.prova}</td>
                      <td className="p-4 text-gray-600">{item.estilo}</td>
                      <td className="p-4 font-mono font-medium text-gray-900">{item.tempo}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold 
                          ${item.modo === 'Competição' ? 'bg-orange-100 text-orange-700' : 
                            item.modo === 'Festival' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {item.modo}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold">{item.genero || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {abaAtiva === 'ativos' ? (
                            <>
                              <button onClick={() => abrirModalEdicao(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => moverParaLixeira(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => restaurarDaLixeira(item.id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Restaurar">
                                <RefreshCcw size={16} />
                              </button>
                              <button onClick={() => excluirDefinitivamente(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Excluir Definitivamente">
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editandoId ? 'Editar Tempo' : 'Novo Registro de Tempo'}</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={salvarRegistro} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Aluno</label>
                <select 
                  required 
                  className="w-full p-2 border rounded-lg bg-white" 
                  value={form.nome} 
                  onChange={e => {
                    const nomeSelecionado = e.target.value;
                    const atleta = alunos.find(a => a.nome === nomeSelecionado);
                    const dataAniversário = atleta ? (atleta.dataNascimento || '') : '';
                    const genero = atleta ? (atleta.genero || '') : '';
                    setForm({...form, nome: nomeSelecionado, dataNascimento: dataAniversário, genero});
                  }}
                >
                  <option value="">Selecione um atleta</option>
                  {alunos.map((atleta, idx) => (
                    <option key={idx} value={atleta.nome}>{atleta.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Registro</label>
                <input required type="date" className="w-full p-2 border rounded-lg" value={form.dataRegistro} onChange={e => setForm({...form, dataRegistro: e.target.value})} />
              </div>

              {/* Exibição da Categoria Calculada no Form */}
              <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                <span className="text-sm text-blue-800">Categoria calculada para esta data:</span>
                <span className="font-bold text-blue-900">{calcularCategoria(form.dataNascimento, form.dataRegistro)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo/Evento</label>
                <select required className="w-full p-2 border rounded-lg bg-white" value={form.modo} onChange={e => setForm({...form, modo: e.target.value})}>
                  <option value="">Selecione</option>
                  {MODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estilo</label>
                <select required className="w-full p-2 border rounded-lg bg-white" value={form.estilo} onChange={e => setForm({...form, estilo: e.target.value})}>
                  <option value="">Selecione</option>
                  {ESTILOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prova</label>
                <select required className="w-full p-2 border rounded-lg bg-white" value={form.prova} onChange={e => setForm({...form, prova: e.target.value})}>
                  <option value="">Selecione</option>
                  {PROVAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo</label>
                <input required type="text" placeholder="00:00.00" className="w-full p-2 border rounded-lg" value={form.tempo} onChange={handleTempoChange} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={fecharModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
