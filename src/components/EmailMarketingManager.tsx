import { Search, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import NewsletterManager from './NewsletterManager';
import { Portal } from './Portal';

const API_URL = '/api/campaigns';

type Campaign = {
  id: number;
  name: string;
  status: 'Activa' | 'Borrador';
  open_rate: string | null;
};

const emptyForm = { name: '', status: 'Borrador' as Campaign['status'], open_rate: '' };
const emptyErrors = { name: '' };

export default function EmailMarketingManager() {
  const [activeTab, setActiveTab] = useState<'Campaigns' | 'Newsletter'>('Campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [saving, setSaving] = useState(false);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCampaigns(data);
    } catch (e) {
      console.error('Error al cargar campañas', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCampaigns(); }, []);

  function validate() {
    const e = { name: '' };
    if (!form.name.trim()) e.name = 'El nombre de la campaña es obligatorio.';
    setErrors(e);
    return !e.name;
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
    setShowForm(true);
  }

  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({ name: c.name, status: c.status, open_rate: c.open_rate || '' });
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
        body: JSON.stringify({ ...form, open_rate: form.open_rate || null }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchCampaigns();
      }
    } catch (e) {
      console.error('Error al guardar', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Campaign) {
    if (!confirm(`¿Eliminar campaña "${c.name}"?`)) return;
    await fetch(`${API_URL}/${c.id}`, { method: 'DELETE' });
    fetchCampaigns();
  }

  async function handleToggleStatus(c: Campaign) {
    const newStatus = c.status === 'Activa' ? 'Borrador' : 'Activa';
    await fetch(`${API_URL}/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCampaigns();
  }

  return (
    <section id="email-marketing-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="px-6 pt-6 border-b border-slate-100 flex justify-between items-end bg-slate-50/50">
        <div>
          <h2 className="text-lg font-medium text-slate-950">Email & News</h2>
          <div className="flex gap-4 mt-4">
            <button onClick={() => setActiveTab('Campaigns')} className={`pb-3 text-sm font-semibold border-b-2 ${activeTab === 'Campaigns' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              Campañas
            </button>
            <button onClick={() => setActiveTab('Newsletter')} className={`pb-3 text-sm font-semibold border-b-2 ${activeTab === 'Newsletter' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              Newsletter
            </button>
          </div>
        </div>
        {activeTab === 'Campaigns' && (
          <button onClick={openAdd} className="flex items-center px-4 py-2 mb-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4 mr-2" />
            Nueva campaña
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'Campaigns' ? (
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando campañas...</div>}
            {!loading && campaigns.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay campañas. Crea la primera.</div>}
            {!loading && campaigns.length > 0 && (
              <table className="w-full text-left text-sm border-collapse">
                <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Tasa Apertura</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-950 font-semibold">{c.name}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleStatus(c)} className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition ${c.status === 'Activa' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                          {c.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.open_rate || '0%'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 transition-colors mr-3">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <NewsletterManager />
        )}
      </div>

      {showForm && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-950 mb-4">{editing ? 'Editar campaña' : 'Nueva campaña'}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la campaña</label>
                <input type="text" placeholder="Ej: Newsletter Mayo 2026" className={`w-full p-2 border rounded-lg text-sm ${errors.name ? 'border-red-400' : 'border-slate-200'}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Campaign['status'] })} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                  <option value="Borrador">Borrador</option>
                  <option value="Activa">Activa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tasa de apertura <span className="font-normal text-slate-400">(opcional)</span></label>
                <input type="text" placeholder="Ej: 45%" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.open_rate} onChange={e => setForm({ ...form, open_rate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </section>
  );
}
