import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dxtbakphqiopympgewqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGJha3BocWlvcHltcGdld3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY4NzMsImV4cCI6MjA5NDQxMjg3M30.RAJZgvdB1HWuoCFcBezRBXgNc_AgpAoNMLyiumdcHZM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
  },
  global: {
    headers: {
      "X-Client-Info": "workguardai",
    },
  },
});

// Helper: make authenticated REST API call
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
}
