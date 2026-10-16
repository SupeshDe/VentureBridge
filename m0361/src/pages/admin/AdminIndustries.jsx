import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminIndustries() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const res = await api.getIndustriesAdmin()
      setItems(res.data || [])
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function save(e) {
    e?.preventDefault()
    if (!name.trim()) return alert('Industry name is required')
    setSaving(true)
    try {
      if (editing) {
        await api.updateIndustryAdmin(editing._id, { name: name.trim(), description: description.trim() })
      } else {
        await api.createIndustryAdmin({ name: name.trim(), description: description.trim() })
      }
      setName(''); setDescription(''); setEditing(null)
      await fetchAll()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(item) {
    setEditing(item)
    setName(item.name)
    setDescription(item.description || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleActive(item) {
    try {
      await api.updateIndustryAdmin(item._id, { isActive: !item.isActive })
      await fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete industry "${item.name}"? Only possible when no startup uses it.`)) return
    try {
      await api.deleteIndustryAdmin(item._id)
      await fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div className="page-wrap"><div className="py-16 text-center">Loading…</div></div>

  return (
    <div className="page-wrap">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0057ff]">Industries</h1>
        <p className="text-sm text-[#0057ff]">Categories founders pick and investors filter by. Deactivating hides an industry from new profiles.</p>
      </div>

      <Card className="mb-4">
        <form onSubmit={save}>
          <h2 className="text-base font-bold text-[#0057ff] mb-3">{editing ? `Edit: ${editing.name}` : 'Add industry'}</h2>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SpaceTech" maxLength={60} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm" />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" maxLength={500} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add industry'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setName(''); setDescription('') }}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card padding={false}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f7f4] text-xs text-[#0057ff]"><tr><th className="text-left px-4 py-3">Industry</th><th className="text-left px-4 py-3">Startups</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#0057ff]">
              {items.map(i => (
                <tr key={i._id} className="hover:bg-[#f8f7f4]">
                  <td className="px-4 py-3"><p className="font-medium text-[#0057ff]">{i.name}</p><p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{i.description || '—'}</p></td>
                  <td className="px-4 py-3 text-[#0057ff] font-semibold">{i.startupCount ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={i.isActive ? 'success' : 'warning'}>{i.isActive ? 'Active' : 'Hidden'}</Badge></td>
                  <td className="px-4 py-3 text-right" style={{ whiteSpace: 'nowrap' }}>
                    <Button size="sm" variant="secondary" onClick={() => startEdit(i)}>Edit</Button>{' '}
                    <Button size="sm" variant="secondary" onClick={() => toggleActive(i)}>{i.isActive ? 'Hide' : 'Show'}</Button>{' '}
                    <Button size="sm" variant="danger" onClick={() => remove(i)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-[#0057ff]">No industries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
