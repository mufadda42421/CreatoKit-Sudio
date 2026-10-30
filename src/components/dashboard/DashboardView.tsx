import React from 'react';
import { Project, ContentPlanItem, SocialAccount, PublishingJob } from '../../types';
import { NavView } from '../layout/Sidebar';
import {
  Sparkles,
  Plus,
  Video,
  Calendar,
  Share2,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Film,
  FileText,
  Flame,
  Layers,
  Compass,
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: NavView) => void;
  onOpenNewProject: () => void;
  calendarItems: ContentPlanItem[];
  socialAccounts: SocialAccount[];
  publishingJobs: PublishingJob[];
  onRequestAuth?: (actionName: string) => boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onNavigate,
  onOpenNewProject,
  calendarItems,
  socialAccounts,
  publishingJobs,
  onRequestAuth,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'active');
  const upcomingPosts = calendarItems
    .filter((item) => item.status === 'scheduled' || item.status === 'ready')
    .slice(0, 3);
  const connectedAccounts = socialAccounts.filter((a) => a.status === 'connected');

  const handleCreateProject = () => {
    if (onRequestAuth && !onRequestAuth('create a new project')) return;
    onOpenNewProject();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Welcome Hero Strip */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-rose-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creator Workspace Ready</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-100">
              Welcome to CreatorKit Studio
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              You have <span className="font-semibold text-neutral-200">{activeProjects.length} active projects</span>,{' '}
              <span className="font-semibold text-neutral-200">{upcomingPosts.length} scheduled releases</span>, and{' '}
              <span className="font-semibold text-neutral-200">{connectedAccounts.length} platforms</span> connected.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('niche-finder')}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-2"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Niche Finder</span>
            </button>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('video-editor')}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 text-left transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">Video Editor</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Multitrack timeline & real canvas render</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('niche-finder')}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 text-left transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">Niche Finder</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">CPM, RPM & competition scanner</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('thumbnail-studio')}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 text-left transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">Thumbnail Studio</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Canvas designer with layer ordering</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('social-hub')}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 text-left transition-all group flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">Social Hub</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Direct video uploads & multi-platform</div>
          </div>
        </button>
      </div>

      {/* Main Grid: Projects & Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-400" />
              <h2 className="text-sm font-bold text-neutral-200">Recent Projects</h2>
            </div>
            {projects.length > 0 && (
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>View all projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeProjects.length === 0 ? (
            <div className="p-8 rounded-xl border border-neutral-800/80 bg-neutral-900/40 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">No active projects yet</h3>
                <p className="text-xs text-neutral-400 max-w-sm mt-1">
                  Start fresh by creating your first video project or discover viral high-RPM topics with Niche Finder.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleCreateProject}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Project</span>
                </button>
                <button
                  onClick={() => onNavigate('niche-finder')}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Discover Niches</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 4).map((p) => {
                const isSelected = activeProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700/60 relative group">
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">
                            {p.aspectRatio}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-100 truncate">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                          <span className="capitalize">{p.platform}</span>
                          <span aria-hidden="true">·</span>
                          <span>{p.aspectRatio}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{p.targetDurationSec}s target</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p.id);
                          onNavigate('video-editor');
                        }}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                      >
                        Open Editor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Schedule & Social Overview */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>Upcoming Releases</span>
              </div>
              <button
                onClick={() => onNavigate('content-planner')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
              >
                Planner
              </button>
            </div>

            {upcomingPosts.length === 0 ? (
              <div className="text-xs text-neutral-500 py-4 text-center">
                No posts scheduled yet. Use Content Planner to schedule your drops.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingPosts.map((post) => (
                  <div key={post.id} className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span className="capitalize font-medium text-neutral-300">{post.platform}</span>
                      <span className="font-mono text-neutral-500">{post.scheduledDate}</span>
                    </div>
                    <div className="text-xs font-medium text-neutral-200 line-clamp-1">{post.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Accounts Status */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                <Share2 className="w-4 h-4 text-neutral-400" />
                <span>Publishing Hub</span>
              </div>
              <button
                onClick={() => onNavigate('social-hub')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {socialAccounts.length === 0 ? (
                <div className="text-xs text-neutral-500 py-3 text-center">
                  No accounts linked yet. Connect your channels in Social Hub.
                </div>
              ) : (
                socialAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium text-neutral-200">{acc.platform}</span>
                      <span className="text-[11px] text-neutral-500">{acc.username}</span>
                    </div>
                    <div>
                      {acc.status === 'connected' ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Not connected</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
