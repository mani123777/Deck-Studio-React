export interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface FontSpec {
  family: string
  size: number
  weight: number
}

export interface Fonts {
  heading: FontSpec
  body: FontSpec
  caption: FontSpec
}

export interface Colors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface Theme {
  id: string
  name: string
  colors: Colors
  fonts: Fonts
}

export interface TemplateMetadata {
  total_slides: number
  estimated_duration: number
  default_audience: string
}

export interface TemplateListItem {
  id: string
  name: string
  category: string
  description: string
  thumbnail_url: string
  total_slides: number
  preview_presentation_id: string | null
  tags: string[]
  preview_slide?: Slide | null
  theme?: Theme | null
}

export interface TemplateDetail extends TemplateListItem {
  theme: Theme
  slides: SlideTemplate[]
}

export interface SlideTemplate {
  order: number
  type: string
  blocks: BlockTemplate[]
}

export interface BlockTemplate {
  id: string
  type: string
  content: string
  position: Position
}

export interface Position {
  x: number
  y: number
  w: number
  h: number
}

export interface Styling {
  font_family?: string
  font_size?: number
  font_weight?: number
  color?: string
  background_color?: string
  text_align?: string
}

export interface Block {
  id: string
  type: string
  content: string
  position: Position
  styling: Styling
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image'
  value: string
}

export interface Slide {
  order: number
  type: string
  background?: SlideBackground
  blocks: Block[]
}

export interface PresentationListItem {
  id: string
  title: string
  template_name: string
  theme_id: string
  total_slides: number
  created_at: string
  updated_at: string
  preview_slide?: Slide | null
}

export interface PresentationDetail {
  id: string
  title: string
  description: string
  logo_url: string
  slides: Slide[]
  template_id: string
  theme_id: string
  is_preview: boolean
  created_at: string
  updated_at: string
}

export interface GenerationStartResponse {
  job_id: string
  status: string
}

export interface GenerationStatusResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  presentation_id: string | null
  error_message: string | null
}

export interface ExportStartResponse {
  job_id: string
  status: string
}

export interface ExportStatusResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  file_url: string | null
  file_size: number | null
  error_message: string | null
}

export type ExportFormat = 'html' | 'pptx' | 'pdf'

export interface PreviewResponse {
  slides: Slide[]
  theme: Theme
}

export interface SyncGenerateResponse {
  slides: Slide[]
  theme: Theme
}

export interface CreatePresentationRequest {
  title: string
  description?: string
  slides: Slide[]
  theme_id: string
  template_id?: string
  logo_url?: string
}

export interface CreatePresentationResponse {
  id: string
  title: string
  theme_id: string
  total_slides: number
  created_at: string
}
