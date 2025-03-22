import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...', location);
        
        // Get code from query params (for email links)
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const type = queryParams.get('type');
        
        // Process auth code if present
        if (code) {
          console.log('Found auth code, exchanging for session');
          await supabase.auth.exchangeCodeForSession(code);
        }

        // Handle different auth types
        if (type === 'recovery') {
          // For password recovery
          navigate('/?show=resetPassword', { replace: true });
        } else {
          // Default redirect
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/?error=auth_callback_error', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p>Completing authentication...</p>
      </div>
    </div>
  );
} 