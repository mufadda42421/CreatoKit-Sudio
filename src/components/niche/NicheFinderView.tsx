import React, { useState } from 'react';
import { NicheResult, Project, SocialPlatform, AIProviderConfig } from '../../types';
import {
  Compass,
  Sparkles,
  TrendingUp,
  DollarSign,
  Target,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Plus,
  Loader2,
  Layers,
  Flame,
  ArrowRight,
  Shield,
  Zap,
  Key,
} from 'lucide-react';

interface NicheFinderViewProps {
  onStartProjectInNiche: (niche: NicheResult) => void;
  onRequestApiKey: () => void;
  onRequestAuth: (actionName: string) => boolean;
  providers: AIProviderConfig[];
  isAuthenticated: boolean;
}

export const NicheFinderView: React.FC<NicheFinderViewProps> = ({
  onStartProjectInNiche,
  onRequestApiKey,
  onRequestAuth,
  providers,
  isAuthenticated,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('youtube');
  const [competitionFilter, setCompetitionFilter] = useState<'all' | 'Low' | 'Medium'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);

  // Clean empty state with no pre-baked demo info
  const [niches, setNiches] = useState<NicheResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  const defaultProvider = providers.find((p) => p.isDefault) || providers[0];

  const handleScanNiches = async () => {
    // Check authentication
    if (!onRequestAuth('scan new niches with AI')) {
      return;
    }

    setScanError(null);
    setIsScanning(true);
    try {
      const prompt = `Analyze current digital content trends on ${selectedPlatform} and return 3 high-potential, underserved creator niches.
Focus Query: "${topicInput || selectedCategory || 'Trending Creator Niches'}"
Target Platform: ${selectedPlatform}
Competition Preference: ${competitionFilter}

Format the response strictly as a JSON array of 3 objects with these exact keys:
[
  {
    "id": "niche_generated_1",
    "title": "Niche Title",
    "tagline": "One clear sentence describing value",
    "category": "${selectedCategory === 'all' ? 'Tech & Software' : selectedCategory}",
    "competition": "Low",
    "rpmEstimate": "$20 - $40 RPM",
    "growthScore": 92,
    "targetAudience": "Specific demographics and psychology",
    "contentFormats": ["Format 1", "Format 2", "Format 3"],
    "topVideoHooks": ["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"],
    "monetizationMethods": ["Stream 1", "Stream 2", "Stream 3"],
    "whyItWorks": "Concrete commercial reason why this niche is underserved"
  }
]`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'niche',
          prompt,
          systemInstruction: 'You are an elite digital creator strategist and YouTube algorithm research director. Always output valid JSON only.',
          model: defaultProvider?.model || 'gemini-3.8-flash',
          provider: defaultProvider?.type || 'gemini',
          apiKey: defaultProvider?.apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Niche scan failed.');

      // Extract JSON from response (handling markdown fences)
      const rawText = data.text || '';
      let parsed = null;
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Try cleaning markdown
          const cleaned = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        setNiches(parsed);
      } else {
        setScanError('Unable to parse scanner results. Please click "Scan Niches" again.');
      }
    } catch (err: any) {
      setScanError(err?.message || 'Niche scanner notice: unable to complete scan at this moment.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook);
    setCopiedHook(hook);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const filteredNiches = niches.filter((n) => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (competitionFilter !== 'all' && n.competition !== competitionFilter) return false;
    if (topicInput.trim()) {
      const q = topicInput.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.tagline.toLowerCase().includes(q) ||
        n.targetAudience.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
              CreatorKit Intelligence
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-100">AI Niche Finder & Opportunity Scanner</h1>
          <p className="text-xs text-neutral-400 max-w-2xl">
            Scan high-growth, low-competition content niches. Dissect estimated RPM, target audience psychology, high-retention video hooks, and monetization angles.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={onRequestApiKey}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>API Key / AI Provider</span>
          </button>

          <button
            onClick={handleScanNiches}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Scanning Real Niches...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scan Trending Niches with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scanError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center justify-between gap-3">
          <span>{scanError}</span>
          <button
            onClick={onRequestApiKey}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-semibold text-[11px] shrink-0"
          >
            Configure API Key
          </button>
        </div>
      )}

      {/* Query and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Search keyword (e.g. software, fitness, finance, gaming)..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            <option value="Tech & Software">Tech, AI & Software</option>
            <option value="Health & Science">Health, Fitness & Longevity</option>
            <option value="Business & Finance">Business, Micro-Assets & Finance</option>
            <option value="Productivity">Personal Productivity & Habits</option>
            <option value="Creative Production">Filmmaking & Creative Tools</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 capitalize"
          >
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="x">X (Twitter)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value as any)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Competition</option>
            <option value="Low">Low Competition</option>
            <option value="Medium">Medium Competition</option>
          </select>
        </div>
      </div>

      {/* Niche Cards Grid or Clean Empty State */}
      {filteredNiches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 text-rose-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-200">No Niches Scanned Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Ready to find high-growth, underserved content opportunities? Click below to run a live scan targeting {selectedPlatform}.
            </p>
          </div>
          <button
            onClick={handleScanNiches}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm"
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isScanning ? 'Scanning...' : 'Scan Niches with AI'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredNiches.map((niche) => (
            <div
              key={niche.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5 hover:border-neutral-700 transition-all shadow-sm"
            >
              {/* Header: Title, Category, RPM & Growth */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                      {niche.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        niche.competition === 'Low'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {niche.competition} Competition
                    </span>
                    <span className="text-[11px] font-mono text-rose-300 font-bold bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      {niche.rpmEstimate}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-neutral-100">{niche.title}</h2>
                  <p className="text-xs text-neutral-400">{niche.tagline}</p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    if (onRequestAuth('start a project in this niche')) {
                      onStartProjectInNiche(niche);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm shrink-0 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Project in this Niche</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Target Audience</span>
                  <p className="text-neutral-300 leading-relaxed">{niche.targetAudience}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Why It Works</span>
                  <p className="text-neutral-300 leading-relaxed">{niche.whyItWorks}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Monetization Streams</span>
                  <ul className="text-neutral-300 space-y-0.5">
                    {niche.monetizationMethods.map((m, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Formats */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                  <Layers className="w-3 h-3" />
                  <span>Suggested Formats:</span>
                </span>
                {niche.contentFormats.map((fmt, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px]">
                    {fmt}
                  </span>
                ))}
              </div>

              {/* Proven Video Hooks */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Tested Video Hooks for {niche.title}</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">Click hook to copy</span>
                </div>

                <div className="space-y-1.5">
                  {niche.topVideoHooks.map((hook, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCopyHook(hook)}
                      className="group flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-colors"
                    >
                      <span className="text-neutral-300 group-hover:text-neutral-100 pr-3">"{hook}"</span>
                      <button
                        type="button"
                        className="text-neutral-500 group-hover:text-rose-400 shrink-0 transition-colors"
                      >
                        {copiedHook === hook ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
