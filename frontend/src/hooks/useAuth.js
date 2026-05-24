import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = "https://dxtbakphqiopympgewqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGJha3BocWlvcHltcGdld3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY4NzMsImV4cCI6MjA5NDQxMjg3M30.RAJZgvdB1HWuoCFcBezRBXgNc_AgpAoNMLyiumdcHZM";

async function fetchProfileDirect(userId, accessToken) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email,role&id=eq.${userId}&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken || SUPABASE_KEY}`,
        },
      }
    );
    const data = await res.json();
    console.log("Profile fetch result:", data);
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (e) {
    console.error("Profile fetch error:", e);
    return null;
  }
}

export function useAuth() {
  const [user, setUser]       = useState(undefined);
  const [role, setRole]       = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session?.user?.email);

      if (!session?.user) {
        if (mounted) setUser(null);
        return;
      }

      if (mounted) setUser(session.user);

      const p = await fetchProfileDirect(session.user.id, session.access_token);
      console.log("Profile:", p);

      if (mounted) {
        setProfile(p);
        setRole(p?.role || null);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log("Auth event:", event, session?.user?.email);

        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null); setRole(null); setProfile(null);
          return;
        }

        if (event === "SIGNED_IN") {
          setUser(session.user);
          const p = await fetchProfileDirect(session.user.id, session.access_token);
          console.log("Profile on SIGNED_IN:", p);
          if (mounted) { setProfile(p); setRole(p?.role || null); }
        }
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return { user, role, profile, loading: user === undefined, signOut };
}
