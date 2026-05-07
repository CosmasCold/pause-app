// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type UserTier = 'free' | 'pro' | 'team'

export interface UserProfile {
  id: string
  email: string
  tier: UserTier
  analyses_today: number
  last_analysis_date: string
  created_at: string
  stripe_customer_id?: string
  team_id?: string
}

interface BiasEntry {
  type: string
  confidence: number
  excerpt: string
  explanation: string
}

interface EmotionalToneEntry {
  start: string
  middle: string
  end: string
  shift: string
  intensity: string
}

export interface SavedAnalysis {
  id: string
  user_id: string
  original_text: string
  context: string
  regret_score: number
  biases: BiasEntry[]
  emotional_tone: EmotionalToneEntry
  created_at: string
  is_favorite: boolean
}