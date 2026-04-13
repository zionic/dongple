import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 유효한 설정이 없을 때 에러를 방지하기 위한 더미 클라이언트
const mockSupabase = {
  from: () => ({
    select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }), gt: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }),
    insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} })
    })
  }),
  rpc: () => Promise.resolve({ data: null, error: null })
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Mock client is being used.');
}

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase as any;
