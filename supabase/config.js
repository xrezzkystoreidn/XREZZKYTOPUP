// ============================================================
// SUPABASE CONFIG
// ============================================================

// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Environment variables (Vercel)
// PENTING: file HTML di project ini adalah static file biasa (bukan hasil
// build Vite/webpack), jadi `import.meta.env` TIDAK PERNAH ada isinya di
// browser dan `process` TIDAK ADA sama sekali di browser. Memanggil
// `import.meta.env.VITE_SUPABASE_URL` langsung (tanpa optional chaining)
// menyebabkan "TypeError: Cannot read properties of undefined" saat file
// ini di-import, dan itu bikin SEMUA script yang import config.js ikut
// gagal total (app.js, auth.js, dashboard.js, dst).
//
// Solusi: baca dari `window.__ENV__` (di browser) untuk nilai yang di-set
// lewat env.js, dan dari `process.env` (di server/Vercel functions) tanpa
// pernah menyentuh properti dari objek yang undefined.
const isBrowser = typeof window !== 'undefined'
const isNode = typeof process !== 'undefined' && !!process.env

const supabaseUrl =
    (isBrowser && window.__ENV__?.VITE_SUPABASE_URL) ||
    (isNode && process.env.VITE_SUPABASE_URL) ||
    ''

const supabaseAnonKey =
    (isBrowser && window.__ENV__?.VITE_SUPABASE_ANON_KEY) ||
    (isNode && process.env.VITE_SUPABASE_ANON_KEY) ||
    ''

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing!')
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check connection
export const checkConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
        if (error) throw error
        console.log('✅ Supabase connected!')
        return true
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message)
        return false
    }
}

export default supabase