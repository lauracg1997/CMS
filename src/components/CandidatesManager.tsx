import { useState, useEffect } from 'react';
import { Search, Trash2, ArrowLeft, MapPin, Inbox, UserCheck, CheckCircle2, XCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const API_URL = '/api/candidates';

type CvType = 'Normal' | 'Prácticas Curriculares' | 'Prácticas Extracurriculares';
type Status = 'Nuevo' | 'En Selección' | 'Entrevistado' | 'Declinado';

type Candidate = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  cv_type: CvType;
  status: Status;
  cv_url: string | null;
  location: string | null;
  duracion_meses: number | null;
  created_at: string;
};

const CV_TYPE_COLORS: Record<string, string> = {
  Normal:                        'bg-blue-50 text-blue-700',
  'Prácticas Curriculares':      'bg-purple-50 text-purple-700',
  'Prácticas Extracurriculares': 'bg-orange-50 text-orange-700',
};

const CV_TYPE_SHORT: Record<string, string> = {
  Normal:                        'General',
  'Prácticas Curriculares':      'Curricular',
  'Prácticas Extracurriculares': 'Extracurricular',
};

const CV_TYPES: CvType[] = ['Normal', 'Prácticas Curriculares', 'Prácticas Extracurriculares'];

const COLUMNS: { status: Status; label: string; short: string; icon: React.ReactNode; headerBg: string; headerText: string; countBg: string; countText: string; borderActive: string }[] = [
  {
    status: 'Nuevo',
    label: 'Nuevo',
    short: 'Nuevo',
    icon: <Inbox className="w-4 h-4" />,
    headerBg: 'bg-sky-50',
    headerText: 'text-sky-700',
    countBg: 'bg-sky-100',
    countText: 'text-sky-700',
    borderActive: 'border-sky-200',
  },
  {
    status: 'En Selección',
    label: 'En Selección',
    short: 'Selecc.',
    icon: <UserCheck className="w-4 h-4" />,
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
    countBg: 'bg-amber-100',
    countText: 'text-amber-700',
    borderActive: 'border-amber-200',
  },
  {
    status: 'Entrevistado',
    label: 'Entrevistado',
    short: 'Entrevis.',
    icon: <CheckCircle2 className="w-4 h-4" />,
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-700',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-700',
    borderActive: 'border-emerald-200',
  },
  {
    status: 'Declinado',
    label: 'Declinado',
    short: 'Declin.',
    icon: <XCircle className="w-4 h-4" />,
    headerBg: 'bg-rose-50',
    headerText: 'text-rose-700',
    countBg: 'bg-rose-100',
    countText: 'text-rose-700',
    borderActive: 'border-rose-200',
  },
];

function getTab(cv_type: CvType): 'practicas' | 'general' {
  return cv_type === 'Normal' ? 'general' : 'practicas';
}

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [activeTab, setActiveTab] = useState<'practicas' | 'general'>('practicas');
  const [filterSubtype, setFilterSubtype] = useState<'Todos' | 'Curricular' | 'Extracurricular'>('Todos');
  const [filterLocation, setFilterLocation] = useState('');
  const [search, setSearch] = useState('');

  async function fetchCandidates() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error('Error al cargar candidatos', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCandidates(); }, []);

  async function handleStatusChange(id: number, newStatus: Status) {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (selectedCandidate?.id === id) {
      setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    }
    fetchCandidates();
  }

  async function handleCvTypeChange(id: number, newType: CvType) {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ cv_type: newType }),
    });
    if (selectedCandidate?.id === id) {
      setSelectedCandidate(prev => prev ? { ...prev, cv_type: newType } : null);
    }
    fetchCandidates();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este candidato?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (selectedCandidate?.id === id) setSelectedCandidate(null);
    fetchCandidates();
  }

  const visibleCandidates = candidates
    .filter(c => getTab(c.cv_type) === activeTab)
    .filter(c => {
      if (activeTab === 'practicas') {
        if (filterSubtype === 'Curricular')      return c.cv_type === 'Prácticas Curriculares';
        if (filterSubtype === 'Extracurricular') return c.cv_type === 'Prácticas Extracurriculares';
      }
      return true;
    })
    .filter(c => !filterLocation || c.location?.toLowerCase().includes(filterLocation.toLowerCase()))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase()));

  const practCount   = candidates.filter(c => getTab(c.cv_type) === 'practicas').length;
  const generalCount = candidates.filter(c => getTab(c.cv_type) === 'general').length;

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedCandidate) {
    return (
      <section className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <header className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-medium text-slate-950">{selectedCandidate.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CV_TYPE_COLORS[selectedCandidate.cv_type]}`}>
                {selectedCandidate.cv_type}
              </span>
            </div>
            <p className="text-sm text-gray-500">{selectedCandidate.position}</p>
          </div>
        </header>

        <div className="p-6 grid grid-cols-2 gap-8 flex-1 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de contacto</h3>
              <dl className="space-y-2 text-sm">
                {selectedCandidate.email && (
                  <div className="flex gap-2"><dt className="text-gray-500 w-20 flex-shrink-0">Email:</dt><dd className="text-gray-900 break-all">{selectedCandidate.email}</dd></div>
                )}
                {selectedCandidate.phone && (
                  <div className="flex gap-2"><dt className="text-gray-500 w-20 flex-shrink-0">Teléfono:</dt><dd className="text-gray-900">{selectedCandidate.phone}</dd></div>
                )}
                {selectedCandidate.location && (
                  <div className="flex gap-2"><dt className="text-gray-500 w-20 flex-shrink-0">Ubicación:</dt><dd className="text-gray-900">{selectedCandidate.location}</dd></div>
                )}
                {selectedCandidate.duracion_meses !== null && (
                  <div className="flex gap-2"><dt className="text-gray-500 w-20 flex-shrink-0">Duración:</dt><dd className="text-gray-900">{selectedCandidate.duracion_meses} mes{selectedCandidate.duracion_meses !== 1 ? 'es' : ''}</dd></div>
                )}
                <div className="flex gap-2"><dt className="text-gray-500 w-20 flex-shrink-0">Enviado:</dt><dd className="text-gray-900">{selectedCandidate.created_at.slice(0, 10)}</dd></div>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de candidatura</h3>
              <div className="flex flex-col gap-1.5">
                {CV_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => handleCvTypeChange(selectedCandidate.id, t)}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition text-left ${selectedCandidate.cv_type === t ? `${CV_TYPE_COLORS[t]} ring-1 ring-current` : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {selectedCandidate.cv_url && (
              <a href={selectedCandidate.cv_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Ver CV
              </a>
            )}

            <button onClick={() => handleDelete(selectedCandidate.id)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" /> Eliminar candidato
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estado del proceso</h3>
            {COLUMNS.map(col => (
              <button
                key={col.status}
                onClick={() => handleStatusChange(selectedCandidate.id, col.status)}
                className={`w-full px-4 py-3 text-sm rounded-xl font-medium transition text-left flex items-center gap-2 ${selectedCandidate.status === col.status ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {col.icon}
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Kanban view ───────────────────────────────────────────────────────────
  return (
    <section id="candidates-manager" className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

      {/* Header + tabs */}
      <header className="px-6 pt-6 pb-0 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-slate-950">Candidatos (CVs)</h2>
            <p className="text-sm text-gray-500">CVs recibidos desde la web.</p>
          </div>
        </div>
        <div className="flex gap-0 -mb-px">
          <button
            onClick={() => { setActiveTab('practicas'); setFilterSubtype('Todos'); }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'practicas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Prácticas / Formación
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'practicas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {practCount}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('general'); setFilterSubtype('Todos'); }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            General
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {generalCount}
            </span>
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2 flex-wrap items-center bg-white">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar candidato o puesto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {activeTab === 'practicas' && (
          <div className="flex gap-1.5">
            {(['Todos', 'Curricular', 'Extracurricular'] as const).map(t => (
              <button key={t} onClick={() => setFilterSubtype(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${filterSubtype === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Ubicación..."
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32"
          />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0 bg-gray-50/40">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando candidatos...</div>
        )}
        {!loading && COLUMNS.map(col => {
          const cards = visibleCandidates.filter(c => c.status === col.status);
          return (
            <div key={col.status} className="flex-1 flex flex-col min-h-0">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 ${col.headerBg}`}>
                <span className={col.headerText}>{col.icon}</span>
                <span className={`text-sm font-semibold whitespace-nowrap ${col.headerText}`}>{col.label}</span>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold ${col.countBg} ${col.countText}`}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
                    Sin candidatos
                  </div>
                )}
                {cards.map(c => {
                  const others = COLUMNS.filter(cl => cl.status !== c.status);
                  const colIdx = COLUMNS.findIndex(cl => cl.status === c.status);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`group bg-white border ${col.borderActive} rounded-xl p-3.5 cursor-pointer hover:shadow-sm hover:border-blue-300 transition-all duration-150`}
                    >
                      {/* Name + delete */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{c.position}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CV_TYPE_COLORS[c.cv_type]}`}>
                          {CV_TYPE_SHORT[c.cv_type]}
                        </span>
                        {c.location && (
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <MapPin className="w-2.5 h-2.5" />{c.location}
                          </span>
                        )}
                      </div>

                      {/* Move buttons */}
                      <div
                        className="border-t border-gray-50 pt-2.5 flex gap-1.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {others.map(target => {
                          const targetIdx = COLUMNS.findIndex(cl => cl.status === target.status);
                          const isForward = targetIdx > colIdx;
                          return (
                            <button
                              key={target.status}
                              onClick={() => handleStatusChange(c.id, target.status)}
                              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${target.headerBg} ${target.headerText} hover:opacity-80`}
                            >
                              {!isForward && <ChevronLeft className="w-3 h-3" />}
                              {target.short}
                              {isForward && <ChevronRight className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
