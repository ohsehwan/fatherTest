import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://soghyilhoxjuvgrrszcy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2h5aWxob3hqdXZncnJzemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzA0MjYsImV4cCI6MjA3MDEwNjQyNn0.N-84Bw7a7IoJKfKMk_6M9-2KwxyxOYxODHb0TFuW4QQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  name: string
  role: 'admin' | 'user'
  created_at: string
}

export interface Snack {
  id: string
  name: string
  description: string
  image_url?: string
  is_active: boolean
  created_at: string
  created_by: string
}

export interface DailySelection {
  id: string
  user_id: string
  snack_id: string
  date: string
  status: 'selected' | 'delivered' | 'completed'
  created_at: string
  snack?: Snack
  user?: User
}

export interface Review {
  id: string
  selection_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  selection?: DailySelection
}