'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type KBFile = {
  id: string
  filename: string
  name: string
  category: 'Policy' | 'Procedure' | 'FAQ' | 'Manual' | 'Other'
  description: string
  uploader: string
  uploadDate: string
  deletedAt?: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function CategoryPage() {
  const params = useParams()
  const categoryParam = String(params?.category || '').toLowerCase()
  const categoryTitle = useMemo(() => {
    const map: Record<string, KBFile['category']> = {
      policy: 'Policy',
      procedure: 'Procedure',
      faq: 'FAQ',
      manual: 'Manual',
      other: 'Other',
    }
    return map[categoryParam] || 'Other'
  }, [categoryParam])

  const [query, setQuery] = useState('')
  const [items, setItems] = useState<KBFile[]>([])
  const [editTarget, setEditTarget] = useState<KBFile | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch(`${API_URL}/api/kb/files?category=${categoryTitle}`)
        const data = await res.json()
        if (data.success) setItems(data.files)
      } catch {
        console.error('Failed to fetch files')
      }
    }
    fetchCategory()
  }, [categoryTitle])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const s = query.trim().toLowerCase()
    return items.filter(f => f.name.toLowerCase().includes(s) || (f.description || '').toLowerCase().includes(s))
  }, [items, query])

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-sky-600">{categoryTitle} Folder</h1>
        <Link href="/" className="text-sm text-sky-600">Back</Link>
      </div>
      <div className="mb-3">
        <input
          aria-label="Search"
          className="w-full border rounded p-2"
          placeholder="Search by name or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-md shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Description</th>
              <th className="p-2">Upload Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.name}</td>
                <td className="p-2">{f.description}</td>
                <td className="p-2">{new Date(f.uploadDate).toLocaleDateString()}</td>
                <td className="p-2">
                  <a
                    href={`${API_URL}/api/kb/files/${f.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 border rounded"
                    aria-label={`View ${f.name}`}
                  >
                    View
                  </a>
                  <button
                    className="ml-2 px-2 py-1 border rounded"
                    aria-label={`Edit ${f.name}`}
                    onClick={() => {
                      setEditTarget(f)
                      setEditName(f.name)
                      setEditDesc(f.description || '')
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-2 px-2 py-1 border rounded"
                    aria-label={`Delete ${f.name}`}
                    onClick={() => alert(`Delete ${f.name}`)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-center text-[#333]" colSpan={4}>No files found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editTarget && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-4">
            <div className="mb-3">
              <h2 id="edit-title" className="text-lg font-semibold text-[#333]">Edit file</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[#333] mb-1">Name</label>
                <input
                  className="w-full border rounded p-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  aria-label="Edit name"
                />
              </div>
              <div>
                <label className="block text-sm text-[#333] mb-1">Description</label>
                <input
                  className="w-full border rounded p-2"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={500}
                  aria-label="Edit description"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-2 border rounded"
                onClick={() => {
                  setEditTarget(null)
                  setEditName('')
                  setEditDesc('')
                }}
                aria-label="Cancel edit"
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 bg-sky-600 text-white rounded"
                onClick={() => {
                  const name = editName.trim()
                  const desc = editDesc.trim()
                  if (!name) return
                  if (name.length > 100 || desc.length > 500) return
                  setItems(prev => prev.map(it => it.id === editTarget.id ? { ...it, name, description: desc } : it))
                  setEditTarget(null)
                  setEditName('')
                  setEditDesc('')
                }}
                aria-label="Save edit"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
