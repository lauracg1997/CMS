import { Search, Edit2, Trash2, UserPlus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = '/api/users';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'Administrador' | 'Editor';
};

const emptyForm = { name: '', email: '', password: '', role: 'Editor' as 'Administrador' | 'Editor' };
const emptyErrors = { name: '', email: '', password: '' };

export default function UsersManager() {
  const [activeTab, setActiveTab] = useState<'Usuarios' | 'Roles'>('Usuarios');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [saving, setSaving] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  function validate() {
    const e = { name: '', email: '', password: '' };
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.email.trim()) {
      e.email = 'El email es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Introduce un email válido.';
    }
    if (!editingUser && form.password.length < 6) {
      e.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    setErrors(e);
    return !e.name && !e.email && !e.password;
  }

  function openAdd() {
    setEditingUser(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
    setIsAddModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setErrors(emptyErrors);
    setIsAddModalOpen(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      let res;
      if (editingUser) {
        res = await fetch(`${API_URL}/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
        });
      } else {
        res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        setErrors({
          name: err.errors?.name?.[0] || '',
          email: err.errors?.email?.[0] ? 'Este email ya está registrado.' : '',
          password: err.errors?.password?.[0] || '',
        });
        return;
      }

      setIsAddModalOpen(false);
      setForm(emptyForm);
      setErrors(emptyErrors);
      fetchUsers();
    } catch (e) {
      console.error('Error de conexión', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres borrar este usuario?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  const roles = [
    { id: 1, name: 'Administrador', description: 'Acceso total al CMS.' },
    { id: 2, name: 'Editor', description: 'Puede editar y crear recursos, formularios y candidatos.' },
  ];

  return (
    <section id="users-manager" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <header className="px-6 pt-6 border-b border-slate-100 flex justify-between items-end bg-slate-50/50">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Gestión de Usuarios</h2>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('Usuarios')}
              className={`pb-3 text-sm font-semibold border-b-2 ${activeTab === 'Usuarios' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('Roles')}
              className={`pb-3 text-sm font-semibold border-b-2 ${activeTab === 'Roles' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              Roles
            </button>
          </div>
        </div>
        {activeTab === 'Usuarios' && (
          <button
            onClick={openAdd}
            className="flex items-center px-4 py-2 mb-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Añadir usuario
          </button>
        )}
      </header>

      {activeTab === 'Usuarios' ? (
        <>
          <div className="p-6 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-sm text-slate-400">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-slate-400">No hay usuarios. Crea el primero.</div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-950 font-semibold">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${u.role === 'Administrador' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600 transition-colors mr-3">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 text-xs uppercase border-b border-slate-100 sticky top-0 bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-950 font-semibold">{r.name}</td>
                  <td className="px-6 py-4 text-slate-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-slate-950 mb-4">
              {editingUser ? 'Editar usuario' : 'Añadir nuevo usuario'}
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <input
                  type="text"
                  placeholder="Nombre"
                  className={`w-full p-2 border rounded-lg text-sm ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className={`w-full p-2 border rounded-lg text-sm ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              {!editingUser && (
                <div>
                  <input
                    type="password"
                    placeholder="Contraseña (mín. 6 caracteres)"
                    className={`w-full p-2 border rounded-lg text-sm ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
              )}
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as 'Administrador' | 'Editor' })}
              >
                <option>Administrador</option>
                <option>Editor</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
