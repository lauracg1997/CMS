import { Search, Edit2, Trash2, Plus, Users, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = '/api/newsletters';

type Newsletter = {
  id: number;
  name: string;
  subscribers: number;
  last_sent_at: string | null;
};

const emptyForm = { name: '', subscribers: 0, last_sent_at: '' };

export default function NewsletterManager() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Newsletter | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchNewsletters() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setNewsletters(data);
    } catch (e) {
      console.error('Error al cargar newsletters', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNewsletters(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(n: Newsletter) {
    setEditing(n);
    setForm({ name: n.name, subscribers: n.subscribers, last_sent_at: n.last_sent_at || '' });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...form, last_sent_at: form.last_sent_at || null }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchNewsletters();
      }
    } catch (e) {
      console.error('Error al guardar', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(n: Newsletter) {
    if (!confirm(`¿Eliminar "${n.name}"?`)) return;
    await fetch(`${API_URL}/${n.id}`, { method: 'DELETE' });
    fetchNewsletters();
  }

  return (
    <>
      <div className="p-4 border-b border-slate-100 flex justify-end">
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4 mr-2" />
          Nueva lista
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando...</div>}
        {!loading && newsletters.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay listas. Crea la primera.</div>}
        {!loading && newsletters.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Suscriptores</th>
                <th className="px-6 py-4 font-semibold">Último Envío</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newsletters.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{n.name}</td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    {n.subscribers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{n.last_sent_at || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(n)} className="text-slate-400 hover:text-blue-600 transition-colors mr-3">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(n)} className="text-slate-400 hover:text-red-600 transition-colors">
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
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-950 mb-4">{editing ? 'Editar lista' : 'Nueva lista'}</h3>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Nombre de la lista *" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Suscriptores</label>
                <input type="number" min="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.subscribers} onChange={e => setForm({ ...form, subscribers: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Último envío</label>
                <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700" value={form.last_sent_at} onChange={e => setForm({ ...form, last_sent_at: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
