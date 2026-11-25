// Supabase client for accounts and saved progress.
// Accounts are optional: without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY the
// app runs exactly as before, keeping progress in this browser only.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const accountsEnabled = Boolean(url && anonKey);

export const supabase = accountsEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The app uses hash routes (#/quiz); don't let the client read them as auth callbacks.
        detectSessionInUrl: false,
      },
    })
  : null;
