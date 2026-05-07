import { Search, Eye, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Portal } from './Portal';

const API_URL = '/api/form-submissions';

type ContactStatus = 'Pendiente' | 'Contactado' | 'Llamada realizada' | 'Conversación mantenida';

type FormSubmission = {
  id: number;
  name: string;
  surname: string | null;
  company: string | null;
  cargo: string | null;
  email: string;
  phone: string | null;
  employees: string | null;
  message: string | null;
  status: ContactStatus;
  created_at: string;
};

const STATUS_STYLES: Record<ContactStatus, string> = {
  'Pendiente':               'bg-slate-100 text-slate-600',
  'Contactado':              'bg-amber-100 text-amber-700',
  'Llamada realizada':       'bg-blue-100 text-blue-700',
  'Conversación mantenida':  'bg-emerald-100 text-emerald-700',
};

const STATUSES: ContactStatus[] = ['Pendiente', 'Contactado', 'Llamada realizada', 'Conversación mantenida'];

export default function FormsManager() {
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewDetail, setViewDetail] = useState<FormSubmission | null>(null);

  async function fetchForms() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setForms(data);
    } catch (e) {
      console.error('Error al cargar formularios', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchForms(); }, []);

  async function handleStatusChange(form: FormSubmission, newStatus: ContactStatus) {
    await fetch(`${API_URL}/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setForms(prev => prev.map(f => f.id === form.id ? { ...f, status: newStatus } : f));
  }

  async function handleDelete(form: FormSubmission) {
    if (!confirm(`¿Eliminar el envío de "${form.name}"?`)) return;
    await fetch(`${API_URL}/${form.id}`, { method: 'DELETE' });
    fetchForms();
  }

  const filtered = forms.filter(f => {
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.surname ?? '').toLowerCase().includes(q) ||
      (f.company ?? '').toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  return (
    <section id="forms-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-medium text-slate-950">Formularios Recibidos</h2>
          <p className="text-sm text-slate-500">Registro de todas las consultas recibidas desde la web.</p>
        </div>
      </header>

      <div className="p-6 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa o email..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
            <tr>
              <th className="px-5 py-4 font-semibold">Nombre</th>
              <th className="px-5 py-4 font-semibold">Apellidos</th>
              <th className="px-5 py-4 font-semibold">Empresa</th>
              <th className="px-5 py-4 font-semibold">Cargo</th>
              <th className="px-5 py-4 font-semibold">Correo</th>
              <th className="px-5 py-4 font-semibold">Teléfono</th>
              <th className="px-5 py-4 font-semibold">Nº Empleados</th>
              <th className="px-5 py-4 font-semibold">Estado</th>
              <th className="px-5 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">Cargando formularios...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">No hay envíos aún. Cuando la web esté conectada, los formularios aparecerán aquí.</td></tr>
            )}
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-slate-950 font-semibold">{f.name}</td>
                  <td className="px-5 py-4 text-slate-700">{f.surname || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{f.company || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{f.cargo || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{f.email}</td>
                  <td className="px-5 py-4 text-slate-600">{f.phone || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{f.employees || '—'}</td>
                  <td className="px-5 py-4">
                    <select
                      value={f.status ?? 'Pendiente'}
                      onChange={e => handleStatusChange(f, e.target.value as ContactStatus)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${STATUS_STYLES[f.status ?? 'Pendiente']}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => setViewDetail(f)} className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(f)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {viewDetail && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
              <button onClick={() => setViewDetail(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-slate-950 mb-4">Detalle del envío</h3>
              <dl className="space-y-2 text-sm">
                {(
                  [
                    ['Nombre', viewDetail.name],
                    ['Apellidos', viewDetail.surname || '—'],
                    ['Empresa', viewDetail.company || '—'],
                    ['Cargo', viewDetail.cargo || '—'],
                    ['Correo', viewDetail.email],
                    ['Teléfono', viewDetail.phone || '—'],
                    ['Nº Empleados', viewDetail.employees || '—'],
                    ['Fecha', viewDetail.created_at.slice(0, 10)],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-28 text-slate-500 flex-shrink-0">{k}:</dt>
                    <dd className="text-slate-900 font-medium">{v}</dd>
                  </div>
                ))}
                {viewDetail.message && (
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500 mb-1">Mensaje:</dt>
                    <dd className="text-slate-900 bg-slate-50 p-3 rounded-lg">{viewDetail.message}</dd>
                  </div>
                )}
              </dl>
              <button onClick={() => setViewDetail(null)} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
