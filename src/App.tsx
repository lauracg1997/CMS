/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Folder,
  BookOpen,
  User,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  Mail,
  Target,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CandidatesManager from './components/CandidatesManager';
import ResourceManager from './components/ResourceManager';
import FormsManager from './components/FormsManager';
import UsersManager from './components/UsersManager';
import BlogManager from './components/BlogManager';
import EmailMarketingManager from './components/EmailMarketingManager';
import LeadsManager from './components/LeadsManager';
import SettingsManager from './components/SettingsManager';
import TalentionLogo from './components/TalentionLogo';
import ProfileModal from './components/ProfileModal';
import LoginScreen from './components/LoginScreen';

// Inject auth token into all /api/ fetch calls automatically
const _originalFetch = window.fetch.bind(window);
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const token = localStorage.getItem('cms_token');
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  if (token && url.startsWith('/api/') && !url.includes('/api/login')) {
    init = { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } };
  }
  return _originalFetch(input, init);
};

function buildChartData(leads: any[], candidates: any[]) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const label = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
    const leadsCount = leads.filter(l => l.created_at?.startsWith(dateStr)).length;
    const cvsCount = candidates.filter(c => c.created_at?.startsWith(dateStr)).length;
    days.push({ name: label, leads: leadsCount, cvs: cvsCount });
  }
  return days;
}

type AuthUser = { name: string; email: string; role: string; avatar_url: string | null };

export default function App() {
  // Auth — all hooks unconditionally at top
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cms_token'));
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem('cms_user');
    return u ? JSON.parse(u) : null;
  });

  const [activeView, setActiveView] = useState('Inicio');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [totalCandidates, setTotalCandidates] = useState<number | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<{ id: number; name: string; position: string; status: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<{ id: number; description: string; created_at: string }[]>([]);
  const [chartData, setChartData] = useState<{ name: string; leads: number; cvs: number }[]>(buildChartData([], []));

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => []),
      fetch('/api/candidates').then(r => r.json()).catch(() => []),
    ]).then(([leadsData, candidatesData]) => {
      const leads = Array.isArray(leadsData) ? leadsData : [];
      const candidates = Array.isArray(candidatesData) ? candidatesData : [];
      setTotalLeads(leads.length);
      setTotalCandidates(candidates.length);
      setRecentCandidates(candidates.slice(0, 5));
      setChartData(buildChartData(leads, candidates));
    });
    fetch('/api/activity-logs').then(r => r.json()).then(d => setActivityLogs(Array.isArray(d) ? d : [])).catch(() => setActivityLogs([]));
  }, [token]);

  function handleLogin(t: string, user: AuthUser) {
    localStorage.setItem('cms_token', t);
    localStorage.setItem('cms_user', JSON.stringify(user));
    setToken(t);
    setAuthUser(user);
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    setToken(null);
    setAuthUser(null);
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  const navItems = ['Inicio', 'Recursos', 'Blog', 'Email & News', 'Leads', 'Candidatos (CVs)', 'Formularios', 'Usuarios', 'Configuración'];

  return (
    <div id="app-container" className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        id="sidebar" 
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-52'}`}
      >
        <div className={`flex items-center ${isCollapsed ? 'flex-col justify-center gap-2 py-4' : 'justify-between px-3 py-3'}`}>
          {!isCollapsed && (
            <div style={{ maxWidth: '130px', overflow: 'hidden' }}>
              <TalentionLogo collapsed={false} activeView={activeView} useStatic={true} height={38} />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {isCollapsed && (
            <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#1e2535' }}>
              T<span style={{ color: '#2563eb' }}>.</span>
            </span>
          )}
        </div>
        <nav id="main-nav" className="flex-1 px-3 space-y-1">
          {navItems.map((item, idx) => {
            const iconClass = isCollapsed ? "w-6 h-6" : "w-4 h-4 mr-3";
            return (
            <button
              key={item}
              onClick={() => setActiveView(item)}
              id={`nav-link-${idx}`}
              className={`w-full flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeView === item ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              {idx === 0 && <LayoutDashboard className={iconClass} />}
              {idx === 1 && <Folder className={iconClass} />}
              {idx === 2 && <BookOpen className={iconClass} />}
              {idx === 3 && <Mail className={iconClass} />}
              {idx === 4 && <Target className={iconClass} />}
              {idx === 5 && <User className={iconClass} />}
              {idx === 6 && <FileText className={iconClass} />}
              {idx === 7 && <Users className={iconClass} />}
              {idx === 8 && <Settings className={iconClass} />}
              {!isCollapsed && item}
            </button>
            );
          })}
        </nav>

        <div className="relative p-3 border-t border-slate-100">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg group"
          >
            {authUser?.avatar_url
              ? <img src={authUser.avatar_url} className="w-7 h-7 rounded-full object-cover mr-3 flex-shrink-0" />
              : <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-3 font-semibold text-xs text-blue-600 flex-shrink-0">{authUser?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            }
            {!isCollapsed && <span className="font-medium text-slate-950 truncate">{authUser?.name ?? 'Usuario'}</span>}
          </button>
          {showProfileMenu && (
            <div className={`absolute ${isCollapsed ? 'bottom-16 left-3' : 'bottom-16 left-3 w-44'} bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50`}>
              <button onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Perfil</button>
              <button onClick={() => { setShowProfileMenu(false); handleLogout(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
            </div>
          )}
        </div>
      </aside>

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 p-8 flex flex-col overflow-y-auto space-y-6"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: `radial-gradient(circle, rgba(148,163,184,0.18) 1.2px, transparent 1.2px)`,
          backgroundSize: '22px 22px',
        }}
      >
        {activeView === 'Inicio' ? (
          <>
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-blue-600 tracking-tight">Bienvenido de nuevo, equipo</h2>
                <p className="text-sm text-slate-500 mt-1">Resumen ejecutivo y flujo de trabajo actual.</p>
              </div>
            </header>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-4 gap-6 flex-1">
              
              {/* Stat Cards */}
              <div className="col-span-1 bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Leads Totales</p>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-950 mt-2">{totalLeads ?? '—'}</p>
              </div>
              <div className="col-span-1 bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Tasa Conversión</p>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-950 mt-2">
                  {totalLeads && totalCandidates != null && totalLeads > 0
                    ? `${((totalCandidates / totalLeads) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div className="col-span-2 bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-slate-950 mb-6">Actividad Semanal</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="leads" stroke="#2563eb" fill="#eff6ff" />
                      <Area type="monotone" dataKey="cvs" stroke="#64748b" fill="#f1f5f9" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Candidates */}
              <div className="col-span-2 bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-semibold text-slate-950 mb-4">Candidatos Recientes</h3>
                {recentCandidates.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin candidatos aún.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 text-xs uppercase">
                      <tr><th className="pb-3">Candidato</th><th className="pb-3">Puesto</th><th className="pb-3 text-right">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {recentCandidates.map(c => {
                        const badge =
                          c.status === 'Nuevo'         ? 'bg-sky-100 text-sky-700' :
                          c.status === 'En Selección'  ? 'bg-amber-100 text-amber-700' :
                          c.status === 'Entrevistado'  ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'Declinado'     ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600';
                        return (
                          <tr key={c.id}>
                            <td className="py-3 font-medium text-slate-950">{c.name}</td>
                            <td className="py-3 text-slate-600">{c.position}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>{c.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Activity Feed */}
              <div className="col-span-2 border p-6 rounded-2xl shadow-sm" style={{ background: 'rgba(239,246,255,0.5)', borderColor: 'rgba(147,197,253,0.3)' }}>
                <h3 className="text-base font-semibold text-slate-950 mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                  {activityLogs.length === 0 ? (
                    <p className="text-sm text-slate-400">Sin actividad registrada aún.</p>
                  ) : activityLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="mt-0.5 p-1.5 bg-blue-100 text-blue-500 rounded-lg flex-shrink-0"><Clock className="w-3 h-3"/></div>
                      <div className="flex-1 text-slate-700">{log.description}</div>
                      <div className="text-xs text-slate-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              </div>
            
            </div>
          </>
        ) : activeView === 'Recursos' ? (
          <ResourceManager />
        ) : activeView === 'Blog' ? (
          <BlogManager />
        ) : activeView === 'Email & News' ? (
          <EmailMarketingManager />
        ) : activeView === 'Leads' ? (
          <LeadsManager />
        ) : activeView === 'Candidatos (CVs)' ? (
          <CandidatesManager />
        ) : activeView === 'Formularios' ? (
          <FormsManager />
        ) : activeView === 'Usuarios' ? (
          <UsersManager />
        ) : activeView === 'Configuración' ? (
          <SettingsManager />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Página de {activeView} en construcción.
          </div>
        )}
      </main>
    </div>
  );
}
