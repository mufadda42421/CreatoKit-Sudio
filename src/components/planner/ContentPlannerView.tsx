import React, { useState } from 'react';
import { ContentPlanItem, SocialPlatform, ContentStatus, Project } from '../../types';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
} from 'lucide-react';

interface ContentPlannerViewProps {
  items: ContentPlanItem[];
  onSaveItem: (item: ContentPlanItem) => void;
  onDeleteItem: (id: string) => void;
  projects: Project[];
}

export const ContentPlannerView: React.FC<ContentPlannerViewProps> = ({
  items,
  onSaveItem,
  onDeleteItem,
  projects,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating/editing
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>('youtube');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<ContentStatus>('scheduled');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formCaption, setFormCaption] = useState('');
  const [formHashtags, setFormHashtags] = useState('');

  const filteredItems = items.filter((item) => {
    if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;
    if (selectedPlatformFilter !== 'all' && item.platform !== selectedPlatformFilter) return false;
    return true;
  });

  const handleOpenCreateModal = (dateStr?: string) => {
    setEditingItem(null);
    setFormTitle('');
    setFormPlatform('youtube');
    setFormDate(dateStr || new Date().toISOString().split('T')[0]);
    setFormStatus('scheduled');
    setFormProjectId(projects[0]?.id || '');
    setFormCaption('');
    setFormHashtags('#creator #video');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ContentPlanItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormPlatform(item.platform);
    setFormDate(item.scheduledDate);
    setFormStatus(item.status);
    setFormProjectId(item.projectId || '');
    setFormCaption(item.caption || '');
    setFormHashtags((item.hashtags || []).join(' '));
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newItem: ContentPlanItem = {
      id: editingItem ? editingItem.id : `plan_${Date.now()}`,
      title: formTitle.trim(),
      platform: formPlatform,
      scheduledDate: formDate,
      status: formStatus,
      projectId: formProjectId || undefined,
      caption: formCaption.trim(),
      hashtags: formHashtags.split(' ').map((h) => h.trim()).filter(Boolean),
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    onSaveItem(newItem);
    setIsModalOpen(false);
  };

  const handleDuplicate = (item: ContentPlanItem) => {
    const copy: ContentPlanItem = {
      ...item,
      id: `plan_${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    onSaveItem(copy);
  };

  // Calendar dates generation
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <div>
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-rose-500" />
            <span>Content Publishing Calendar</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Plan, organize, and track scheduled content drops across all social channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'month' ? 'bg-neutral-800 text-rose-300 font-semibold' : 'text-neutral-400'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-rose-300 font-semibold' : 'text-neutral-400'
              }`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedPlatformFilter}
          onChange={(e) => setSelectedPlatformFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200"
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="x">X</option>
          <option value="linkedin">LinkedIn</option>
        </select>

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* View Mode: Month Grid */}
      {viewMode === 'month' ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-950/60 text-center text-[11px] font-semibold text-neutral-400 py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-neutral-800/60">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-neutral-950/20" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayItems = filteredItems.filter((item) => item.scheduledDate === dateString);
              const isToday = dayNum === today.getDate();

              return (
                <div
                  key={dateString}
                  onClick={() => handleOpenCreateModal(dateString)}
                  className={`p-1.5 flex flex-col justify-between overflow-hidden cursor-pointer group hover:bg-neutral-800/30 transition-colors ${
                    isToday ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded-full font-mono ${
                        isToday ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 group-hover:text-neutral-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateModal(dateString);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(item);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${
                          item.status === 'published'
                            ? 'bg-emerald-950/60 border-emerald-900/60 text-emerald-300'
                            : item.status === 'scheduled'
                            ? 'bg-rose-950/60 border-rose-900/60 text-rose-300'
                            : item.status === 'ready'
                            ? 'bg-blue-950/60 border-blue-900/60 text-blue-300'
                            : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300'
                        }`}
                      >
                        <span className="capitalize">{item.platform.slice(0, 2)}: </span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* View Mode: List */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden divide-y divide-neutral-800/60">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-500">
              No content items matching filters.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/30 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-100">{item.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 capitalize">
                      {item.platform}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded capitalize font-medium ${
                        item.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : item.status === 'scheduled'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 line-clamp-1">{item.caption || 'No caption written.'}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">Date: {item.scheduledDate}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDuplicate(item)}
                    className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    title="Duplicate post"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    title="Edit details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded text-neutral-500 hover:text-rose-400"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100">
                {editingItem ? 'Edit Scheduled Release' : 'Schedule New Post'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 5 AI Video Editors (YouTube Release)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as SocialPlatform)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="x">X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready to Post</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Linked Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="">No linked project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Caption / Post Body</label>
                <textarea
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="The description or post caption text..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Hashtags (space separated)</label>
                <input
                  type="text"
                  value={formHashtags}
                  onChange={(e) => setFormHashtags(e.target.value)}
                  placeholder="#creatortips #videoediting #ai"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-neutral-400 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
