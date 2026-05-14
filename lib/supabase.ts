import { createClient } from '@supabase/supabase-js'

// Bunlar senin Supabase panelindeki Project Settings > API kısmından:
const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co'
const supabaseAnonKey ='sb_publishable_P9bpx7ID2MIa1WZz5SoHlw_BRRP7-Cq';
export const supabase = createClient(supabaseUrl, supabaseAnonKey)





















