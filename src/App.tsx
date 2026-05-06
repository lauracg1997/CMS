/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  LayoutDashboard,
  Folder,
  BookOpen,
  User,
  FileText,
  Users,
  HardDrive,
  Plus,
  MoreVertical,
  FileArchive,
  FileBadge,
  ChevronLeft,
  ChevronRight,
  Settings,
  Mail,
  Target,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CandidatesManager from './components/CandidatesManager';
import ResourceManager from './components/ResourceManager';
import FormsManager from './components/FormsManager';
import UsersManager from './components/UsersManager';
import BlogManager from './components/BlogManager';
import EmailMarketingManager from './components/EmailMarketingManager';
import LeadsManager from './components/LeadsManager';
import SettingsManager from './components/SettingsManager';

const data = [
  { name: 'Lun', leads: 400, cvs: 240 },
  { name: 'Mar', leads: 300, cvs: 139 },
  { name: 'Mié', leads: 200, cvs: 980 },
  { name: 'Jue', leads: 278, cvs: 390 },
  { name: 'Vie', leads: 189, cvs: 480 },
];

export default function App() {
  const [activeView, setActiveView] = useState('Inicio');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = ['Inicio', 'Recursos', 'Blog', 'Email & News', 'Leads', 'Candidatos (CVs)', 'Formularios', 'Usuarios', 'Configuración'];

  return (
    <div id="app-container" className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        id="sidebar" 
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-52'}`}
      >
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-lg font-bold tracking-tight text-slate-950">TalentionHR<span className="text-blue-600">.</span></h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav id="main-nav" className="flex-1 px-3 space-y-1">
          {navItems.map((item, idx) => (
            <button
              key={item}
              onClick={() => setActiveView(item)}
              id={`nav-link-${idx}`}
              className={`w-full flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                activeView === item ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              {idx === 0 && <LayoutDashboard className="w-4 h-4 mr-3" />}
              {idx === 1 && <Folder className="w-4 h-4 mr-3" />}
              {idx === 2 && <BookOpen className="w-4 h-4 mr-3" />}
              {idx === 3 && <Mail className="w-4 h-4 mr-3" />}
              {idx === 4 && <Target className="w-4 h-4 mr-3" />}
              {idx === 5 && <User className="w-4 h-4 mr-3" />}
              {idx === 6 && <FileText className="w-4 h-4 mr-3" />}
              {idx === 7 && <Users className="w-4 h-4 mr-3" />}
              {idx === 8 && <Settings className="w-4 h-4 mr-3" />}
              {!isCollapsed && item}
            </button>
          ))}
        </nav>

        <div className="relative p-3 border-t border-slate-100">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)} 
            className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg group"
          >
            <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center mr-3 font-medium text-xs text-slate-500">U</div>
            {!isCollapsed && <span className="font-medium text-slate-950">Usuario</span>}
          </button>
          {showProfileMenu && (
            <div className={`absolute ${isCollapsed ? 'bottom-16 left-3' : 'bottom-16 left-3 w-44'} bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50`}>
                <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Perfil</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
            </div>
          )}
        </div>
      </aside>

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
                <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Bienvenido de nuevo, equipo</h2>
                <p className="text-sm text-slate-500 mt-1">Resumen ejecutivo y flujo de trabajo actual.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Exportar Reporte</button>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Acción
                </button>
              </div>
            </header>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-4 gap-6 flex-1">
              
              {/* Stat Cards */}
              <div className="col-span-1 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Totales</p>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-950 mt-2">1,248</p>
              </div>
              <div className="col-span-1 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa Conversión</p>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-950 mt-2">18.2%</p>
              </div>
              <div className="col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-slate-950 mb-6">Actividad Semanal</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
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
              <div className="col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-semibold text-slate-950 mb-4">Candidatos Recientes</h3>
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500 text-xs uppercase">
                    <tr><th className="pb-3">Candidato</th><th className="pb-3">Puesto</th><th className="pb-3 text-right">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[['Marcos Torres', 'Frontend', 'Entrevista'], ['Elena Rubio', 'Product', 'Selección']].map((row, i) => (
                      <tr key={i}>
                        <td className="py-3 font-medium text-slate-950">{row[0]}</td>
                        <td className="py-3 text-slate-600">{row[1]}</td>
                        <td className="py-3 text-right text-blue-600 font-medium">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Activity Feed */}
              <div className="col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-semibold text-slate-950 mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                  {[
                      {icon: Clock, text: 'Newsletter "Tips RRHH" enviada hace 2h', time: '10:30'},
                      {icon: Clock, text: 'Nuevo lead registrado: Carlos D.', time: '09:15'}
                  ].map((act, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                          <div className="mt-0.5 p-1.5 bg-slate-100 text-slate-500 rounded-lg"><act.icon className="w-3 h-3"/></div>
                          <div className="flex-1 text-slate-700">{act.text}</div>
                          <div className="text-xs text-slate-400">{act.time}</div>
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
