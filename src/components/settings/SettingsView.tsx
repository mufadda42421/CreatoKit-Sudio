import React, { useState } from 'react';
import { AIProviderConfig, AIProviderType } from '../../types';
import {
  Settings,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Shield,
  HardDrive,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface SettingsViewProps {
  providers: AIProviderConfig[];
  onSaveProvider: (provider: AIProviderConfig) => void;
  onDeleteProvider: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onResetAllData: () => void;
  onExportAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  providers,
  onSaveProvider,
  onDeleteProvider,
  theme,
  onToggleTheme,
  onResetAllData,
  onExportAllData,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Provider Form
  const [newType, setNewType] = useState<AIProviderType>('openai');
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newModel, setNewModel] = useState('gpt-4o');

  const handleTestConnection = async (provider: AIProviderConfig) => {
    setTestingId(provider.id);
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.type,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: provider.model,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          success: data.success,
          message: data.message || (data.success ? 'Connected successfully' : 'Failed to connect'),
        },
      }));

      // Update provider lastTestedStatus
      onSaveProvider({
        ...provider,
        lastTestedStatus: data.success ? 'success' : 'failed',
        lastTestedError: data.success ? undefined : data.message,
      });
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          success: false,
          message: err?.message || 'Connection test timed out.',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProvider: AIProviderConfig = {
      id: `prov_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      apiKey: newKey.trim() || undefined,
      baseUrl: newBaseUrl.trim() || undefined,
      model: newModel.trim() || 'default',
      isDefault: false,
      isEnabled: true,
      lastTestedStatus: 'untested',
    };

    onSaveProvider(newProvider);
    setIsAddModalOpen(false);
    setNewName('');
    setNewKey('');
    setNewBaseUrl('');
  };

  const maskKey = (key?: string) => {
    if (!key) return 'None (Using Server default)';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-rose-500" />
          <span>CreatorKit Studio Preferences & Configurations</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Bring Your Own Key (BYOK) AI providers, storage settings, theme preferences, and desktop runtime info.
        </p>
      </div>

      {/* Section 1: AI Providers & BYOK */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Bring Your Own Key (BYOK) AI Providers</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Connect external AI models securely. Secrets are never exposed to public bundles.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Provider</span>
          </button>
        </div>

        <div className="space-y-3">
          {providers.map((p) => {
            const result = testResults[p.id];
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100">{p.name}</span>
                      {p.isDefault && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                          Active Default
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-500 font-mono uppercase">{p.type}</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Model:{' '}
                      <input
                        type="text"
                        value={p.model}
                        onChange={(e) => onSaveProvider({ ...p, model: e.target.value })}
                        className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!p.isDefault && (
                      <button
                        onClick={() => onSaveProvider({ ...p, isDefault: true })}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleTestConnection(p)}
                      disabled={testingId === p.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
                    >
                      {testingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>{testingId === p.id ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                    {p.id !== 'gemini_default' && (
                      <button
                        onClick={() => onDeleteProvider(p.id)}
                        className="p-1 rounded text-neutral-500 hover:text-rose-400"
                        title="Remove Provider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-500/80" />
                    <span>Secret: <span className="font-mono">{maskKey(p.apiKey)}</span></span>
                  </div>

                  {result && (
                    <div
                      className={`text-xs flex items-center gap-1 font-medium ${
                        result.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{result.message}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Storage & Persistence */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h2 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span>Storage & Offline Persistence</span>
        </h2>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-neutral-200">Local Studio Cache & Assets</div>
            <p className="text-xs text-neutral-400">
              Projects, timeline cuts, thumbnail canvas layers, and media metadata are stored in client storage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportAllData}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700"
            >
              Export JSON Backup
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all CreatorKit studio data to defaults?')) {
                  onResetAllData();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/40"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Appearance & Desktop Packaging */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h2 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <Laptop className="w-3.5 h-3.5 text-purple-400" />
          <span>Appearance & Desktop Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-neutral-200">Interface Theme</div>
              <div className="text-[11px] text-neutral-400">Current: {theme === 'dark' ? 'Dark Studio' : 'Light Studio'}</div>
            </div>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
            <div className="text-xs font-semibold text-neutral-200">Electron Desktop App Ready</div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Modular architecture prepared for packaging with Electron / Tauri with native FFmpeg hardware acceleration.
            </div>
          </div>
        </div>
      </div>

      {/* Add Provider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100">Add AI Provider (BYOK)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">Provider Service</label>
                <select
                  value={newType}
                  onChange={(e) => {
                    const t = e.target.value as AIProviderType;
                    setNewType(t);
                    if (t === 'openai') {
                      setNewName('OpenAI Production');
                      setNewModel('gpt-4o');
                    } else if (t === 'anthropic') {
                      setNewName('Anthropic Claude');
                      setNewModel('claude-3-5-sonnet-20241022');
                    } else if (t === 'openrouter') {
                      setNewName('OpenRouter AI');
                      setNewModel('meta-llama/llama-3.3-70b-instruct');
                    } else {
                      setNewName('Custom LLM Endpoint');
                      setNewModel('llama-3.3');
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="custom">Custom OpenAI-Compatible Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Label Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My OpenAI Key"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">API Key</label>
                <input
                  type="password"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {newType === 'custom' && (
                <div>
                  <label className="block text-neutral-300 mb-1">Base URL Endpoint</label>
                  <input
                    type="url"
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    placeholder="https://api.together.xyz/v1/chat/completions"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-neutral-300 mb-1">Target Model Name</label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded text-neutral-400 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
