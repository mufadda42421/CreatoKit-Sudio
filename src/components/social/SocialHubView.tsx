import React, { useState, useRef } from 'react';
import { SocialAccount, PublishingJob, SocialPlatform, MediaAsset, Project } from '../../types';
import { SocialConnectModal } from '../modals/SocialConnectModal';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Calendar,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Image as ImageIcon,
  Loader2,
  Upload,
  Film,
  Video as VideoIcon,
  Play,
  Lock,
} from 'lucide-react';

interface SocialHubViewProps {
  accounts: SocialAccount[];
  onSaveAccount: (account: SocialAccount) => void;
  publishingJobs: PublishingJob[];
  onSaveJob: (job: PublishingJob) => void;
  mediaAssets: MediaAsset[];
  projects: Project[];
  onUploadMedia: (file: File) => Promise<void>;
  onRequestAuth: (actionName: string) => boolean;
  isAuthenticated: boolean;
}

export const SocialHubView: React.FC<SocialHubViewProps> = ({
  accounts,
  onSaveAccount,
  publishingJobs,
  onSaveJob,
  mediaAssets,
  projects,
  onUploadMedia,
  onRequestAuth,
  isAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<'composer' | 'queue' | 'accounts'>('composer');

  // Composer Form States
  const [targetPlatform, setTargetPlatform] = useState<SocialPlatform>('instagram');
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postHashtags, setPostHashtags] = useState('#CreatorKit #ContentCreation');
  const [selectedMediaId, setSelectedMediaId] = useState<string>(mediaAssets[0]?.id || '');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  // Direct video upload state
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);

  // Platform Login Popup State
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [platformForModal, setPlatformForModal] = useState<SocialPlatform>('instagram');
  const [pendingPublishAfterAuth, setPendingPublishAfterAuth] = useState(false);

  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Character limits per platform
  const platformLimits: Record<SocialPlatform, { max: number; requiresTitle: boolean; mediaSupported: string }> = {
    youtube: { max: 5000, requiresTitle: true, mediaSupported: 'Long-form & Shorts Video (MP4, WebM)' },
    instagram: { max: 2200, requiresTitle: false, mediaSupported: 'Reels & Feed Video (9:16 or 1:1 MP4)' },
    tiktok: { max: 2200, requiresTitle: false, mediaSupported: 'Vertical Video (9:16 MP4)' },
    x: { max: 280, requiresTitle: false, mediaSupported: 'Video & Image Media' },
    linkedin: { max: 3000, requiresTitle: false, mediaSupported: 'Video & Image Posts' },
    facebook: { max: 63206, requiresTitle: false, mediaSupported: 'Video & Page Posts' },
  };

  const limitConfig = platformLimits[targetPlatform];
  const fullTextLength = postCaption.length + postHashtags.length + 1;
  const isOverLimit = fullTextLength > limitConfig.max;

  const connectedTargetAccount = accounts.find((a) => a.platform === targetPlatform && a.status === 'connected');

  // Currently attached media object or direct upload
  const selectedMedia = mediaAssets.find((m) => m.id === selectedMediaId);
  const activeMediaUrl = uploadedVideoUrl || selectedMedia?.url;
  const isVideo = uploadedVideoUrl ? true : selectedMedia?.type === 'video' || selectedMedia?.name?.match(/\.(mp4|mov|webm|avi|mkv)$/i);

  // Handle direct file picking from computer
  const handleDirectVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onRequestAuth('upload a video to social hub')) {
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(10);
    setUploadedVideoName(file.name);

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 150);

      // Create object URL for local immediate playback
      const localUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(localUrl);

      // Also register into Media Library
      await onUploadMedia(file);

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadingVideo(false);
      }, 500);
    } catch (err) {
      setIsUploadingVideo(false);
      alert('Error uploading video file.');
    }
  };

  const executePublish = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const hashtagsList = postHashtags.split(' ').map((h) => h.trim()).filter(Boolean);

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetPlatform,
          title: postTitle.trim(),
          caption: postCaption.trim(),
          hashtags: hashtagsList,
          mediaUrl: activeMediaUrl,
          scheduledAt: scheduleTime ? new Date(scheduleTime).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Publishing failed.');
      }

      const newJob: PublishingJob = {
        id: data.jobId,
        platform: targetPlatform,
        title: postTitle.trim(),
        caption: postCaption.trim(),
        mediaUrl: activeMediaUrl || undefined,
        scheduledAt: scheduleTime || undefined,
        status: data.status,
        platformPostUrl: data.platformPostUrl,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      onSaveJob(newJob);
      setSubmitResult({
        success: true,
        message: data.message,
        url: data.platformPostUrl,
      });

      if (!scheduleTime) {
        setPostCaption('');
        setPostTitle('');
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: err?.message || 'Failed to submit publishing job.',
      });
    } finally {
      setIsSubmitting(false);
      setPendingPublishAfterAuth(false);
    }
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;

    // Check main app auth
    if (!onRequestAuth('upload and publish videos to social media')) {
      return;
    }

    if (limitConfig.requiresTitle && !postTitle.trim()) {
      alert(`Title is required for ${targetPlatform}`);
      return;
    }

    // Check if user is logged into the specific target social platform
    if (!connectedTargetAccount) {
      setPlatformForModal(targetPlatform);
      setPendingPublishAfterAuth(true);
      setPlatformModalOpen(true);
      return;
    }

    executePublish();
  };

  const handlePlatformConnected = (newAccount: SocialAccount) => {
    onSaveAccount(newAccount);
    // If user clicked publish and was stopped by login popup, proceed with publishing now!
    if (pendingPublishAfterAuth) {
      setTimeout(() => {
        executePublish();
      }, 400);
    }
  };

  const handleManualConnectClick = (platform: SocialPlatform) => {
    if (!onRequestAuth(`connect your ${platform} account`)) return;
    setPlatformForModal(platform);
    setPendingPublishAfterAuth(false);
    setPlatformModalOpen(true);
  };

  const handleDisconnect = (account: SocialAccount) => {
    onSaveAccount({ ...account, status: 'disconnected', username: '' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">
        <div>
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-500" />
            <span>Social Hub & Multi-Platform Publishing</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Upload videos, connect verified social channels, compose optimized posts, and dispatch releases.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('composer')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'composer' ? 'bg-neutral-800 text-rose-300 font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Video Post Composer
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'queue' ? 'bg-neutral-800 text-rose-300 font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Dispatch Queue ({publishingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'accounts' ? 'bg-neutral-800 text-rose-300 font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Connected Channels
          </button>
        </div>
      </div>

      {/* Tab: Post Composer */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side (7 cols) */}
          <form onSubmit={handlePublishSubmit} className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Compose Video Release
              </span>

              {connectedTargetAccount ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Logged in as {connectedTargetAccount.username}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleManualConnectClick(targetPlatform)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  <Lock className="w-3 h-3" />
                  Sign in with {targetPlatform.toUpperCase()} ID
                </button>
              )}
            </div>

            {/* Target Network Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Publishing Destination</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(['instagram', 'youtube', 'tiktok', 'x', 'linkedin', 'facebook'] as SocialPlatform[]).map((p) => {
                  const isSelected = targetPlatform === p;
                  const acc = accounts.find((a) => a.platform === p && a.status === 'connected');
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTargetPlatform(p)}
                      className={`py-2 px-1.5 rounded-xl text-xs font-medium capitalize transition-all border flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/15 text-rose-300 font-bold shadow-sm'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>{p}</span>
                      <span className={`text-[9px] ${acc ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
                        {acc ? 'Connected' : 'Sign in req'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Attachment Picker & Upload option */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Choose Video to Upload</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {limitConfig.mediaSupported}
                </span>
              </div>

              {/* Direct File Upload button */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="file"
                  ref={videoFileInputRef}
                  onChange={handleDirectVideoUpload}
                  accept="video/*,image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Video File from Computer</span>
                </button>

                <div className="flex-1">
                  <select
                    value={selectedMediaId}
                    onChange={(e) => {
                      setSelectedMediaId(e.target.value);
                      setUploadedVideoUrl(null);
                    }}
                    className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Or Pick from Studio Media Library</option>
                    {mediaAssets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploadingVideo && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-neutral-300">
                    <span>Uploading {uploadedVideoName}...</span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="h-full bg-rose-600 transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* Selected Video confirmation */}
              {activeMediaUrl && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <VideoIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate text-neutral-200 font-medium">
                      {uploadedVideoName || selectedMedia?.name || 'Selected Video Asset'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedVideoUrl(null);
                      setSelectedMediaId('');
                    }}
                    className="text-neutral-500 hover:text-rose-400 text-xs px-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {limitConfig.requiresTitle && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 AI Video Editors Every Creator Needs"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-300">Caption / Video Description</label>
                <span
                  className={`text-[11px] font-mono ${
                    isOverLimit ? 'text-rose-500 font-bold' : 'text-neutral-500'
                  }`}
                >
                  {fullTextLength} / {limitConfig.max} chars
                </span>
              </div>
              <textarea
                rows={4}
                required
                placeholder="Write engaging copy, video summary, hashtags, and call to action..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Hashtags</label>
              <input
                type="text"
                placeholder="#creator #video #reels"
                value={postHashtags}
                onChange={(e) => setPostHashtags(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Schedule Video Release (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            {submitResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  submitResult.success
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                }`}
              >
                <span>{submitResult.message}</span>
                {submitResult.url && (
                  <a
                    href={submitResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold flex items-center gap-1"
                  >
                    <span>View Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || isOverLimit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading & Publishing Video...</span>
                  </>
                ) : scheduleTime ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Queue Video Schedule</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Upload & Publish to {targetPlatform}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Feed Video Preview (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-3">
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Live Feed Player Preview
                </span>
                <span className="text-[11px] text-neutral-400 capitalize">{targetPlatform} Video Player</span>
              </div>

              {/* Feed Card Simulation with actual video preview */}
              <div className="rounded-xl border border-neutral-800 bg-black/90 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-rose-400">
                    {connectedTargetAccount?.username?.slice(1, 3).toUpperCase() || 'CK'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-200">
                      {connectedTargetAccount?.displayName || 'Creator Account'}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {connectedTargetAccount?.username || '@your_id'} · Video Release
                    </div>
                  </div>
                </div>

                {postTitle && <div className="text-xs font-bold text-neutral-100">{postTitle}</div>}

                <div className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {postCaption || 'Your post caption preview will display here as you type...'}
                </div>

                {postHashtags && (
                  <div className="text-xs text-rose-400 font-medium">{postHashtags}</div>
                )}

                {/* Media Preview Box (real Video tag if video) */}
                <div className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 aspect-video flex items-center justify-center relative">
                  {activeMediaUrl ? (
                    isVideo ? (
                      <video
                        src={activeMediaUrl}
                        controls
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={activeMediaUrl}
                        alt="Media attachment preview"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="text-center p-6 text-neutral-500 text-xs flex flex-col items-center gap-2">
                      <Film className="w-8 h-8 text-neutral-700" />
                      <span>No video chosen yet. Click "Choose Video File" above to attach footage.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Direct Upload Pipeline</span>
              </div>
              <p>
                Video binaries are uploaded via official partner endpoints with token authorization and content verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Publishing Queue */}
      {activeTab === 'queue' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden divide-y divide-neutral-800/60">
          <div className="p-4 bg-neutral-950/50 flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-200">Video Publishing & Schedule Queue</span>
            <span className="font-mono text-neutral-500">{publishingJobs.length} records</span>
          </div>

          {publishingJobs.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              No videos currently in queue. Select a video in the Composer tab to upload or schedule.
            </div>
          ) : (
            publishingJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/30 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-200 capitalize">{job.platform}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded capitalize font-medium ${
                        job.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : job.status === 'scheduled'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {job.scheduledAt ? `Scheduled: ${new Date(job.scheduledAt).toLocaleString()}` : 'Direct Upload'}
                    </span>
                  </div>

                  {job.title && <div className="text-xs font-medium text-neutral-100">{job.title}</div>}
                  <div className="text-xs text-neutral-400 line-clamp-1">{job.caption}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {job.platformPostUrl && (
                    <a
                      href={job.platformPostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-400 hover:text-rose-300 underline flex items-center gap-1 font-medium"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Connected Channels */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 capitalize">{acc.platform}</h3>
                  <p className="text-xs text-neutral-400">{acc.displayName}</p>
                  <p className="text-[11px] text-neutral-500 font-mono">{acc.username || 'Not signed in'}</p>
                </div>
                <div
                  className={`text-[11px] px-2.5 py-0.5 rounded-full capitalize font-medium ${
                    acc.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {acc.status}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Granted Permissions</span>
                <div className="flex flex-wrap gap-1">
                  {acc.permissions.map((p) => (
                    <span key={p} className="text-[10px] text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-800/60">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex justify-between items-center">
                <span className="text-[10px] text-neutral-500">
                  {acc.connectedAt ? `Connected ${new Date(acc.connectedAt).toLocaleDateString()}` : 'Sign-in required to post'}
                </span>
                <button
                  onClick={() => {
                    if (acc.status === 'connected') {
                      handleDisconnect(acc);
                    } else {
                      handleManualConnectClick(acc.platform);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    acc.status === 'connected'
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {acc.status === 'connected' ? 'Disconnect' : `Log in with ${acc.platform}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Sign In Popup (e.g. Log in from Instagram ID) */}
      <SocialConnectModal
        isOpen={platformModalOpen}
        platform={platformForModal}
        onClose={() => {
          setPlatformModalOpen(false);
          setPendingPublishAfterAuth(false);
        }}
        onConnected={handlePlatformConnected}
        pendingActionTitle={`upload and publish your video to ${platformForModal}`}
      />
    </div>
  );
};
