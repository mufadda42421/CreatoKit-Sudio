import React, { useState, useEffect } from 'react';
import {
  Project,
  MediaAsset,
  TimelineClip,
  TimelineTrack,
  ThumbnailLayer,
  SubtitleSegment,
  SubtitleStyle,
  ContentPlanItem,
  AIProviderConfig,
  SocialAccount,
  PublishingJob,
  UserProfile,
  NicheResult,
} from './types';
import { storage } from './lib/storage';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AuthModal } from './components/auth/AuthModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AIStudioView } from './components/ai/AIStudioView';
import { NicheFinderView } from './components/niche/NicheFinderView';
import { VideoEditorView } from './components/video/VideoEditorView';
import { ThumbnailStudioView } from './components/thumbnail/ThumbnailStudioView';
import { SubtitlesView } from './components/subtitles/SubtitlesView';
import { ContentPlannerView } from './components/planner/ContentPlannerView';
import { MediaLibraryView } from './components/media/MediaLibraryView';
import { SocialHubView } from './components/social/SocialHubView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProjectsView } from './components/projects/ProjectsView';
import { SettingsView } from './components/settings/SettingsView';
import { Video, Layers, Captions } from 'lucide-react';

export default function App() {
  // Navigation & UI state
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Authentication & API Key Modals
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storage.getAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTriggerReason, setAuthTriggerReason] = useState('access CreatorKit studio tools');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyFeatureName, setApiKeyFeatureName] = useState('AI Studio');

  // Core Data States (Synchronous initial hydration)
  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => storage.getCurrentProjectId() || '');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => storage.getMediaAssets());
  const [calendarItems, setCalendarItems] = useState<ContentPlanItem[]>(() => storage.getContentPlanItems());
  const [providers, setProviders] = useState<AIProviderConfig[]>(() => storage.getAIProviders());
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(() => storage.getSocialAccounts());
  const [publishingJobs, setPublishingJobs] = useState<PublishingJob[]>(() => storage.getPublishingJobs());

  // Project-specific data
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>(() => {
    const curId = storage.getCurrentProjectId();
    return curId ? storage.getTimelineTracks(curId) : [];
  });
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>(() => {
    const curId = storage.getCurrentProjectId();
    return curId ? storage.getTimelineClips(curId) : [];
  });
  const [thumbnailLayers, setThumbnailLayers] = useState<ThumbnailLayer[]>(() => {
    const curId = storage.getCurrentProjectId();
    return curId ? storage.getThumbnailLayers(curId) : [];
  });
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(() => {
    const curId = storage.getCurrentProjectId();
    return curId ? storage.getSubtitles(curId) : [];
  });
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(() => {
    const curId = storage.getCurrentProjectId();
    return curId ? storage.getSubtitleStyle(curId) : {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 24,
      color: '#FFFFFF',
      outlineColor: '#000000',
      bgColor: 'rgba(0,0,0,0.7)',
      position: 'bottom',
    };
  });

  // Auth gate helper: allows exploring, but gates any action
  const handleRequestAuth = (actionName: string): boolean => {
    if (currentUser) {
      return true;
    }
    setAuthTriggerReason(actionName);
    setIsAuthModalOpen(true);
    return false;
  };

  const handleSignIn = (user: UserProfile) => {
    storage.saveAuthUser(user);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = () => {
    storage.saveAuthUser(null);
    setCurrentUser(null);
  };

  // API Key request helper
  const handleRequestApiKey = (featureName: string) => {
    setApiKeyFeatureName(featureName);
    setIsApiKeyModalOpen(true);
  };

  // When activeProjectId changes, reload its tracks, clips, thumbnails, subtitles
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    storage.setCurrentProjectId(projectId);
    setTimelineTracks(storage.getTimelineTracks(projectId));
    setTimelineClips(storage.getTimelineClips(projectId));
    setThumbnailLayers(storage.getThumbnailLayers(projectId));
    setSubtitles(storage.getSubtitles(projectId));
    setSubtitleStyle(storage.getSubtitleStyle(projectId));
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Project CRUD
  const handleCreateProject = (newProject: Project) => {
    storage.saveProject(newProject);
    const updated = storage.getProjects();
    setProjects(updated);
    handleSelectProject(newProject.id);
  };

  const handleSaveProject = (project: Project) => {
    storage.saveProject(project);
    setProjects(storage.getProjects());
  };

  const handleDeleteProject = (id: string) => {
    storage.deleteProject(id);
    const updated = storage.getProjects();
    setProjects(updated);
    if (activeProjectId === id && updated[0]) {
      handleSelectProject(updated[0].id);
    }
  };

  // Niche Finder direct project creation
  const handleStartNicheProject = (niche: NicheResult) => {
    if (!handleRequestAuth('create a project from this niche')) return;

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: `${niche.title} - Video Project`,
      description: niche.tagline,
      platform: 'youtube',
      aspectRatio: '16:9',
      targetDurationSec: 480,
      status: 'active',
      script: `[NICHE CONCEPT]\n${niche.title}\nCategory: ${niche.category} | Est. RPM: ${niche.rpmEstimate}\n\n[TOP 5 PROVEN HOOKS]\n${niche.topVideoHooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n[MONETIZATION ROADMAP]\n${niche.monetizationMethods.join(', ')}\n\n[WHY IT WORKS]\n${niche.whyItWorks}\n\n[MAIN VIDEO OUTLINE]\n- Intro & Pattern Interrupt\n- 3 Actionable Insights / Secrets\n- Demonstration / Case Proof\n- Strong Retention Ending & Call to Action`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleCreateProject(newProject);
    storage.saveTimelineTracks(newProject.id, [
      { id: `t_v_${Date.now()}_1`, type: 'video', name: 'Main Video Track', locked: false, muted: false },
      { id: `t_a_${Date.now()}_1`, type: 'audio', name: 'Voiceover & SFX', locked: false, muted: false },
    ]);
    setTimelineTracks(storage.getTimelineTracks(newProject.id));
    setTimelineClips([]);
    setCurrentView('video-editor');
  };

  // Media Asset Handlers
  const handleUploadMedia = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const type: 'video' | 'audio' | 'image' = file.type.startsWith('video')
          ? 'video'
          : file.type.startsWith('audio')
          ? 'audio'
          : 'image';

        const newAsset: MediaAsset = {
          id: `media_${Date.now()}`,
          name: file.name,
          type,
          url: dataUrl,
          size: file.size,
          tags: ['upload', type],
          folder: 'Uploaded Media',
          createdAt: new Date().toISOString(),
          projectId: activeProjectId,
        };

        storage.saveMediaAsset(newAsset);
        setMediaAssets(storage.getMediaAssets());
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteMediaAsset = (id: string) => {
    storage.deleteMediaAsset(id);
    setMediaAssets(storage.getMediaAssets());
  };

  // Timeline Handlers
  const handleSaveTimelineTracks = (tracks: TimelineTrack[]) => {
    setTimelineTracks(tracks);
    if (activeProjectId) storage.saveTimelineTracks(activeProjectId, tracks);
  };

  const handleSaveTimelineClips = (clips: TimelineClip[]) => {
    setTimelineClips(clips);
    if (activeProjectId) storage.saveTimelineClips(activeProjectId, clips);
  };

  // Thumbnail Handlers
  const handleSaveThumbnailLayers = (layers: ThumbnailLayer[]) => {
    setThumbnailLayers(layers);
    if (activeProjectId) storage.saveThumbnailLayers(activeProjectId, layers);
  };

  // Subtitle Handlers
  const handleSaveSubtitles = (segs: SubtitleSegment[]) => {
    setSubtitles(segs);
    if (activeProjectId) storage.saveSubtitles(activeProjectId, segs);
  };

  const handleSaveSubtitleStyle = (style: SubtitleStyle) => {
    setSubtitleStyle(style);
    if (activeProjectId) storage.saveSubtitleStyle(activeProjectId, style);
  };

  // Content Planner Handlers
  const handleSaveContentPlanItem = (item: ContentPlanItem) => {
    storage.saveContentPlanItem(item);
    setCalendarItems(storage.getContentPlanItems());
  };

  const handleDeleteContentPlanItem = (id: string) => {
    storage.deleteContentPlanItem(id);
    setCalendarItems(storage.getContentPlanItems());
  };

  // AI Provider Handlers
  const handleSaveAIProvider = (provider: AIProviderConfig) => {
    storage.saveAIProvider(provider);
    setProviders(storage.getAIProviders());
  };

  const handleDeleteAIProvider = (id: string) => {
    storage.deleteAIProvider(id);
    setProviders(storage.getAIProviders());
  };

  // Social Hub Handlers
  const handleSaveSocialAccount = (account: SocialAccount) => {
    storage.saveSocialAccount(account);
    setSocialAccounts(storage.getSocialAccounts());
  };

  const handleSavePublishingJob = (job: PublishingJob) => {
    storage.savePublishingJob(job);
    setPublishingJobs(storage.getPublishingJobs());
  };

  // Update Script from AI
  const handleUpdateActiveProjectScript = (script: string) => {
    if (!activeProject) return;
    const updated = { ...activeProject, script };
    handleSaveProject(updated);
  };

  // Theme Toggle
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Reset / Export all data
  const handleResetAllData = () => {
    storage.resetAllData();
    window.location.reload();
  };

  const handleExportAllData = () => {
    const json = storage.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creatorkit_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProject={activeProject}
        onOpenNewProjectModal={() => {
          if (handleRequestAuth('create a new project')) {
            setIsNewProjectModalOpen(true);
          }
        }}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={handleSelectProject}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setCurrentView('settings')}
          currentUser={currentUser}
          onOpenAuth={() => {
            setAuthTriggerReason('Sign in to access CreatorKit tools');
            setIsAuthModalOpen(true);
          }}
          onSignOut={handleSignOut}
          onOpenApiKeyModal={() => handleRequestApiKey('CreatorKit BYOK')}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'dashboard' && (
            <DashboardView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={handleSelectProject}
              onNavigate={setCurrentView}
              onOpenNewProject={() => {
                if (handleRequestAuth('create a new project')) {
                  setIsNewProjectModalOpen(true);
                }
              }}
              calendarItems={calendarItems}
              socialAccounts={socialAccounts}
              publishingJobs={publishingJobs}
              onRequestAuth={handleRequestAuth}
            />
          )}

          {currentView === 'ai-studio' && (
            <AIStudioView
              activeProject={activeProject}
              onUpdateProjectScript={handleUpdateActiveProjectScript}
              providers={providers}
              onOpenSettings={() => setCurrentView('settings')}
              onRequestApiKey={handleRequestApiKey}
              onRequestAuth={handleRequestAuth}
              isAuthenticated={!!currentUser}
            />
          )}

          {currentView === 'niche-finder' && (
            <NicheFinderView
              onStartProjectInNiche={handleStartNicheProject}
              onRequestApiKey={() => handleRequestApiKey('Niche Finder')}
              onRequestAuth={handleRequestAuth}
              providers={providers}
              isAuthenticated={!!currentUser}
            />
          )}

          {currentView === 'video-editor' && (
            activeProject ? (
              <VideoEditorView
                project={activeProject}
                tracks={timelineTracks}
                clips={timelineClips}
                onSaveTracks={handleSaveTimelineTracks}
                onSaveClips={handleSaveTimelineClips}
                mediaAssets={mediaAssets}
                onUploadMedia={async (file) => {
                  if (!handleRequestAuth('upload video media')) return;
                  await handleUploadMedia(file);
                }}
              />
            ) : (
              <div className="flex-1 p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">No project selected</h3>
                <p className="text-xs text-neutral-400 max-w-sm text-center">
                  Create a new video project or pick an existing project to launch the multitrack timeline editor.
                </p>
                <button
                  onClick={() => {
                    if (handleRequestAuth('create a project')) {
                      setIsNewProjectModalOpen(true);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Create New Project
                </button>
              </div>
            )
          )}

          {currentView === 'thumbnail-studio' && (
            activeProject ? (
              <ThumbnailStudioView
                project={activeProject}
                layers={thumbnailLayers}
                onSaveLayers={handleSaveThumbnailLayers}
                mediaAssets={mediaAssets}
              />
            ) : (
              <div className="flex-1 p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">No project selected</h3>
                <p className="text-xs text-neutral-400 max-w-sm text-center">
                  Create or select a project to design high-CTR thumbnails and cover graphics.
                </p>
                <button
                  onClick={() => {
                    if (handleRequestAuth('create a project')) {
                      setIsNewProjectModalOpen(true);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Create New Project
                </button>
              </div>
            )
          )}

          {currentView === 'subtitles' && (
            activeProject ? (
              <SubtitlesView
                project={activeProject}
                segments={subtitles}
                onSaveSegments={handleSaveSubtitles}
                style={subtitleStyle}
                onSaveStyle={handleSaveSubtitleStyle}
                mediaAssets={mediaAssets}
              />
            ) : (
              <div className="flex-1 p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <Captions className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">No project selected</h3>
                <p className="text-xs text-neutral-400 max-w-sm text-center">
                  Create or select a project to transcribe speech, edit captions, and style subtitles.
                </p>
                <button
                  onClick={() => {
                    if (handleRequestAuth('create a project')) {
                      setIsNewProjectModalOpen(true);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Create New Project
                </button>
              </div>
            )
          )}

          {currentView === 'content-planner' && (
            <ContentPlannerView
              items={calendarItems}
              onSaveItem={(item) => {
                if (!handleRequestAuth('schedule content')) return;
                handleSaveContentPlanItem(item);
              }}
              onDeleteItem={(id) => {
                if (!handleRequestAuth('modify schedule')) return;
                handleDeleteContentPlanItem(id);
              }}
              projects={projects}
            />
          )}

          {currentView === 'media-library' && (
            <MediaLibraryView
              assets={mediaAssets}
              onUploadMedia={async (file) => {
                if (!handleRequestAuth('upload media asset')) return;
                await handleUploadMedia(file);
              }}
              onDeleteAsset={(id) => {
                if (!handleRequestAuth('delete media asset')) return;
                handleDeleteMediaAsset(id);
              }}
              projects={projects}
            />
          )}

          {currentView === 'social-hub' && (
            <SocialHubView
              accounts={socialAccounts}
              onSaveAccount={handleSaveSocialAccount}
              publishingJobs={publishingJobs}
              onSaveJob={handleSavePublishingJob}
              mediaAssets={mediaAssets}
              projects={projects}
              onUploadMedia={handleUploadMedia}
              onRequestAuth={handleRequestAuth}
              isAuthenticated={!!currentUser}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              accounts={socialAccounts}
              projects={projects}
              onNavigateToSocial={() => setCurrentView('social-hub')}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onOpenNewProjectModal={() => {
                if (handleRequestAuth('create a project')) {
                  setIsNewProjectModalOpen(true);
                }
              }}
              onNavigate={setCurrentView}
              onRequestAuth={handleRequestAuth}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              providers={providers}
              onSaveProvider={handleSaveAIProvider}
              onDeleteProvider={handleDeleteAIProvider}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onResetAllData={handleResetAllData}
              onExportAllData={handleExportAllData}
            />
          )}
        </main>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Auth / Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleSignIn}
        triggerReason={authTriggerReason}
        allowExplore={true}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveKey={handleSaveAIProvider}
        providers={providers}
        featureName={apiKeyFeatureName}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
