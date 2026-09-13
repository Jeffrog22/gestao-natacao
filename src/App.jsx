import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCcw, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Edit2, 
  X,
  FileUp,
  Users,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import { parseExcelFile } from './utils/excel';
import { useAlunosSupabase } from './hooks/useAlunosSupabase';
import * as ExcelJS from 'exceljs';
import GestaoAlunos from './components/GestaoAlunos';
import Graficos from './components/Graficos';

// --- Configurações e Constantes ---

const ESTILOS = ['Livre', 'Costas', 'Peito', 'Borboleta', 'Medley'];
const PROVAS_POR_ESTILO = {
  Livre: ['25m', '50m', '100m', '200m', '400m', '800m', '1500m'],
  Costas: ['25m', '50m', '100m', '200m', '400m'],
  Peito: ['25m', '50m', '100m', '200m', '400m'],
  Borboleta: ['25m', '50m', '100m', '200m', '400m'],
  Medley: ['100m', '200m', '400m']
};
const PROVAS = Array.from(new Set(Object.values(PROVAS_POR_ESTILO).flat()));
const MODOS = ['Aula', 'Festival', 'Competição']; 

const STORAGE_KEYS = {
  registros: 'registro-tempos:registros',
  alunos: 'registro-tempos:alunos',
  lixeira: 'registro-tempos:lixeira',
  darkMode: 'registro-tempos:darkMode'
};

const loadFromStorage = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const loadDarkMode = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.darkMode);
    if (raw !== null) return JSON.parse(raw);
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Tabela de Categorias CBDA (Baseada na idade mínima na época do registro)
const CATEGORIAS_CBDA = [
  { idadeMinima: 0,  nome: 'Pré-Mirim' },
  { idadeMinima: 9,  nome: 'Mirim I' },
  { idadeMinima: 10, nome: 'Mirim II' },
  { idadeMinima: 11, nome: 'Petiz I' },
  { idadeMinima: 12, nome: 'Petiz II' },
  { idadeMinima: 13, nome: 'Infantil I' },
  { idadeMinima: 14, nome: 'Infantil II' },
  { idadeMinima: 15, nome: 'Juvenil I' },
  { idadeMinima: 16, nome: 'Juvenil II' },
  { idadeMinima: 17, nome: 'Júnior I' },
  { idadeMinima: 18, nome: 'Júnior II/Sênior' },
  { idadeMinima: 20, nome: 'A20+' },
  { idadeMinima: 25, nome: 'B25+' },
  { idadeMinima: 30, nome: 'C30+' },
  { idadeMinima: 35, nome: 'D35+' },
  { idadeMinima: 40, nome: 'E40+' },
  { idadeMinima: 45, nome: 'F45+' },
  { idadeMinima: 50, nome: 'G50+' },
  { idadeMinima: 55, nome: 'H55+' },
  { idadeMinima: 60, nome: 'I60+' },
  { idadeMinima: 65, nome: 'J65+' },
  { idadeMinima: 70, nome: 'K70+' },
  { idadeMinima: 75, nome: 'L75+' },
  { idadeMinima: 80, nome: 'M80+' },
];

const calcularCategoria = (dataNascimento, dataRegistro) => {
  if (!dataNascimento || !dataRegistro) return '-';
  
  const nasc = new Date(dataNascimento);
  const reg = new Date(dataRegistro);
  
  let idade = reg.getFullYear() - nasc.getFullYear();
  const mesReg = reg.getMonth();
  const diaReg = reg.getDate();
  const mesNasc = nasc.getMonth();
  const diaNasc = nasc.getDate();
  if (mesReg < mesNasc || (mesReg === mesNasc && diaReg < diaNasc)) {
    idade--;
  }

  let categoria = '-';
  for (let i = CATEGORIAS_CBDA.length - 1; i >= 0; i--) {
    if (idade >= CATEGORIAS_CBDA[i].idadeMinima) {
      categoria = CATEGORIAS_CBDA[i].nome;
      break;
    }
  }
  return categoria;
};

const normalizarNome = (nome) =>
  (nome || '').trim().toLowerCase().replace(/\s+/g, ' ');

const formatTempoFromDigits = (digits) => {
  const padded = String(digits).padStart(6, '0').slice(-6);
  const mm = padded.slice(0, 2);
  const ss = padded.slice(2, 4);
  const cs = padded.slice(4, 6);
  return `${mm}:${ss}.${cs}`;
};

const normalizeTempoInput = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{1,6}$/.test(raw)) {
    return formatTempoFromDigits(raw);
  }

  const match = raw.match(/^(\d{1,2}):(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (match) {
    const mm = match[1].padStart(2, '0');
    const ss = match[2].padStart(2, '0');
    const cs = (match[3] || '0').padStart(2, '0');
    return `${mm}:${ss}.${cs}`;
  }

  const digits = raw.replace(/\D/g, '').slice(-6);
  return digits ? formatTempoFromDigits(digits) : '';
};

const isTempoValido = (tempo) => {
  if (!tempo) return false;
  const match = tempo.match(/^(\d{2}):(\d{2})\.(\d{2})$/);
  if (!match) return false;
  const segundos = Number(match[2]);
  const centesimos = Number(match[3]);
  return segundos >= 0 && segundos <= 59 && centesimos >= 0 && centesimos <= 99;
};

// --- Componente Principal ---

export default function App() {
  // Estado do Dark Mode
  const [darkMode, setDarkMode] = useState(loadDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(darkMode));
  }, [darkMode]);

  // Estado dos Dados Iniciais
  const [registros, setRegistros] = useState(() => {
    const dados = loadFromStorage(STORAGE_KEYS.registros, []);
    const normalizados = dados.map(r => ({ ...r, genero: (r.genero === '-') ? '' : (r.genero || '') }));
    if (normalizados.some((r, i) => r.genero !== dados[i]?.genero)) {
      localStorage.setItem(STORAGE_KEYS.registros, JSON.stringify(normalizados));
    }
    return normalizados;
  });

  const [alunosLocais, setAlunosLocais] = useState(() => {
    const dados = loadFromStorage(STORAGE_KEYS.alunos, []);
    let counter = 0;
    const existentes = new Set();
    dados.forEach(a => { if (a.id) { const num = parseInt(String(a.id).replace(/\D/g, ''), 10); if (!isNaN(num)) existentes.add(num); } });
    const normalizados = dados.map(a => {
      const genero = (a.genero === '-') ? '' : (a.genero || '');
      if (a.id) return { ...a, genero };
      counter++;
      while (existentes.has(counter)) counter++;
      existentes.add(counter);
      return { ...a, id: `ID-${String(counter).padStart(4, '0')}`, genero };
    });
    if (normalizados.some((a, i) => a.id !== dados[i]?.id || a.genero !== dados[i]?.genero)) {
      localStorage.setItem(STORAGE_KEYS.alunos, JSON.stringify(normalizados));
    }
    return normalizados;
  });

  const { alunos: alunosSupabase, loading: supabaseLoading } = useAlunosSupabase();

  // Merge: Supabase + Excel (não mais substituir)
  const alunos = useMemo(() => {
    const nomesSupabase = new Set(alunosSupabase.map(a => a.nome));
    const excelUnicos = alunosLocais.filter(a => !nomesSupabase.has(a.nome));
    return [...alunosSupabase, ...excelUnicos];
  }, [alunosSupabase, alunosLocais]);

  const [lixeira, setLixeira] = useState(() => loadFromStorage(STORAGE_KEYS.lixeira, []));
  const [abaAtiva, setAbaAtiva] = useState('ativos'); // 'ativos' | 'alunos' | 'graficos' | 'lixeira'

  // Estado de Filtros e Ordenação
  const [filtros, setFiltros] = useState({ nome: '', prova: '', estilo: '', modo: '', categoria: '', genero: '' });
  const [buscaDropdownOpen, setBuscaDropdownOpen] = useState(false);
  const [buscaIndiceAtivo, setBuscaIndiceAtivo] = useState(-1);
  const [generoDropdownOpen, setGeneroDropdownOpen] = useState(false);
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [ordenacao, setOrdenacao] = useState({ campo: 'dataRegistro', direcao: 'desc' });

  // Estado do Formulário de Registro
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: '', dataNascimento: '', dataRegistro: '', tempo: '', prova: '', estilo: '', modo: '', genero: ''
  });
  const [alunoBusca, setAlunoBusca] = useState('');
  const [autocompleteAberto, setAutocompleteAberto] = useState(false);
  const [indiceAlunoAtivo, setIndiceAlunoAtivo] = useState(-1);

  // --- Lógica de Negócio e Manipuladores ---

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      const registrosImportados = parsed.registros || [];
      const alunosImportados = parsed.alunos || [];

      console.log('registrosImportados (preview):', JSON.stringify(registrosImportados.slice(0, 5), null, 2));
      console.log('alunosImportados (preview):', JSON.stringify(alunosImportados.slice(0, 5), null, 2));

      if (alunosImportados.length > 0) {
        setAlunosLocais(prev => {
          const existing = [...prev];
          const names = new Set(existing.map(x => x.nome));
          alunosImportados.forEach(a => {
            if (a.nome && !names.has(a.nome)) existing.push({ id: a.id, nome: a.nome, dataNascimento: a.dataNascimento || '', codigo: a.codigo || '', genero: a.genero || '', categoria: a.categoria || '', status: a.status || 'ativo' });
          });
          return existing;
        });
      }

      if (registrosImportados.length === 0) {
        alert('Nenhum registro válido encontrado no arquivo.');
        return;
      }

      const registrosComIds = registrosImportados.map((reg, idx) => ({ ...reg, id: Date.now() + idx }));
      setRegistros(prev => [...prev, ...registrosComIds]);
      alert(`${registrosComIds.length} registro(s) importado(s) com sucesso!`);
    } catch (error) {
      alert(`Erro ao importar arquivo: ${error.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const exportRegistrosToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DBregistros');
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
    setOrdenacao(prev => {
      if (prev.campo !== campo) return { campo, direcao: 'asc' };
      if (prev.direcao === 'asc') return { campo, direcao: 'desc' };
      if (prev.direcao === 'desc') return { campo: campo, direcao: null };
      return { campo, direcao: 'asc' };
    });
  };

  const limparFiltros = () => {
    setFiltros({ nome: '', prova: '', estilo: '', modo: '', categoria: '', genero: '' });
  };

  const handleTempoChange = (e) => {
    const valor = e.target.value;
    const valorLimpo = valor.replace(/[^\d:.]/g, '');

    const formatoNumerico = /^\d{0,6}$/;
    const formatoComSeparadores = /^\d{0,2}(?::\d{0,2})?(?:\.\d{0,2})?$/;

    if (!valor) {
      setForm(prev => ({ ...prev, tempo: '' }));
      return;
    }

    if (formatoNumerico.test(valorLimpo) || formatoComSeparadores.test(valorLimpo)) {
      setForm(prev => ({ ...prev, tempo: valorLimpo }));
    }
  };

  const salvarRegistro = (e) => {
    e.preventDefault();
    const tempoNormalizado = normalizeTempoInput(form.tempo);
    if (!tempoNormalizado || !isTempoValido(tempoNormalizado)) {
      alert('Tempo inválido. Use MM:SS.CC ou 6 dígitos (ex: 000000).');
      return;
    }

    const formFinal = { ...form, tempo: tempoNormalizado };

    if (editandoId) {
      setRegistros(prev => prev.map(r => r.id === editandoId ? { ...formFinal, id: editandoId } : r));
    } else {
      setRegistros(prev => [...prev, { ...formFinal, id: Date.now() }]);
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
    setAlunoBusca(registro.nome || '');
    setAutocompleteAberto(false);
    setIndiceAlunoAtivo(-1);
    setEditandoId(registro.id);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoId(null);
    setForm({ nome: '', dataNascimento: '', dataRegistro: '', tempo: '', prova: '', estilo: '', modo: '', genero: '' });
    setAlunoBusca('');
    setAutocompleteAberto(false);
    setIndiceAlunoAtivo(-1);
  };

  const limparDadosLocais = () => {
    const ok = window.confirm('Limpar todos os alunos salvos localmente (importados de Excel)?\n\nOs alunos do Supabase continuarão disponíveis.');
    if (!ok) return;
    setAlunosLocais([]);
    localStorage.removeItem(STORAGE_KEYS.alunos);
  };

  const selecionarAlunoParaGrid = (nome) => {
    setFiltros(prev => ({ ...prev, nome }));
    setAbaAtiva('ativos');
  };

  const handleAtualizarAluno = (alunoId, dadosAtualizados) => {
    setAlunosLocais(prev => prev.map(a => a.id === alunoId ? { ...a, ...dadosAtualizados } : a));
    if (dadosAtualizados.genero !== undefined) {
      const aluno = alunos.find(a => a.id === alunoId);
      if (aluno) {
        const nomeAluno = normalizarNome(aluno.nome);
        setRegistros(prev => prev.map(r =>
          normalizarNome(r.nome) === nomeAluno ? { ...r, genero: dadosAtualizados.genero } : r
        ));
      }
    }
  };

  const alunosParaGestao = useMemo(() => {
    return [...alunos].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [alunos]);

  const provasDisponiveisForm = form.estilo ? (PROVAS_POR_ESTILO[form.estilo] || []) : [];
  const tempoNormalizadoForm = normalizeTempoInput(form.tempo);
  const tempoInvalidoNoForm = form.tempo !== '' && !isTempoValido(tempoNormalizadoForm);
  const alunosSugeridos = useMemo(() => {
    const nomesUnicos = Array.from(new Set(alunos.map(a => normalizarNome(a.nome)).filter(Boolean)));
    const termo = normalizarNome(alunoBusca);
    if (!termo) return nomesUnicos.slice(0, 8);
    return nomesUnicos.filter(nome => nome.includes(termo)).slice(0, 8);
  }, [alunos, alunoBusca]);

  const nomesBuscaSugeridos = useMemo(() => {
    const nomesRegistros = registros.map(r => normalizarNome(r.nome)).filter(Boolean);
    const nomesAlunos = alunos.map(a => normalizarNome(a.nome)).filter(Boolean);
    const nomesUnicos = Array.from(new Set([...nomesRegistros, ...nomesAlunos]));
    const termo = normalizarNome(filtros.nome);
    if (!termo) return nomesUnicos.slice(0, 8);
    return nomesUnicos.filter(nome => nome.includes(termo)).slice(0, 8);
  }, [registros, alunos, filtros.nome]);

  const alunosStatusMap = useMemo(() => {
    const map = {};
    alunos.forEach(a => {
      if (a.nome) map[a.nome.trim()] = a.status || 'ativo';
    });
    return map;
  }, [alunos]);

  const selecionarAluno = (nomeSelecionado) => {
    const aluno = alunos.find(a => a.nome === nomeSelecionado);
    setForm(prev => ({
      ...prev,
      nome: nomeSelecionado,
      dataNascimento: aluno?.dataNascimento || '',
      genero: aluno?.genero || ''
    }));
    setAlunoBusca(nomeSelecionado);
    setAutocompleteAberto(false);
    setIndiceAlunoAtivo(-1);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.registros, JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.alunos, JSON.stringify(alunosLocais));
  }, [alunosLocais]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lixeira, JSON.stringify(lixeira));
  }, [lixeira]);

  // Sync gênero dos alunos para registros sem gênero ao carregar
  useEffect(() => {
    if (alunos.length === 0 || registros.length === 0) return;
    const alunosMapLocal = {};
    alunos.forEach(a => { if (a.nome && a.genero) alunosMapLocal[normalizarNome(a.nome)] = a.genero; });
    let atualizados = 0;
    const novosRegistros = registros.map(r => {
      if (!r.genero || r.genero === '-') {
        const generoAluno = alunosMapLocal[normalizarNome(r.nome)];
        if (generoAluno) {
          atualizados++;
          return { ...r, genero: generoAluno };
        }
      }
      return r;
    });
    if (atualizados > 0) {
      setRegistros(novosRegistros);
    }
  }, [alunos]);

  // --- Processamento de Dados (Memoized) ---

  const dadosExibidos = useMemo(() => {
    const fonte = abaAtiva === 'ativos' ? registros : lixeira;

    let dadosFiltrados = fonte.filter(item => {
      const categoriaHistorica = item.categoria || calcularCategoria(item.dataNascimento, item.dataRegistro);
      return (
        normalizarNome(item.nome).includes(normalizarNome(filtros.nome)) &&
        (filtros.prova === '' || item.prova === filtros.prova) &&
        (filtros.estilo === '' || item.estilo === filtros.estilo) &&
        (filtros.modo === '' || item.modo === filtros.modo) &&
        (filtros.categoria === '' || categoriaHistorica === filtros.categoria) &&
        (filtros.genero === '' || (item.genero || '-') === filtros.genero)
      );
    });

    if (ordenacao.direcao) {
      return dadosFiltrados.sort((a, b) => {
        const valA = a[ordenacao.campo];
        const valB = b[ordenacao.campo];
        
        if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return dadosFiltrados;
  }, [registros, lixeira, abaAtiva, filtros, ordenacao]);

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 font-sans text-gray-800 dark:text-gray-100 transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              Gestão de Tempos de Natação
              <span className="ml-2 text-[10px] font-normal text-gray-400 dark:text-gray-500 align-super">v0.3.0</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Acompanhamento histórico e evolução de atletas
              {supabaseLoading && <span className="ml-2 text-xs text-primary-500">● Carregando alunos...</span>}
              {!supabaseLoading && alunosSupabase.length > 0 && <span className="ml-2 text-xs text-green-600 dark:text-green-400">● {alunosSupabase.length} alunos sincronizados</span>}
              {!supabaseLoading && alunosSupabase.length === 0 && alunosLocais.length > 0 && <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">● {alunosLocais.length} alunos locais</span>}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              id="import-xlsx-input"
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="import-xlsx-input"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors text-sm font-medium cursor-pointer"
            >
              <FileUp size={16} /> Importar XLSX
            </label>
            <button 
              onClick={exportRegistrosToExcel}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
              Exportar XLSX
            </button>
            <button 
              onClick={() => setModalAberto(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Novo Registro
            </button>
            {alunosLocais.length > 0 && (
              <button 
                onClick={limparDadosLocais}
                className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
              >
                Limpar Dados Locais
              </button>
            )}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Abas de Navegação */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setAbaAtiva('ativos')}
            className={`pb-2 px-4 font-medium transition-colors ${abaAtiva === 'ativos' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Registros Ativos ({registros.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('alunos')}
            className={`pb-2 px-4 font-medium flex items-center gap-2 transition-colors ${abaAtiva === 'alunos' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Users size={16} /> Alunos ({alunos.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('graficos')}
            className={`pb-2 px-4 font-medium flex items-center gap-2 transition-colors ${abaAtiva === 'graficos' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <BarChart3 size={16} /> Gráficos
          </button>
          <button 
            onClick={() => setAbaAtiva('lixeira')}
            className={`pb-2 px-4 font-medium flex items-center gap-2 transition-colors ${abaAtiva === 'lixeira' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Trash2 size={16} /> Lixeira ({lixeira.length})
          </button>
        </div>

        {/* Conteúdo por Aba */}
        {abaAtiva === 'alunos' ? (
          <GestaoAlunos
            alunos={alunosParaGestao}
            onSelecionarAluno={selecionarAlunoParaGrid}
            onAtualizarAluno={handleAtualizarAluno}
            onCalcularCategoria={calcularCategoria}
          />
        ) : abaAtiva === 'graficos' ? (
          <Graficos alunos={alunos} registros={registros} />
        ) : (
        <>
        {/* Barra de Filtros */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm dark:shadow-black/20 mb-6 flex flex-wrap gap-4 items-end border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Buscar Aluno</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Nome do atleta..." 
                className="w-full pl-10 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                value={filtros.nome}
                onFocus={() => {
                  setBuscaDropdownOpen(true);
                  setBuscaIndiceAtivo(-1);
                }}
                onBlur={() => setTimeout(() => setBuscaDropdownOpen(false), 120)}
                onChange={e => {
                  setFiltros({...filtros, nome: e.target.value});
                  setBuscaDropdownOpen(true);
                  setBuscaIndiceAtivo(-1);
                }}
                onKeyDown={e => {
                  if (!buscaDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    setBuscaDropdownOpen(true);
                  }
                  if (!nomesBuscaSugeridos.length) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setBuscaIndiceAtivo(prev => (prev + 1) % nomesBuscaSugeridos.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setBuscaIndiceAtivo(prev => (prev <= 0 ? nomesBuscaSugeridos.length - 1 : prev - 1));
                  } else if (e.key === 'Enter' && buscaIndiceAtivo >= 0) {
                    e.preventDefault();
                    setFiltros({ ...filtros, nome: nomesBuscaSugeridos[buscaIndiceAtivo] });
                    setBuscaDropdownOpen(false);
                    setBuscaIndiceAtivo(-1);
                  } else if (e.key === 'Escape') {
                    setBuscaDropdownOpen(false);
                    setBuscaIndiceAtivo(-1);
                  }
                }}
              />
              {filtros.nome && (
                <button
                  type="button"
                  onClick={() => { setFiltros({...filtros, nome: ''}); setBuscaDropdownOpen(false); }}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              )}

              {buscaDropdownOpen && nomesBuscaSugeridos.length > 0 && (
                <div className="absolute z-40 mt-1 w-full max-h-52 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg dark:shadow-black/20">
                  {nomesBuscaSugeridos.map((nome, idx) => (
                    <button
                      key={`${nome}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setFiltros({ ...filtros, nome });
                        setBuscaDropdownOpen(false);
                        setBuscaIndiceAtivo(-1);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === buscaIndiceAtivo ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      <span>{nome}</span>
                      {alunosStatusMap[nome] === 'inativo' && (
                        <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">Inativo</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {['prova', 'estilo', 'modo'].map(campo => (
            <div key={campo} className="w-40">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 capitalize">{campo}</label>
              <select 
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                value={filtros[campo]}
                onChange={e => {
                  const valor = e.target.value;
                  if (campo === 'estilo') {
                    const provasDoEstilo = valor ? (PROVAS_POR_ESTILO[valor] || []) : PROVAS;
                    setFiltros({
                      ...filtros,
                      estilo: valor,
                      prova: provasDoEstilo.includes(filtros.prova) ? filtros.prova : ''
                    });
                    return;
                  }
                  setFiltros({...filtros, [campo]: valor});
                }}
              >
                <option value="">Todos</option>
                {(campo === 'prova'
                  ? (filtros.estilo ? (PROVAS_POR_ESTILO[filtros.estilo] || []) : PROVAS)
                  : campo === 'estilo'
                    ? ESTILOS
                    : MODOS
                ).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          <button 
            onClick={limparFiltros}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-sm font-medium px-4 py-1.5"
          >
            Limpar Filtros
          </button>
          
          {abaAtiva === 'lixeira' && lixeira.length > 0 && (
             <button 
             onClick={limparLixeiraCompleta}
             className="ml-auto border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors text-sm font-medium px-4 py-1.5 flex items-center gap-2"
           >
             <Trash2 size={16} /> Esvaziar Lixeira
           </button>
          )}
        </div>

        {/* Grid de Dados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th onClick={() => handleSort('nome')} className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative">Aluno {ordenacao.campo === 'nome' && ordenacao.direcao && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th onClick={() => handleSort('dataRegistro')} className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative">Data Reg.
                  {ordenacao.campo === 'dataRegistro' && ordenacao.direcao && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCategoriaDropdownOpen(prev => !prev); }}
                      className={`flex items-center gap-2 ${filtros.categoria ? 'text-white bg-primary-600 px-2 py-1 rounded' : ''}`}
                    >
                      CATEGORIA
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </button>

                    {categoriaDropdownOpen && (
                      <div className="absolute z-50 mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg dark:shadow-black/20 w-40 p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Filtrar por Categoria</div>
                        {['', ...CATEGORIAS_CBDA.map(c => c.nome), '-'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setFiltros({...filtros, categoria: opt}); setCategoriaDropdownOpen(false); }}
                            className={`block w-full text-left px-2 py-1 rounded text-sm ${filtros.categoria === opt ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            {opt === '' ? 'Todos' : opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('prova')} className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative">Prova {ordenacao.campo === 'prova' && ordenacao.direcao && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th onClick={() => handleSort('estilo')} className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative">Estilo {ordenacao.campo === 'estilo' && ordenacao.direcao && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th onClick={() => handleSort('tempo')} className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative">Tempo {ordenacao.campo === 'tempo' && ordenacao.direcao && (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}</th>
                <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">Modo</th>
                <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setGeneroDropdownOpen(prev => !prev); }}
                      className={`flex items-center gap-2 ${filtros.genero ? 'text-white bg-primary-600 px-2 py-1 rounded' : ''}`}
                    >
                      GÊNERO
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </button>

                    {generoDropdownOpen && (
                      <div className="absolute z-50 mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg dark:shadow-black/20 w-32 p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Filtrar por Gênero</div>
                        {['', 'M','F','O'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setFiltros({...filtros, genero: opt}); setGeneroDropdownOpen(false); }}
                            className={`block w-full text-left px-2 py-1 rounded text-sm ${filtros.genero === opt ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {dadosExibidos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400 dark:text-gray-500">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                dadosExibidos.map((item) => {
                  const categoriaHistorica = item.categoria || calcularCategoria(item.dataNascimento, item.dataRegistro);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.nome}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{new Date(item.dataRegistro).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setFiltros({...filtros, categoria: categoriaHistorica})}
                          className={`px-2 py-1 rounded text-xs font-bold focus:outline-none ${filtros.categoria === categoriaHistorica ? 'bg-primary-600 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'}`}
                          title={`Filtrar por ${categoriaHistorica}`}
                        >
                          {categoriaHistorica}
                        </button>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{item.prova}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{item.estilo}</td>
                      <td className="p-4 font-mono tabular-nums font-medium text-gray-900 dark:text-gray-100">{item.tempo}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold 
                          ${item.modo === 'Competição' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : 
                            item.modo === 'Festival' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          {item.modo}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold">{item.genero || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {abaAtiva === 'ativos' ? (
                            <>
                              <button onClick={() => abrirModalEdicao(item)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => moverParaLixeira(item.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => restaurarDaLixeira(item.id)} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded" title="Restaurar">
                                <RefreshCcw size={16} />
                              </button>
                              <button onClick={() => excluirDefinitivamente(item.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Excluir Definitivamente">
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
        </>
        )}

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-black/20 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editandoId ? 'Editar Tempo' : 'Novo Registro de Tempo'}</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={salvarRegistro} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do Aluno</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Digite para buscar aluno..."
                    value={alunoBusca}
                    onFocus={() => {
                      setAutocompleteAberto(true);
                      setIndiceAlunoAtivo(-1);
                    }}
                    onBlur={() => {
                      setTimeout(() => setAutocompleteAberto(false), 120);
                    }}
                    onChange={e => {
                      const valor = e.target.value;
                      setAlunoBusca(valor);
                      setForm(prev => ({ ...prev, nome: valor }));
                      const encontrado = alunos.find(a => a.nome === valor);
                      if (encontrado) {
                        setForm(prev => ({ ...prev, nome: valor, dataNascimento: encontrado.dataNascimento || '', genero: encontrado.genero || '' }));
                      }
                      setAutocompleteAberto(true);
                      setIndiceAlunoAtivo(-1);
                    }}
                    onKeyDown={e => {
                      if (!autocompleteAberto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                        setAutocompleteAberto(true);
                      }
                      if (!alunosSugeridos.length) return;

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIndiceAlunoAtivo(prev => (prev + 1) % alunosSugeridos.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setIndiceAlunoAtivo(prev => (prev <= 0 ? alunosSugeridos.length - 1 : prev - 1));
                      } else if (e.key === 'Enter' && indiceAlunoAtivo >= 0) {
                        e.preventDefault();
                        selecionarAluno(alunosSugeridos[indiceAlunoAtivo]);
                      } else if (e.key === 'Escape') {
                        setAutocompleteAberto(false);
                        setIndiceAlunoAtivo(-1);
                      }
                    }}
                  />

                  {autocompleteAberto && alunosSugeridos.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full max-h-52 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg dark:shadow-black/20">
                      {alunosSugeridos.map((nome, idx) => (
                        <button
                          key={`${nome}-${idx}`}
                          type="button"
                          onMouseDown={() => selecionarAluno(nome)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === indiceAlunoAtivo ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                          <span>{nome}</span>
                          {alunosStatusMap[nome] === 'inativo' && (
                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">Inativo</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Data do Registro</label>
                  <input required type="date" className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100" value={form.dataRegistro} onChange={e => setForm({...form, dataRegistro: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Modo/Evento</label>
                  <select required className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100" value={form.modo} onChange={e => setForm({...form, modo: e.target.value})}>
                    <option value="">Selecione</option>
                    {MODOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Exibição da Categoria Calculada no Form */}
              <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-md border border-primary-200 dark:border-primary-800 flex justify-between items-center">
                <span className="text-sm text-primary-700 dark:text-primary-300">Categoria calculada para esta data:</span>
                <span className="font-bold text-primary-800 dark:text-primary-200">{calcularCategoria(form.dataNascimento, form.dataRegistro)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Gênero</label>
                  <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100" value={form.genero} onChange={e => setForm({...form, genero: e.target.value})}>
                    <option value="">Selecione</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Estilo</label>
                  <select
                    required
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    value={form.estilo}
                    onChange={e => {
                      const novoEstilo = e.target.value;
                      const provasDoEstilo = PROVAS_POR_ESTILO[novoEstilo] || [];
                      const provaAtualValida = provasDoEstilo.includes(form.prova);
                      setForm({
                        ...form,
                        estilo: novoEstilo,
                        prova: provaAtualValida ? form.prova : ''
                      });
                    }}
                  >
                    <option value="">Selecione</option>
                    {ESTILOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Prova</label>
                  <select
                    required
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                    value={form.prova}
                    onChange={e => setForm({...form, prova: e.target.value})}
                    disabled={!form.estilo}
                  >
                    <option value="">{form.estilo ? 'Selecione' : 'Selecione o estilo primeiro'}</option>
                    {provasDisponiveisForm.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tempo</label>
                  <input
                    required
                    type="text"
                    placeholder="000000 ou 00:00.00"
                    className={`w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 ${tempoInvalidoNoForm ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-gray-600'}`}
                    value={form.tempo}
                    onChange={handleTempoChange}
                    onBlur={() => setForm(prev => ({ ...prev, tempo: normalizeTempoInput(prev.tempo) }))}
                  />
                  {tempoInvalidoNoForm && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">Tempo inválido (segundos devem ficar entre 00 e 59).</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={fecharModal} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors px-4 py-2 text-sm font-medium">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors px-6 py-2 text-sm font-medium">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
