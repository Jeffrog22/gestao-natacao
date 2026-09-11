import React, { useMemo, useState } from 'react';

const CORES = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

/**
 * Converte tempo MM:SS.CC para segundos
 */
function tempoParaSegundos(tempo) {
  if (!tempo) return 0;
  const match = String(tempo).match(/^(\d{1,2}):(\d{2})\.(\d{2})$/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
}

/**
 * Converte segundos para MM:SS.CC
 */
function segundosParaTempo(s) {
  if (!s || s <= 0) return '';
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.round((s % 1) * 100);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Aba de gráficos comparativos
 * @param {object} props
 * @param {Array} props.alunos - Lista de todos os alunos
 * @param {Array} props.registros - Lista de todos os registros
 */
export default function Graficos({ alunos, registros }) {
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [provaFiltro, setProvaFiltro] = useState('');
  const [estiloFiltro, setEstiloFiltro] = useState('');

  const estilos = useMemo(() => {
    const set = new Set(registros.map(r => r.estilo).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  const provas = useMemo(() => {
    const set = new Set(
      registros
        .filter(r => !estiloFiltro || r.estilo === estiloFiltro)
        .map(r => r.prova)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [registros, estiloFiltro]);

  const toggleAluno = (nome) => {
    setAlunosSelecionados(prev => {
      if (prev.includes(nome)) return prev.filter(n => n !== nome);
      if (prev.length >= 3) return prev;
      return [...prev, nome];
    });
  };

  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      if (!alunosSelecionados.includes(r.nome)) return false;
      if (estiloFiltro && r.estilo !== estiloFiltro) return false;
      if (provaFiltro && r.prova !== provaFiltro) return false;
      return true;
    });
  }, [registros, alunosSelecionados, estiloFiltro, provaFiltro]);

  // --- Dados para Gráfico 1: Linha temporal ---
  const dadosLinha = useMemo(() => {
    const porAluno = {};
    alunosSelecionados.forEach(nome => { porAluno[nome] = []; });
    registrosFiltrados.forEach(r => {
      if (porAluno[r.nome] && r.dataRegistro && r.tempo) {
        porAluno[r.nome].push({
          data: r.dataRegistro,
          segundos: tempoParaSegundos(r.tempo),
          tempo: r.tempo,
        });
      }
    });
    Object.keys(porAluno).forEach(nome => {
      porAluno[nome].sort((a, b) => a.data.localeCompare(b.data));
    });
    return porAluno;
  }, [registrosFiltrados, alunosSelecionados]);

  // --- Dados para Gráfico 2: Barras comparativas (melhor tempo por prova) ---
  const dadosBarras = useMemo(() => {
    const melhorPorAlunoProva = {};
    registrosFiltrados.forEach(r => {
      const seg = tempoParaSegundos(r.tempo);
      if (seg <= 0) return;
      const key = `${r.nome}|${r.prova}`;
      if (!melhorPorAlunoProva[key] || seg < melhorPorAlunoProva[key].segundos) {
        melhorPorAlunoProva[key] = { segundos: seg, tempo: r.tempo, prova: r.prova, nome: r.nome };
      }
    });
    const provasSet = new Set();
    Object.values(melhorPorAlunoProva).forEach(v => provasSet.add(v.prova));
    return { dados: melhorPorAlunoProva, provas: Array.from(provasSet).sort() };
  }, [registrosFiltrados]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Gráficos Comparativos</h2>
        <p className="text-sm text-gray-500 mt-1">Selecione 2-3 alunos para comparar (máximo 3)</p>
      </div>

      {/* Seleção de alunos */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-xs font-semibold text-gray-500 mb-2">Alunos (clique para selecionar, max 3)</label>
        <div className="flex flex-wrap gap-2">
          {alunos.filter(a => a.status === 'ativo').slice(0, 30).map(aluno => {
            const selecionado = alunosSelecionados.includes(aluno.nome);
            const idx = alunosSelecionados.indexOf(aluno.nome);
            return (
              <button
                key={aluno.id}
                onClick={() => toggleAluno(aluno.nome)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selecionado
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={selecionado ? { backgroundColor: CORES[idx] || CORES[0] } : undefined}
              >
                {aluno.nome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros de prova/estilo */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-end">
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Estilo</label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
            value={estiloFiltro}
            onChange={e => { setEstiloFiltro(e.target.value); setProvaFiltro(''); }}
          >
            <option value="">Todos</option>
            {estilos.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Prova</label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
            value={provaFiltro}
            onChange={e => setProvaFiltro(e.target.value)}
          >
            <option value="">Todas</option>
            {provas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {alunosSelecionados.length < 2 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-400">
          Selecione pelo menos 2 alunos para ver os gráficos
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Linha temporal */}
          <GraficoLinha dados={dadosLinha} cores={CORES} alunos={alunosSelecionados} />

          {/* Gráfico 2: Barras comparativas */}
          <GraficoBarras dados={dadosBarras} cores={CORES} alunos={alunosSelecionados} />
        </div>
      )}
    </div>
  );
}

/**
 * Gráfico de linha temporal (melhor tempo ao longo das datas)
 */
function GraficoLinha({ dados, cores, alunos }) {
  const WIDTH = 500;
  const HEIGHT = 300;
  const PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const todosPontos = useMemo(() => {
    const pts = [];
    alunos.forEach((nome, i) => {
      (dados[nome] || []).forEach(p => {
        pts.push({ ...p, nome, cor: cores[i] });
      });
    });
    return pts;
  }, [dados, alunos, cores]);

  if (todosPontos.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Evolução Temporal</h3>
        <div className="text-center text-gray-400 py-12">Sem dados para os filtros selecionados</div>
      </div>
    );
  }

  const todasDatas = todosPontos.map(p => p.data).sort();
  const dataMin = todasDatas[0];
  const dataMax = todasDatas[todasDatas.length - 1];
  const todosSeg = todosPontos.map(p => p.segundos);
  const segMin = Math.min(...todosSeg) * 0.95;
  const segMax = Math.max(...todosSeg) * 1.05;

  const scaleX = (data) => {
    if (dataMin === dataMax) return chartW / 2;
    return ((new Date(data) - new Date(dataMin)) / (new Date(dataMax) - new Date(dataMin))) * chartW;
  };
  const scaleY = (seg) => {
    if (segMax === segMin) return chartH / 2;
    return chartH - ((seg - segMin) / (segMax - segMin)) * chartH;
  };

  const formatData = (d) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => segMin + (segMax - segMin) * (i / yTicks));

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">Evolução Temporal</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {/* Grid lines */}
        {yTickValues.map((v, i) => (
          <g key={i}>
            <line x1={PADDING.left} y1={PADDING.top + scaleY(v)} x2={WIDTH - PADDING.right} y2={PADDING.top + scaleY(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PADDING.left - 8} y={PADDING.top + scaleY(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{segundosParaTempo(v)}</text>
          </g>
        ))}

        {/* X axis labels */}
        {todosPontos.filter((p, i, self) => self.findIndex(x => x.data === p.data) === i).map((p, i) => (
          <text key={i} x={PADDING.left + scaleX(p.data)} y={HEIGHT - 10} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {formatData(p.data)}
          </text>
        ))}

        {/* Lines */}
        {alunos.map((nome, i) => {
          const pontos = (dados[nome] || []).sort((a, b) => a.data.localeCompare(b.data));
          if (pontos.length < 2) return null;
          const pathD = pontos.map((p, j) => {
            const x = PADDING.left + scaleX(p.data);
            const y = PADDING.top + scaleY(p.segundos);
            return `${j === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ');
          return (
            <g key={nome}>
              <path d={pathD} fill="none" stroke={cores[i]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pontos.map((p, j) => (
                <circle key={j} cx={PADDING.left + scaleX(p.data)} cy={PADDING.top + scaleY(p.segundos)} r="4" fill={cores[i]} />
              ))}
            </g>
          );
        })}

        {/* Legend */}
        {alunos.map((nome, i) => (
          <g key={nome} transform={`translate(${PADDING.left + i * 120}, 12)`}>
            <rect x="0" y="0" width="10" height="10" rx="2" fill={cores[i]} />
            <text x="14" y="9" fontSize="10" fill="#374151">{nome.length > 15 ? nome.slice(0, 15) + '…' : nome}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Gráfico de barras comparativas (melhor tempo por prova)
 */
function GraficoBarras({ dados, cores, alunos }) {
  const WIDTH = 500;
  const HEIGHT = 300;
  const PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const { provas } = dados;

  const todosSeg = useMemo(() => {
    const segs = [];
    provas.forEach(prova => {
      alunos.forEach(nome => {
        const key = `${nome}|${prova}`;
        if (dados.dados[key]) segs.push(dados.dados[key].segundos);
      });
    });
    return segs;
  }, [dados, provas, alunos]);

  if (provas.length === 0 || todosSeg.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Melhor Tempo por Prova</h3>
        <div className="text-center text-gray-400 py-12">Sem dados para os filtros selecionados</div>
      </div>
    );
  }

  const segMax = Math.max(...todosSeg) * 1.1;
  const grupoW = chartW / provas.length;
  const barW = Math.min(grupoW / (alunos.length + 1), 30);

  const scaleY = (seg) => {
    if (segMax === 0) return chartH;
    return chartH - (seg / segMax) * chartH;
  };

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (segMax / yTicks) * i);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">Melhor Tempo por Prova</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {/* Grid lines */}
        {yTickValues.map((v, i) => (
          <g key={i}>
            <line x1={PADDING.left} y1={PADDING.top + scaleY(v)} x2={WIDTH - PADDING.right} y2={PADDING.top + scaleY(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PADDING.left - 8} y={PADDING.top + scaleY(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{segundosParaTempo(v)}</text>
          </g>
        ))}

        {/* Bars */}
        {provas.map((prova, pi) => {
          const grupoX = PADDING.left + pi * grupoW + grupoW / 2;
          return (
            <g key={prova}>
              {alunos.map((nome, ai) => {
                const key = `${nome}|${prova}`;
                const d = dados.dados[key];
                if (!d) return null;
                const x = grupoX - (alunos.length * barW) / 2 + ai * barW;
                const h = (d.segundos / segMax) * chartH;
                const y = PADDING.top + chartH - h;
                return (
                  <g key={nome}>
                    <rect x={x} y={y} width={barW - 2} height={h} fill={cores[ai]} rx="3" />
                    <text x={x + (barW - 2) / 2} y={y - 4} textAnchor="middle" fontSize="8" fill={cores[ai]} fontWeight="bold">
                      {d.tempo}
                    </text>
                  </g>
                );
              })}
              <text x={grupoX} y={HEIGHT - 10} textAnchor="middle" fontSize="9" fill="#9ca3af">
                {prova}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {alunos.map((nome, i) => (
          <g key={nome} transform={`translate(${PADDING.left + i * 120}, 12)`}>
            <rect x="0" y="0" width="10" height="10" rx="2" fill={cores[i]} />
            <text x="14" y="9" fontSize="10" fill="#374151">{nome.length > 15 ? nome.slice(0, 15) + '…' : nome}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
