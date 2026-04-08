import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aflhhrhzqqumibvjyhfc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_JsldCzzRbk85bIKZtF4BTg_o2HPadXH'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
