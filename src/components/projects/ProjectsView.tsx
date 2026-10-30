import React, { useState } from 'react';
import { Project, SocialPlatform } from '../../types';
import { NavView } from '../layout/Sidebar';
import {
  Layers,
  Plus,
  Search,
  MoreVertical,
  Film,
  Copy,
  Archive,
  Trash2,
  Edit2,
  Play,
  Clock,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onNavigate: (view: NavView) => void;
  onRequestAuth?: (actionName: string) => boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
  onOpenNewProjectModal,
  onNavigate,
  onRequestAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenNewProject = () => {
    if (onRequestAuth && !onRequestAuth('create a new project')) return;
    onOpenNewProjectModal();
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleStartRename = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (project: Project) => {
    if (!editingName.trim()) return;
    onSaveProject({ ...project, name: editingName.trim() });
    setEditingProjectId(null);
  };

  const handleDuplicate = (project: Project) => {
    const copy: Project = {
      ...project,
      id: `proj_${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveProject(copy);
  };

  const handleToggleArchive = (project: Project) => {
    onSaveProject({
      ...project,
      status: project.status === 'active' ? 'archived' : 'active',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <div>
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-500" />
            <span>Studio Workspaces & Projects</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your long-form videos, short-form reels, drafts, and production scripts.
          </p>
        </div>

        <button
          onClick={handleOpenNewProject}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
          {(['active', 'archived', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-neutral-800 text-rose-300 font-semibold' : 'text-neutral-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 && (
          <div className="col-span-full p-12 rounded-xl border border-neutral-800/80 bg-neutral-900/40 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">No projects found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                {searchQuery
                  ? `No projects matching "${searchQuery}". Try a different keyword.`
                  : 'Get started by creating your first video project.'}
              </p>
            </div>
            <button
              onClick={handleOpenNewProject}
              className="mt-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Project</span>
            </button>
          </div>
        )}

        {filteredProjects.map((p) => {
          const isActive = activeProjectId === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'border-rose-500/60 bg-neutral-900 shadow-md ring-1 ring-rose-500/30'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Thumbnail Header */}
                <div
                  onClick={() => {
                    onSelectProject(p.id);
                    onNavigate('video-editor');
                  }}
                  className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer group"
                >
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-1">
                      <Film className="w-8 h-8" />
                      <span className="text-[11px] font-mono">{p.aspectRatio}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open in Video Editor</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/70 text-neutral-300 backdrop-blur-sm">
                    {p.platform} · {p.aspectRatio}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  {editingProjectId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => handleSaveRename(p)}
                        className="p-1 rounded bg-rose-600 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingProjectId(null)}
                        className="p-1 rounded text-neutral-400 hover:bg-neutral-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => onSelectProject(p.id)}
                        className="text-xs font-bold text-neutral-100 hover:text-rose-400 cursor-pointer line-clamp-1"
                      >
                        {p.name}
                      </h3>
                      <button
                        onClick={() => handleStartRename(p)}
                        className="text-neutral-500 hover:text-neutral-300 p-0.5"
                        title="Rename project"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 line-clamp-2">{p.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 py-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500">
                <span className="font-mono text-[11px]">{new Date(p.updatedAt).toLocaleDateString()}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="p-1.5 rounded hover:bg-neutral-800 hover:text-neutral-300 transition-colors"
                    title="Duplicate project"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleArchive(p)}
                    className="p-1.5 rounded hover:bg-neutral-800 hover:text-neutral-300 transition-colors"
                    title={p.status === 'active' ? 'Archive project' : 'Unarchive project'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === p.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 text-[10px] text-neutral-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-1.5 rounded hover:bg-neutral-800 hover:text-rose-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
