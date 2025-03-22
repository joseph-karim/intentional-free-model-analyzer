import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get the current site URL for redirects
const configuredSiteUrl = import.meta.env.VITE_SITE_URL;
const isDevelopment = import.meta.env.DEV;
const netlifyUrl = 'https://animated-druid-260eae.netlify.app';
const customDomain = 'https://insights.reviveagent.com';
const localUrl = window.location.origin;

// Priority order: 
// 1. Environment variable VITE_SITE_URL if set
// 2. Current origin if it contains one of our known domains
// 3. Custom domain in production, Netlify URL as fallback
// 4. Local development URL
const currentOrigin = window.location.origin;
const isKnownProductionDomain = 
  currentOrigin.includes('reviveagent.com') || 
  currentOrigin.includes('animated-druid-260eae.netlify.app');

// Ensure the site URL is properly formatted
let siteUrl = configuredSiteUrl || 
  (isKnownProductionDomain ? currentOrigin : 
    isDevelopment ? localUrl : customDomain);

// Make sure the URL doesn't have trailing slashes
if (siteUrl.endsWith('/')) {
  siteUrl = siteUrl.slice(0, -1);
}

// Log all URL information for debugging
console.log(`Auth URL Debug Information:`);
console.log(`- Configured site URL: ${configuredSiteUrl}`);
console.log(`- Current origin: ${currentOrigin}`);
console.log(`- Is known production domain: ${isKnownProductionDomain}`);
console.log(`- Is development: ${isDevelopment}`);
console.log(`- Final site URL for auth redirects: ${siteUrl}`);

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      flowType: 'pkce',
      site_url: siteUrl,
      redirectTo: `${siteUrl}/auth/callback`
    }
  }
);

export async function signInWithGoogle() {
  try {
    // Get the current origin
    console.log('Redirecting to:', siteUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false, // Ensure direct browser redirect
      }
    });
    
    if (error) {
      console.error('Google Auth Error:', error);
      throw error;
    }
    
    console.log('Auth response:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error during Google sign-in:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveAnalysis(analysis: {
  productDescription: string;
  idealUser?: any;
  outcomes?: any;
  challenges?: any;
  solutions?: any;
  selectedModel?: string;
  features?: any;
  userJourney?: any;
  analysisResults?: any;
  analysis_results?: any;
}) {
  // Get current user if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use actual user ID if authenticated, otherwise use anonymous ID
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';

  // Convert properties to match database column names
  const dbAnalysis: any = {
    user_id: userId,
    product_description: analysis.productDescription
  };
  
  if (analysis.idealUser) dbAnalysis.ideal_user = analysis.idealUser;
  if (analysis.outcomes) dbAnalysis.outcomes = analysis.outcomes;
  if (analysis.challenges) dbAnalysis.challenges = analysis.challenges;
  if (analysis.solutions) dbAnalysis.solutions = analysis.solutions;
  if (analysis.selectedModel) dbAnalysis.selected_model = analysis.selectedModel;
  if (analysis.features) dbAnalysis.features = analysis.features;
  if (analysis.userJourney) dbAnalysis.user_journey = analysis.userJourney;
  
  // Handle either naming convention for analysis results
  if (analysis.analysisResults) dbAnalysis.analysis_results = analysis.analysisResults;
  else if (analysis.analysis_results) dbAnalysis.analysis_results = analysis.analysis_results;

  const { data, error } = await supabase
    .from('analyses')
    .insert(dbAnalysis)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAnalyses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAnalysis(id: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getSharedAnalysis(shareId: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnalysis(id: string, analysis: {
  productDescription?: string;
  idealUser?: any;
  outcomes?: any;
  challenges?: any;
  solutions?: any;
  selectedModel?: string;
  features?: any;
  userJourney?: any;
  analysisResults?: any;
  analysis_results?: any;
}) {
  // Convert properties to match database column names
  const dbAnalysis: any = {};
  
  if (analysis.productDescription) dbAnalysis.product_description = analysis.productDescription;
  if (analysis.idealUser) dbAnalysis.ideal_user = analysis.idealUser;
  if (analysis.outcomes) dbAnalysis.outcomes = analysis.outcomes;
  if (analysis.challenges) dbAnalysis.challenges = analysis.challenges;
  if (analysis.solutions) dbAnalysis.solutions = analysis.solutions;
  if (analysis.selectedModel) dbAnalysis.selected_model = analysis.selectedModel;
  if (analysis.features) dbAnalysis.features = analysis.features;
  if (analysis.userJourney) dbAnalysis.user_journey = analysis.userJourney;
  
  // Handle either naming convention for analysis results
  if (analysis.analysisResults) dbAnalysis.analysis_results = analysis.analysisResults;
  else if (analysis.analysis_results) dbAnalysis.analysis_results = analysis.analysis_results;

  const { data, error } = await supabase
    .from('analyses')
    .update(dbAnalysis)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function shareAnalysis(id: string) {
  const { data, error } = await supabase
    .from('analyses')
    .update({
      is_public: true
    })
    .eq('id', id)
    .select('share_id')
    .single();

  if (error) throw error;
  return data.share_id;
}

export async function unshareAnalysis(id: string) {
  const { error } = await supabase
    .from('analyses')
    .update({
      is_public: false
    })
    .eq('id', id);

  if (error) throw error;
}

// Function to send password reset email
export async function sendPasswordResetEmail(email: string) {
  try {
    console.log('Sending password reset email to:', email);
    console.log('Using redirect URL:', `${siteUrl}/auth/callback?type=recovery`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Function to send magic link
export async function sendMagicLink(email: string) {
  try {
    console.log('Sending magic link to:', email);
    console.log('Using redirect URL:', `${siteUrl}/auth/callback?type=magiclink`);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?type=magiclink`
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      throw error;
    }

    console.log('Magic link sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending magic link:', error);
    throw error;
  }
}