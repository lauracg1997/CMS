import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import TalentionLogo from './TalentionLogo';

type Props = { onLogin: (token: string, user: { name: string; email: string; role: string; avatar_url: string | null }) => void };
type Step = 'login' | 'forgot' | 'verify';

export default function LoginScreen({ onLogin }: Props) {
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Credenciales incorrectas.'); return; }
      onLogin(data.token, data.user);
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || 'Error.'); return; }
      setStep('verify');
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Código incorrecto.'); return; }
      setSuccessMsg('Contraseña actualizada. Ya puedes iniciar sesión.');
      setStep('login');
      setCode('');
      setNewPassword('');
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-white px-4"
      style={{
        boxShadow: 'inset 80px 0 120px -40px rgba(37,99,235,0.07), inset -80px 0 120px -40px rgba(37,99,235,0.07)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <TalentionLogo collapsed={false} activeView="" height={130} />
        </div>

        <div className="rounded-2xl p-8" style={{ border: '1px solid rgba(56,182,255,0.35)', boxShadow: '0 4px 32px rgba(56,182,255,0.18)' }}>

          {/* LOGIN */}
          {step === 'login' && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-5">Iniciar sesión</h2>
              {successMsg && <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">{successMsg}</p>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
                  <input type="email" autoComplete="email" placeholder="tu@empresa.com"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                      className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                      value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>
              <button onClick={() => { setStep('forgot'); setError(''); setSuccessMsg(''); }}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-700 mt-4 transition">
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {/* FORGOT */}
          {step === 'forgot' && (
            <>
              <button onClick={() => { setStep('login'); setError(''); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Recuperar contraseña</h2>
              <p className="text-xs text-slate-500 mb-5">Te enviamos un código de 6 dígitos a tu email.</p>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
                  <input type="email" placeholder="tu@empresa.com"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }} required />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          )}

          {/* VERIFY + RESET */}
          {step === 'verify' && (
            <>
              <button onClick={() => { setStep('forgot'); setError(''); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Introduce el código</h2>
              <p className="text-xs text-slate-500 mb-5">
                Revisa tu email <span className="font-medium text-slate-700">{forgotEmail}</span>. Expira en 15 min.
              </p>
              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código de 6 dígitos</label>
                  <input type="text" placeholder="000000" maxLength={6}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input type={showNewPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                      className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                      value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Verificando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
