
import { Globe, Mail, Folder, Link2, Save, Key, Server, Hash, Webhook, CheckCircle2, Plus, Edit2, Trash2, ChevronLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const DEFAULT_WEB = {
  url: 'https://talentionhr.es',
  apiUrl: 'https://api.talentionhr.es/v1',
  apiKey: '',
  webhookSecret: '',
  env: 'production'
};

const DEFAULT_RESOURCES = {
  storageProvider: 'local',
  bucketName: '',
  cdnUrl: '',
  maxUploadSize: '50',
  allowedFormats: ['pdf', 'docx', 'jpg', 'png'],
  addWatermark: false
};

const DEFAULT_URLS = {
  defaultDomain: 'talentionhr.es',
  blogSlug: 'blog/{slug}',
  resourceSlug: 'recursos/{id}',
  enableUtmTracking: false,
  utmSourceDefault: 'app-talention'
};

export default function SettingsManager() {
  const [activeTab, setActiveTab] = useState<'web' | 'email' | 'resources' | 'urls'>('web');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [webSettings, setWebSettings] = useState(DEFAULT_WEB);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [emailForm, setEmailForm] = useState<any>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [resourceSettings, setResourceSettings] = useState(DEFAULT_RESOURCES);
  const [urlSettings, setUrlSettings] = useState(DEFAULT_URLS);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.web_settings) {
          try { setWebSettings(JSON.parse(data.web_settings)); } catch {}
        }
        if (data.email_accounts) {
          try { setEmailAccounts(JSON.parse(data.email_accounts)); } catch {}
        }
        if (data.resource_settings) {
          try { setResourceSettings(JSON.parse(data.resource_settings)); } catch {}
        }
        if (data.url_settings) {
          try { setUrlSettings(JSON.parse(data.url_settings)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    setSaveError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          web_settings: JSON.stringify(webSettings),
          email_accounts: JSON.stringify(emailAccounts),
          resource_settings: JSON.stringify(resourceSettings),
          url_settings: JSON.stringify(urlSettings),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message || 'Error al guardar.');
        return;
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setSaveError('No se pudo conectar al servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const startNewEmail = () => {
    setEmailForm({
      id: Date.now().toString(),
      provider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPass: '',
      fromName: '',
      fromEmail: '',
      status: 'pending'
    });
    setTestResult(null);
  };

  const saveEmailAccount = async () => {
    const newAccounts = emailAccounts.find(a => a.id === emailForm.id)
      ? emailAccounts.map(a => a.id === emailForm.id ? emailForm : a)
      : [...emailAccounts, emailForm];

    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          web_settings: JSON.stringify(webSettings),
          email_accounts: JSON.stringify(newAccounts),
          resource_settings: JSON.stringify(resourceSettings),
          url_settings: JSON.stringify(urlSettings),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message || 'Error al guardar.');
        return;
      }
      setEmailAccounts(newAccounts);
      setEmailForm(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setSaveError('No se pudo conectar al servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    setIsTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          smtpHost:  emailForm.smtpHost,
          smtpPort:  emailForm.smtpPort,
          smtpUser:  emailForm.smtpUser,
          smtpPass:  emailForm.smtpPass,
          fromEmail: emailForm.fromEmail,
          fromName:  emailForm.fromName,
        }),
      });
      if (res.ok) {
        setTestResult('success');
        setEmailForm({ ...emailForm, status: 'connected' });
      } else {
        setTestResult('error');
        setEmailForm({ ...emailForm, status: 'error' });
      }
    } catch {
      setTestResult('error');
      setEmailForm({ ...emailForm, status: 'error' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <section id="settings-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
        <div className="min-w-0">
          <h2 className="text-lg font-medium text-slate-950">Configuración del Sistema</h2>
          <p className="text-sm text-slate-500">Gestión de integraciones, envíos, almacenamiento y enrutamiento.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {saveError && <span className="flex items-center text-sm text-red-600 font-medium"><AlertCircle className="w-4 h-4 mr-1"/> {saveError}</span>}
          {showSuccess && <span className="flex items-center text-sm text-green-600 font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Guardado</span>}
          {activeTab !== 'email' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-4 py-2 text-white text-sm font-semibold rounded-lg transition ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-slate-100 p-4 space-y-1 bg-slate-50/30 overflow-y-auto">
          <button
            onClick={() => setActiveTab('web')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'web' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
          >
            <Globe className="w-4 h-4 mr-3" /> Conexión Web
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'email' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
          >
            <Mail className="w-4 h-4 mr-3" /> Email Marketing
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'resources' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
          >
            <Folder className="w-4 h-4 mr-3" /> Archivos y Recursos
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'urls' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
          >
            <Link2 className="w-4 h-4 mr-3" /> Enlaces y URLs
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-2xl">

            {/* WEB SETTINGS */}
            {activeTab === 'web' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Entorno Web</h3>
                  <p className="text-sm text-slate-500 mb-4">Configura los parámetros principales de tu sitio web para sincronización.</p>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">URL Principal</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm"><Globe className="w-4 h-4"/></span>
                        <input type="text" className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={webSettings.url} onChange={e => setWebSettings({...webSettings, url: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Entorno</label>
                      <select className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={webSettings.env} onChange={e => setWebSettings({...webSettings, env: e.target.value})}>
                        <option value="production">Producción</option>
                        <option value="staging">Staging</option>
                        <option value="development">Desarrollo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL de la API</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm"><Server className="w-4 h-4"/></span>
                      <input type="text" className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={webSettings.apiUrl} onChange={e => setWebSettings({...webSettings, apiUrl: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">API Key Principal</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm"><Key className="w-4 h-4"/></span>
                      <input type="password" placeholder="sk_live_..." className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={webSettings.apiKey} onChange={e => setWebSettings({...webSettings, apiKey: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Webhook Secret</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm"><Webhook className="w-4 h-4"/></span>
                      <input type="password" placeholder="whsec_..." className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={webSettings.webhookSecret} onChange={e => setWebSettings({...webSettings, webhookSecret: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL SETTINGS */}
            {activeTab === 'email' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {!emailForm ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">Cuentas de Correo Remitente</h3>
                        <p className="text-sm text-slate-500">Configura servidores SMTP para envíos de campañas y notificaciones.</p>
                      </div>
                      <button
                        onClick={startNewEmail}
                        className="flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Cuenta
                      </button>
                    </div>

                    <div className="space-y-3">
                      {emailAccounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{account.fromEmail}</p>
                              <p className="text-xs text-slate-500 capitalize">{account.smtpHost} • {account.fromName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {account.status === 'connected' ? (
                              <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1"/> Conectado</span>
                            ) : account.status === 'error' ? (
                              <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1"/> Error SMTP</span>
                            ) : (
                              <span className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Sin verificar</span>
                            )}
                            <button
                              onClick={() => { setEmailForm(account); setTestResult(null); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEmailAccounts(emailAccounts.filter(a => a.id !== account.id))}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {emailAccounts.length === 0 && (
                        <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl border-dashed">
                           <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-sm text-slate-500 font-medium">No hay cuentas configuradas</p>
                           <p className="text-xs text-slate-400 mt-1">Añade tu primera cuenta de envío para empezar.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setEmailForm(null)}
                        className="mr-3 p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">Configurar Cuenta SMTP</h3>
                        <p className="text-sm text-slate-500">Introduce los credenciales de tu proveedor de correo.</p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Servidor SMTP</label>
                          <input type="text" placeholder="smtp.ejemplo.com" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.smtpHost} onChange={e => setEmailForm({...emailForm, smtpHost: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Puerto</label>
                          <input type="text" placeholder="587" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.smtpPort} onChange={e => setEmailForm({...emailForm, smtpPort: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Usuario SMTP</label>
                          <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.smtpUser} onChange={e => setEmailForm({...emailForm, smtpUser: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña SMTP</label>
                          <div className="relative">
                            <input type={showSmtpPass ? 'text' : 'password'} placeholder="••••••••" className="w-full p-2 pr-9 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.smtpPass} onChange={e => setEmailForm({...emailForm, smtpPass: e.target.value})} />
                            <button type="button" onClick={() => setShowSmtpPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
                       <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Remitente</label>
                          <input type="text" placeholder="Tu Empresa" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.fromName} onChange={e => setEmailForm({...emailForm, fromName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Email del Remitente</label>
                          <input type="email" placeholder="hola@ejemplo.com" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={emailForm.fromEmail} onChange={e => setEmailForm({...emailForm, fromEmail: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={testEmailConnection}
                          disabled={isTestingEmail || !emailForm.smtpHost}
                          className="flex items-center px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                        >
                          {isTestingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
                          {isTestingEmail ? 'Probando...' : 'Probar Conexión'}
                        </button>

                        {testResult === 'success' && (
                          <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100"><CheckCircle2 className="w-4 h-4 mr-1.5"/> Configuración completa</span>
                        )}
                        {testResult === 'error' && (
                          <span className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4 mr-1.5"/> Faltan datos o credenciales inválidas</span>
                        )}
                      </div>

                      <button
                        onClick={saveEmailAccount}
                        disabled={isSaving}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar cuenta'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* RESOURCE SETTINGS */}
            {activeTab === 'resources' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Archivos y Recursos</h3>
                  <p className="text-sm text-slate-500 mb-4">Gestión de subida, almacenamiento y CDN para los recursos de la web.</p>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor de Almacenamiento</label>
                      <select className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={resourceSettings.storageProvider} onChange={e => setResourceSettings({...resourceSettings, storageProvider: e.target.value})}>
                        <option value="local">Servidor Local</option>
                        <option value="s3">Amazon S3</option>
                        <option value="gcs">Google Cloud Storage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Bucket / Carpeta</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" value={resourceSettings.bucketName} onChange={e => setResourceSettings({...resourceSettings, bucketName: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL Base del CDN</label>
                    <input type="text" placeholder="https://cdn.tudominio.com" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={resourceSettings.cdnUrl} onChange={e => setResourceSettings({...resourceSettings, cdnUrl: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Límite por Archivo (MB)</label>
                    <input type="number" className="w-48 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={resourceSettings.maxUploadSize} onChange={e => setResourceSettings({...resourceSettings, maxUploadSize: e.target.value})} />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-3">Formatos Permitidos</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['pdf', 'docx', 'jpg', 'png', 'zip', 'csv', 'mp4', 'txt'].map(format => (
                        <label key={format} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                            checked={resourceSettings.allowedFormats.includes(format)}
                            onChange={(e) => {
                              const newFormats = e.target.checked
                                ? [...resourceSettings.allowedFormats, format]
                                : resourceSettings.allowedFormats.filter(f => f !== format);
                              setResourceSettings({...resourceSettings, allowedFormats: newFormats});
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700 uppercase">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-center cursor-pointer w-fit">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={resourceSettings.addWatermark} onChange={e => setResourceSettings({...resourceSettings, addWatermark: e.target.checked})} />
                        <div className={`block w-10 h-6 rounded-full transition ${resourceSettings.addWatermark ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${resourceSettings.addWatermark ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-slate-700">Añadir marca de agua a imágenes subidas</div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* URL SETTINGS */}
            {activeTab === 'urls' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Estructura de URLs y Tracking</h3>
                  <p className="text-sm text-slate-500 mb-4">Define cómo se generan los enlaces públicos para contenidos y recursos.</p>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dominio Público por Defecto</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={urlSettings.defaultDomain} onChange={e => setUrlSettings({...urlSettings, defaultDomain: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Patrón URL Blog</label>
                      <div className="flex">
                         <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-xs">/</span>
                         <input type="text" className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={urlSettings.blogSlug} onChange={e => setUrlSettings({...urlSettings, blogSlug: e.target.value})} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Usa {"{slug}"} o {"{id}"} como variables</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Patrón URL Recursos</label>
                      <div className="flex">
                         <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-xs">/</span>
                         <input type="text" className="flex-1 w-full p-2 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={urlSettings.resourceSlug} onChange={e => setUrlSettings({...urlSettings, resourceSlug: e.target.value})} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Usa {"{slug}"} o {"{id}"} como variables</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Añadir etiquetas UTM automáticamente</label>
                      <label className="relative cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={urlSettings.enableUtmTracking} onChange={e => setUrlSettings({...urlSettings, enableUtmTracking: e.target.checked})} />
                        <div className={`block w-10 h-6 rounded-full transition ${urlSettings.enableUtmTracking ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${urlSettings.enableUtmTracking ? 'translate-x-4' : ''}`}></div>
                      </label>
                  </div>
                  {urlSettings.enableUtmTracking && (
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">utm_source por defecto</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={urlSettings.utmSourceDefault} onChange={e => setUrlSettings({...urlSettings, utmSourceDefault: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
