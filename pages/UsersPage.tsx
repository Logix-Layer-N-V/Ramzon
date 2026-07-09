
import React, { useState } from 'react';
import { Search, UserPlus, MoreVertical, Shield, CheckCircle2, XCircle, X, Check, Pencil, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetPassword, UserRow } from '../lib/hooks/useUsers';

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

const ROLES = ['Admin', 'Sales', 'Accountant'];

const emptyForm = { name: '', email: '', role: 'Sales', status: 'Active' as 'Active' | 'Inactive', password: '' };

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list'|'roles'>('list');
  const [activeMenu, setActiveMenu] = useState<string|null>(null);
  const [menuUser, setMenuUser] = useState<UserRow | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [permissions] = useState(DEFAULT_PERMISSIONS);
  const [roles] = useState(ROLES);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setSaveError(null); setShowAddUser(true); };
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status, password: '' });
    setSaveError(null);
    setActiveMenu(null);
  };
  const closeModal = () => { setShowAddUser(false); setEditUser(null); setSaveError(null); };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaveError(null);
    try {
      if (editUser) {
        await updateUser.mutateAsync({ id: editUser.id, name: form.name, email: form.email, role: form.role as UserRow['role'], status: form.status });
      } else {
        await createUser.mutateAsync({ name: form.name, email: form.email, role: form.role as UserRow['role'], status: form.status, password: form.password || 'ramzon123' });
      }
      closeModal();
    } catch (err: any) {
      setSaveError(err?.response?.data?.error ?? 'Something went wrong. Please try again.');
    }
  };

  const handleToggleStatus = async (u: UserRow) => {
    await updateUser.mutateAsync({ id: u.id, status: u.status === 'Active' ? 'Inactive' : 'Active' });
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this user?')) return;
    await deleteUser.mutateAsync(id);
    setActiveMenu(null);
  };

  const openReset = (u: UserRow) => {
    setResetTarget(u);
    setResetPwd('');
    setResetConfirm('');
    setResetError(null);
    setResetSuccess(false);
    setShowResetPwd(false);
    setShowResetConfirm(false);
    setActiveMenu(null);
  };
  const closeReset = () => { setResetTarget(null); setResetError(null); setResetSuccess(false); };

  const handleReset = async () => {
    setResetError(null);
    if (resetPwd.length < 8) { setResetError('Password must be at least 8 characters'); return; }
    if (resetPwd !== resetConfirm) { setResetError('Passwords do not match'); return; }
    try {
      await resetPassword.mutateAsync({ id: resetTarget!.id, newPassword: resetPwd });
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err?.response?.data?.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage team members and their access levels</p>
        </div>
        <button onClick={openAdd} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95">
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
            {isLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"/></div>
            ) : (
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
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {u.avatar
                            ? <img src={u.avatar} className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-sm" alt={u.name} />
                            : <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">{u.name.charAt(0)}</div>
                          }
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-400 font-bold">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-blue-500" />
                          <span className="font-bold text-slate-700">{u.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-bold">{u.joinedDate ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.status==='Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.status==='Active' ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          title="User actions"
                          onClick={e => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const dropW = 208;
                            const menuH = 130;
                            const top = rect.bottom + 4 + menuH > window.innerHeight
                              ? rect.top - menuH - 4
                              : rect.bottom + 4;
                            const left = Math.max(8, Math.min(rect.right - dropW, window.innerWidth - dropW - 8));
                            setMenuPos({ top, left });
                            setMenuUser(u);
                            setActiveMenu(activeMenu === u.id ? null : u.id);
                          }}
                          className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                          <MoreVertical size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ROLES & PERMISSIONS TAB */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map(r => (
              <div key={r} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all">
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
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">Permission Matrix</h3>
              <p className="text-[10px] text-slate-400 font-bold italic">Read-only — reflects the fixed access rules enforced by the system</p>
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
                          <span
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto ${permissions[r]?.[mod] ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-300 bg-white'}`}>
                            {permissions[r]?.[mod] && <Check size={12}/>}
                          </span>
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

      {/* ADD / EDIT USER MODAL */}
      {(showAddUser || editUser) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button type="button" title="Close" onClick={closeModal} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))}
                  placeholder="e.g. john@ramzon.nv"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select title="Select role" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Status</label>
                <div className="flex gap-3">
                  {(['Active','Inactive'] as const).map(s => (
                    <button type="button" key={s} onClick={() => setForm(p=>({...p,status:s}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${form.status===s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {!editUser && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Password <span className="normal-case font-medium text-slate-400">(default: ramzon123)</span></label>
                  <input type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))}
                    placeholder="Leave blank for default"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              )}
            </div>
            {saveError && (
              <p className="text-red-500 text-xs font-bold text-center py-2 bg-red-50 rounded-xl px-3 mt-4">{saveError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button type="button" onClick={handleSave} disabled={!form.name||!form.email||createUser.isPending||updateUser.isPending}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                {(createUser.isPending || updateUser.isPending) ? 'Saving…' : editUser ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-slate-900">Reset Password</h2>
              <button type="button" title="Close" onClick={closeReset} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                <X size={20}/>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Set a new password for <span className="font-bold text-slate-700">{resetTarget.name}</span>
            </p>
            {resetSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} className="text-green-600"/>
                </div>
                <p className="font-black text-slate-900">Password Reset!</p>
                <p className="text-sm text-slate-500">The new password has been saved successfully.</p>
                <button type="button" onClick={closeReset} className="mt-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all active:scale-95">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showResetPwd ? 'text' : 'password'}
                        value={resetPwd}
                        onChange={e => setResetPwd(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button type="button" onClick={() => setShowResetPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showResetPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showResetConfirm ? 'text' : 'password'}
                        value={resetConfirm}
                        onChange={e => setResetConfirm(e.target.value)}
                        placeholder="Repeat new password"
                        onKeyDown={e => e.key === 'Enter' && handleReset()}
                        className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button type="button" onClick={() => setShowResetConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showResetConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {resetPwd && resetConfirm && resetPwd !== resetConfirm && (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5">Passwords do not match</p>
                    )}
                  </div>
                </div>
                {resetError && (
                  <p className="text-red-500 text-xs font-bold text-center py-2 bg-red-50 rounded-xl px-3 mt-4">{resetError}</p>
                )}
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeReset} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="button" onClick={handleReset}
                    disabled={!resetPwd || !resetConfirm || resetPassword.isPending}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2">
                    <KeyRound size={14}/>
                    {resetPassword.isPending ? 'Saving…' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Actions dropdown — rendered at root level to escape overflow clipping ── */}
      {activeMenu && menuUser && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setActiveMenu(null)} />
          <div
            className="fixed w-52 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-[999] py-2 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button type="button" onClick={() => openEdit(menuUser)} className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors">
              <Pencil size={14} className="text-blue-400" /> Edit User
            </button>
            <button type="button" onClick={() => openReset(menuUser)} className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors">
              <KeyRound size={14} className="text-amber-400" /> Reset Password
            </button>
            <button type="button" onClick={() => handleToggleStatus(menuUser)} className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors">
              {menuUser.status === 'Active' ? <XCircle size={14} className="text-slate-400" /> : <CheckCircle2 size={14} className="text-slate-400" />}
              {menuUser.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <div className="my-1.5 border-t border-slate-100 mx-2" />
            <button type="button" onClick={() => handleDelete(menuUser.id)} className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
              Remove User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
