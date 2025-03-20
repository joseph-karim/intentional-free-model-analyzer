import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...', location);
        
        // First check for code in query parameters (email links)
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const type = queryParams.get('type');
        
        console.log('Query parameters:', {
          hasCode: !!code,
          type
        });

        // If code exists in query parameters, exchange it for session
        if (code) {
          console.log('Found auth code in query parameters, exchanging for session');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            throw exchangeError;
          }
          
          console.log('Session established via code exchange:', data);
        } else {
          // If no code in query params, check URL hash (OAuth flows)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const hashType = hashParams.get('type');
          
          console.log('Hash parameters:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type: hashType
          });

          if (accessToken) {
            // Set the session with the tokens from the URL hash
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              throw sessionError;
            }

            console.log('Session set successfully via hash params');
          } else {
            // Try to get session normally if no tokens anywhere
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('Session error:', sessionError);
              throw sessionError;
            }

            if (!session) {
              throw new Error('No session found and no auth parameters provided');
            }

            console.log('Session retrieved successfully');
          }
        }

        // Handle different auth types
        if (type === 'recovery' || queryParams.get('type') === 'recovery') {
          // For password recovery, instead of redirecting to a separate page,
          // navigate to home with a query parameter to show the password reset form
          navigate('/?show=resetPassword', { replace: true });
        } else if (type === 'magiclink' || queryParams.get('type') === 'magiclink') {
          // Handle magic link sign in
          navigate('/', { replace: true });
        } else {
          // Default redirect
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        // Don't redirect immediately on error, show the error to the user
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <h3 className="text-xl font-semibold text-white">Authentication Error</h3>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333]"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FFD23F]" />
        <p className="text-gray-400">Completing authentication...</p>
        <p className="text-sm text-gray-500">This may take a moment...</p>
      </div>
    </div>
  );
} 