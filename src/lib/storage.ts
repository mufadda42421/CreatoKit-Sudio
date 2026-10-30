import {
  Project,
  MediaAsset,
  TimelineClip,
  TimelineTrack,
  ContentPlanItem,
  AIProviderConfig,
  SocialAccount,
  PublishingJob,
  SubtitleSegment,
  SubtitleStyle,
  ThumbnailLayer,
  UserProfile,
} from '../types';

const STORAGE_KEYS = {
  VERSION_CHECK: 'creatorkit_clean_v5',
  AUTH_USER: 'creatorkit_auth_user',
  PROJECTS: 'creatorkit_projects',
  CURRENT_PROJECT_ID: 'creatorkit_current_project_id',
  MEDIA_ASSETS: 'creatorkit_media_assets',
  TIMELINE_CLIPS_PREFIX: 'creatorkit_timeline_clips_',
  TIMELINE_TRACKS_PREFIX: 'creatorkit_timeline_tracks_',
  THUMBNAILS_PREFIX: 'creatorkit_thumbnails_',
  SUBTITLES_PREFIX: 'creatorkit_subtitles_',
  SUBTITLE_STYLE_PREFIX: 'creatorkit_subtitle_style_',
  CONTENT_PLANNER: 'creatorkit_content_planner',
  AI_PROVIDERS: 'creatorkit_ai_providers',
  SOCIAL_ACCOUNTS: 'creatorkit_social_accounts',
  PUBLISHING_JOBS: 'creatorkit_publishing_jobs',
  USER_THEME: 'creatorkit_theme',
};

// Safe helper for localStorage
function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage read error:', e);
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage write error:', e);
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage remove error:', e);
  }
}

// Clean default AI providers with NO sample keys
const INITIAL_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini_default',
    name: 'Google Gemini',
    type: 'gemini',
    model: 'gemini-3.8-flash',
    isDefault: true,
    isEnabled: true,
    lastTestedStatus: 'untested',
  },
  {
    id: 'openai_custom',
    name: 'OpenAI',
    type: 'openai',
    model: 'gpt-4o',
    isDefault: false,
    isEnabled: false,
    lastTestedStatus: 'untested',
  },
  {
    id: 'anthropic_custom',
    name: 'Anthropic Claude',
    type: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    isDefault: false,
    isEnabled: false,
    lastTestedStatus: 'untested',
  },
  {
    id: 'openrouter_custom',
    name: 'OpenRouter',
    type: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    isDefault: false,
    isEnabled: false,
    lastTestedStatus: 'untested',
  },
];

// Clean template for social platforms with no demo accounts
const INITIAL_SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'soc_yt',
    platform: 'youtube',
    username: '',
    displayName: 'YouTube Channel',
    status: 'disconnected',
    permissions: ['upload_videos', 'read_analytics', 'manage_metadata'],
  },
  {
    id: 'soc_ig',
    platform: 'instagram',
    username: '',
    displayName: 'Instagram Account',
    status: 'disconnected',
    permissions: ['publish_reels', 'read_insights'],
  },
  {
    id: 'soc_tt',
    platform: 'tiktok',
    username: '',
    displayName: 'TikTok Profile',
    status: 'disconnected',
    permissions: ['direct_post', 'view_creator_info'],
  },
  {
    id: 'soc_x',
    platform: 'x',
    username: '',
    displayName: 'X (Twitter)',
    status: 'disconnected',
    permissions: ['write_tweets', 'upload_media'],
  },
  {
    id: 'soc_li',
    platform: 'linkedin',
    username: '',
    displayName: 'LinkedIn Profile',
    status: 'disconnected',
    permissions: ['share_posts', 'manage_organization'],
  },
  {
    id: 'soc_fb',
    platform: 'facebook',
    username: '',
    displayName: 'Facebook Page',
    status: 'disconnected',
    permissions: ['publish_pages', 'read_insights'],
  },
];

// Perform one-time migration to clear old demo seed data
function ensureCleanSlate() {
  if (typeof window === 'undefined') return;
  const isMigrated = safeGet(STORAGE_KEYS.VERSION_CHECK);
  if (!isMigrated) {
    safeRemove(STORAGE_KEYS.PROJECTS);
    safeRemove(STORAGE_KEYS.CURRENT_PROJECT_ID);
    safeRemove(STORAGE_KEYS.MEDIA_ASSETS);
    safeRemove(STORAGE_KEYS.CONTENT_PLANNER);
    safeRemove(STORAGE_KEYS.PUBLISHING_JOBS);
    safeRemove(STORAGE_KEYS.SOCIAL_ACCOUNTS);
    safeSet(STORAGE_KEYS.VERSION_CHECK, 'true');
  }
}
ensureCleanSlate();

export const storage = {
  // Auth User
  getAuthUser(): UserProfile | null {
    const raw = safeGet(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  },

  saveAuthUser(user: UserProfile | null): void {
    if (user) {
      safeSet(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      safeRemove(STORAGE_KEYS.AUTH_USER);
    }
  },

  // Projects (Clean empty start)
  getProjects(): Project[] {
    const raw = safeGet(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveProject(project: Project): void {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      projects.unshift(project);
    }
    safeSet(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    safeSet(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    if (this.getCurrentProjectId() === id) {
      safeRemove(STORAGE_KEYS.CURRENT_PROJECT_ID);
    }
  },

  getCurrentProjectId(): string | null {
    return safeGet(STORAGE_KEYS.CURRENT_PROJECT_ID);
  },

  setCurrentProjectId(id: string): void {
    safeSet(STORAGE_KEYS.CURRENT_PROJECT_ID, id);
  },

  // Media Assets (Clean empty start)
  getMediaAssets(): MediaAsset[] {
    const raw = safeGet(STORAGE_KEYS.MEDIA_ASSETS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveMediaAsset(asset: MediaAsset): void {
    const assets = this.getMediaAssets();
    const idx = assets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      assets[idx] = asset;
    } else {
      assets.unshift(asset);
    }
    safeSet(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));
  },

  deleteMediaAsset(id: string): void {
    const assets = this.getMediaAssets().filter((a) => a.id !== id);
    safeSet(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));
  },

  // Timeline Tracks & Clips
  getTimelineTracks(projectId: string): TimelineTrack[] {
    if (!projectId) return [];
    const raw = safeGet(STORAGE_KEYS.TIMELINE_TRACKS_PREFIX + projectId);
    if (!raw) {
      const defaultTracks: TimelineTrack[] = [
        { id: 'track_v1', name: 'Main Video (A-Roll)', type: 'video', muted: false, locked: false },
        { id: 'track_v2', name: 'Overlays & B-Roll', type: 'video', muted: false, locked: false },
        { id: 'track_a1', name: 'Voice / Dialogue', type: 'audio', muted: false, locked: false },
        { id: 'track_a2', name: 'Background Music', type: 'audio', muted: false, locked: false },
      ];
      safeSet(STORAGE_KEYS.TIMELINE_TRACKS_PREFIX + projectId, JSON.stringify(defaultTracks));
      return defaultTracks;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveTimelineTracks(projectId: string, tracks: TimelineTrack[]): void {
    if (!projectId) return;
    safeSet(STORAGE_KEYS.TIMELINE_TRACKS_PREFIX + projectId, JSON.stringify(tracks));
  },

  getTimelineClips(projectId: string): TimelineClip[] {
    if (!projectId) return [];
    const raw = safeGet(STORAGE_KEYS.TIMELINE_CLIPS_PREFIX + projectId);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveTimelineClips(projectId: string, clips: TimelineClip[]): void {
    if (!projectId) return;
    safeSet(STORAGE_KEYS.TIMELINE_CLIPS_PREFIX + projectId, JSON.stringify(clips));
  },

  // Thumbnail Layers
  getThumbnailLayers(projectId: string): ThumbnailLayer[] {
    if (!projectId) return [];
    const raw = safeGet(STORAGE_KEYS.THUMBNAILS_PREFIX + projectId);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveThumbnailLayers(projectId: string, layers: ThumbnailLayer[]): void {
    if (!projectId) return;
    safeSet(STORAGE_KEYS.THUMBNAILS_PREFIX + projectId, JSON.stringify(layers));
  },

  // Subtitles
  getSubtitles(projectId: string): SubtitleSegment[] {
    if (!projectId) return [];
    const raw = safeGet(STORAGE_KEYS.SUBTITLES_PREFIX + projectId);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveSubtitles(projectId: string, subs: SubtitleSegment[]): void {
    if (!projectId) return;
    safeSet(STORAGE_KEYS.SUBTITLES_PREFIX + projectId, JSON.stringify(subs));
  },

  getSubtitleStyle(projectId: string): SubtitleStyle {
    const defaultStyle: SubtitleStyle = {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 24,
      color: '#FFFFFF',
      outlineColor: '#000000',
      bgColor: 'rgba(0, 0, 0, 0.75)',
      position: 'bottom',
    };
    if (!projectId) return defaultStyle;
    const raw = safeGet(STORAGE_KEYS.SUBTITLE_STYLE_PREFIX + projectId);
    if (!raw) return defaultStyle;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? { ...defaultStyle, ...parsed } : defaultStyle;
    } catch {
      return defaultStyle;
    }
  },

  saveSubtitleStyle(projectId: string, style: SubtitleStyle): void {
    if (!projectId) return;
    safeSet(STORAGE_KEYS.SUBTITLE_STYLE_PREFIX + projectId, JSON.stringify(style));
  },

  // Content Planner
  getContentPlanItems(): ContentPlanItem[] {
    const raw = safeGet(STORAGE_KEYS.CONTENT_PLANNER);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveContentPlanItem(item: ContentPlanItem): void {
    const items = this.getContentPlanItems();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    safeSet(STORAGE_KEYS.CONTENT_PLANNER, JSON.stringify(items));
  },

  deleteContentPlanItem(id: string): void {
    const items = this.getContentPlanItems().filter((i) => i.id !== id);
    safeSet(STORAGE_KEYS.CONTENT_PLANNER, JSON.stringify(items));
  },

  // AI Providers (BYOK - with NO sample keys)
  getAIProviders(): AIProviderConfig[] {
    const raw = safeGet(STORAGE_KEYS.AI_PROVIDERS);
    if (!raw) {
      safeSet(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(INITIAL_AI_PROVIDERS));
      return INITIAL_AI_PROVIDERS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_AI_PROVIDERS;
    } catch {
      return INITIAL_AI_PROVIDERS;
    }
  },

  saveAIProvider(provider: AIProviderConfig): void {
    const list = this.getAIProviders();
    const idx = list.findIndex((p) => p.id === provider.id);
    if (provider.isDefault) {
      list.forEach((p) => {
        p.isDefault = false;
      });
    }
    if (idx >= 0) {
      list[idx] = provider;
    } else {
      list.push(provider);
    }
    safeSet(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(list));
  },

  deleteAIProvider(id: string): void {
    const list = this.getAIProviders().filter((p) => p.id !== id);
    safeSet(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(list));
  },

  // Social Accounts
  getSocialAccounts(): SocialAccount[] {
    const raw = safeGet(STORAGE_KEYS.SOCIAL_ACCOUNTS);
    if (!raw) {
      safeSet(STORAGE_KEYS.SOCIAL_ACCOUNTS, JSON.stringify(INITIAL_SOCIAL_ACCOUNTS));
      return INITIAL_SOCIAL_ACCOUNTS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SOCIAL_ACCOUNTS;
    } catch {
      return INITIAL_SOCIAL_ACCOUNTS;
    }
  },

  saveSocialAccount(account: SocialAccount): void {
    const list = this.getSocialAccounts();
    const idx = list.findIndex((a) => a.id === account.id || a.platform === account.platform);
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    safeSet(STORAGE_KEYS.SOCIAL_ACCOUNTS, JSON.stringify(list));
  },

  // Publishing Jobs
  getPublishingJobs(): PublishingJob[] {
    const raw = safeGet(STORAGE_KEYS.PUBLISHING_JOBS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  savePublishingJob(job: PublishingJob): void {
    const list = this.getPublishingJobs();
    const idx = list.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      list[idx] = job;
    } else {
      list.unshift(job);
    }
    safeSet(STORAGE_KEYS.PUBLISHING_JOBS, JSON.stringify(list));
  },

  // Export / Reset
  exportAllData(): string {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([_, key]) => {
      data[key] = safeGet(key);
    });
    return JSON.stringify(data, null, 2);
  },

  resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      safeRemove(key);
    });
  },
};
