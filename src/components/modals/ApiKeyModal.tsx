import React, { useState } from 'react';
import { AIProviderConfig, AIProviderType } from '../../types';
import { Key, Shield, ExternalLink, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (provider: AIProviderConfig) => void;
  providers: AIProviderConfig[];
  featureName?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  providers,
  featureName = 'AI Feature',
}) => {
  const [selectedType, setSelectedType] = useState<AIProviderType>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const defaultModels: Record<AIProviderType, string> = {
    gemini: 'gemini-3.8-flash',
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    custom: 'llama-3.3',
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setTestResult({ success: false, message: 'Please enter a valid API key.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const modelToUse = customModel.trim() || defaultModels[selectedType];

    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedType,
          apiKey: cleanKey,
          baseUrl: selectedType === 'custom' ? baseUrl.trim() : undefined,
          model: modelToUse,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setTestResult({
          success: false,
          message: data.message || 'Key verification failed. Please double check the key.',
        });
        setIsTesting(false);
        return;
      }

      // Save provider
      const existing = providers.find((p) => p.type === selectedType);
      const updatedProvider: AIProviderConfig = {
        id: existing?.id || `prov_${selectedType}_${Date.now()}`,
        name: selectedType === 'gemini' ? 'Google Gemini' : selectedType === 'openai' ? 'OpenAI' : selectedType === 'anthropic' ? 'Anthropic Claude' : 'OpenRouter',
        type: selectedType,
        apiKey: cleanKey,
        baseUrl: selectedType === 'custom' ? baseUrl.trim() : undefined,
        model: modelToUse,
        isDefault: true,
        isEnabled: true,
        lastTestedStatus: 'success',
      };

      onSaveKey(updatedProvider);
      setTestResult({ success: true, message: 'API key verified and saved!' });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getKeyHelpLink = () => {
    switch (selectedType) {
      case 'gemini':
        return { name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' };
      case 'openai':
        return { name: 'OpenAI API Keys', url: 'https://platform.openai.com/api-keys' };
      case 'anthropic':
        return { name: 'Anthropic Console', url: 'https://console.anthropic.com/settings/keys' };
      case 'openrouter':
        return { name: 'OpenRouter Keys', url: 'https://openrouter.ai/keys' };
      default:
        return null;
    }
  };

  const helpLink = getKeyHelpLink();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Add API Key to Continue</h3>
              <p className="text-[11px] text-neutral-400">Required to run {featureName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation */}
        <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-neutral-200">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bring Your Own Key (BYOK) Architecture</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            CreatorKit does not provide demo keys. Please connect your official AI provider key. Your key is stored securely in your browser and sent only through secure server-side proxies.
          </p>
        </div>

        <form onSubmit={handleTestAndSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-neutral-300 mb-1 font-medium">Select AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedType('gemini');
                  setCustomModel('');
                }}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  selectedType === 'gemini'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold">Google Gemini</div>
                <div className="text-[10px] text-neutral-500">gemini-3.8-flash</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('openai');
                  setCustomModel('');
                }}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  selectedType === 'openai'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold">OpenAI</div>
                <div className="text-[10px] text-neutral-500">gpt-4o</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('anthropic');
                  setCustomModel('');
                }}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  selectedType === 'anthropic'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold">Anthropic Claude</div>
                <div className="text-[10px] text-neutral-500">claude-3-5-sonnet</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('openrouter');
                  setCustomModel('');
                }}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                  selectedType === 'openrouter'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold">OpenRouter</div>
                <div className="text-[10px] text-neutral-500">llama-3.3 & others</div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-neutral-300 font-medium">
                {selectedType.toUpperCase()} API Key <span className="text-rose-500">*</span>
              </label>
              {helpLink && (
                <a
                  href={helpLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <span>Get key from {helpLink.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="password"
              required
              autoFocus
              placeholder={selectedType === 'gemini' ? 'AIzaSy...' : selectedType === 'openai' ? 'sk-...' : 'sk-ant-...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border border-emerald-900/60 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-900/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="truncate">{testResult.message}</span>
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
              disabled={isTesting || !apiKey.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Save Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
