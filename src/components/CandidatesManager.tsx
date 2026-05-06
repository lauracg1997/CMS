import { useState, useEffect } from 'react';
import { Search, User, Trash2, ArrowLeft, Eye } from 'lucide-react';

const API_URL = '/api/candidates';

type CvType = 'Empleo' | 'Prácticas' | 'Extracurricular' | 'Voluntariado' | 'Otro';

type Candidate = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  cv_type: CvType;
  status: 'Nuevo' | 'Revisado' | 'Entrevistado';
  cv_url: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  Nuevo: 'bg-sky-50 text-sky-700',
  Revisado: 'bg-amber-50 text-amber-700',
  Entrevistado: 'bg-emerald-50 text-emerald-700',
};

const CV_TYPE_COLORS: Record<string, string> = {
  Empleo:          'bg-blue-50 text-blue-700',
  Prácticas:       'bg-purple-50 text-purple-700',
  Extracurricular: 'bg-orange-50 text-orange-700',
  Voluntariado:    'bg-teal-50 text-teal-700',
  Otro:            'bg-gray-100 text-gray-600',
};

const CV_TYPES: CvType[] = ['Empleo', 'Prácticas', 'Extracurricular', 'Voluntariado', 'Otro'];

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filterType, setFilterType] = useState<CvType | 'Todos'>('Todos');

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

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este candidato?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (selectedCandidate?.id === id) setSelectedCandidate(null);
    fetchCandidates();
  }

  const filtered = filterType === 'Todos' ? candidates : candidates.filter(c => c.cv_type === filterType);

  if (selectedCandidate) {
    return (
      <section className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <header className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-gray-200 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{selectedCandidate.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CV_TYPE_COLORS[selectedCandidate.cv_type]}`}>
                {selectedCandidate.cv_type}
              </span>
            </div>
            <p className="text-sm text-gray-500">{selectedCandidate.position}</p>
          </div>
        </header>

        <div className="p-6 grid grid-cols-2 gap-8 flex-1">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Datos de contacto</h3>
            <dl className="space-y-2 text-sm">
              {selectedCandidate.email && (
                <div className="flex gap-2"><dt className="text-gray-500 w-16">Email:</dt><dd className="text-gray-900">{selectedCandidate.email}</dd></div>
              )}
              {selectedCandidate.phone && (
                <div className="flex gap-2"><dt className="text-gray-500 w-16">Tel:</dt><dd className="text-gray-900">{selectedCandidate.phone}</dd></div>
              )}
              <div className="flex gap-2"><dt className="text-gray-500 w-16">Tipo:</dt><dd><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CV_TYPE_COLORS[selectedCandidate.cv_type]}`}>{selectedCandidate.cv_type}</span></dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-16">Fecha:</dt><dd className="text-gray-900">{selectedCandidate.created_at.slice(0, 10)}</dd></div>
            </dl>
            {selectedCandidate.cv_url && (
              <a href={selectedCandidate.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                Ver CV
              </a>
            )}
            <button onClick={() => handleDelete(selectedCandidate.id)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 mt-2">
              <Trash2 className="w-4 h-4" /> Eliminar candidato
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Estado</h3>
            {(['Nuevo', 'Revisado', 'Entrevistado'] as Candidate['status'][]).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(selectedCandidate.id, status)}
                className={`w-full px-3 py-2 text-sm rounded-lg font-medium transition text-left ${selectedCandidate.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
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
      <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Candidatos (CVs)</h2>
          <p className="text-sm text-gray-500">Gestión de todos los CVs recibidos.</p>
        </div>
      </header>

      <div className="p-6 border-b border-gray-100 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por candidato o puesto..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['Todos', ...CV_TYPES] as (CvType | 'Todos')[]).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-gray-400">Cargando candidatos...</div>}
        {!loading && filtered.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-gray-400">No hay candidatos{filterType !== 'Todos' ? ` de tipo "${filterType}"` : ''} aún.</div>}
        {!loading && filtered.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-gray-500 text-xs uppercase border-b border-gray-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Candidato</th>
                <th className="px-6 py-4 font-semibold">Puesto</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
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
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${CV_TYPE_COLORS[c.cv_type]}`}>
                      {c.cv_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.created_at.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${STATUS_COLORS[c.status]}`}>
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
