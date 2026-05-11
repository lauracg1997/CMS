import { Search, Edit2, Trash2, Plus, Calendar, Link2, X, Upload, Check } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Portal } from './Portal';

const API_URL = '/api/posts';

type Post = {
  id: number;
  title: string;
  content: string;
  status: 'Publicado' | 'Borrador';
  cover_image_url: string | null;
  created_at: string;
};

const emptyForm = {
  title: '',
  content: '',
  status: 'Borrador' as Post['status'],
  cover_image_url: '',
};
const emptyErrors = { title: '', content: '' };

export default function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0, selectedText: '' });
  const [errors, setErrors] = useState(emptyErrors);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error('Error al cargar posts', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(); }, []);

  const uploadCover = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.message || 'Error al subir la imagen.');
        return;
      }
      const data = await res.json();
      setForm(prev => ({ ...prev, cover_image_url: data.url }));
    } catch {
      setUploadError('No se pudo conectar al servidor.');
    } finally {
      setUploading(false);
    }
  }, []);

  function validate() {
    const e = { title: '', content: '' };
    if (!form.title.trim()) e.title = 'El título es obligatorio.';
    if (!form.content.trim()) e.content = 'El contenido es obligatorio.';
    setErrors(e);
    return !e.title && !e.content;
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
    setUploadError('');
    setIsModalOpen(true);
  }

  function openEdit(post: Post) {
    setEditing(post);
    setForm({
      title: post.title,
      content: post.content || '',
      status: post.status,
      cover_image_url: post.cover_image_url || '',
    });
    setErrors(emptyErrors);
    setUploadError('');
    setIsModalOpen(true);
  }

  const handleAddLink = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      selectedText: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd),
    });
    setIsUrlModalOpen(true);
  };

  const confirmAddLink = () => {
    const { start, end, selectedText } = selection;
    const before = form.content.substring(0, start);
    const after = form.content.substring(end);
    setForm({ ...form, content: before + `[${selectedText || 'Enlace'}](http://${linkUrl})` + after });
    setIsUrlModalOpen(false);
    setLinkUrl('');
  };

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          ...form,
          cover_image_url: form.cover_image_url || null,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchPosts();
      }
    } catch (e) {
      console.error('Error al guardar', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post: Post) {
    if (!confirm(`¿Eliminar "${post.title}"?`)) return;
    await fetch(`${API_URL}/${post.id}`, { method: 'DELETE' });
    fetchPosts();
  }

  async function handleToggleStatus(post: Post) {
    const newStatus = post.status === 'Publicado' ? 'Borrador' : 'Publicado';
    await fetch(`${API_URL}/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPosts();
  }

  return (
    <section id="blog-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-medium text-slate-950">Gestión del Blog</h2>
          <p className="text-sm text-slate-500">Administra las entradas de tu blog.</p>
        </div>
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4 mr-2" />
          Nueva entrada
        </button>
      </header>

      <div className="p-6 border-b border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando entradas...</div>}
        {!loading && posts.length === 0 && <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay entradas. Crea la primera.</div>}
        {!loading && posts.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Título</th>
                <th className="px-6 py-4 font-semibold">Portada</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase())).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{p.title}</td>
                  <td className="px-6 py-4">
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt="" className="w-16 h-12 object-contain rounded-md border border-slate-100 bg-slate-50" />
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleStatus(p)} className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition ${p.status === 'Publicado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                      {p.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {p.created_at.slice(0, 10)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 transition-colors mr-3">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <Portal><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-slate-950 mb-4">{editing ? 'Editar entrada' : 'Nueva entrada'}</h3>
            <div className="space-y-4">

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Título de la entrada"
                  className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
                  value={form.title}
                  onChange={e => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors(prev => ({ ...prev, title: '' })); }}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Post['status'] })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700"
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Publicado">Publicado</option>
                </select>
              </div>

              {/* Imagen de portada */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Imagen de portada <span className="font-normal text-slate-400">(opcional)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ''; }}
                />

                {/* Preview — visible cuando hay imagen */}
                {form.cover_image_url && !uploading && (
                  <div
                    className="relative mb-2 rounded-xl border border-slate-200 bg-slate-50"
                    style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                  >
                    <img
                      src={form.cover_image_url}
                      alt="portada"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cover_image_url: '' })}
                      className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-slate-500 hover:text-red-600 hover:bg-white transition shadow-sm"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Drop zone — solo si no hay imagen */}
                {!form.cover_image_url && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadCover(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all mb-2 ${
                      dragOver ? 'border-blue-400 bg-blue-50' : uploadError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                    style={{ height: '280px' }}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3 text-blue-500">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Subiendo imagen...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-600">Arrastra una imagen aquí</p>
                          <p className="text-xs text-slate-400 mt-0.5">o haz clic para seleccionar</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {uploadError && <p className="text-xs text-red-500 mb-1">{uploadError}</p>}

                {/* URL manual */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">o URL externa</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.cover_image_url}
                  onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenido</label>
                <div className="flex gap-2 mb-1.5">
                  <button type="button" onClick={handleAddLink} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5" /> Insertar enlace
                  </button>
                </div>
                <textarea
                  ref={contentRef}
                  placeholder="Escribe el contenido de la entrada..."
                  className={`w-full p-2 border rounded-lg text-sm h-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.content ? 'border-red-400' : 'border-slate-200'}`}
                  value={form.content}
                  onChange={e => { setForm({ ...form, content: e.target.value }); if (errors.content) setErrors(prev => ({ ...prev, content: '' })); }}
                />
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              </div>
            </div>

            {isUrlModalOpen && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-xl shadow-lg w-64">
                  <input type="text" placeholder="URL (ej: google.com)" className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-2" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => setIsUrlModalOpen(false)} className="flex-1 py-1 bg-slate-100 rounded text-xs">Cancelar</button>
                    <button onClick={confirmAddLink} className="flex-1 py-1 bg-blue-600 text-white rounded text-xs">Aceptar</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Publicar'}
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </section>
  );
}
