import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseClientType = SupabaseClient<any>

let supabaseClient: SupabaseClientType | null = null

const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY environment variable is not set')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export const getSupabaseClient = (): SupabaseClientType => {
  supabaseClient = supabaseClient ?? createSupabaseClient()
  return supabaseClient
}

export const setSupabaseClientForTest = (client: SupabaseClientType) => {
  supabaseClient = client
}
