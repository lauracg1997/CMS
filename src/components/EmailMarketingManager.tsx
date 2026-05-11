import { Edit2, Trash2, Plus, X, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NewsletterManager from './NewsletterManager';
import { Portal } from './Portal';
import ConfirmModal from './ConfirmModal';

const API_URL = '/api/campaigns';

type Campaign = {
  id: number;
  name: string;
  subject: string | null;
  content: string | null;
  status: 'Activa' | 'Borrador' | 'Enviada';
  open_rate: string | null;
};

const emptyForm = { name: '', subject: '', content: '', status: 'Borrador' as Campaign['status'], open_rate: '' };
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
  const [sendResult, setSendResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ action: 'send' | 'delete'; item: Campaign } | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

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
    setForm({ name: c.name, subject: c.subject || '', content: c.content || '', status: c.status, open_rate: c.open_rate || '' });
    setErrors(emptyErrors);
    setShowForm(true);
  }

  async function handleSave() {
    if (!validate()) {
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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
    setConfirmModal({ action: 'delete', item: c });
  }

  async function handleToggleStatus(c: Campaign) {
    if (c.status === 'Enviada') return;
    const newStatus = c.status === 'Activa' ? 'Borrador' : 'Activa';
    await fetch(`${API_URL}/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCampaigns();
  }

  async function handleSendCampaign(c: Campaign) {
    setConfirmModal({ action: 'send', item: c });
  }

  async function executeConfirm() {
    if (!confirmModal) return;
    const c = confirmModal.item;
    setConfirmModal(null);
    if (confirmModal.action === 'delete') {
      await fetch(`${API_URL}/${c.id}`, { method: 'DELETE' });
      fetchCampaigns();
    } else {
      setSendResult(null);
      try {
        const res = await fetch(`${API_URL}/${c.id}/send`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
        });
        const data = await res.json();
        setSendResult({ id: c.id, msg: data.message, ok: res.ok });
        fetchCampaigns();
      } catch {
        setSendResult({ id: c.id, msg: 'Error al enviar la campaña.', ok: false });
      }
    }
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
                        <button
                          onClick={() => handleToggleStatus(c)}
                          disabled={c.status === 'Enviada'}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                            c.status === 'Enviada' ? 'bg-blue-100 text-blue-700 cursor-default' :
                            c.status === 'Activa' ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' :
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer'
                          }`}
                        >
                          {c.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.open_rate || '—'}</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {sendResult?.id === c.id && (
                          <span className={`text-xs mr-2 ${sendResult.ok ? 'text-green-600' : 'text-red-500'}`}>{sendResult.msg}</span>
                        )}
                        {c.status !== 'Enviada' && (
                          <button onClick={() => handleSendCampaign(c)} title="Enviar campaña" className="text-slate-400 hover:text-blue-600 transition-colors">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 transition-colors">
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

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.action === 'delete' ? `¿Eliminar campaña "${confirmModal.item.name}"?` : `¿Enviar campaña "${confirmModal.item.name}" a todos los leads?`}
          confirmLabel={confirmModal.action === 'delete' ? 'Eliminar' : 'Enviar'}
          danger={confirmModal.action === 'delete'}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {showForm && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalScrollRef} className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
              <h3 className="font-semibold text-slate-950">{editing ? 'Editar campaña' : 'Nueva campaña'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la campaña</label>
                <input type="text" placeholder="Ej: Campaña Mayo 2026" className={`w-full p-2 border rounded-lg text-sm ${errors.name ? 'border-red-400' : 'border-slate-200'}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asunto del email</label>
                <input type="text" placeholder="Ej: ¡Nuevas ofertas de empleo para ti!" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenido del email</label>
                <textarea rows={3} placeholder="Escribe el cuerpo del email..." className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Campaign['status'] })} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
                  <option value="Borrador">Borrador</option>
                  <option value="Activa">Activa</option>
                  <option value="Enviada">Enviada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tasa de apertura <span className="font-normal text-slate-400">(opcional)</span></label>
                <input type="text" placeholder="Ej: 45%" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={form.open_rate} onChange={e => setForm({ ...form, open_rate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
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
