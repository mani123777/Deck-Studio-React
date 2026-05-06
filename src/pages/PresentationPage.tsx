import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { presentationsApi, exportApi, themesApi, shareApi } from '../api/client'
import { SlidePreview } from '../components/Presentation/SlidePreview'
import { PropertyPanel } from '../components/Presentation/SlideEditor'
import { ThemePanel } from '../components/Presentation/ThemePanel'
import { SlideChat } from '../components/Presentation/SlideChat'
import { EditorToolbar } from '../components/Presentation/EditorToolbar'
import { ChartModal } from '../components/Presentation/ChartModal'
import { AddSlideMenu, type SlideTemplateKind } from '../components/Presentation/AddSlideMenu'
import { getThemeById } from '../data/themes'
import type { ThemePreset } from '../data/themes'
import type {
  Block, ChartDataPoint, ChartType,
  PresentationDetail, Position, Slide, Styling, Theme,
} from '../types'

type SaveStatus = 'idle' | 'saving' | 'saved'
type CtxMenu = { index: number; x: number; y: number } | null
type ExportReady = { jobId: string; format: string } | null

const SLIDE_W = 1280
const SLIDE_H = 720

// ── Helpers ───────────────────────────────────────────────────────────────────

function presetToTheme(p: ThemePreset): Theme {
  return {
    id: p.id,
    name: p.name,
    colors: {
      primary:    p.colors.heading,
      secondary:  p.colors.surface,
      accent:     p.colors.accent,
      background: p.colors.background,
      text:       p.colors.body,
    },
    fonts: {
      heading: { family: p.fonts.heading, size: 52, weight: 800 },
      body:    { family: p.fonts.body,    size: 16, weight: 400 },
      caption: { family: p.fonts.body,    size: 12, weight: 400 },
    },
  }
}

function applyPresetToSlides(slides: Slide[], t: ThemePreset): Slide[] {
  return slides.map((slide) => ({
    ...slide,
    background: { type: 'color' as const, value: t.colors.background },
    blocks: slide.blocks.map((block) => {
      switch (block.type) {
        case 'title':
        case 'heading':
          return { ...block, styling: { ...block.styling, color: t.colors.heading, font_family: t.fonts.heading } }
        case 'subtitle':
        case 'body':
        case 'text':
        case 'caption':
        case 'quote':
        case 'bullet':
          return { ...block, styling: { ...block.styling, color: t.colors.body, font_family: t.fonts.body } }
        case 'badge':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'shape':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: t.colors.accent } }
        case 'panel':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface } }
        case 'card':
          return { ...block, styling: { ...block.styling, background_color: t.colors.surface, color: t.colors.heading } }
        case 'stat':
          return { ...block, styling: { ...block.styling, color: t.colors.accent } }
        case 'process_circle':
          return { ...block, styling: { ...block.styling, background_color: t.colors.accent, color: '#ffffff' } }
        default:
          return { ...block, styling: { ...block.styling, color: t.colors.body } }
      }
    }),
  }))
}

function getCanvasBg(hex: string): string {
  // Use the theme's background as the canvas surround when available.
  // Falls back to a neutral mid-gray only when no valid hex is provided.
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#1A1814'
  return hex
}

function makeSlideOfKind(kind: SlideTemplateKind, order: number, theme: ThemePreset): Slide {
  const base: Pick<Slide, 'order' | 'type' | 'background'> = {
    order,
    type: kind,
    background: { type: 'color', value: theme.colors.background },
  }
  const titleStyle: Styling = {
    font_family: theme.fonts.heading, font_size: 56, font_weight: 800,
    color: theme.colors.heading, background_color: 'transparent', text_align: 'left',
  }
  const subtitleStyle: Styling = {
    font_family: theme.fonts.body, font_size: 22, font_weight: 400,
    color: theme.colors.body, background_color: 'transparent', text_align: 'left',
  }
  const bodyStyle: Styling = {
    font_family: theme.fonts.body, font_size: 20, font_weight: 400,
    color: theme.colors.body, background_color: 'transparent', text_align: 'left',
  }
  const id = () => crypto.randomUUID()

  if (kind === 'title') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'title',    content: 'Presentation Title', position: { x: 80, y: 260, w: 1120, h: 140 }, styling: { ...titleStyle, font_size: 72, text_align: 'center' } },
        { id: id(), type: 'subtitle', content: 'Subtitle goes here', position: { x: 80, y: 410, w: 1120, h: 60  }, styling: { ...subtitleStyle, text_align: 'center' } },
      ],
    }
  }
  if (kind === 'agenda') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'heading', content: 'Agenda', position: { x: 80, y: 80, w: 1120, h: 90 }, styling: { ...titleStyle, font_size: 48 } },
        { id: id(), type: 'bullet',  content: '• First topic\n• Second topic\n• Third topic\n• Fourth topic', position: { x: 80, y: 200, w: 1120, h: 440 }, styling: bodyStyle },
      ],
    }
  }
  if (kind === 'content') {
    return {
      ...base,
      blocks: [
        { id: id(), type: 'heading', content: 'Section heading', position: { x: 80, y: 80, w: 1120, h: 90 }, styling: { ...titleStyle, font_size: 48 } },
        { id: id(), type: 'body',    content: 'Add your content here. Click any element to select it, double-click to edit.', position: { x: 80, y: 200, w: 1120, h: 440 }, styling: bodyStyle },
      ],
    }
  }
  // blank
  return { ...base, blocks: [] }
}

function makeImageBlock(src: string): Block {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    content: src,
    position: { x: 440, y: 220, w: 400, h: 280 },
    styling: {},
  }
}

function makeChartBlock(chartType: ChartType, data: ChartDataPoint[]): Block {
  return {
    id: crypto.randomUUID(),
    type: 'chart',
    content: '',
    position: { x: 380, y: 180, w: 520, h: 360 },
    styling: { background_color: 'rgba(255,255,255,0.04)' },
    chart_type: chartType,
    chart_data: data,
  }
}

function makeTextBlock(theme: ThemePreset): Block {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    content: 'Double-click to edit',
    position: { x: 480, y: 320, w: 320, h: 60 },
    styling: {
      font_family: theme.fonts.body, font_size: 22, font_weight: 500,
      color: theme.colors.body, background_color: 'transparent', text_align: 'left',
    },
  }
}

// ── PresentationPage ──────────────────────────────────────────────────────────

export function PresentationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [presentation, setPresentation] = useState<PresentationDetail | null>(null)
  const [slides, setSlides]             = useState<Slide[]>([])
  const [activeSlide, setActiveSlide]   = useState(0)

  const [themeOpen, setThemeOpen]       = useState(false)
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>('idle')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId]   = useState<string | null>(null)
  const [activeTheme, setActiveTheme]   = useState<ThemePreset>(getThemeById('vortex'))
  const [canvasScale, setCanvasScale]   = useState(0.72)
  const [presentMode, setPresentMode]   = useState(false)
  const [presentSlide, setPresentSlide] = useState(0)

  // Context menu for slide strip
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null)

  // AI Chat panel
  const [chatOpen, setChatOpen] = useState(false)

  // Chart insert / edit modal
  const [chartModalOpen, setChartModalOpen]   = useState(false)
  const [editingChartId, setEditingChartId]   = useState<string | null>(null)

  // Hidden file input for image upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag-and-drop for slide reordering
  const [dragIdx, setDragIdx]   = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Download modal
  const [downloadOpen, setDownloadOpen]   = useState(false)
  const [exporting, setExporting]         = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportReady, setExportReady]     = useState<ExportReady>(null)
  const [exportError, setExportError]     = useState<string | null>(null)

  // Share link
  const [shareUrl, setShareUrl]   = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const centerRef   = useRef<HTMLDivElement>(null)
  const slidesRef   = useRef<Slide[]>([])

  // Keep slidesRef in sync so handleApplyTheme always has the latest slides
  useEffect(() => { slidesRef.current = slides }, [slides])

  // DB theme used as the canvas/preview backdrop (full theme object from API).
  const [dbTheme, setDbTheme] = useState<Theme | null>(null)

  // Load presentation
  // The DB `theme_id` is a UUID FK (not a preset name like 'vortex'). We fetch
  // the real theme by id so the canvas background, fonts, and SlidePreview
  // fallbacks match the template the user picked. We do NOT overwrite slide
  // styling on load — the seeded slides already have correct fonts/colors per
  // block, and overwriting them with a frontend preset is what made every
  // copy look black. Only when the user explicitly picks a new theme via
  // ThemePanel do we recolor slides.
  useEffect(() => {
    if (!id) return
    presentationsApi.get(id).then(async (r) => {
      setPresentation(r.data)
      setSlides(r.data.slides)

      const savedPreset = localStorage.getItem(`theme_preset_${id}`)
      if (savedPreset) {
        const preset = getThemeById(savedPreset)
        setActiveTheme(preset)
        setSlides(applyPresetToSlides(r.data.slides, preset))
        setDbTheme(presetToTheme(preset))
      } else if (r.data.theme_id) {
        // Fetch the actual DB theme for canvas/fallback rendering.
        try {
          const themeRes = await themesApi.get(r.data.theme_id)
          setDbTheme(themeRes.data as Theme)
        } catch {
          /* fall through — render will use whatever defaults exist */
        }
      }
    })
  }, [id])

  // Dynamic canvas scale
  useEffect(() => {
    const compute = () => {
      if (!centerRef.current) return
      const { clientWidth, clientHeight } = centerRef.current
      const scaleW = (clientWidth  - 80) / 1280
      const scaleH = (clientHeight - 80) / 720
      setCanvasScale(Math.min(scaleW, scaleH, 1))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  // Present mode keyboard navigation
  useEffect(() => {
    if (!presentMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')           setPresentMode(false)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ')
        setPresentSlide((p) => Math.min(p + 1, slides.length - 1))
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')
        setPresentSlide((p) => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentMode, slides.length])

  const enterPresent = () => {
    setPresentSlide(activeSlide)
    setPresentMode(true)
  }

  // Auto-save
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!id) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await presentationsApi.update(id, { slides })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slides, id])

  // ── Block interactions ──────────────────────────────────────────────────────
  const handleBlockClick = useCallback((blockId: string) => {
    if (!blockId) { setSelectedBlockId(null); setEditingBlockId(null); return }
    setSelectedBlockId(blockId)
    setEditingBlockId(null)
  }, [])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    setEditingBlockId(blockId)
  }, [])

  const handleBlockContentChange = useCallback((blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      )
    )
  }, [activeSlide])

  const updateStyling = (blockId: string, updates: Partial<Styling>) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, styling: { ...b.styling, ...updates } } : b
          ),
        }
      )
    )
  }

  const updateContent = (blockId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s, i) =>
        i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) => b.id === blockId ? { ...b, content } : b),
        }
      )
    )
  }

  // ── Theme ───────────────────────────────────────────────────────────────────
  const handleApplyTheme = useCallback((theme: ThemePreset) => {
    const updated = applyPresetToSlides(slidesRef.current, theme)
    setSlides(updated)
    setActiveTheme(theme)
    setDbTheme(presetToTheme(theme))
    setThemeOpen(false)
    if (id) {
      // Persist preset name in localStorage (the DB theme_id is a UUID FK,
      // not a preset name, so we can't save 'vortex' there directly).
      localStorage.setItem(`theme_preset_${id}`, theme.id)
      // Save slides immediately — don't rely on the debounce in case the user
      // closes the tab before it fires.
      presentationsApi.update(id, { slides: updated })
    }
  }, [id])

  // ── Slide management ────────────────────────────────────────────────────────
  const addSlideOfKind = (kind: SlideTemplateKind) => {
    const newSlide = makeSlideOfKind(kind, slides.length + 1, activeTheme)
    setSlides((prev) => [...prev, newSlide])
    setActiveSlide(slides.length)
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  // Insert a new slide directly after the currently active slide.
  // Used by the toolbar's "+ Slide" button — feels more natural than appending
  // to the end when you're working in the middle of a deck.
  const insertSlideAfterCurrent = (kind: SlideTemplateKind) => {
    const insertAt = activeSlide + 1
    const newSlide = makeSlideOfKind(kind, insertAt + 1, activeTheme)
    setSlides((prev) => {
      const next = [...prev.slice(0, insertAt), newSlide, ...prev.slice(insertAt)]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    setActiveSlide(insertAt)
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  const applyLayoutToCurrentSlide = (kind: SlideTemplateKind) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...makeSlideOfKind(kind, s.order, activeTheme),
        order: s.order,
      })
    )
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }

  // ── Block insert / delete / move / resize ───────────────────────────────────
  const insertBlock = (block: Block) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : { ...s, blocks: [...s.blocks, block] })
    )
    setSelectedBlockId(block.id)
    setEditingBlockId(null)
  }

  const handleInsertText = () => {
    insertBlock(makeTextBlock(activeTheme))
  }

  const handleInsertImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading the same file
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      insertBlock(makeImageBlock(src))
    }
    reader.readAsDataURL(file)
  }

  const handleInsertChart = () => {
    setEditingChartId(null)
    setChartModalOpen(true)
  }

  const handleEditChart = () => {
    if (!selectedBlockId) return
    setEditingChartId(selectedBlockId)
    setChartModalOpen(true)
  }

  const handleChartSubmit = (chartType: ChartType, data: ChartDataPoint[]) => {
    if (editingChartId) {
      setSlides((prev) =>
        prev.map((s, i) => i !== activeSlide ? s : {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === editingChartId ? { ...b, chart_type: chartType, chart_data: data } : b
          ),
        })
      )
    } else {
      insertBlock(makeChartBlock(chartType, data))
    }
    setChartModalOpen(false)
    setEditingChartId(null)
  }

  const deleteBlock = useCallback((blockId: string) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...s, blocks: s.blocks.filter((b) => b.id !== blockId),
      })
    )
    setSelectedBlockId(null)
    setEditingBlockId(null)
  }, [activeSlide])

  // Delete-key handling for selected block (skip while editing text or in modals)
  useEffect(() => {
    if (presentMode || chartModalOpen || themeOpen) return
    if (!selectedBlockId || editingBlockId) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteBlock(selectedBlockId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBlockId, editingBlockId, presentMode, chartModalOpen, themeOpen, deleteBlock])

  const handleDeleteSelected = () => {
    if (selectedBlockId) deleteBlock(selectedBlockId)
  }

  const handleBlockPositionChange = useCallback((blockId: string, next: Position) => {
    setSlides((prev) =>
      prev.map((s, i) => i !== activeSlide ? s : {
        ...s,
        blocks: s.blocks.map((b) => b.id === blockId ? { ...b, position: next } : b),
      })
    )
  }, [activeSlide])

  const duplicateSlide = (index: number) => {
    const src = slides[index]
    const dup: Slide = {
      ...src,
      order: index + 2,
      blocks: src.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    }
    const next = [
      ...slides.slice(0, index + 1),
      dup,
      ...slides.slice(index + 1),
    ].map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(index + 1)
    setCtxMenu(null)
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { setCtxMenu(null); return }
    const next = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSlides(next)
    setActiveSlide(Math.min(activeSlide, next.length - 1))
    setCtxMenu(null)
  }

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= slides.length) return
    setSlides((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    if (activeSlide === index) setActiveSlide(target)
    else if (activeSlide === target) setActiveSlide(index)
    setCtxMenu(null)
  }

  // ── Drag-and-drop reorder ───────────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIdx(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIdx === null || dragIdx === targetIndex) { setDragIdx(null); setDragOver(null); return }
    setSlides((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(targetIndex, 0, moved)
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
    if (activeSlide === dragIdx) setActiveSlide(targetIndex)
    else if (activeSlide > Math.min(dragIdx, targetIndex) && activeSlide <= Math.max(dragIdx, targetIndex)) {
      setActiveSlide(dragIdx < targetIndex ? activeSlide - 1 : activeSlide + 1)
    }
    setDragIdx(null)
    setDragOver(null)
  }

  const handleDragEnd = () => { setDragIdx(null); setDragOver(null) }

  // ── Slide update from chat ──────────────────────────────────────────────────
  const handleSlideUpdate = useCallback((updated: Slide) => {
    setSlides((prev) => prev.map((s, i) => i === activeSlide ? updated : s))
  }, [activeSlide])

  // ── Share link ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!id) return
    const url = shareApi.url(id)
    setShareUrl(url)
    setShareCopied(false)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
    } catch {
      // clipboard may be blocked — user can still copy from the input
    }
  }

  // ── Export / Download ───────────────────────────────────────────────────────
  const handleDownload = async (format: 'pptx' | 'html') => {
    if (!id) return
    setDownloadOpen(false)
    setExporting(true)
    setExportReady(null)
    setExportError(null)
    setExportProgress(0)
    try {
      const { data } = await exportApi.start(id, format)
      const poll = setInterval(async () => {
        const { data: s } = await exportApi.status(data.job_id)
        setExportProgress(s.progress ?? 0)
        if (s.status === 'completed') {
          clearInterval(poll)
          setExporting(false)
          setExportReady({ jobId: data.job_id, format })
        } else if (s.status === 'failed') {
          clearInterval(poll)
          setExporting(false)
          setExportError(s.error_message ?? 'Export failed')
        }
      }, 2000)
    } catch {
      setExporting(false)
      setExportError('Export failed. Please try again.')
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  // Prefer the DB theme (matches the template the user picked). Fall back to
  // the preset only if the API fetch hasn't returned yet.
  const themeObj      = dbTheme ?? presetToTheme(activeTheme)
  const canvasBg      = getCanvasBg(themeObj.colors.background)
  const currentSlide  = slides[activeSlide]
  const selectedBlock = currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null

  if (!presentation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#13131f', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: canvasBg }}>

      {/* ── Toolbar ── */}
      <div style={{
        height: 56, flexShrink: 0, zIndex: 20,
        background: '#0A0907',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.65)', borderRadius: 10, lineHeight: 1,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'
            ;(e.currentTarget as HTMLElement).style.color = '#fff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
          }}
        >←</button>

        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.2 }}>WAC</span>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{
            color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.2,
            fontFamily: 'Fraunces, serif',
          }}>
            {presentation.title}
          </span>
          {saveStatus !== 'idle' && (
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              color: saveStatus === 'saving' ? 'rgba(255,255,255,0.45)' : '#7DD3A8',
              marginTop: 1,
            }}>
              {saveStatus === 'saving' ? '— Saving…' : '— Saved'}
            </span>
          )}
        </div>

        <TBtn label="Theme" active={themeOpen} onClick={() => setThemeOpen((o) => !o)} />
        <TBtn label="AI" active={chatOpen} onClick={() => setChatOpen((o) => !o)} />
        <button
          onClick={enterPresent}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 999,
            color: '#fff', height: 36, padding: '0 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', letterSpacing: -0.1,
            transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
        >
          ▶ Present
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 999,
            color: '#fff', height: 36, padding: '0 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', letterSpacing: -0.1,
            transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          title="Public read-only link — anyone can open it without an account"
        >
          🔗 Share
        </button>

        {/* Download button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDownloadOpen((o) => !o); setExportReady(null); setExportError(null) }}
            disabled={exporting}
            style={{
              background: '#fff',
              border: 'none',
              color: '#0A0907',
              borderRadius: 999, height: 36, padding: '0 16px',
              fontSize: 13, fontWeight: 600, cursor: exporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              whiteSpace: 'nowrap', letterSpacing: -0.1,
              opacity: exporting ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!exporting) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)' }}
            onMouseLeave={e => { if (!exporting) (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            {exporting ? (
              <>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(10,9,7,0.25)', borderTopColor: '#0A0907', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Exporting {exportProgress}%
              </>
            ) : '↓ Download'}
          </button>

          {/* Format picker dropdown */}
          {downloadOpen && !exporting && (
            <div
              style={{
                position: 'absolute', top: 44, right: 0, zIndex: 100,
                background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                minWidth: 180,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Choose format
              </div>
              {(['pptx', 'html'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', padding: '10px 14px',
                    color: '#e2e8f0', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: fmt === 'html' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ fontSize: 18 }}>{fmt === 'pptx' ? '📊' : '🌐'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmt.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                      {fmt === 'pptx' ? 'PowerPoint file' : 'Web HTML file'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share URL banner */}
      {shareUrl && (
        <div style={{
          background: '#0f1f2d', color: '#7dd3fc',
          padding: '10px 20px', fontSize: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ fontWeight: 600 }}>{shareCopied ? '✓ Link copied — share it with anyone:' : '🔗 Public link (anyone can view, no login):'}</span>
          <input
            readOnly
            value={shareUrl}
            onFocus={e => e.currentTarget.select()}
            style={{
              flex: '0 1 480px', minWidth: 0, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              color: '#e2e8f0', padding: '4px 8px', fontSize: 12, fontFamily: 'monospace',
            }}
          />
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl)
                setShareCopied(true)
              } catch { /* noop */ }
            }}
            style={{ background: 'none', border: '1px solid rgba(125,211,252,0.4)', color: '#7dd3fc', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Copy
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 600 }}
          >
            Open ↗
          </a>
          <button onClick={() => { setShareUrl(null); setShareCopied(false) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Export ready / error banner */}
      {(exportReady || exportError) && (
        <div style={{
          background: exportReady ? '#0f2d1f' : '#2d0f0f',
          color: exportReady ? '#4ade80' : '#f87171',
          padding: '8px 20px', fontSize: 12, textAlign: 'center', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {exportReady ? (
            <>
              <span>✓ Your file is ready — you can download now</span>
              <button
                onClick={() => exportApi.download(exportReady.jobId, `presentation.${exportReady.format}`)}
                style={{ background: 'none', border: 'none', color: '#86efac', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              >
                Download
              </button>
              <button onClick={() => setExportReady(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          ) : (
            <>
              <span>{exportError}</span>
              <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left slide strip */}
        <div style={{
          width: 168, flexShrink: 0,
          background: '#0f0f1a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Add slide menu (Title / Agenda / Content / Blank) */}
          <AddSlideMenu onPick={addSlideOfKind} />

          {/* Slide thumbnails */}
          <div style={{ padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slides.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                style={{
                  position: 'relative',
                  opacity: dragIdx === i ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  outline: dragOver === i && dragIdx !== i ? '2px solid #6366f1' : 'none',
                  borderRadius: 8,
                }}
              >
                <button
                  onClick={() => { setActiveSlide(i); setSelectedBlockId(null); setEditingBlockId(null) }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCtxMenu({ index: i, x: e.clientX, y: e.clientY })
                  }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'grab' }}
                >
                  <div style={{
                    border: `2px solid ${i === activeSlide ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 7, overflow: 'hidden', transition: 'border-color 0.15s',
                    lineHeight: 0,
                  }}>
                    <SlidePreview slide={s} theme={themeObj} scale={0.116} />
                  </div>
                  <div style={{ color: i === activeSlide ? '#a5b4fc' : 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                    {s.order}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center canvas */}
        <div
          ref={centerRef}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative', background: canvasBg,
            transition: 'background 0.4s ease',
          }}
          onClick={() => {
            setSelectedBlockId(null); setEditingBlockId(null)
            setDownloadOpen(false)
          }}
        >
          {/* Floating editor toolbar */}
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30,
          }}>
            <EditorToolbar
              block={selectedBlock}
              saveStatus={saveStatus}
              onStylingChange={(u) => selectedBlock && updateStyling(selectedBlock.id, u)}
              onInsertText={handleInsertText}
              onInsertImage={handleInsertImageClick}
              onInsertChart={handleInsertChart}
              onAddSlide={insertSlideAfterCurrent}
              onApplyLayout={applyLayoutToCurrentSlide}
              onPreview={enterPresent}
              onDelete={handleDeleteSelected}
              onEditChart={selectedBlock?.type === 'chart' ? handleEditChart : undefined}
            />
          </div>

          {currentSlide && (
            <SlidePreview
              slide={currentSlide}
              theme={themeObj}
              scale={canvasScale}
              selectedBlockId={selectedBlockId}
              editingBlockId={editingBlockId}
              onBlockClick={handleBlockClick}
              onBlockDoubleClick={handleBlockDoubleClick}
              onBlockContentChange={handleBlockContentChange}
              editable
              onBlockPositionChange={handleBlockPositionChange}
            />
          )}

          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {currentSlide?.order} / {slides.length}
            {'  ·  Click to select  ·  Drag to move  ·  Double-click to edit  ·  Del to remove'}
          </div>
        </div>

        {/* Right property panel */}
        {selectedBlock && (
          <div style={{
            width: 232, flexShrink: 0,
            background: '#13131f',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', padding: 16,
          }}>
            <PropertyPanel
              block={selectedBlock}
              onStylingChange={(u) => updateStyling(selectedBlock.id, u)}
              onContentChange={(c) => updateContent(selectedBlock.id, c)}
              onImageUpload={(url) => updateContent(selectedBlock.id, url)}
              dark
            />
          </div>
        )}

        {/* Right AI chat panel */}
        {chatOpen && (
          <div style={{
            width: 300, flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <SlideChat
              slide={currentSlide ?? null}
              presentationId={id ?? ''}
              onSlideUpdate={handleSlideUpdate}
            />
          </div>
        )}
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 200,
            background: '#1e1e35', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            minWidth: 160,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem label="Duplicate" icon="⧉" onClick={() => duplicateSlide(ctxMenu.index)} />
          <CtxItem
            label="Move Up"
            icon="↑"
            disabled={ctxMenu.index === 0}
            onClick={() => moveSlide(ctxMenu.index, -1)}
          />
          <CtxItem
            label="Move Down"
            icon="↓"
            disabled={ctxMenu.index === slides.length - 1}
            onClick={() => moveSlide(ctxMenu.index, 1)}
          />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          <CtxItem
            label="Delete"
            icon="🗑"
            danger
            disabled={slides.length <= 1}
            onClick={() => deleteSlide(ctxMenu.index)}
          />
        </div>
      )}

      {/* ── Present mode overlay ── */}
      {presentMode && (
        <PresentOverlay
          slides={slides}
          theme={themeObj}
          current={presentSlide}
          onChangeCurrent={setPresentSlide}
          onExit={() => setPresentMode(false)}
        />
      )}

      {/* Theme panel overlay */}
      {themeOpen && (
        <ThemePanel
          currentThemeId={activeTheme.id}
          onClose={() => setThemeOpen(false)}
          onApply={handleApplyTheme}
        />
      )}

      {/* Chart modal */}
      {chartModalOpen && (
        <ChartModal
          initialType={
            editingChartId
              ? (currentSlide?.blocks.find((b) => b.id === editingChartId)?.chart_type ?? 'bar')
              : 'bar'
          }
          initialData={
            editingChartId
              ? currentSlide?.blocks.find((b) => b.id === editingChartId)?.chart_data
              : undefined
          }
          onCancel={() => { setChartModalOpen(false); setEditingChartId(null) }}
          onSubmit={handleChartSubmit}
        />
      )}

      {/* Hidden file input for image insert */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelected}
        style={{ display: 'none' }}
      />

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function TBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (active ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'),
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        borderRadius: 999, height: 36, padding: '0 16px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        whiteSpace: 'nowrap', letterSpacing: -0.1,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
    >{label}</button>
  )
}

// ── Context menu item ─────────────────────────────────────────────────────────

function CtxItem({ label, icon, onClick, disabled, danger }: {
  label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: '9px 14px', color: disabled ? 'rgba(255,255,255,0.2)' : danger ? '#f87171' : '#e2e8f0',
        fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  )
}

// ── Present mode overlay ──────────────────────────────────────────────────────

function PresentOverlay({ slides, theme, current, onChangeCurrent, onExit }: {
  slides: Slide[]
  theme: Theme
  current: number
  onChangeCurrent: (i: number) => void
  onExit: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return
      const { clientWidth, clientHeight } = containerRef.current
      setScale(Math.min(clientWidth / SLIDE_W, clientHeight / SLIDE_H))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const slide = slides[current]
  const isFirst = current === 0
  const isLast  = current === slides.length - 1

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Slide area */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onClick={() => onChangeCurrent(Math.min(current + 1, slides.length - 1))}
      >
        {slide && (
          <SlidePreview slide={slide} theme={theme} scale={scale} />
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        height: 52, flexShrink: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Slide counter */}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif', minWidth: 60 }}>
          {current + 1} / {slides.length}
        </span>

        {/* Nav arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn label="←" disabled={isFirst} onClick={() => onChangeCurrent(current - 1)} />

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', maxWidth: 320, overflow: 'hidden' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChangeCurrent(i) }}
                style={{
                  width:  i === current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  background: i === current ? '#6366f1' : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <NavBtn label="→" disabled={isLast} onClick={() => onChangeCurrent(current + 1)} />
        </div>

        {/* Exit */}
        <button
          onClick={onExit}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', borderRadius: 7,
            padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            minWidth: 60,
          }}
        >
          ✕ Exit
        </button>
      </div>
    </div>
  )
}

function NavBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: 8,
        background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        fontSize: 16, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  )
}
