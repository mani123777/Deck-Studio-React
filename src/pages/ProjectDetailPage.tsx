import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Sparkles,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { AppLayout } from '../components/Layout/AppLayout'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { projectsApi } from '../api/client'
import type {
  ProjectDetail,
  ProjectDocument,
  ProjectRole,
  ProjectRoleProfile,
} from '../api/client'

const ALLOWED_TYPES = ['.pdf', '.docx', '.txt']

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  const refresh = async () => {
    if (!id) return
    try {
      const { data } = await projectsApi.get(id)
      setProject(data)
    } catch (e: any) {
      toast.error('Failed to load project', e?.response?.data?.detail ?? e?.message ?? '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !id) return
    setUploading(true)
    let okCount = 0
    let failCount = 0
    for (const file of Array.from(files)) {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) {
        toast.error(`Skipped ${file.name}`, `Only ${ALLOWED_TYPES.join(', ')} are supported.`)
        failCount++
        continue
      }
      const tid = toast.loading(`Uploading ${file.name}`, 'Extracting text…')
      try {
        await projectsApi.uploadDocument(id, file)
        toast.update(tid, {
          variant: 'success',
          title: `Uploaded ${file.name}`,
          description: 'Ready for generation.',
        })
        okCount++
      } catch (e: any) {
        toast.update(tid, {
          variant: 'error',
          title: `Failed: ${file.name}`,
          description: e?.response?.data?.detail ?? e?.message ?? '',
        })
        failCount++
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (okCount > 0) refresh()
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!id) return
    if (!confirm('Delete this document?')) return
    try {
      await projectsApi.deleteDocument(id, docId)
      refresh()
    } catch (e: any) {
      toast.error('Delete failed', e?.response?.data?.detail ?? e?.message ?? '')
    }
  }

  const handleRetry = async (docId: string) => {
    if (!id) return
    try {
      await projectsApi.retryExtraction(id, docId)
      toast.success('Extraction retried')
      refresh()
    } catch (e: any) {
      toast.error('Retry failed', e?.response?.data?.detail ?? e?.message ?? '')
    }
  }

  const handleDeleteProject = async () => {
    if (!id) return
    if (!confirm('Delete this project and all its documents and generated decks?')) return
    try {
      await projectsApi.delete(id)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (e: any) {
      toast.error('Delete failed', e?.response?.data?.detail ?? e?.message ?? '')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="px-12 pt-12 pb-20 max-w-[1100px] mx-auto">
          <div className="h-8 w-1/3 mb-4 rounded shimmer" />
          <div className="h-4 w-2/3 rounded shimmer" />
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="px-12 pt-12 max-w-[1100px] mx-auto">
          <p style={{ color: 'var(--ink-muted)' }}>Project not found.</p>
          <Button variant="link" onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        </div>
      </AppLayout>
    )
  }

  const completeDocsCount = project.documents.filter((d) => d.extraction_status === 'complete').length
  const canGenerate = completeDocsCount > 0

  return (
    <AppLayout>
      {showGenerate && (
        <GenerateModal
          project={project}
          onClose={() => setShowGenerate(false)}
          onGenerated={(presentationId) => {
            setShowGenerate(false)
            navigate(`/presentations/${presentationId}`)
          }}
        />
      )}

      <div className="px-12 pt-10 pb-20 max-w-[1100px] mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-[12.5px] mb-6 transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
        >
          <ArrowLeft size={13} />
          All projects
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-3">— Project</p>
            <h1
              className="font-serif leading-[1.05] tracking-tighter text-[34px] md:text-[42px] mb-3"
              style={{ color: 'var(--ink-strong)' }}
            >
              {project.name}
            </h1>
            {project.description && (
              <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: 'var(--ink-soft)' }}>
                {project.description}
              </p>
            )}
            {project.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2.5 py-1 rounded-full"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--ink-soft)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleDeleteProject}>
              <Trash2 size={13} />
              Delete
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowGenerate(true)}
              disabled={!canGenerate}
              leadingIcon={<Sparkles size={13} />}
            >
              Generate deck
            </Button>
          </div>
        </div>

        {!canGenerate && (
          <div
            className="rounded-xl px-4 py-3 mb-8 text-[13px] flex items-start gap-2.5"
            style={{
              background: 'var(--accent-soft, rgba(245,158,11,0.08))',
              color: 'var(--ink-soft)',
              border: '1px solid var(--line)',
            }}
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <span>
              Upload at least one PDF, DOCX, or TXT document with successful extraction to enable
              deck generation.
            </span>
          </div>
        )}

        {/* Documents */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-serif text-[24px] tracking-tighter"
              style={{ color: 'var(--ink-strong)' }}
            >
              Documents
              <span className="text-[14px] font-normal ml-2" style={{ color: 'var(--ink-muted)' }}>
                {project.documents.length}
              </span>
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              leadingIcon={uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            >
              {uploading ? 'Uploading…' : 'Upload documents'}
            </Button>
          </div>

          {project.documents.length === 0 ? (
            <DropZone onFiles={handleUpload} disabled={uploading} />
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
              {project.documents.map((d, i) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  isLast={i === project.documents.length - 1}
                  onDelete={() => handleDeleteDoc(d.id)}
                  onRetry={() => handleRetry(d.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Generated decks */}
        <section>
          <h2
            className="font-serif text-[24px] tracking-tighter mb-5"
            style={{ color: 'var(--ink-strong)' }}
          >
            Generated decks
            <span className="text-[14px] font-normal ml-2" style={{ color: 'var(--ink-muted)' }}>
              {project.presentations.length}
            </span>
          </h2>

          {project.presentations.length === 0 ? (
            <div
              className="rounded-2xl px-8 py-10 text-center text-[13px]"
              style={{
                background: 'var(--surface)',
                border: '1px dashed var(--line-strong)',
                color: 'var(--ink-soft)',
              }}
            >
              No decks yet. Once you have documents uploaded, hit{' '}
              <span style={{ color: 'var(--ink-strong)' }}>Generate deck</span> and pick a role.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.presentations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/presentations/${p.presentation_id}`)}
                  className="text-left rounded-2xl p-5 transition-all"
                  style={{
                    background: 'var(--paper-2)',
                    border: '1px solid var(--line)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 1px rgba(15,14,12,0.06), 0 12px 28px -10px rgba(15,14,12,0.14)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{ background: 'var(--ink-strong)', color: '#fff' }}
                    >
                      {p.role}
                    </span>
                    <span className="eyebrow">{p.slide_count} slides</span>
                  </div>
                  <p
                    className="font-serif text-[18px] leading-tight tracking-tighter mb-1"
                    style={{ color: 'var(--ink-strong)' }}
                  >
                    {p.title}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                    Generated from {p.source_document_ids.length}{' '}
                    {p.source_document_ids.length === 1 ? 'doc' : 'docs'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

// ── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: FileList | null) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setHover(true)
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault()
        setHover(false)
        if (!disabled) onFiles(e.dataTransfer.files)
      }}
      className="rounded-2xl px-12 py-14 text-center cursor-pointer transition-all"
      style={{
        background: hover ? 'rgba(10,9,7,0.04)' : 'var(--surface)',
        border: `1px dashed ${hover ? 'var(--ink-strong)' : 'var(--line-strong)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Upload
        size={20}
        className="mx-auto mb-3"
        style={{ color: 'var(--ink-muted)' }}
      />
      <p
        className="font-serif text-[20px] tracking-tighter mb-1"
        style={{ color: 'var(--ink-strong)' }}
      >
        Drop documents here
      </p>
      <p className="text-[12.5px]" style={{ color: 'var(--ink-muted)' }}>
        Supports PDF, DOCX, TXT — up to 10 MB each
      </p>
    </div>
  )
}

// ── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  isLast,
  onDelete,
  onRetry,
}: {
  doc: ProjectDocument
  isLast: boolean
  onDelete: () => void
  onRetry: () => void
}) {
  const statusMeta: Record<typeof doc.extraction_status, { label: string; color: string; Icon: any }> = {
    complete: { label: 'Ready', color: '#16A34A', Icon: CheckCircle2 },
    pending: { label: 'Extracting', color: 'var(--ink-muted)', Icon: Clock },
    failed: { label: 'Failed', color: 'var(--accent)', Icon: AlertCircle },
  }
  const { label, color, Icon } = statusMeta[doc.extraction_status]

  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{
        background: 'var(--paper)',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
      >
        <FileText size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-medium truncate"
          style={{ color: 'var(--ink-strong)' }}
        >
          {doc.original_filename}
          {doc.version > 1 && (
            <span className="ml-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              v{doc.version}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-[11.5px]" style={{ color: 'var(--ink-muted)' }}>
          <span className="uppercase">{doc.format}</span>
          <span>{formatBytes(doc.size_bytes)}</span>
          <span className="inline-flex items-center gap-1" style={{ color }}>
            <Icon size={11} />
            {label}
          </span>
        </div>
      </div>
      {doc.extraction_status === 'failed' && (
        <button
          onClick={onRetry}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          title="Retry extraction"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(10,9,7,0.05)'
            e.currentTarget.style.color = 'var(--ink-strong)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-muted)'
          }}
        >
          <RefreshCw size={13} />
        </button>
      )}
      <button
        onClick={onDelete}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: 'var(--ink-muted)' }}
        title="Delete"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-soft, rgba(220,38,38,0.08))'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--ink-muted)'
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Generate modal ───────────────────────────────────────────────────────────

const ROLE_LABELS: Record<ProjectRole, string> = {
  developer: 'Developer',
  ba: 'Business Analyst',
  sales: 'Sales',
  pm: 'Project Manager',
  qa: 'QA',
}

function GenerateModal({
  project,
  onClose,
  onGenerated,
}: {
  project: ProjectDetail
  onClose: () => void
  onGenerated: (presentationId: string) => void
}) {
  const toast = useToast()
  const [role, setRole] = useState<ProjectRole>('pm')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [profiles, setProfiles] = useState<ProjectRoleProfile[]>([])

  const usableDocs = project.documents.filter((d) => d.extraction_status === 'complete')
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    new Set(usableDocs.map((d) => d.id)),
  )

  useEffect(() => {
    projectsApi
      .roles()
      .then((res) => setProfiles(res.data))
      .catch(() => {
        /* fall back to labels-only */
      })
  }, [])

  const toggleDoc = (id: string) => {
    setSelectedDocs((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async () => {
    if (selectedDocs.size === 0) {
      toast.error('Select at least one document')
      return
    }
    setSubmitting(true)
    const tid = toast.loading(`Generating ${ROLE_LABELS[role]} deck`, 'AI is reading your documents…')
    try {
      const { data } = await projectsApi.generate(project.id, {
        role,
        document_ids: Array.from(selectedDocs),
        title: title.trim() || undefined,
      })
      toast.update(tid, {
        variant: 'success',
        title: 'Deck generated',
        description: `${data.slide_count} slides ready.`,
      })
      onGenerated(data.presentation_id)
    } catch (e: any) {
      toast.update(tid, {
        variant: 'error',
        title: 'Generation failed',
        description: e?.response?.data?.detail ?? e?.message ?? '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const activeProfile = profiles.find((p) => p.role === role)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,9,7,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <div>
            <p className="eyebrow mb-1">— Generate</p>
            <h2 className="font-serif text-[22px] tracking-tighter" style={{ color: 'var(--ink-strong)' }}>
              New deck from project
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Role */}
          <div>
            <label className="eyebrow mb-2 block">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_LABELS) as ProjectRole[]).map((r) => {
                const active = role === r
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all"
                    style={{
                      background: active ? 'var(--ink-strong)' : 'var(--surface)',
                      color: active ? '#fff' : 'var(--ink-soft)',
                      border: `1px solid ${active ? 'var(--ink-strong)' : 'var(--line)'}`,
                    }}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                )
              })}
            </div>
            {activeProfile && (
              <p className="text-[12px] mt-2.5 leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {activeProfile.focus}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="eyebrow mb-2 block">
              Title <span style={{ color: 'var(--ink-faint)' }}>(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${project.name} — ${ROLE_LABELS[role]} Deck`}
              className="w-full px-3 h-10 rounded-xl text-[13px] outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-strong)' }}
            />
          </div>

          {/* Documents */}
          <div>
            <label className="eyebrow mb-2 block">
              Source documents{' '}
              <span style={{ color: 'var(--ink-faint)' }}>({selectedDocs.size} of {usableDocs.length})</span>
            </label>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
              {usableDocs.map((d, i) => {
                const checked = selectedDocs.has(d.id)
                return (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer text-[13px] transition-colors"
                    style={{
                      background: checked ? 'rgba(10,9,7,0.03)' : 'var(--paper)',
                      borderBottom: i === usableDocs.length - 1 ? 'none' : '1px solid var(--line)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDoc(d.id)}
                      className="w-4 h-4 accent-black"
                    />
                    <FileText size={13} style={{ color: 'var(--ink-muted)' }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--ink-strong)' }}>
                      {d.original_filename}
                    </span>
                    <span className="text-[11px] uppercase" style={{ color: 'var(--ink-muted)' }}>
                      {d.format}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div
          className="px-6 py-4 flex items-center justify-end gap-2"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={submitting || selectedDocs.size === 0}
            leadingIcon={submitting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          >
            {submitting ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  )
}
