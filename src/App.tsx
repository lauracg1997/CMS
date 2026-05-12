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
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
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
  const [leadsInitialStatus, setLeadsInitialStatus] = useState<string | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    window.history.replaceState({ view: 'Inicio' }, '');
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (!e.state?.view) {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        setToken(null);
        setAuthUser(null);
        return;
      }
      setActiveView(e.state.view as string);
      setLeadsInitialStatus(e.state?.leadsStatus);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function handleNavigate(view: string, leadsStatus?: string) {
    window.history.pushState({ view, leadsStatus }, '');
    setActiveView(view);
    setLeadsInitialStatus(leadsStatus);
  }
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [weekLeads, setWeekLeads] = useState<number | null>(null);
  const [convertedLeads, setConvertedLeads] = useState<number | null>(null);
  const [totalCandidates, setTotalCandidates] = useState<number | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<{ id: number; name: string; position: string; status: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<{ id: number; description: string; created_at: string }[]>([]);
  const [chartData, setChartData] = useState<{ name: string; leads: number; cvs: number }[]>(buildChartData([], []));
  const [leadsView, setLeadsView] = useState<'total' | 'semana'>('total');

  useEffect(() => {
    if (!token || activeView !== 'Inicio') return;
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => []),
      fetch('/api/candidates').then(r => r.json()).catch(() => []),
    ]).then(([leadsData, candidatesData]) => {
      const leads = Array.isArray(leadsData) ? leadsData : [];
      const candidates = Array.isArray(candidatesData) ? candidatesData : [];
      setTotalLeads(leads.length);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      setWeekLeads(leads.filter((l: any) => l.created_at && new Date(l.created_at) >= cutoff).length);
      setConvertedLeads(leads.filter((l: any) => l.status === 'Convertido').length);
      setTotalCandidates(candidates.length);
      setRecentCandidates(candidates.slice(0, 5));
      setChartData(buildChartData(leads, candidates));
    });
    fetch('/api/activity-logs').then(r => r.json()).then(d => setActivityLogs(Array.isArray(d) ? d : [])).catch(() => setActivityLogs([]));
  }, [token, activeView]);

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
              onClick={() => handleNavigate(item)}
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

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <div
                onClick={() => { setLeadsInitialStatus(undefined); setActiveView('Leads'); }}
                className="bg-gradient-to-br from-blue-50/70 to-white border border-blue-100 rounded-2xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-600/10 rounded-xl"><Target className="w-4 h-4 text-blue-600" /></div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setLeadsView('total')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition ${leadsView === 'total' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >Total</button>
                    <button
                      onClick={() => setLeadsView('semana')}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition ${leadsView === 'semana' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >Semana</button>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-950 leading-none">
                  {leadsView === 'total' ? (totalLeads ?? '—') : (weekLeads ?? '—')}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">
                  {leadsView === 'total' ? 'Leads totales' : 'Leads esta semana'}
                </p>
                {leadsView === 'total' && weekLeads !== null && (
                  <p className="text-[11px] text-blue-500 mt-1 font-medium">+{weekLeads} esta semana</p>
                )}
              </div>

              <button
                onClick={() => handleNavigate('Leads', 'Convertido')}
                className="bg-gradient-to-br from-blue-50/70 to-white border border-blue-100 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-600/10 rounded-xl"><ArrowUpRight className="w-4 h-4 text-blue-600" /></div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-200 group-hover:text-blue-500 transition" />
                </div>
                <p className="text-3xl font-bold text-slate-950 leading-none">
                  {totalLeads != null && convertedLeads != null && totalLeads > 0
                    ? `${((convertedLeads / totalLeads) * 100).toFixed(1)}%`
                    : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">Tasa de conversión</p>
                {convertedLeads !== null && <p className="text-[11px] text-blue-500 mt-1 font-medium">{convertedLeads} convertidos · Ver</p>}
              </button>

              <button
                onClick={() => handleNavigate('Candidatos (CVs)')}
                className="bg-gradient-to-br from-blue-50/70 to-white border border-blue-100 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-600/10 rounded-xl"><User className="w-4 h-4 text-blue-600" /></div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-200 group-hover:text-blue-500 transition" />
                </div>
                <p className="text-3xl font-bold text-slate-950 leading-none">{totalCandidates ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-1.5">Candidatos (CVs)</p>
              </button>
            </div>

            {/* Chart + Activity */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/80 px-5 pt-5 pb-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-950">Actividad Semanal</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Leads nuevos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />CVs recibidos
                    </span>
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeOpacity: 0.2 }}
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #dbeafe', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', backgroundColor: 'white' }}
                      />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                      <Line type="monotone" dataKey="cvs" name="CVs" stroke="#cbd5e1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#94a3b8' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/80 p-5 rounded-2xl shadow-sm overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-950 mb-3">Actividad Reciente</h3>
                <div className="space-y-2.5">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin actividad aún.</p>
                  ) : activityLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                      <div className="flex-1 text-slate-500 leading-snug">{log.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidates table */}
            <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/80 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-950">Candidatos Recientes</h3>
                <button onClick={() => handleNavigate('Candidatos (CVs)')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">Ver todos <ArrowUpRight className="w-3 h-3" /></button>
              </div>
              {recentCandidates.length === 0 ? (
                <p className="text-sm text-slate-400">Sin candidatos aún.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400 text-xs uppercase border-b border-slate-100">
                    <tr><th className="pb-2">Candidato</th><th className="pb-2">Puesto</th><th className="pb-2 text-right">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentCandidates.map(c => {
                      const badge =
                        c.status === 'Nuevo'        ? 'bg-blue-50 text-blue-700' :
                        c.status === 'En Selección' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'Entrevistado' ? 'bg-slate-100 text-slate-700' :
                        c.status === 'Declinado'    ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-100 text-slate-600';
                      return (
                        <tr key={c.id}>
                          <td className="py-2.5 font-medium text-slate-950">{c.name}</td>
                          <td className="py-2.5 text-slate-500">{c.position}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>{c.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : activeView === 'Recursos' ? (
          <ResourceManager />
        ) : activeView === 'Blog' ? (
          <BlogManager />
        ) : activeView === 'Email & News' ? (
          <EmailMarketingManager />
        ) : activeView === 'Leads' ? (
          <LeadsManager initialStatus={leadsInitialStatus} />
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
