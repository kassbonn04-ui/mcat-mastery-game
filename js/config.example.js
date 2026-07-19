/**
 * Copy this file to js/config.js and fill in values from Supabase.
 * For Netlify, the build script generates js/config.js from env vars instead.
 *
 * Safe to expose: supabaseUrl + supabaseAnonKey (protected by Row Level Security).
 * NEVER put the service_role key in the frontend.
 */
window.ARCANUM_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
};
