import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://qwiqqlzfgmzaimyhdlph.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXFxbHpmZ216YWlteWhkbHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MDc4NDMsImV4cCI6MjAyOTA4Mzg0M30.d2x_BbxtNA4v7I4dz4GV5rF3EKv9Uwy0gwZECHNvB4s'
export const supabase = createClient(supabaseUrl, supabaseKey);