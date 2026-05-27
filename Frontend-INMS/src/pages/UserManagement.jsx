import { useEffect, useMemo, useState } from 'react'
import UserService from '../services/UserService'

const initialUsers = [
  { id: 1, fullName: 'Jane Doe', serviceId: '123456', role: 'Network Engineer', region: 'Western', province: 'Colombo', lea: 'City' },
  { id: 2, fullName: 'Mike Thompson', serviceId: '123457', role: 'Support', region: 'Central', province: 'Kandy', lea: 'Town' },
  { id: 3, fullName: 'Sarah Nguyen', serviceId: '123458', role: 'Admin', region: 'Southern', province: 'Galle', lea: 'Coast' },
  { id: 4, fullName: 'Raj Patel', serviceId: '123459', role: 'Developer', region: 'Western', province: 'Gampaha', lea: 'North' },
  { id: 5, fullName: 'Lisa Chen', serviceId: '123460', role: 'Analyst', region: 'Eastern', province: 'Trincomalee', lea: 'Port' },
  { id: 6, fullName: 'John Pending', serviceId: '123461', role: 'Developer', status: 'Pending', region: 'Western', province: 'Gampaha', lea: 'South' },
  { id: 7, fullName: 'Bob Johnson', serviceId: '123462', role: 'Network Engineer', status: 'Pending', region: 'Central', province: 'Matale', lea: 'East' },
  { id: 8, fullName: 'Karen Lee', serviceId: '123463', role: 'Support', status: 'Pending', region: 'Eastern', province: 'Ampara', lea: 'West' },
  { id: 9, fullName: 'David Williams', serviceId: '123464', role: 'Analyst', status: 'Pending', region: 'Southern', province: 'Matara', lea: 'North' },
]

const emptyForm = { firstName: '', lastName: '', serviceId: '', role: '', regionId: '', provinceId: '', leaId: '' }

const rolesOptions = [
  { id: "Admin", label: "Admin", description: "System Administrator" },
  { id: "Region Officer", label: "Region Officer", description: "Regional Network Management" },
  { id: "Province Officer", label: "Province Officer", description: "Provincial Network Management" },
  { id: "LEA Officer", label: "LEA Officer", description: "Law Enforcement Agency" },
]

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
const selectCls = inputCls + ' appearance-none'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [message, setMessage] = useState('')
  const [viewMode, setViewMode] = useState('users')
  const [statusFilter, setStatusFilter] = useState('Pending')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await UserService.getAll()
      setUsers(data)
    } catch (error) {
      setMessage('Failed to load users')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => users.filter(u => {
    if (viewMode === 'pending' && u.status !== statusFilter) return false
    if (viewMode === 'users' && (u.status === 'Pending' || u.status === 'Rejected')) return false
    const s = searchTerm.toLowerCase()
    const fullName = (u.fullName || '').toLowerCase()
    return (fullName.includes(s) || u.serviceId?.includes(s))
      && (roleFilter === 'All' || u.roleName === roleFilter)
  }), [users, searchTerm, roleFilter, viewMode, statusFilter])

  const stats = useMemo(() => ({
    current: users.filter(u => u.status !== 'Pending' && u.status !== 'Rejected').length,
    pending: users.filter(u => u.status === 'Pending').length,
  }), [users])

  const showRegion = ['Region Officer', 'Province Officer', 'LEA Officer'].includes(form.role);
  const showProvince = ['Province Officer', 'LEA Officer'].includes(form.role);
  const showLEA = form.role === 'LEA Officer';

  const isValid = useMemo(() => {
    return !!(
      form.firstName?.trim() &&
      form.lastName?.trim() &&
      form.serviceId?.trim().length === 6 &&
      form.role?.trim() &&
      (!showRegion || form.regionId?.trim()) &&
      (!showProvince || form.provinceId?.trim()) &&
      (!showLEA || form.leaId?.trim())
    );
  }, [form, showRegion, showProvince, showLEA]);

  const handleInputChange = (field, value) => { setForm(p => ({ ...p, [field]: value })); setMessage('') }

  const openModal = (mode, user = null) => {
    setModalMode(mode)
    if (mode === 'edit' && user) {
      // When editing, combine fullName back into firstName and lastName for display
      const [firstName, ...lastNameParts] = (user.fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      setForm({
        firstName: firstName || '',
        lastName: lastName || '',
        serviceId: user.serviceId,
        role: user.roleName || user.role,
        regionId: user.regionId || '',
        provinceId: user.provinceId || '',
        leaId: user.leaId || ''
      });
      setEditingUser(user)
    }
    else { setForm(emptyForm); setEditingUser(null) }
    setShowModal(true); setMessage('')
  }

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditingUser(null) }

  const handleSubmit = async () => {
    if (!isValid) { setMessage('Please complete all fields (Service ID must be 6 digits).'); return }
    try {
      // Map role name to roleId
      const roleMap = {
        'Admin': 1,
        'Region Officer': 2,
        'Province Officer': 3,
        'LEA Officer': 4
      };

      // Prepare payload for backend
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: roleMap[form.role] || 1,
        serviceId: form.serviceId,
        regionId: form.regionId ? parseInt(form.regionId) : null,
        provinceId: form.provinceId ? parseInt(form.provinceId) : null,
        leaId: form.leaId ? parseInt(form.leaId) : null
      };

      if (modalMode === 'add') {
        await UserService.create(payload)
        setMessage('User created successfully!')
        await loadUsers()
      } else {
        await UserService.update(editingUser.userId, payload)
        setMessage('User updated successfully!')
        await loadUsers()
      }
      closeModal(); setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save user')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    try {
      await UserService.delete(id)
      setUsers(prev => prev.filter(u => u.userId !== id))
      setMessage('User deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to delete user')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleApprove = async (id) => {
    try {
      await UserService.update(id, { status: 'Active' })
      setMessage('Request approved!')
      await loadUsers()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to approve request')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleReject = async (id) => {
    try {
      await UserService.update(id, { status: 'Rejected' })
      setMessage('Request rejected!')
      await loadUsers()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to reject request')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const statCards = [
    { label: 'Current Users', value: stats.current, icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
    { label: 'Pending Users', value: stats.pending, icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User Management Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setViewMode(v => v === 'users' ? 'pending' : 'users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition ${viewMode === 'pending' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {viewMode === 'pending' ? 'View Current Users' : 'Pending Requests'}
          </button>
          <button onClick={() => openModal('add')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-md transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add New User
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        {statCards.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:-translate-y-0.5 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{icon}</svg>
              </div>
              <span className="text-sm text-slate-500 font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
        </div>
        <div className="flex gap-3">
          {viewMode === 'pending' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls + ' min-w-36'}>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          )}
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls + ' min-w-36'}>
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Region Officer">Region Officer</option>
            <option value="Province Officer">Province Officer</option>
            <option value="LEA Officer">LEA Officer</option>
            <option value="Network Engineer">Network Engineer</option>
            <option value="Developer">Developer</option>
            <option value="Support">Support</option>
            <option value="Analyst">Analyst</option>
          </select>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.includes('deleted') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {message}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {(viewMode === 'pending'
                  ? ['User', 'Role', 'Status', 'Region', 'Province', 'LEA', 'Actions']
                  : ['User', 'Role', 'Region', 'Province', 'LEA', 'Actions']
                ).map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={viewMode === 'pending' ? 7 : 6} className="text-center py-16 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                  {searchTerm || roleFilter !== 'All' ? 'No users match your filters.' : 'No users found.'}
                </td></tr>
              ) : filteredUsers.map((user, index) => (
                <tr key={user.userId || `user-${index}`} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                        {(user.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                        <div className="text-xs text-slate-500">{user.serviceId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 w-36 text-center">{user.roleName || user.role}</span>
                  </td>
                  {viewMode === 'pending' && (
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium w-20 text-center ${user.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {user.status}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-slate-500">{user.region || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.province || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.lea || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {viewMode === 'pending' ? (
                        <>
                          <button onClick={() => handleApprove(user.userId)} title="Approve"
                            className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                          {user.status !== 'Rejected' && (
                            <button onClick={() => handleReject(user.userId)} title="Reject"
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}
                          {user.status === 'Rejected' && (
                            <button onClick={() => handleDelete(user.userId)} title="Delete permanently"
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleDelete(user.userId)} title="Delete"
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{modalMode === 'add' ? (form.role ? `Add ${form.role}` : 'Select Your Role') : 'Edit User'}</h2>
              <button onClick={closeModal} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {modalMode === 'add' && !form.role ? (
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="space-y-3">
                  {rolesOptions.map((roleOption) => (
                    <button
                      key={roleOption.id}
                      onClick={() => handleInputChange('role', roleOption.id)}
                      className="w-full p-4 text-left rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                          {roleOption.label.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 group-hover:text-sky-700">
                            {roleOption.label}
                          </p>
                          <p className="text-sm text-slate-500">
                            {roleOption.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={closeModal}
                    className="w-full py-3 px-4 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 flex flex-col gap-4">
                  {message && <p className="text-sm text-red-600">{message}</p>}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">First Name *</label>
                      <input type="text" value={form.firstName} onChange={e => handleInputChange('firstName', e.target.value)} placeholder="Enter first name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Last Name *</label>
                      <input type="text" value={form.lastName} onChange={e => handleInputChange('lastName', e.target.value)} placeholder="Enter last name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Service ID *</label>
                      <input type="text" maxLength={6} value={form.serviceId} onChange={e => handleInputChange('serviceId', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 123456" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Role *</label>
                    <select value={form.role} onChange={e => handleInputChange('role', e.target.value)} className={selectCls} disabled={modalMode === 'add'}>
                      <option value="">Select role</option>
                      <option value="Admin">Admin</option>
                      <option value="Region Officer">Region Officer</option>
                      <option value="Province Officer">Province Officer</option>
                      <option value="LEA Officer">LEA Officer</option>
                      <option value="Network Engineer">Network Engineer</option>
                      <option value="Developer">Developer</option>
                      <option value="Support">Support</option>
                      <option value="Analyst">Analyst</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {showRegion && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Region *</label>
                        <input type="text" value={form.regionId} onChange={e => handleInputChange('regionId', e.target.value)} placeholder="Region ID" className={inputCls} />
                      </div>
                    )}
                    {showProvince && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Province *</label>
                        <input type="text" value={form.provinceId} onChange={e => handleInputChange('provinceId', e.target.value)} placeholder="Province ID" className={inputCls} />
                      </div>
                    )}
                    {showLEA && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">LEA *</label>
                        <input type="text" value={form.leaId} onChange={e => handleInputChange('leaId', e.target.value)} placeholder="LEA ID" className={inputCls} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                  {modalMode === 'add' && (
                    <button onClick={() => handleInputChange('role', '')} className="mr-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                      Back
                    </button>
                  )}
                  <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                  <button onClick={handleSubmit} disabled={!isValid}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {modalMode === 'add' ? 'Create User' : 'Update User'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
