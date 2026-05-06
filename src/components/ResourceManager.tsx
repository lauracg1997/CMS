import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, MoreVertical, X, Pencil, Copy, Check, FileText, MonitorPlay, Upload, Eye, Download, File, Tv, Film, Table2, Image, Link } from 'lucide-react';
import { Portal } from './Portal';

const API_URL = '/api/resources';

type Resource = {
  id: number;
  name: string;
  category: 'PDF' | 'Documento' | 'Hoja de calculo' | 'Presentacion' | 'Video' | 'Webinar' | 'Imagen' | 'Enlace';
  description: string;
  type: string;
  size: string;
  url: string;
  status: 'active' | 'disabled';
  downloads: number;
  webinar_date: string | null;
  created_at: string;
};

const emptyForm = {
  name: '',
  category: 'PDF' as Resource['category'],
  description: '',
  type: '',
  size: '',
  url: '',
  webinar_date: '',
};

const emptyErrors = { name: '', description: '', url: '', webinar_date: '', upload: '' };

const CATEGORY_ACCEPT: Record<string, string> = {
  PDF:               '.pdf',
  Documento:         '.doc,.docx,.txt,.odt,.rtf',
  'Hoja de calculo': '.xls,.xlsx,.csv,.ods',
  Presentacion:      '.ppt,.pptx,.odp',
  Video:             '.mp4,.mov,.avi,.webm',
  Webinar:           '.mp4,.mov,.avi,.webm,.pdf,.ppt,.pptx',
  Imagen:            '.jpg,.jpeg,.png,.gif,.svg,.webp',
  Enlace:            '',
};

const CATEGORY_META: Record<string, { iconBg: string; iconColor: string }> = {
  PDF:               { iconBg: 'bg-red-100',    iconColor: 'text-red-600' },
  Documento:         { iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' },
  'Hoja de calculo': { iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
  Presentacion:      { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  Video:             { iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  Webinar:           { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  Imagen:            { iconBg: 'bg-pink-100',   iconColor: 'text-pink-600' },
  Enlace:            { iconBg: 'bg-slate-100',  iconColor: 'text-slate-600' },
};

const CATEGORIES: { value: Resource['category']; label: string; icon: React.ReactNode; activeBorder: string; activeBg: string; activeText: string }[] = [
  { value: 'PDF',              label: 'PDF',            icon: <FileText className="w-5 h-5" />,    activeBorder: 'border-red-400',    activeBg: 'bg-red-50',    activeText: 'text-red-700' },
  { value: 'Documento',        label: 'Documento',      icon: <File className="w-5 h-5" />,        activeBorder: 'border-blue-400',   activeBg: 'bg-blue-50',   activeText: 'text-blue-700' },
  { value: 'Hoja de calculo',  label: 'Hoja de\ncálculo', icon: <Table2 className="w-5 h-5" />,   activeBorder: 'border-green-400',  activeBg: 'bg-green-50',  activeText: 'text-green-700' },
  { value: 'Presentacion',     label: 'Presentación',   icon: <MonitorPlay className="w-5 h-5" />, activeBorder: 'border-orange-400', activeBg: 'bg-orange-50', activeText: 'text-orange-700' },
  { value: 'Video',            label: 'Vídeo',          icon: <Film className="w-5 h-5" />,        activeBorder: 'border-purple-400', activeBg: 'bg-purple-50', activeText: 'text-purple-700' },
  { value: 'Webinar',          label: 'Webinar',        icon: <Tv className="w-5 h-5" />,          activeBorder: 'border-indigo-400', activeBg: 'bg-indigo-50', activeText: 'text-indigo-700' },
  { value: 'Imagen',           label: 'Imagen',         icon: <Image className="w-5 h-5" />,       activeBorder: 'border-pink-400',   activeBg: 'bg-pink-50',   activeText: 'text-pink-700' },
  { value: 'Enlace',           label: 'Enlace',         icon: <Link className="w-5 h-5" />,        activeBorder: 'border-slate-400',  activeBg: 'bg-slate-50',  activeText: 'text-slate-700' },
];

export default function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [saving, setSaving] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [formUrlCopied, setFormUrlCopied] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setErrors(prev => ({ ...prev, upload: '' }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrors(prev => ({ ...prev, upload: err.message || 'Error al subir el archivo.' }));
        return;
      }
      const data = await res.json();
      setForm(prev => ({ ...prev, url: data.url, type: data.type || prev.type, size: data.size || prev.size }));
      setUploadedFile({ name: file.name, size: data.size });
    } catch {
      setErrors(prev => ({ ...prev, upload: 'No se pudo conectar al servidor.' }));
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const handler = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const file = e.clipboardData?.files[0];
      if (file) uploadFile(file);
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [showForm, uploadFile]);

  async function fetchResources() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setResources(data);
    } catch (e) {
      console.error('Error al cargar recursos', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchResources(); }, []);

  function validate() {
    const e = { name: '', description: '', url: '', webinar_date: '', upload: errors.upload };
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (form.category === 'Webinar' && !form.webinar_date) {
      e.webinar_date = 'Los webinars necesitan fecha y hora.';
    }
    setErrors(e);
    return !e.name && !e.webinar_date;
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
    setSaveError('');
    setUploadedFile(null);
    setShowForm(true);
  }

  function openEdit(resource: Resource) {
    setEditing(resource);
    setForm({
      name: resource.name,
      category: resource.category,
      description: resource.description || '',
      type: resource.type || '',
      size: resource.size || '',
      url: resource.url || '',
      webinar_date: resource.webinar_date ? resource.webinar_date.slice(0, 16) : '',
    });
    setErrors(emptyErrors);
    setSaveError('');
    setUploadedFile(
      resource.url
        ? { name: resource.name + (resource.type ? `.${resource.type}` : ''), size: resource.size || '' }
        : null
    );
    setShowForm(true);
    setOpenDropdownId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const body = { ...form, webinar_date: form.webinar_date || null };
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrors({
          name: err.errors?.name?.[0] || '',
          description: '',
          url: err.errors?.url?.[0] || '',
          webinar_date: err.errors?.webinar_date?.[0] || '',
          upload: '',
        });
        setSaveError(err.message || `Error ${res.status} al guardar el recurso.`);
        return;
      }
      setShowForm(false);
      fetchResources();
    } catch {
      setSaveError('No se pudo conectar al servidor. ¿Está Laravel corriendo?');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(resource: Resource) {
    const newStatus = resource.status === 'active' ? 'disabled' : 'active';
    await fetch(`${API_URL}/${resource.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setOpenDropdownId(null);
    fetchResources();
  }

  async function handleDelete(resource: Resource) {
    if (!confirm(`¿Eliminar "${resource.name}"?`)) return;
    await fetch(`${API_URL}/${resource.id}`, { method: 'DELETE' });
    setOpenDropdownId(null);
    fetchResources();
  }

  function copyUrl(url: string, id: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function copyFormUrl() {
    if (!form.url) return;
    navigator.clipboard.writeText(form.url).then(() => {
      setFormUrlCopied(true);
      setTimeout(() => setFormUrlCopied(false), 2000);
    });
  }

  function getIcon(category: string) {
    if (category === 'Documento')        return <File className="w-5 h-5" />;
    if (category === 'Hoja de calculo')  return <Table2 className="w-5 h-5" />;
    if (category === 'Presentacion')     return <MonitorPlay className="w-5 h-5" />;
    if (category === 'Video')            return <Film className="w-5 h-5" />;
    if (category === 'Webinar')          return <Tv className="w-5 h-5" />;
    if (category === 'Imagen')           return <Image className="w-5 h-5" />;
    if (category === 'Enlace')           return <Link className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  }

  function getIconColor(category: string) {
    if (category === 'Documento')        return 'bg-blue-50 text-blue-600';
    if (category === 'Hoja de calculo')  return 'bg-green-50 text-green-600';
    if (category === 'Presentacion')     return 'bg-orange-50 text-orange-600';
    if (category === 'Video')            return 'bg-purple-50 text-purple-600';
    if (category === 'Webinar')          return 'bg-indigo-50 text-indigo-600';
    if (category === 'Imagen')           return 'bg-pink-50 text-pink-600';
    if (category === 'Enlace')           return 'bg-slate-50 text-slate-600';
    return 'bg-red-50 text-red-600';
  }

  function getCategoryBadge(category: string) {
    if (category === 'Documento')        return 'bg-blue-50 text-blue-700';
    if (category === 'Hoja de calculo')  return 'bg-green-50 text-green-700';
    if (category === 'Presentacion')     return 'bg-orange-50 text-orange-700';
    if (category === 'Video')            return 'bg-purple-50 text-purple-700';
    if (category === 'Webinar')          return 'bg-indigo-50 text-indigo-700';
    if (category === 'Imagen')           return 'bg-pink-50 text-pink-700';
    if (category === 'Enlace')           return 'bg-slate-50 text-slate-700';
    return 'bg-red-50 text-red-700';
  }

  return (
    <section className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gestión de Recursos</h2>
          <p className="text-sm text-gray-500">Administra tus archivos descargables para la web.</p>
        </div>
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Recurso
        </button>
      </header>

      <div className="p-6 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar recursos..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-sm text-gray-400">Cargando recursos...</div>}
        {!loading && resources.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">No hay recursos. Crea el primero.</div>
        )}
        {!loading && resources.length > 0 && (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-gray-500 text-xs uppercase border-b border-gray-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">URL</th>
                <th className="px-6 py-4 font-semibold">Descargas</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIconColor(res.category)}`}>
                      {getIcon(res.category)}
                    </div>
                    <span className="font-medium text-gray-900">{res.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getCategoryBadge(res.category)}`}>
                      {res.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {res.url ? (
                      <div className="flex items-center gap-1.5 max-w-[180px]">
                        <a href={res.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{res.url}</a>
                        <button
                          onClick={() => copyUrl(res.url, res.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Copiar URL"
                        >
                          {copiedId === res.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{res.downloads.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${res.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {res.status === 'active' ? 'Activo' : 'Deshabilitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    {res.url && (
                      <>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-gray-400 hover:text-indigo-600 transition-colors mr-2"
                          title="Ver en navegador"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={res.url}
                          download={res.type ? `${res.name}.${res.type}` : res.name}
                          className="inline-flex text-gray-400 hover:text-emerald-600 transition-colors mr-2"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}
                    <button onClick={() => openEdit(res)} className="text-gray-400 hover:text-blue-600 transition-colors mr-2">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setOpenDropdownId(openDropdownId === res.id ? null : res.id)} className="text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openDropdownId === res.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-left">
                        <button onClick={() => handleToggleStatus(res)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          {res.status === 'active' ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                        <button onClick={() => handleDelete(res)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.07) 0%, white 55%)' }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100"
                style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.07) 0%, white 55%)' }}
              >
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-blue-400 uppercase mb-0.5">Recursos</p>
                  <h3 className="text-lg font-bold text-gray-900">{editing ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 pb-6 pt-5">
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                      placeholder="Ej: Guía SEO 2024"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Tipo de recurso</label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {CATEGORIES.map(cat => {
                        const active = form.category === cat.value;
                        const meta = CATEGORY_META[cat.value];
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setForm({ ...form, category: cat.value })}
                            className={`group flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200 ${
                              active
                                ? `${cat.activeBorder} ${cat.activeBg} ${cat.activeText} shadow-md`
                                : 'border-gray-100 bg-white text-gray-400 shadow-sm hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-600 hover:shadow-md'
                            }`}
                          >
                            <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-white/70' : `${meta.iconBg} opacity-60 group-hover:opacity-100`}`}>
                              <div className={active ? cat.activeText : `${meta.iconColor} opacity-80 group-hover:opacity-100`}>
                                {cat.icon}
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-center leading-tight whitespace-pre-line">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.category === 'Webinar' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha y hora del webinar</label>
                      <input
                        type="datetime-local"
                        value={form.webinar_date}
                        onChange={e => setForm({ ...form, webinar_date: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.webinar_date ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.webinar_date && <p className="text-xs text-red-500 mt-1">{errors.webinar_date}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Descripción breve..."
                    />
                  </div>

                  {form.category !== 'Enlace' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Archivo
                        <span className="ml-1 text-gray-400 font-normal">({CATEGORY_ACCEPT[form.category]})</span>
                      </label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
                          dragOver
                            ? 'border-blue-400 bg-blue-50'
                            : errors.upload
                              ? 'border-red-300 bg-red-50'
                              : uploadedFile
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept={CATEGORY_ACCEPT[form.category]}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
                        />
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2 text-blue-500">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Subiendo...</span>
                          </div>
                        ) : uploadedFile ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <span className="text-xs font-medium truncate max-w-[220px]">{uploadedFile.name}</span>
                            <span className="text-xs text-green-500 flex-shrink-0">({uploadedFile.size})</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-7 h-7 text-gray-300" />
                            <div className="text-center">
                              <p className="text-xs font-medium text-gray-600">Arrastra aquí, haz clic o pega con Ctrl+V</p>
                              <p className="text-xs text-gray-400 mt-0.5">Solo {CATEGORY_ACCEPT[form.category]} · máx. 50 MB</p>
                            </div>
                          </>
                        )}
                      </div>
                      {errors.upload && <p className="text-xs text-red-500 mt-1">{errors.upload}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {form.category === 'Enlace' ? 'URL del enlace' : 'URL del recurso'}
                      {uploadedFile && <span className="ml-1 text-green-600 font-normal text-[10px]">(rellenada automáticamente)</span>}
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={form.url}
                        onChange={e => setForm({ ...form, url: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={form.category === 'Enlace' ? 'https://...' : 'https://... (o sube un archivo arriba)'}
                      />
                      <button
                        type="button"
                        onClick={copyFormUrl}
                        disabled={!form.url}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        title="Copiar URL"
                      >
                        {formUrlCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {formUrlCopied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {saveError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                      {saveError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={saving || uploading} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
