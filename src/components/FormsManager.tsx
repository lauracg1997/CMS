import { Search, Eye, Trash2, MessageSquare, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Portal } from './Portal';

const API_URL = '/api/form-submissions';

type FormSubmission = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  employees: string | null;
  message: string | null;
  source: 'web' | 'resource';
  resource_name: string | null;
  created_at: string;
};

export default function FormsManager() {
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMessage, setOpenMessage] = useState<string | null>(null);
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

  async function handleDelete(form: FormSubmission) {
    if (!confirm(`¿Eliminar el envío de "${form.name}"?`)) return;
    await fetch(`${API_URL}/${form.id}`, { method: 'DELETE' });
    fetchForms();
  }

  return (
    <section id="forms-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Formularios Recibidos</h2>
          <p className="text-sm text-slate-500">Registro de todas las consultas de clientes.</p>
        </div>
      </header>

      <div className="p-6 border-b border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, empresa o email..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando formularios...</div>}
        {!loading && forms.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay envíos aún.</div>}
        {!loading && forms.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Nombre y apellidos</th>
                <th className="px-6 py-4 font-semibold">Empresa</th>
                <th className="px-6 py-4 font-semibold">Tamaño</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Origen</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forms.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{f.name}</td>
                  <td className="px-6 py-4 text-slate-600">{f.company || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{f.employees || '—'}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-950 font-medium">{f.email}</p>
                    {f.phone && <p className="text-xs text-slate-500">{f.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${f.source === 'web' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {f.source === 'web' ? 'Formulario Web' : `Descarga: ${f.resource_name || ''}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{f.created_at.slice(0, 10)}</td>
                  <td className="px-6 py-4 text-right">
                    {f.message && (
                      <button onClick={() => setOpenMessage(f.message)} className="text-slate-400 hover:text-blue-600 transition-colors mr-2">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setViewDetail(f)} className="text-slate-400 hover:text-blue-600 transition-colors mr-2">
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
        )}
      </div>

      {openMessage && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
            <button onClick={() => setOpenMessage(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-950 mb-2">Mensaje del cliente</h3>
            <p className="text-slate-600 text-sm mb-4">{openMessage}</p>
            <button onClick={() => setOpenMessage(null)} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Cerrar</button>
          </div>
        </div></Portal>
      )}

      {viewDetail && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <button onClick={() => setViewDetail(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-950 mb-4">Detalle del envío</h3>
            <dl className="space-y-2 text-sm">
              {([['Nombre', viewDetail.name], ['Email', viewDetail.email], ['Teléfono', viewDetail.phone || '—'], ['Empresa', viewDetail.company || '—'], ['Empleados', viewDetail.employees || '—'], ['Origen', viewDetail.source], ['Fecha', viewDetail.created_at.slice(0, 10)]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-24 text-slate-500 flex-shrink-0">{k}:</dt>
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
            <button onClick={() => setViewDetail(null)} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Cerrar</button>
          </div>
        </div></Portal>
      )}
    </section>
  );
}
