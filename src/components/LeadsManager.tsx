import { Search, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = '/api/leads';

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: 'Nuevo' | 'Contactado' | 'Convertido';
  notes: string | null;
};

const emptyForm = { name: '', email: '', phone: '', company: '', status: 'Nuevo' as Lead['status'], notes: '' };
const emptyErrors = { name: '', email: '' };

const STATUS_COLORS: Record<string, string> = {
  Nuevo: 'bg-sky-50 text-sky-700',
  Contactado: 'bg-amber-50 text-amber-700',
  Convertido: 'bg-emerald-50 text-emerald-700',
};

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [saving, setSaving] = useState(false);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setLeads(data);
    } catch (e) {
      console.error('Error al cargar leads', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  function validate() {
    const e = { name: '', email: '' };
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.email.trim()) e.email = 'El email es obligatorio.';
    setErrors(e);
    return !e.name && !e.email;
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
    setShowForm(true);
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status,
      notes: lead.notes || '',
    });
    setErrors(emptyErrors);
    setShowForm(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...form, phone: form.phone || null, company: form.company || null, notes: form.notes || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrors({ name: err.errors?.name?.[0] || '', email: err.errors?.email?.[0] || '' });
        return;
      }
      setShowForm(false);
      fetchLeads();
    } catch (e) {
      console.error('Error al guardar', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lead: Lead) {
    if (!confirm(`¿Eliminar lead "${lead.name}"?`)) return;
    await fetch(`${API_URL}/${lead.id}`, { method: 'DELETE' });
    fetchLeads();
  }

  async function handleStatusChange(lead: Lead, newStatus: Lead['status']) {
    await fetch(`${API_URL}/${lead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchLeads();
  }

  return (
    <section id="leads-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Leads</h2>
          <p className="text-sm text-slate-500">Administra tus contactos y leads.</p>
        </div>
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Lead
        </button>
      </header>

      <div className="p-6 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o email..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando leads...</div>}
        {!loading && leads.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay leads. Añade el primero.</div>}
        {!loading && leads.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Empresa</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{l.name}</td>
                  <td className="px-6 py-4 text-slate-600">{l.email}</td>
                  <td className="px-6 py-4 text-slate-600">{l.company || '—'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={l.status}
                      onChange={e => handleStatusChange(l, e.target.value as Lead['status'])}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border-0 cursor-pointer ${STATUS_COLORS[l.status]}`}
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Convertido">Convertido</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(l)} className="text-slate-400 hover:text-blue-600 transition-colors mr-3">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(l)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-slate-950 mb-4">{editing ? 'Editar Lead' : 'Nuevo Lead'}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <input type="text" placeholder="Nombre *" className={`w-full p-2 border rounded-lg text-sm ${errors.name ? 'border-red-400' : 'border-slate-200'}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input type="email" placeholder="Email *" className={`w-full p-2 border rounded-lg text-sm ${errors.email ? 'border-red-400' : 'border-slate-200'}`} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <input type="text" placeholder="Teléfono" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input type="text" placeholder="Empresa" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Lead['status'] })} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                <option value="Nuevo">Nuevo</option>
                <option value="Contactado">Contactado</option>
                <option value="Convertido">Convertido</option>
              </select>
              <textarea placeholder="Notas (opcional)" className="w-full p-2 border border-slate-200 rounded-lg text-sm" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
