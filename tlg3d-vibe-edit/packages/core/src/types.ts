// ===== USER & PROJECT TYPES =====
export interface TLG3DUser {
  id: string;
  platform: 'discord' | 'telegram' | 'slack' | 'sms' | 'imessage';
  platformId: string;
  username: string;
  email?: string;
  createdAt: Date;
  projectsPath: string;
}

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  duration: number; // seconds
  fps: number;
  resolution: string; // e.g., "1920x1080"
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  assets: VideoAsset[];
  timeline: TimelineSegment[];
  metadata: ProjectMetadata;
}

export interface VideoAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text';
  filename: string;
  path: string;
  duration?: number;
  size: number;
  uploadedAt: Date;
}

export interface TimelineSegment {
  id: string;
  assetId: string;
  startTime: number;
  endTime: number;
  position: number;
  effects: VideoEffect[];
  transitions: Transition[];
}

export interface VideoEffect {
  id: string;
  name: string; // blur, sharpen, color_grade, style_transfer, etc.
  params: Record<string, any>;
  startTime: number;
  endTime: number;
}

export interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'wipe' | 'dissolve' | 'zoom';
  duration: number;
  easing: string;
}

export interface ProjectMetadata {
  tags: string[];
  script?: string;
  voiceover?: VoiceoverConfig;
  subtitles?: SubtitleConfig;
  colorGrade?: ColorGradeConfig;
}

export interface VoiceoverConfig {
  enabled: boolean;
  provider: string; // ElevenLabs, Google TTS, etc.
  voice: string;
  speed: number;
  audioPath?: string;
}

export interface SubtitleConfig {
  enabled: boolean;
  language: string;
  autoGenerate: boolean;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  font: string;
  size: number;
  color: string;
  background: string;
}

export interface ColorGradeConfig {
  enabled: boolean;
  preset?: string;
  temperature: number;
  saturation: number;
  contrast: number;
}

// ===== MESSAGING TYPES =====
export interface MessagePayload {
  userId: string;
  platform: string;
  platformId: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  type: string;
  url: string;
  filename?: string;
}

// ===== AGENT SKILL TYPES =====
export interface AgentSkill {
  name: string;
  description: string;
  execute: (context: AgentContext) => Promise<any>;
}

export interface AgentContext {
  userId: string;
  projectId?: string;
  params: Record<string, any>;
  llmRouter: any;
}

// ===== LLM PROVIDER TYPES =====
export interface LLMProvider {
  name: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}
