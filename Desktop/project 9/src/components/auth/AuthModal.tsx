import React, { useState } from 'react';
import { supabase } from '../../services/supabase';

interface AuthModalProps {
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgotPassword';

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage('Sign up successful! Please check your email to verify your account.');
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else if (mode === 'forgotPassword') {
        // Send password reset email using supabase.ts helper function
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        setSuccessMessage('Password reset link sent! Check your email inbox.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Close
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Enter your email"
              required
            />
          </div>

          {mode !== 'forgotPassword' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Enter your password"
                required={mode !== 'forgotPassword'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'signin' && (
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setMode('forgotPassword')}
              className="text-blue-400 hover:text-blue-300"
            >
              Forgot your password?
            </button>
          </div>
        )}

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-400 hover:text-blue-300"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : mode === 'signup'
              ? 'Already have an account? Sign in'
              : 'Back to login'}
          </button>
        </div>
      </div>
    </div>
  );
}
