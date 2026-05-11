import { Edit2, Trash2, Plus, Users, X, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Portal } from './Portal';

const API_URL = '/api/newsletters';

type Newsletter = {
  id: number;
  name: string;
  subject: string | null;
  content: string | null;
  status: string;
  subscribers: number;
  last_sent_at: string | null;
};

const emptyForm = { name: '', subject: '', content: '', subscribers: 0, last_sent_at: '' };

export default function NewsletterManager() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Newsletter | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sendResult, setSendResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

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
    setForm({ name: n.name, subject: n.subject || '', content: n.content || '', subscribers: n.subscribers, last_sent_at: n.last_sent_at || '' });
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
        body: JSON.stringify({ ...form, last_sent_at: form.last_sent_at || null, subject: form.subject || null, content: form.content || null }),
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

  async function handleSend(n: Newsletter) {
    if (!confirm(`¿Enviar newsletter "${n.name}" a todos los leads?`)) return;
    setSendResult(null);
    try {
      const res = await fetch(`${API_URL}/${n.id}/send`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      setSendResult({ id: n.id, msg: data.message, ok: res.ok });
      fetchNewsletters();
    } catch {
      setSendResult({ id: n.id, msg: 'Error al enviar.', ok: false });
    }
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
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Suscriptores</th>
                <th className="px-6 py-4 font-semibold">Último Envío</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newsletters.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{n.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      n.status === 'Enviado' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{n.status || 'Borrador'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    {n.subscribers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{n.last_sent_at || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {sendResult?.id === n.id && (
                        <span className={`text-xs mr-1 ${sendResult.ok ? 'text-green-600' : 'text-red-500'}`}>{sendResult.msg}</span>
                      )}
                      {n.status !== 'Enviado' && (
                        <button onClick={() => handleSend(n)} title="Enviar newsletter" className="text-slate-400 hover:text-blue-600 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(n)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(n)} className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-950 mb-4">{editing ? 'Editar newsletter' : 'Nueva lista'}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la lista</label>
                <input type="text" placeholder="Ej: Lista principal" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asunto del email</label>
                <input type="text" placeholder="Ej: ¡Novedades de TalentionHR!" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenido del email</label>
                <textarea rows={5} placeholder="Escribe el cuerpo del newsletter..." className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
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
        </div></Portal>
      )}
    </>
  );
}
