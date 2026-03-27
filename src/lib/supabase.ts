import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://nvwznfznueegyvayvbvp.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52d3puZnpudWVlZ3l2YXl2YnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTU4MjAsImV4cCI6MjA5MDEzMTgyMH0.jdV8oKert7ZImIqNWs33sOD7QAUK92b-udQeI7obvek';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
