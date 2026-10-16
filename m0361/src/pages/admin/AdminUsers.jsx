import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Eye, Search } from 'lucide-react'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchUsers()
  }, [])
  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await api.getUsers()
      setUsers(res.data || [])
    } finally {
      setLoading(false)
    }
  }
  async function toggleStatus(u) {
    try {
      await api.updateUserStatus(u._id, { isActive: !u.isActive })
      fetchUsers()
    } catch (e) {
      alert(e.message)
    }
  }
  async function toggleVerify(u) {
    try {
      await api.updateUserStatus(u._id, { isVerified: !u.isVerified })
      fetchUsers()
    } catch (e) {
      alert(e.message)
    }
  }
  async function removeUser(u) {
    if (u.role === 'admin') return
    const ok = window.confirm(
      `Permanently delete ${u.name} (${u.email}) and all of their startups, requests, connections and messages? This cannot be undone.`
    )
    if (!ok) return
    try {
      await api.deleteUser(u._id)
      fetchUsers()
    } catch (e) {
      alert(e.message)
    }
  }
  const pendingCount = users.filter(u => !u.isVerified && u.role !== 'admin').length
  const filtered = users.filter(
    u =>
      !query ||
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  )
  if (loading)
    return (
      <div className="page-wrap">
        <div className="py-16 text-center">Loading…</div>
      </div>
    )

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-[#0057ff]">Users</h1>
        {pendingCount > 0 && <Badge variant="warning">{pendingCount} awaiting verification</Badge>}
      </div>
      <Card className="mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-[#0057ff] px-3 py-2.5">
          <Search size={16} className="text-[#0057ff]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 outline-none text-sm"
          />
        </div>
      </Card>
      <Card padding={false} className="admin-users-table-card">
        <div className="overflow-auto">
          <table className="admin-users-table w-full text-sm">
            <colgroup>
              <col className="admin-users-col-user" />
              <col className="admin-users-col-role" />
              <col className="admin-users-col-verification" />
              <col className="admin-users-col-status" />
              <col className="admin-users-col-actions" />
            </colgroup>
            <thead className="bg-[#f8f7f4] text-xs text-[#0057ff]">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Verification</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0057ff]">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-[#f8f7f4]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0057ff]">{u.name}</p>
                    <p className="text-xs text-[#0057ff]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className="admin-user-state-badge"
                      variant={u.isVerified ? 'success' : 'warning'}
                      style={{ padding: '7px 14px', minHeight: 28, boxSizing: 'border-box' }}
                    >
                      {u.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className="admin-user-state-badge"
                      variant={u.isActive ? 'success' : 'danger'}
                      style={{ padding: '7px 14px', minHeight: 28, boxSizing: 'border-box' }}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right" style={{ whiteSpace: 'nowrap' }}>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/profiles/user/${u._id}`)}>
                      <Eye size={14} />
                      View profile
                    </Button>{' '}
                    {u.role !== 'admin' && (
                      <Button size="sm" onClick={() => toggleVerify(u)}>
                        {u.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
                    )}{' '}
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>{' '}
                    {u.role !== 'admin' && (
                      <Button size="sm" variant="danger" onClick={() => removeUser(u)}>
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[#0057ff]">
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
