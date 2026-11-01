import React, { useState } from 'react';
import { Project, AIProviderConfig } from '../../types';
import {
  Sparkles,
  FileText,
  Flame,
  Heading,
  AlignLeft,
  Hash,
  Repeat,
  MessageSquare,
  Copy,
  Check,
  Save,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AIStudioViewProps {
  activeProject: Project | null;
  onUpdateProjectScript: (script: string) => void;
  providers: AIProviderConfig[];
  onOpenSettings: () => void;
  onRequestApiKey: (featureName: string) => void;
  onRequestAuth: (actionName: string) => boolean;
  isAuthenticated: boolean;
}

type AIToolType =
  | 'ideas'
  | 'script'
  | 'hooks'
  | 'titles'
  | 'descriptions'
  | 'hashtags'
  | 'repurpose'
  | 'chat';

export const AIStudioView: React.FC<AIStudioViewProps> = ({
  activeProject,
  onUpdateProjectScript,
  providers,
  onOpenSettings,
  onRequestApiKey,
  onRequestAuth,
  isAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<AIToolType>('script');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToProject, setSavedToProject] = useState(false);

  // Form states
  const [platform, setPlatform] = useState(activeProject?.platform || 'youtube');
  const [niche, setNiche] = useState('Tech & AI Productivity');
  const [topic, setTopic] = useState(activeProject?.name || 'Top 5 AI Tools for Creators in 2026');
  const [targetAudience, setTargetAudience] = useState('YouTubers, video editors, and digital creators');
  const [tone, setTone] = useState('Authoritative, engaging, and crisp');
  const [duration, setDuration] = useState('8 minutes');
  const [language, setLanguage] = useState('English');
  const [repurposeSourceText, setRepurposeSourceText] = useState(activeProject?.script || '');

  // Output text
  const [generatedOutput, setGeneratedOutput] = useState<string>('');

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I am your CreatorKit AI copilot. I have context on your active project: "${activeProject?.name || 'New Project'}" (${activeProject?.platform || 'YouTube'}). How can I assist with your script, hooks, or video structure today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const defaultProvider = providers.find((p) => p.isDefault) || providers[0];

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToProject = () => {
    if (!generatedOutput) return;
    onUpdateProjectScript(generatedOutput);
    setSavedToProject(true);
    setTimeout(() => setSavedToProject(false), 2500);
  };

  const executeGeneration = async (tool: AIToolType) => {
    if (!onRequestAuth('generate AI content')) return;
    if (!defaultProvider?.apiKey && defaultProvider?.type !== 'gemini') {
      onRequestApiKey(`AI Studio (${tool})`);
      return;
    }

    setLoading(true);
    setError(null);
    setSavedToProject(false);

    try {
      let promptText = '';
      let systemPrompt = 'You are CreatorKit AI, a world-class creator studio director, script doctor, and digital marketing expert.';

      if (tool === 'ideas') {
        promptText = `Generate 5 viral, high-retention content ideas for ${platform}.\nNiche: ${niche}\nTarget Audience: ${targetAudience}\nTone: ${tone}\nLanguage: ${language}\n\nFor each idea provide:\n1. Catchy Title\n2. Core Concept & Angle\n3. 3-Second Hook\n4. Recommended Format (Shorts vs Long-form)\n5. High-Converting Call to Action`;
      } else if (tool === 'script') {
        promptText = `Write a comprehensive, professional video production script for ${platform}.\nTopic: ${topic}\nTarget Duration: ${duration}\nTarget Audience: ${targetAudience}\nTone: ${tone}\nLanguage: ${language}\n\nPlease format the output clearly with these exact sections:\n- [OPENING HOOK] (First 5 seconds to stop the scroll)\n- [INTRODUCTION & VALUE PROPOSITION]\n- [SCENE-BY-SCENE MAIN SCRIPT WITH SUGGESTED B-ROLL & SOUND EFFECTS]\n- [CALL TO ACTION & OUTRO]\n- [PINNED COMMENT RECOMMENDATION]`;
      } else if (tool === 'hooks') {
        promptText = `Generate 8 diverse, high-conversion opening hooks for a video about "${topic}" on ${platform}.\nAudience: ${targetAudience}\nTone: ${tone}.\nInclude a mix of:\n- Question hooks\n- Contrarian/Belief-challenging hooks\n- Negative/Mistake warning hooks\n- Story/Transformation hooks\n- Data/Stat hooks`;
      } else if (tool === 'titles') {
        promptText = `Generate 10 magnetic, high-CTR titles for a video about "${topic}" on ${platform}.\nNiche: ${niche}\nTone: ${tone}.\nInclude curiosity gap titles, search-optimized SEO titles, and bold emotional titles.`;
      } else if (tool === 'descriptions') {
        promptText = `Write a high-converting, platform-optimized video description for ${platform}.\nTitle/Topic: ${topic}\nTarget Audience: ${targetAudience}\nInclude:\n- First 2 lines optimized for search preview\n- Concise summary of value\n- Timestamp chapter outline placeholders\n- Call to action with links\n- Creator social handles placeholders`;
      } else if (tool === 'hashtags') {
        promptText = `Provide 25 highly relevant, categorized hashtags for "${topic}" on ${platform}.\nCategorize them into:\n- Broad Niche tags\n- Mid-tier Targeted tags\n- Specific Community tags\nDo NOT make false claims about guaranteed reach; explain genuine audience tagging best practices.`;
      } else if (tool === 'repurpose') {
        promptText = `Repurpose the following creator script/transcript into multiple platform assets:\n\nSOURCE CONTENT:\n"""\n${repurposeSourceText || topic}\n"""\n\nGenerate:\n1. 60-Second TikTok / Reels Script with Visual Cues\n2. YouTube Shorts 30-Second Script\n3. Engaging 5-Post X (Twitter) Thread\n4. Professional LinkedIn Thought Leadership Post\n5. Community Tab Discussion Poll Prompt`;
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tool,
          prompt: promptText,
          systemInstruction: systemPrompt,
          model: defaultProvider?.model || 'gemini-3.8-flash',
          provider: defaultProvider?.type || 'gemini',
          apiKey: defaultProvider?.apiKey,
          baseUrl: defaultProvider?.baseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI content.');
      }

      setGeneratedOutput(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to connect to AI provider.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    if (!onRequestAuth('use AI Chat Assistant')) return;
    if (!defaultProvider?.apiKey && defaultProvider?.type !== 'gemini') {
      onRequestApiKey('AI Chat Assistant');
      return;
    }

    const userText = chatInput.trim();
    setChatInput('');
    const updatedHistory = [...chatMessages, { role: 'user' as const, content: userText }];
    setChatMessages(updatedHistory);
    setLoading(true);
    setError(null);

    try {
      const systemInstruction = `You are CreatorKit AI Copilot. You are collaborating with a content creator on active project "${activeProject?.name || 'Untitled'}" (${activeProject?.platform || 'YouTube'}). Provide actionable, structured advice, script revisions, and creative feedback.`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          prompt: userText,
          chatHistory: updatedHistory,
          systemInstruction,
          model: defaultProvider?.model || 'gemini-3.8-flash',
          provider: defaultProvider?.type || 'gemini',
          apiKey: defaultProvider?.apiKey,
          baseUrl: defaultProvider?.baseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chat response failed.');
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      setError(err?.message || 'Chat request failed.');
    } finally {
      setLoading(false);
    }
  };

  const isGeminiDefault = defaultProvider?.type === 'gemini' && !defaultProvider?.apiKey;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Provider Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-neutral-100">AI Creator Studio</h1>
              {defaultProvider?.apiKey ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Custom Key Active
                </span>
              ) : isGeminiDefault ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Studio AI Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  No Key Set
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Active Provider: <span className="text-neutral-200 font-medium">{defaultProvider?.name}</span> ({defaultProvider?.model})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => onRequestApiKey('AI Studio')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{defaultProvider?.apiKey ? 'Update API Key' : 'Configure BYOK'}</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-2 px-2 py-1"
          >
            Change Provider / Key
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'script' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Full Script Writer</span>
        </button>

        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'ideas' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Viral Content Ideas</span>
        </button>

        <button
          onClick={() => setActiveTab('hooks')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'hooks' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Hook Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('titles')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'titles' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Heading className="w-3.5 h-3.5" />
          <span>CTR Titles</span>
        </button>

        <button
          onClick={() => setActiveTab('descriptions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'descriptions' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Descriptions</span>
        </button>

        <button
          onClick={() => setActiveTab('hashtags')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'hashtags' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Hashtags</span>
        </button>

        <button
          onClick={() => setActiveTab('repurpose')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'repurpose' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Repurpose Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'chat' ? 'bg-neutral-800 text-rose-300 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Chat Assistant</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Panel Content */}
      {activeTab === 'chat' ? (
        /* Multi-turn AI Chat Assistant */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col h-[600px] overflow-hidden">
          <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40 text-xs text-neutral-400 flex items-center justify-between">
            <span>Conversational Studio Copilot with active project context</span>
            <span className="font-mono text-[11px] text-neutral-500">{chatMessages.length} messages</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-xl p-3.5 text-xs whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-neutral-800/80 text-neutral-200 border border-neutral-700/60 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                <span>CreatorKit AI is formulating response...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 flex gap-2">
            <input
              type="text"
              placeholder="Ask for script edits, hook alternatives, camera directions, or topic ideas..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      ) : (
        /* Generator Tools Split (Inputs Left, Generated Output Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <h2 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Generator Parameters
              </h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              >
                <option value="youtube">YouTube (Longform Video)</option>
                <option value="instagram">Instagram (Reels / Feed)</option>
                <option value="tiktok">TikTok Video</option>
                <option value="x">X (Twitter Video & Thread)</option>
                <option value="linkedin">LinkedIn Post</option>
                <option value="facebook">Facebook Page</option>
              </select>
            </div>

            {activeTab === 'repurpose' ? (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Source Script or Transcript</label>
                <textarea
                  rows={8}
                  placeholder="Paste existing long script or transcript here to slice into Shorts, Reels, X threads, and LinkedIn posts..."
                  value={repurposeSourceText}
                  onChange={(e) => setRepurposeSourceText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 resize-none font-mono"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    {activeTab === 'ideas' ? 'Niche & Topic Focus' : 'Video Topic / Working Title'}
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 5 AI Video Editors That Actually Save Time"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Tone & Persona</label>
                    <input
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Target Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 8 mins, 60s"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Language</label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => executeGeneration(activeTab)}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Output...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate with {defaultProvider?.name || 'AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Output Display Column (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col min-h-[500px]">
            {/* Output Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-800/80 bg-neutral-950/40">
              <span className="text-xs font-bold text-neutral-200">Generated Results</span>
              {generatedOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleSaveToProject}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                  >
                    {savedToProject ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savedToProject ? 'Saved to Project' : 'Save as Project Script'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 p-4 overflow-y-auto font-sans text-xs text-neutral-200 leading-relaxed">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  <span>Synthesizing creative content with {defaultProvider?.model}...</span>
                </div>
              ) : generatedOutput ? (
                <div className="whitespace-pre-wrap selection:bg-rose-500/30">
                  {generatedOutput}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
                  <Sparkles className="w-8 h-8 text-neutral-700" />
                  <span>Configure your parameters and click Generate to run the AI engine.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
