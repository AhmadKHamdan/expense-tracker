import { createClient } from '@supabase/supabase-js'

// The anon key is public by design — data access is protected by row-level security.
const SUPABASE_URL = 'https://icrljqukkggfoyfozcwc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcmxqcXVra2dnZm95Zm96Y3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTg3MDUsImV4cCI6MjA5ODg5NDcwNX0.OVRzXO0W2kyV3-KfV5PLj7aoDKm8CTFTpFOPsUqm9d8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
