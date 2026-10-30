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

  // Curated baseline niches that load if no scan has been run yet
  const [niches, setNiches] = useState<NicheResult[]>([
    {
      id: 'niche_1',
      title: 'AI Productivity Tool Architecture for Solo Creators',
      tagline: 'Practical automation workflows replacing 20 hours of manual video production',
      category: 'Tech & AI',
      competition: 'Low',
      rpmEstimate: '$24 - $42 RPM',
      growthScore: 94,
      targetAudience: 'Solo content creators, freelance video editors, remote knowledge workers (Ages 22-40)',
      contentFormats: ['10-Min YouTube Breakdowns', '60-Sec Step-by-Step Reels', 'X Visual Threads'],
      topVideoHooks: [
        '90% of video editors are wasting 15 hours a week doing this one manual step. Here is the AI fix.',
        'I automated my entire YouTube clipping and subtitle workflow with 2 tools.',
        'Stop paying $50/mo for bloated software when these 3 open-source models do it better.',
        'The exact AI stack that helped me publish 4x faster without burning out.',
        'If you still edit B-roll manually in 2026, watch this 60-second shortcut.',
      ],
      monetizationMethods: ['Sponsorships ($1,500 - $5,000 / video)', 'Digital Workflow Templates', 'Affiliate Partnerships'],
      whyItWorks: 'High viewer commercial intent and willingness to purchase software subscriptions result in premier advertiser bids.',
    },
    {
      id: 'niche_2',
      title: 'Micro-Habits & Cognitive Longevity for High Performers',
      tagline: 'Science-backed daily protocols for focus, deep sleep, and sustained mental energy',
      category: 'Health & Science',
      competition: 'Low',
      rpmEstimate: '$18 - $36 RPM',
      growthScore: 91,
      targetAudience: 'Software engineers, founders, and ambitious professionals seeking peak cognitive stamina (Ages 25-45)',
      contentFormats: ['High-Energy Visual Shorts', 'Podcast Deep-Dives', 'Illustrated Whiteboard Explainers'],
      topVideoHooks: [
        'The 10-minute morning protocol neuroscientists use to double afternoon focus.',
        'Why drinking coffee in your first 90 minutes of waking ruins your cortisol curve.',
        '3 micro-habits that completely fixed my 3 PM brain fog.',
        'The non-negotiable sleep stack tested across 500 clinical sleep studies.',
        'Stop doing 2-hour workout routines. This 15-minute protocol builds more stamina.',
      ],
      monetizationMethods: ['Supplements & Nootropics Brand Deals', 'High-Ticket Coaching / Communities', 'Health Tracker Affiliates'],
      whyItWorks: 'High retention driven by evergreen health curiosity and premium wellness advertisers.',
    },
    {
      id: 'niche_3',
      title: 'Zero-Capital Digital Asset Flipping & Newsletters',
      tagline: 'Documenting the rise of micro-media empires built with automated curation',
      category: 'Business & Finance',
      competition: 'Medium',
      rpmEstimate: '$28 - $55 RPM',
      growthScore: 88,
      targetAudience: 'Aspiring digital entrepreneurs and side-hustlers looking for sustainable online businesses',
      contentFormats: ['Case Study Documentaries', 'Weekly Growth Breakdowns', 'Live Audit Shorts'],
      topVideoHooks: [
        'How a 21-year-old built a $14,000/month newsletter working 4 hours on Sundays.',
        'The exact blueprint to acquire your first 5,000 subscribers without spending a dollar on ads.',
        'Don’t build a SaaS in 2026. Build this micro-asset instead.',
        'I audited the top 10 creator businesses. Here is where 80% of their actual revenue comes from.',
        '3 digital business models that require zero inventory and zero staff.',
      ],
      monetizationMethods: ['Premium Newsletter Sponsorships', 'AdSense RPM at highest finance tiers', 'Course & Mastermind Sales'],
      whyItWorks: 'Finance and business topics command the highest advertiser CPMs in digital media.',
    },
  ]);

  const defaultProvider = providers.find((p) => p.isDefault) || providers[0];

  const handleScanNiches = async () => {
    // Check authentication
    if (!onRequestAuth('scan new niches with AI')) {
      return;
    }

    // Check API Key
    if (!defaultProvider?.apiKey) {
      onRequestApiKey();
      return;
    }

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
    "category": "${selectedCategory === 'all' ? 'Tech & Business' : selectedCategory}",
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
          model: defaultProvider.model,
          provider: defaultProvider.type,
          apiKey: defaultProvider.apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Niche scan failed.');

      // Extract JSON from response
      const rawText = data.text || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNiches(parsed);
        }
      }
    } catch (err: any) {
      alert(`Niche scanner notice: ${err?.message || 'Using curated market intel.'}`);
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
    if (selectedCategory !== 'all' && n.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (competitionFilter !== 'all' && n.competition !== competitionFilter) return false;
    if (topicInput.trim()) {
      const q = topicInput.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.tagline.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
            <Compass className="w-4 h-4" />
            <span>Market Intelligence & Creator Strategy</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Creator Niche Finder & RPM Analyzer
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Discover under-served, high-CPM creator niches with proven audience demand, scroll-stopping video hooks, and low saturated competition.
          </p>
        </div>

        <button
          onClick={handleScanNiches}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shrink-0"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning Platform Algorithms...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Run AI Niche Scanner</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Scanner Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search topic or broad interest (e.g. AI Coding, Micro-SaaS, Longevity, Video Production)..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            <option value="Tech & AI">Tech, AI & Software</option>
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
            <option value="all">All Competition Levels</option>
            <option value="Low">Low Competition Only</option>
            <option value="Medium">Medium Competition</option>
          </select>
        </div>
      </div>

      {/* Niche Cards Grid */}
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
                <ul className="text-neutral-300 space-y-0.5 list-disc list-inside">
                  {niche.monetizationMethods.map((m, idx) => (
                    <li key={idx} className="truncate">{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top 5 Proven Video Hooks */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Top 5 High-Retention Video Hooks for this Niche</span>
              </span>

              <div className="space-y-1.5">
                {niche.topVideoHooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/60 text-xs hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-mono text-neutral-500 text-[11px] shrink-0">#{idx + 1}</span>
                      <p className="text-neutral-200 italic font-medium">"{hook}"</p>
                    </div>

                    <button
                      onClick={() => handleCopyHook(hook)}
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-neutral-800 transition-colors shrink-0"
                      title="Copy hook to clipboard"
                    >
                      {copiedHook === hook ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
