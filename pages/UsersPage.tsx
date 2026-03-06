
import React, { useState } from 'react';
import { Search, UserPlus, MoreVertical, Shield, User as UserIcon, Mail, CheckCircle2, XCircle, X, Plus, Check } from 'lucide-react';
import { mockUsers } from '../lib/mock-data';
import { User } from '../types';

const MODULES = ['Dashboard','Billing','Expenses','Products','CRM','Reports','Settings','Users'];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Admin:     { Dashboard:true, Billing:true, Expenses:true, Products:true, CRM:true, Reports:true, Settings:true, Users:true },
  Sales:     { Dashboard:true, Billing:true, Expenses:false, Products:true, CRM:true, Reports:false, Settings:false, Users:false },
  Accountant:{ Dashboard:true, Billing:true, Expenses:true, Products:false, CRM:false, Reports:true, Settings:false, Users:false },
};

const ROLE_DESCS: Record<string,string> = {
  Admin: 'Full access to all settings and content management.',
  Sales: 'Manage billing, products and client relationships.',
  Accountant: 'Access to billing, expenses and financial reports.',
};

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list'|'roles'>('list');
  const [activeMenu, setActiveMenu] = useState<string|null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [roles, setRoles] = useState(Object.keys(DEFAULT_PERMISSIONS));
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newUser, setNewUser] = useState({ name:'', email:'', role:'Sales' as string, status:'Active' as 'Active'|'Inactive' });
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    const u: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      status: newUser.status,
      avatar: `https://picsum.photos/seed/${newUser.name.replace(' ','')}/100/100`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, u]);
    setNewUser({ name:'', email:'', role:'Sales', status:'Active' });
    setShowAddUser(false);
  };

  const addRole = () => {
    const r = newRole.trim();
    if (!r || roles.includes(r)) return;
    setRoles(prev => [...prev, r]);
    setPermissions(prev => ({ ...prev, [r]: Object.fromEntries(MODULES.map(m => [m, false])) }));
    setNewRole('');
    setShowAddRole(false);
  };

  const togglePerm = (role: string, mod: string) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [mod]: !prev[role]?.[mod] }
    }));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
    setActiveMenu(null);
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setActiveMenu(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage team members and their access levels</p>
        </div>
        <button onClick={() => setShowAddUser(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['list','roles'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab===tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {tab === 'list' ? 'User List' : 'Roles & Permissions'}
          </button>
        ))}
      </div>

      {/* USER LIST TAB */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm font-medium" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-sm" alt={user.name} />
                        <div>
                          <span className="font-bold text-slate-900 block">{user.name}</span>
                          <span className="text-[11px] text-slate-400 font-bold">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-blue-500" />
                        <span className="font-bold text-slate-700">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold">{user.joinedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.status==='Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.status==='Active' ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button title="User actions" onClick={() => setActiveMenu(activeMenu===user.id ? null : user.id)}
                        className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                        <MoreVertical size={18}/>
                      </button>
                      {activeMenu===user.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)}/>
                          <div className="absolute right-6 top-14 w-52 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-30 py-2 text-left animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => toggleUserStatus(user.id)} className="w-full px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                              {user.status==='Active' ? <XCircle size={14} className="text-slate-400"/> : <CheckCircle2 size={14} className="text-slate-400"/>}
                              {user.status==='Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="my-1.5 border-t border-slate-100 mx-2"/>
                            <button onClick={() => removeUser(user.id)} className="w-full px-4 py-2 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                              Remove User
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLES & PERMISSIONS TAB */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map(r => (
              <div key={r} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Shield size={20}/>
                  </div>
                  <h3 className="font-black text-base text-slate-900">{r}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{ROLE_DESCS[r] || 'Custom role with configurable permissions.'}</p>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {users.filter(u => u.role === r).length} MEMBER{users.filter(u=>u.role===r).length!==1?'S':''}
                  </span>
                </div>
              </div>
            ))}
            <button onClick={() => setShowAddRole(true)}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
              <Plus size={28}/>
              <span className="text-xs font-black uppercase tracking-widest">Add Role</span>
            </button>
          </div>

          {/* Permission Matrix */}
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">Permission Matrix</h3>
              <p className="text-[10px] text-slate-400 font-bold italic">Check to grant access per module</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Module</th>
                    {roles.map(r => (
                      <th key={r} className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-700">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MODULES.map(mod => (
                    <tr key={mod} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-700 text-sm">{mod}</td>
                      {roles.map(r => (
                        <td key={r} className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePerm(r, mod)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                              permissions[r]?.[mod]
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 bg-white hover:border-blue-400'
                            }`}
                          >
                            {permissions[r]?.[mod] && <Check size={12}/>}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">Add New User</h2>
              <button title="Close" onClick={() => setShowAddUser(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser(p=>({...p,email:e.target.value}))}
                  placeholder="e.g. john@ramzon.nv"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select title="Select role" value={newUser.role} onChange={e => setNewUser(p=>({...p,role:e.target.value}))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Status</label>
                <div className="flex gap-3">
                  {(['Active','Inactive'] as const).map(s => (
                    <button key={s} onClick={() => setNewUser(p=>({...p,status:s}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${newUser.status===s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddUser(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={addUser} disabled={!newUser.name||!newUser.email}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROLE MODAL */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">Add New Role</h2>
              <button title="Close" onClick={() => setShowAddRole(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                <X size={20}/>
              </button>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Role Name</label>
              <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} onKeyDown={e => e.key==='Enter' && addRole()}
                placeholder="e.g. Manager"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">You can configure permissions in the matrix after adding the role.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddRole(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={addRole} disabled={!newRole.trim()}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
