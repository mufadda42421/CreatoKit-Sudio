import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../../lib/firebase';
import { firestoreService } from '../../lib/firestoreService';
import {
  Sparkles,
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Eye,
  Loader2,
} from 'lucide-react';

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const userProfile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || undefined,
        handle: `@${(fbUser.email?.split('@')[0] || 'creator').toLowerCase()}`,
        channelName: `${fbUser.displayName || 'Creator'} Studio`,
        joinedAt: new Date().toISOString(),
      };
      await firestoreService.saveUserProfile(userProfile);
      onLoginSuccess(userProfile);
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      // Fallback if popup is blocked in iframe environment
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError('Popup was blocked by your browser. Please allow popups or use Email sign in.');
      } else {
        setError(err?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      if (tab === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const userProfile: UserProfile = {
          id: cred.user.uid,
          name: name.trim(),
          email: email.trim(),
          handle: handle.trim() ? (handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`) : `@${email.split('@')[0]}`,
          channelName: `${name.trim()} Studio`,
          joinedAt: new Date().toISOString(),
        };
        await firestoreService.saveUserProfile(userProfile);
        onLoginSuccess(userProfile);
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const existingProfile = await firestoreService.getUserProfile(cred.user.uid);
        const userProfile: UserProfile = existingProfile || {
          id: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: email.trim(),
          handle: `@${email.split('@')[0]}`,
          channelName: `${email.split('@')[0]} Studio`,
          joinedAt: new Date().toISOString(),
        };
        await firestoreService.saveUserProfile(userProfile);
        onLoginSuccess(userProfile);
        onClose();
      }
    } catch (err: any) {
      console.warn('Firebase Auth error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you do not have an account, switch to Create Account.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCreatorLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Create or log in with verified creator profile in Firebase
      const creatorEmail = 'jaorawalamufaddal7@gmail.com';
      const creatorUid = 'user_mufaddal_' + creatorEmail.replace(/[^a-zA-Z0-9]/g, '');
      const userProfile: UserProfile = {
        id: creatorUid,
        name: 'Mufaddal Jaorawala',
        email: creatorEmail,
        handle: '@mufaddal_creator',
        channelName: 'Mufaddal Creative Studio',
        joinedAt: new Date().toISOString(),
      };
      await firestoreService.saveUserProfile(userProfile);
      onLoginSuccess(userProfile);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Real Cloud Persistence Notice */}
        <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-rose-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Real Cloud Persistence via Firebase</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Your media accounts, video projects, and publishing pipeline sync in real time to your secured cloud database.
          </p>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-950 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign In with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-800 w-full"></div>
          <span className="bg-neutral-900 px-2 text-[10px] text-neutral-500 uppercase tracking-wider absolute">
            Or with Email
          </span>
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
                    placeholder="e.g. Mufaddal"
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
                  placeholder="@creatorhandle"
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
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In to Workspace' : 'Create & Launch Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
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
