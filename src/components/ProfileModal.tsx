import { X, Globe, Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Save } from 'lucide-react';
import { useState } from 'react';
import { Portal } from './Portal';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState({
    companyName: 'TalentionHR',
    tagline: 'Soluciones de talento para empresas modernas',
    email: 'hola@talentionhr.es',
    phone: '+34 900 000 000',
    website: 'https://talentionhr.es',
    address: 'Calle Ejemplo 1, Madrid, España',
    sector: 'Recursos Humanos',
    size: '1-10',
    linkedin: '',
    twitter: '',
    instagram: '',
  });

  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-950">Perfil de Empresa</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la empresa</label>
              <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción / Tagline</label>
              <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.tagline} onChange={e => setProfile({...profile, tagline: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.sector} onChange={e => setProfile({...profile, sector: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tamaño</label>
                <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.size} onChange={e => setProfile({...profile, size: e.target.value})}>
                  <option value="1-10">1–10 empleados</option>
                  <option value="11-50">11–50 empleados</option>
                  <option value="51-200">51–200 empleados</option>
                  <option value="201-500">201–500 empleados</option>
                  <option value="500+">+500 empleados</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email de contacto</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Mail className="w-4 h-4"/></span>
                  <input type="email" className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Phone className="w-4 h-4"/></span>
                  <input type="text" className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sitio web</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Globe className="w-4 h-4"/></span>
                  <input type="text" className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dirección</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><MapPin className="w-4 h-4"/></span>
                  <input type="text" className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Redes sociales</p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Linkedin className="w-4 h-4"/></span>
                  <input type="text" placeholder="https://linkedin.com/company/..." className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Twitter / X</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Twitter className="w-4 h-4"/></span>
                  <input type="text" placeholder="https://twitter.com/..." className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.twitter} onChange={e => setProfile({...profile, twitter: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instagram</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-400"><Instagram className="w-4 h-4"/></span>
                  <input type="text" placeholder="https://instagram.com/..." className="flex-1 p-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={profile.instagram} onChange={e => setProfile({...profile, instagram: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
