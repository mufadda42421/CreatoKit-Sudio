import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Shield, Sparkles, X, Mail, Lock, User, ArrowRight, CheckCircle2, Video, Film, Eye } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  triggerReason?: string;
  allowExplore?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  triggerReason = 'access CreatorKit tools and studio features',
  allowExplore = true,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password.');
      return;
    }

    if (tab === 'signup' && !name.trim()) {
      setError('Please provide your creator name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        handle: handle.trim() ? (handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`) : `@${email.split('@')[0]}`,
        channelName: `${name.trim() || email.split('@')[0]} Studio`,
        joinedAt: new Date().toISOString(),
      };
      onLoginSuccess(user);
      onClose();
    }, 600);
  };

  const handleQuickCreatorLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        id: `user_creator_${Date.now()}`,
        name: 'Mufaddal Jaorawala',
        email: 'jaorawalamufaddal7@gmail.com',
        handle: '@mufaddal_creator',
        channelName: 'Mufaddal Tech & Creative Studio',
        joinedAt: new Date().toISOString(),
      };
      onLoginSuccess(user);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              C
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                {tab === 'signin' ? 'Sign In to CreatorKit' : 'Create Creator Account'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Sign in to {triggerReason}
              </p>
            </div>
          </div>
          {allowExplore && (
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Guest Explore notice */}
        <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-rose-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Full Creator Studio Access</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            You can freely explore and tour the workspaces in guest mode. Signing in connects your workspace, saves your projects, and unlocks video editing, AI tools, and social publishing.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'signin' ? 'bg-neutral-800 text-rose-300 font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'signup' ? 'bg-neutral-800 text-rose-300 font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-neutral-300 mb-1 font-medium">Your Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-medium">Creator Handle</label>
                <input
                  type="text"
                  placeholder="@alexcreates"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-neutral-300 mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                placeholder="creator@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>{tab === 'signin' ? 'Sign In to Workspace' : 'Create & Launch Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Creator One-Click Sign In */}
        <div className="pt-3 border-t border-neutral-800 space-y-2">
          <button
            type="button"
            onClick={handleQuickCreatorLogin}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Sign In as Creator (1-Click)</span>
          </button>

          {allowExplore && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-center text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>Continue exploring in Guest Mode</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
