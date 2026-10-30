export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'facebook';

export type AspectRatioPreset = '16:9' | '9:16' | '1:1' | '4:5';

export type ContentStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string;
  platform: SocialPlatform;
  aspectRatio: AspectRatioPreset;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  script?: string;
  targetDurationSec: number;
}

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'color';

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  type: ClipType;
  start: number; // in seconds on timeline
  duration: number; // length in seconds on timeline
  offset: number; // source offset trim in seconds
  mediaId?: string;
  mediaUrl?: string;
  color?: string; // for color solids
  textContent?: string;
  textStyle?: {
    fontSize: number;
    color: string;
    fontFamily: string;
    bold: boolean;
    bgColor?: string;
  };
  volume: number; // 0 to 1
  muted: boolean;
  opacity: number; // 0 to 1
  scale: number; // 0.1 to 3
  posX: number; // -100 to 100 percentage
  posY: number; // -100 to 100 percentage
  speed: number; // 0.5 to 2
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio';
  muted: boolean;
  locked: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  blobData?: string; // base64 or blob url
  duration?: number;
  width?: number;
  height?: number;
  size: number; // in bytes
  tags: string[];
  folder?: string;
  createdAt: string;
  projectId?: string;
}

export interface ThumbnailLayer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  // Image specific
  imageUrl?: string;
  // Shape specific
  shapeType?: 'rectangle' | 'circle' | 'badge';
  shapeFill?: string;
}

export interface SubtitleSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  bgColor: string;
  position: 'bottom' | 'middle' | 'top';
}

export interface ContentPlanItem {
  id: string;
  title: string;
  platform: SocialPlatform;
  scheduledDate: string; // ISO date string
  status: ContentStatus;
  projectId?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrl?: string;
  notes?: string;
  createdAt: string;
}

export type AIProviderType = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  isDefault: boolean;
  isEnabled: boolean;
  lastTestedStatus?: 'success' | 'failed' | 'untested';
  lastTestedError?: string;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'connected' | 'disconnected' | 'expired';
  connectedAt?: string;
  lastSyncAt?: string;
  permissions: string[];
  channelSubscribers?: string;
}

export interface PublishingJob {
  id: string;
  platform: SocialPlatform;
  title?: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt?: string;
  status: 'draft' | 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed';
  error?: string;
  platformPostUrl?: string;
  retryCount: number;
  createdAt: string;
}

export interface AnalyticsMetric {
  platform: SocialPlatform;
  followers: number;
  totalViews: number;
  avgEngagementRate: number;
  publishedVideosCount: number;
  topPosts: Array<{
    id: string;
    title: string;
    platform: SocialPlatform;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    publishedAt: string;
    url: string;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  handle?: string;
  channelName?: string;
  joinedAt: string;
}

export interface NicheResult {
  id: string;
  title: string;
  tagline: string;
  category: string;
  competition: 'Low' | 'Medium' | 'High';
  rpmEstimate: string; // e.g. "$18 - $38 RPM"
  growthScore: number; // 0 - 100
  targetAudience: string;
  contentFormats: string[];
  topVideoHooks: string[];
  monetizationMethods: string[];
  whyItWorks: string;
}

