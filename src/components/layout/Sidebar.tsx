import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  Video,
  Image as ImageIcon,
  Captions,
  CalendarDays,
  FolderOpen,
  Share2,
  BarChart3,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Project } from '../../types';

export type NavView =
  | 'dashboard'
  | 'ai-studio'
  | 'niche-finder'
  | 'video-editor'
  | 'thumbnail-studio'
  | 'subtitles'
  | 'content-planner'
  | 'media-library'
  | 'social-hub'
  | 'analytics'
  | 'projects'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProject: Project | null;
  onOpenNewProjectModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  activeProject,
  onOpenNewProjectModal,
}) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-studio', label: 'AI Studio', icon: Sparkles },
    { id: 'niche-finder', label: 'Niche Finder', icon: Compass },
    { id: 'video-editor', label: 'Video Editor', icon: Video },
    { id: 'thumbnail-studio', label: 'Thumbnail Studio', icon: ImageIcon },
    { id: 'subtitles', label: 'Captions & Subtitles', icon: Captions },
    { id: 'content-planner', label: 'Content Planner', icon: CalendarDays },
    { id: 'media-library', label: 'Media Library', icon: FolderOpen },
    { id: 'social-hub', label: 'Social Hub', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 border-r border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-800/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
              C
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-neutral-100">CreatorKit</span>
              <span className="text-[11px] text-neutral-400 font-normal">All-in-One Studio</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-sm">
            C
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Action: New Project */}
      <div className="p-3 border-b border-neutral-800/60">
        <button
          onClick={onOpenNewProjectModal}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm ${
            collapsed ? 'px-0' : ''
          }`}
          title="Create New Project"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : 'text-neutral-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Active Project Footer Card */}
      {!collapsed && activeProject && (
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
            Active Workspace
          </div>
          <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-neutral-300">
              {activeProject.thumbnailUrl ? (
                <img src={activeProject.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                'CK'
              )}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-medium text-neutral-200 truncate">{activeProject.name}</div>
              <div className="text-[10px] text-neutral-500 capitalize">{activeProject.platform} · {activeProject.aspectRatio}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
