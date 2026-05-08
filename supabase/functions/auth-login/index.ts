import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface LoginRequest {
  email: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password }: LoginRequest = await req.json();

    // Step 1: Authenticate user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Check if user has been rejected by admin
    const { data: statusCheck } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (statusCheck?.status === 'rejected') {
      return new Response(
        JSON.stringify({ error: 'Your account has been rejected. Please contact the admin for assistance.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Increment session version to invalidate old tokens
    const { data: versionData, error: versionError } = await supabase
      .rpc('increment_session_version', { user_id: authData.user.id });

    if (versionError) {
      console.error('Error incrementing session version:', versionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const newSessionVersion = versionData;

    // Step 3: Update user metadata with new session version
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: {
          session_version: newSessionVersion,
        },
      }
    );

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update session' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Get user profile directly from database (bypass RLS with raw query)
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_profile_by_id', { profile_id: authData.user.id });

    if (profileError || !profileData || profileData.length === 0) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const profile = profileData[0];

    // Step 5: Return success with version info
    // Note: The client needs to re-authenticate to get a token with updated metadata
    return new Response(
      JSON.stringify({
        success: true,
        session_version: newSessionVersion,
        user_id: authData.user.id,
        profile,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
