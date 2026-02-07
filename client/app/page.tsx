'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

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
const CATEGORIES = ['Policy', 'Procedure', 'FAQ', 'Manual', 'Other'] as const
const ACCENT = 'text-sky-600'

function FolderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const [type, setType] = useState<'success' | 'error'>('success')
  const timer = useRef<any>(null)
  const show = (m: string, t: 'success' | 'error' = 'success') => {
    setType(t)
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 3000)
  }
  return { msg, type, show }
}

export default function KnowledgeBasePage() {
  const [files, setFiles] = useState<KBFile[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | KBFile['category']>('All')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<Record<string, Partial<KBFile>>>({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState<KBFile['category']>('Policy')
  const [fileObj, setFileObj] = useState<File | null>(null)
  const { msg, type, show } = useToast()
  const undoTimer = useRef<any>(null)
  const [undoId, setUndoId] = useState<string | null>(null)

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    const url = new URL(`${API_URL}/api/kb/files`)
    url.searchParams.set('sortBy', sortBy)
    url.searchParams.set('sortDir', sortDir)
    const res = await fetch(url)
    const data = await res.json()
    if (data.success) setFiles(data.files)
  }

  function validateClient(): string | null {
    if (!name.trim()) return 'File name is required'
    if (name.trim().length > 100) return 'File name exceeds 100 characters'
    if (desc.trim().length > 500) return 'Description exceeds 500 characters'
    if (!fileObj) return 'Please select a file'
    const ext = fileObj.name.toLowerCase().slice(fileObj.name.lastIndexOf('.'))
    if (!['.pdf', '.docx', '.txt'].includes(ext)) return 'Unsupported file type'
    if (fileObj.size > 5 * 1024 * 1024) return 'File is larger than 5 MB'
    return null
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setFileObj(f)
  }
  function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFileObj(f)
  }

  async function handleUpload() {
    const err = validateClient()
    if (err) return show(err, 'error')
    const form = new FormData()
    form.append('name', name.trim())
    form.append('category', cat)
    form.append('description', desc.trim())
    form.append('uploader', 'admin')
    form.append('file', fileObj!)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/kb/upload`)
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setUploading(true)
        setProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }
    xhr.onload = async () => {
      setUploading(false)
      setProgress(0)
      try {
        const json = JSON.parse(xhr.responseText)
        if (json.success) {
          show('Upload successful', 'success')
          setName(''); setDesc(''); setFileObj(null); setCat('Policy')
          await fetchList()
        } else {
          show(json.error || 'Upload failed', 'error')
        }
      } catch {
        show('Upload failed', 'error')
      }
    }
    xhr.onerror = () => { setUploading(false); show('Network error', 'error') }
    xhr.send(form)
  }

  const filtered = useMemo(() => {
    let list = files.slice()
    if (query.trim()) {
      const s = query.trim().toLowerCase()
      list = list.filter(f => f.name.toLowerCase().includes(s) || (f.description || '').toLowerCase().includes(s))
    }
    if (category !== 'All') list = list.filter(f => f.category === category)
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
    })
    if (sortDir === 'desc') list.reverse()
    return list
  }, [files, query, category, sortBy, sortDir])

  const paged = useMemo(() => {
    const start = (page - 1) * 10
    return filtered.slice(start, start + 10)
  }, [filtered, page])

  async function saveEdit(id: string) {
    const patch = editing[id]
    if (!patch) return
    const res = await fetch(`${API_URL}/api/kb/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    if (json.success) {
      show('Saved changes', 'success')
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
      await fetchList()
    } else {
      show(json.error || 'Failed to save', 'error')
    }
  }

  async function softDelete(id: string) {
    const res = await fetch(`${API_URL}/api/kb/files/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      show('Deleted (undo available)', 'success')
      setUndoId(id)
      clearTimeout(undoTimer.current)
      undoTimer.current = setTimeout(() => setUndoId(null), 5000)
      await fetchList()
    } else {
      show(json.error || 'Failed to delete', 'error')
    }
  }

  async function bulkDelete() {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([id]) => id)
    if (ids.length === 0) return
    const res = await fetch(`${API_URL}/api/kb/files/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const json = await res.json()
    if (json.success) {
      show('Deleted selected', 'success')
      setSelected({})
      await fetchList()
    } else {
      show(json.error || 'Bulk delete failed', 'error')
    }
  }

  async function restore(id: string) {
    const res = await fetch(`${API_URL}/api/kb/files/${id}/restore`, { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      show('Restored', 'success')
      setUndoId(null)
      await fetchList()
    } else {
      show(json.error || 'Restore failed', 'error')
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
      <h1 className={`text-3xl font-bold mb-4 ${ACCENT}`}>HR Knowledge Base</h1>
      <p className="text-[#333] mb-6">Manage policies, procedures, FAQs and manuals.</p>

      {/* Upload section */}
      <section aria-label="Upload new knowledge file" className="bg-white p-4 sm:p-6 rounded-md shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[#333] mb-1">File name</label>
            <input
              aria-label="File name"
              className="w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm text-[#333] mb-1">Category</label>
            <select
              aria-label="Category"
              className="w-full border rounded p-2"
              value={cat}
              onChange={(e) => setCat(e.target.value as KBFile['category'])}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-[#333] mb-1">Description</label>
            <textarea
              aria-label="Description"
              className="w-full border rounded p-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-4 border-2 border-dashed rounded p-4 text-center cursor-pointer"
        >
          <input
            aria-label="File picker"
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleBrowse}
            id="fileInput"
          />
          <label htmlFor="fileInput" className="block">
            {fileObj ? (
              <span className="text-[#333]">Selected: {fileObj.name}</span>
            ) : (
              <span className="text-[#333]">Drag & drop or click here</span>
            )}
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
            aria-label="Upload file"
          >
            Upload
          </button>
          {uploading && (
            <div className="flex-1 h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-sky-600 rounded"
                style={{ width: `${progress}%` }}
                aria-label="Upload progress"
              />
            </div>
          )}
        </div>
        {msg && (
          <div
            role="status"
            className={`mt-3 px-3 py-2 rounded text-sm ${type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            {msg}
          </div>
        )}
        {undoId && (
          <div className="mt-3 px-3 py-2 rounded bg-yellow-50 text-yellow-800 text-sm flex items-center justify-between">
            <span>File deleted. Undo?</span>
            <button onClick={() => restore(undoId)} className="px-3 py-1 border rounded">Undo</button>
          </div>
        )}
      </section>

      <section aria-label="Repository" className="bg-white p-4 sm:p-6 rounded-md shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-[#333]">Uploaded file</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => {
            const count = files.filter(f => f.category === c && !f.deletedAt).length
            return (
              <Link
                key={c}
                href={`/kb/${c.toLowerCase()}`}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-300 text-white flex items-center justify-center">
                    <FolderIcon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#333]">{c}</div>
                    <div className="text-xs text-gray-500">{count} files</div>
                  </div>
                </div>
                <div className="text-gray-400">⋮</div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
