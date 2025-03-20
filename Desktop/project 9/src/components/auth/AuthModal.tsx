import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';

interface AuthModalProps {
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgotPassword' | 'resetPassword';

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle, error } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation();

  // Check URL parameters for reset password mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('show') === 'resetPassword') {
      setMode('resetPassword');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        onClose();
      } else if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (mode === 'forgotPassword') {
        // Send password reset email
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        setSuccessMessage('Password reset link sent! Check your email inbox.');
      } else if (mode === 'resetPassword') {
        // Validate passwords match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Update password
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        setSuccessMessage('Your password has been reset successfully!');
        // Switch back to sign in mode after successful reset
        setTimeout(() => {
          setMode('signin');
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'signin': return 'Sign In';
      case 'forgotPassword': return 'Reset Password';
      case 'resetPassword': return 'Set New Password';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'signin': return 'Sign In';
      case 'forgotPassword': return 'Send Reset Link';
      case 'resetPassword': return 'Update Password';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#2A2A2A] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b border-[#333333]">
          <h2 className="text-xl font-semibold text-white">
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(error || localError) && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error || localError}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{successMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Email field - shown in all modes except resetPassword */}
            {mode !== 'resetPassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded-lg text-white focus:ring-2 focus:ring-[#FFD23F] focus:border-transparent"
                    placeholder="Enter your email"
                    required={mode !== 'resetPassword'}
                  />
                </div>
              </div>
            )}

            {/* Password field - not shown in forgotPassword mode */}
            {mode !== 'forgotPassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {mode === 'resetPassword' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded-lg text-white focus:ring-2 focus:ring-[#FFD23F] focus:border-transparent"
                    placeholder={mode === 'resetPassword' ? 'Enter new password' : 'Enter your password'}
                    required={mode !== 'forgotPassword'}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password field - only shown in resetPassword mode */}
            {mode === 'resetPassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded-lg text-white focus:ring-2 focus:ring-[#FFD23F] focus:border-transparent"
                    placeholder="Confirm your new password"
                    required={mode === 'resetPassword'}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-[#FFD23F] text-[#1C1C1C] rounded-lg hover:bg-[#FFD23F]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </button>

          {/* Password reset link - only shown in signin mode */}
          {mode === 'signin' && (
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode('forgotPassword')}
                className="text-gray-400 hover:text-white"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Back to login - only shown in forgotPassword mode */}
          {mode === 'forgotPassword' && (
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-gray-400 hover:text-white"
              >
                Back to login
              </button>
            </div>
          )}

          {/* Only show alternative auth methods for signin/signup */}
          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#333333]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#2A2A2A] text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center px-4 py-2 bg-[#1C1C1C] text-white border border-[#333333] rounded-lg hover:bg-[#333333]"
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-4 h-4 mr-2"
                />
                Google
              </button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[#FFD23F] hover:text-[#FFD23F]/80"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}