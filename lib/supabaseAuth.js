import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// Validate incoming bearer token and return user object { id, email } or null
export async function verifySupabaseToken(bearerToken) {
  if (!bearerToken) return null;
  try {
    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (error) {
      console.warn('supabase getUser error', error.message || error);
      return null;
    }
    return data.user || null;
  } catch (err) {
    console.warn('supabase verify error', err);
    return null;
  }
}
