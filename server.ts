// lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

export const createServiceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
