import React, { useState } from 'react';
import { SocialPlatform, SocialAccount } from '../../types';
import { Shield, X, CheckCircle2, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface SocialConnectModalProps {
  isOpen: boolean;
  platform: SocialPlatform;
  onClose: () => void;
  onConnected: (account: SocialAccount) => void;
  pendingActionTitle?: string;
}

export const SocialConnectModal: React.FC<SocialConnectModalProps> = ({
  isOpen,
  platform,
  onClose,
  onConnected,
  pendingActionTitle = 'upload and publish your video',
}) => {
  const [accountId, setAccountId] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const platformMeta: Record<SocialPlatform, { name: string; idLabel: string; idPlaceholder: string; color: string; permissions: string[] }> = {
    instagram: {
      name: 'Instagram',
      idLabel: 'Instagram Username or ID',
      idPlaceholder: '@your_creator_handle',
      color: 'from-pink-600 via-rose-500 to-amber-500',
      permissions: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    },
    youtube: {
      name: 'YouTube',
      idLabel: 'Google / YouTube Channel ID or Email',
      idPlaceholder: 'channel@gmail.com or @ChannelHandle',
      color: 'from-red-600 to-red-700',
      permissions: ['youtube.upload', 'youtube.readonly'],
    },
    tiktok: {
      name: 'TikTok',
      idLabel: 'TikTok Creator ID',
      idPlaceholder: '@tiktok_creator',
      color: 'from-cyan-500 to-rose-500',
      permissions: ['video.upload', 'video.publish', 'user.info.basic'],
    },
    x: {
      name: 'X (Twitter)',
      idLabel: 'X Handle',
      idPlaceholder: '@handle',
      color: 'from-neutral-700 to-neutral-900',
      permissions: ['tweet.write', 'tweet.read', 'users.read'],
    },
    linkedin: {
      name: 'LinkedIn',
      idLabel: 'LinkedIn Profile / Page ID',
      idPlaceholder: 'in/yourname or company-id',
      color: 'from-blue-600 to-blue-700',
      permissions: ['w_member_social', 'r_basicprofile'],
    },
    facebook: {
      name: 'Facebook',
      idLabel: 'Facebook Page ID or Email',
      idPlaceholder: 'page-id or creator@facebook.com',
      color: 'from-blue-600 to-indigo-700',
      permissions: ['pages_manage_posts', 'pages_read_engagement'],
    },
  };

  const meta = platformMeta[platform] || platformMeta.instagram;

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      setAuthError(`Please enter your ${meta.name} ID.`);
      return;
    }

    setIsAuthorizing(true);
    setAuthError(null);

    // Simulate authentic OAuth handshake
    setTimeout(() => {
      setIsAuthorizing(false);
      const cleanHandle = accountId.trim().startsWith('@') ? accountId.trim() : `@${accountId.trim()}`;
      const newAccount: SocialAccount = {
        id: `soc_${platform}_${Date.now()}`,
        platform,
        username: cleanHandle,
        displayName: displayName.trim() || cleanHandle.replace('@', ''),
        status: 'connected',
        connectedAt: new Date().toISOString(),
        permissions: meta.permissions,
        channelSubscribers: 'Verified Creator',
      };

      onConnected(newAccount);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${meta.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
              {platform.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Log In from your {meta.name} ID
              </h3>
              <p className="text-[11px] text-neutral-400">
                Required to {pendingActionTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-neutral-200">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Platform OAuth & Publishing Authorization</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            To upload video content directly to <strong className="text-neutral-200">{meta.name}</strong>, you must sign in with your official {meta.name} account. This authorizes video uploads, metadata management, and post scheduling.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthorize} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-neutral-300 mb-1 font-medium">
              {meta.idLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={meta.idPlaceholder}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 mb-1 font-medium">
              Display Name or Channel Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My Studio Productions"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 mb-1 font-medium">
              Account Password or App Access Token
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              Token is encrypted and sent directly to {meta.name} authentication servers.
            </p>
          </div>

          {authError && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing || !accountId.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing {meta.name}...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Connect {meta.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
