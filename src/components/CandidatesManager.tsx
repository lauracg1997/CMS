import { useState, useEffect } from 'react';
import { Search, User, Trash2, ArrowLeft, Eye, MapPin, Clock } from 'lucide-react';

const API_URL = '/api/candidates';

type CvType = 'Normal' | 'Prácticas Curriculares' | 'Prácticas Extracurriculares';

type Candidate = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  cv_type: CvType;
  status: 'Nuevo' | 'Revisado' | 'Entrevistado';
  cv_url: string | null;
  location: string | null;
  duracion_meses: number | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  Nuevo:        'bg-sky-50 text-sky-700',
  Revisado:     'bg-amber-50 text-amber-700',
  Entrevistado: 'bg-emerald-50 text-emerald-700',
};

const CV_TYPE_COLORS: Record<string, string> = {
  Normal:                        'bg-blue-50 text-blue-700',
  'Prácticas Curriculares':      'bg-purple-50 text-purple-700',
  'Prácticas Extracurriculares': 'bg-orange-50 text-orange-700',
};

const CV_TYPES: CvType[] = ['Normal', 'Prácticas Curriculares', 'Prácticas Extracurriculares'];

function getTab(cv_type: CvType): 'practicas' | 'general' {
  return cv_type === 'Normal' ? 'general' : 'practicas';
}

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [activeTab, setActiveTab] = useState<'practicas' | 'general'>('practicas');
  const [filterSubtype, setFilterSubtype] = useState<'Todos' | 'Curricular' | 'Extracurricular'>('Todos');
  const [filterShort, setFilterShort] = useState(false);
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

  async function handleStatusChange(id: number, newStatus: Candidate['status']) {
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

  const filtered = candidates
    .filter(c => getTab(c.cv_type) === activeTab)
    .filter(c => {
      if (activeTab === 'practicas') {
        if (filterSubtype === 'Curricular')     return c.cv_type === 'Prácticas Curriculares';
        if (filterSubtype === 'Extracurricular') return c.cv_type === 'Prácticas Extracurriculares';
      }
      return true;
    })
    .filter(c => !filterShort || (c.duracion_meses !== null && c.duracion_meses < 3))
    .filter(c => !filterLocation || c.location?.toLowerCase().includes(filterLocation.toLowerCase()))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase()));

  const practCount   = candidates.filter(c => getTab(c.cv_type) === 'practicas').length;
  const generalCount = candidates.filter(c => getTab(c.cv_type) === 'general').length;

  if (selectedCandidate) {
    return (
      <section className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <header className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{selectedCandidate.name}</h2>
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
            {(['Nuevo', 'Revisado', 'Entrevistado'] as Candidate['status'][]).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(selectedCandidate.id, status)}
                className={`w-full px-4 py-3 text-sm rounded-xl font-medium transition text-left ${selectedCandidate.status === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="candidates-manager" className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className="px-6 pt-6 pb-0 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Candidatos (CVs)</h2>
            <p className="text-sm text-gray-500">CVs recibidos desde la web.</p>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="flex gap-0 -mb-px">
          <button
            onClick={() => { setActiveTab('practicas'); setFilterSubtype('Todos'); setFilterShort(false); }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'practicas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Prácticas / Formación
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'practicas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {practCount}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('general'); setFilterSubtype('Todos'); setFilterShort(false); }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            General
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {generalCount}
            </span>
          </button>
        </div>
      </header>

      {/* Barra de filtros */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2 flex-wrap items-center bg-white">
        {/* Búsqueda */}
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

        {/* Pills subtipo — solo en tab prácticas */}
        {activeTab === 'practicas' && (
          <div className="flex gap-1.5">
            {(['Todos', 'Curricular', 'Extracurricular'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterSubtype(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterSubtype === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Pill < 3 meses */}
        <button
          onClick={() => setFilterShort(!filterShort)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            filterShort ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          &lt; 3 meses
        </button>

        {/* Filtro ubicación */}
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

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-gray-400">Cargando candidatos...</div>}
        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No hay candidatos con estos filtros.
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-gray-500 text-xs uppercase border-b border-gray-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Candidato</th>
                <th className="px-6 py-4 font-semibold">Puesto</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Ubicación</th>
                <th className="px-6 py-4 font-semibold">Duración</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.position}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${CV_TYPE_COLORS[c.cv_type]}`}>
                      {c.cv_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {c.location ? (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {c.duracion_meses !== null ? (
                      <span className={c.duracion_meses < 3 ? 'text-amber-600 font-semibold' : ''}>
                        {c.duracion_meses}m
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors mr-3" onClick={(e) => { e.stopPropagation(); setSelectedCandidate(c); }}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
