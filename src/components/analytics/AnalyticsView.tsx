import React, { useState } from 'react';
import { SocialAccount, Project } from '../../types';
import { storage } from '../../lib/storage';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  Film,
  ExternalLink,
  Info,
} from 'lucide-react';

interface AnalyticsViewProps {
  accounts: SocialAccount[];
  projects: Project[];
  onNavigateToSocial?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ accounts, projects, onNavigateToSocial }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const connectedAccounts = accounts.filter((a) => a.status === 'connected');

  const totalProjectDurationSec = projects.reduce((acc, p) => acc + (p.targetDurationSec || 0), 0);
  const totalClips = projects.reduce((acc, p) => acc + storage.getTimelineClips(p.id).length, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <div>
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <span>Studio & Platform Analytics</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real workspace telemetry and connected social platform performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connectedAccounts.length > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{connectedAccounts.length} Platform{connectedAccounts.length > 1 ? 's' : ''} Synced</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
              <Info className="w-3.5 h-3.5 text-neutral-500" />
              <span>No Social Feeds Connected</span>
            </span>
          )}
        </div>
      </div>

      {/* Real Workspace Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Studio Projects</span>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 font-mono tabular-nums">{projects.length}</div>
          <div className="text-[11px] text-neutral-400 font-medium">Stored in browser IndexedDB</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Planned Duration</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 font-mono tabular-nums">
            {totalProjectDurationSec > 0 ? `${Math.round(totalProjectDurationSec / 60)} min` : '0 min'}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">{totalProjectDurationSec}s total timeline length</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Timeline Media Clips</span>
            <Film className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 font-mono tabular-nums">{totalClips}</div>
          <div className="text-[11px] text-neutral-400 font-medium">Across active timelines</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Connected Channels</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 font-mono tabular-nums">{connectedAccounts.length}</div>
          <div className="text-[11px] text-neutral-400 font-medium">Official API integrations</div>
        </div>
      </div>

      {/* Notice on Real Analytics */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            CreatorKit strictly avoids fabricated demo metrics. Telemetry is sourced directly from your verified studio project database and authenticated social channels.
          </span>
        </div>
      </div>

      {/* Social Accounts & Live Telemetry Status */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-neutral-200">Channel Integration Feeds</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Status of connected publishing channels and analytics sync</p>
          </div>
          {onNavigateToSocial && (
            <button
              onClick={onNavigateToSocial}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Manage in Social Hub
            </button>
          )}
        </div>

        {connectedAccounts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-500">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-neutral-200">No social platforms connected</h3>
              <p className="text-[11px] text-neutral-400 max-w-sm mt-1">
                Link your YouTube, Instagram, TikTok, or X accounts in the Social Hub to access live view counts, retention curves, and engagement telemetry.
              </p>
            </div>
            {onNavigateToSocial && (
              <button
                onClick={onNavigateToSocial}
                className="mt-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Connect Channels Now
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {connectedAccounts.map((acc) => (
              <div key={acc.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-neutral-200 uppercase text-[10px]">
                    {acc.platform.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-200 capitalize">{acc.platform}</div>
                    <div className="text-[11px] text-neutral-400">{acc.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Channel Connected
                    </span>
                    <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                      Last sync: {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleTimeString() : 'Active'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Studio Projects Overview */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-200">Active Studio Project Telemetry</h2>
          <span className="text-xs text-neutral-500 font-mono">{projects.length} registered</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No active projects created in this workspace. Create your first project to view timeline duration and clip statistics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Project Name</th>
                  <th className="py-2.5 px-4 font-semibold">Platform</th>
                  <th className="py-2.5 px-4 font-semibold">Aspect Ratio</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Target Duration</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Timeline Clips</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Last Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {projects.map((p) => {
                  const clipCount = storage.getTimelineClips(p.id).length;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-100">{p.name}</td>
                      <td className="py-3 px-4 capitalize text-neutral-300">{p.platform}</td>
                      <td className="py-3 px-4 font-mono text-neutral-400">{p.aspectRatio}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{p.targetDurationSec}s</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{clipCount}</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-500">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
