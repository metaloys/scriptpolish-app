import { createClient } from '@supabase/supabase-js'

// --- PASTE YOUR KEYS HERE ---
const supabaseUrl = 'https://npgdfecwdzmzxgjnoiwc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZ2RmZWN3ZHptenhnam5vaXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDE3OTMsImV4cCI6MjA3NzQxNzc5M30.c4B-q4F27x-Pca2vnhGoVAorOo_epX7y-iabc3Li_eI'
// -----------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey)