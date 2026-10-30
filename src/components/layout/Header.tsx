import React from 'react';
import { Project, UserProfile } from '../../types';
import { NavView } from './Sidebar';
import { Sun, Moon, Key, FolderSync, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  currentView: NavView;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (projectId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenApiKeyModal: () => void;
}

const VIEW_TITLES: Record<NavView, string> = {
  dashboard: 'Creator Studio Dashboard',
  'ai-studio': 'AI Content Studio',
  'niche-finder': 'Niche & Viral Trend Finder',
  'video-editor': 'Timeline Video Editor',
  'thumbnail-studio': 'Thumbnail & Graphic Studio',
  subtitles: 'Captions & Subtitle Studio',
  'content-planner': 'Content & Schedule Planner',
  'media-library': 'Studio Media Library',
  'social-hub': 'Social Hub & Publishing',
  analytics: 'Creator Analytics & Insights',
  projects: 'Projects & Workspaces',
  settings: 'Studio Settings & AI Providers',
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  projects,
  activeProject,
  onSelectProject,
  theme,
  onToggleTheme,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenApiKeyModal,
}) => {
  return (
    <header className="h-16 px-6 border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Zone 1: Contextual Breadcrumb */}
      <div className="flex items-center gap-2 text-xs min-w-0">
        <span className="text-neutral-400 font-medium whitespace-nowrap">CreatorKit</span>
        <span className="text-neutral-600">/</span>
        <span className="text-neutral-100 font-semibold truncate">{VIEW_TITLES[currentView]}</span>
      </div>

      {/* Zone 2: Project Switcher */}
      <div className="hidden md:flex items-center gap-2">
        <FolderSync className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-xs text-neutral-400">Project:</span>
        {projects.length > 0 ? (
          <select
            value={activeProject?.id || ''}
            onChange={(e) => onSelectProject(e.target.value)}
            className="text-xs bg-neutral-950/80 border border-neutral-800 rounded-md px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-rose-500 max-w-[200px] truncate"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.platform})
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-neutral-500 italic bg-neutral-950/60 border border-neutral-800/60 rounded-md px-2.5 py-1">
            No projects yet
          </span>
        )}
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <PWAInstallButton />

        <button
          onClick={onOpenApiKeyModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 transition-colors"
          title="Configure AI API Key (BYOK)"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">API Key</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account / Auth Status */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-200 leading-tight max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight truncate">
                    {currentUser.channelName || currentUser.handle || 'Creator'}
                  </span>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign out of CreatorKit"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-800/80 text-neutral-400 border border-neutral-700/50">
                Explore Mode
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
