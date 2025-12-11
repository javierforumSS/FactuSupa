const SUPABASE_URL = "https://gqhfimpbjocjshjlcdmy.supabase.co";
const SUPABASE_ANON_KEY = "D222$YQ4s6HWew!"; // la que me diste

// Cliente Supabase global
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
