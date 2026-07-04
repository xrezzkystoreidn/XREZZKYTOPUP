// ============================================================
// ENV.JS - Konfigurasi environment untuk BROWSER
// ============================================================
// Karena project ini adalah static HTML biasa (tanpa proses build
// Vite/webpack), variabel dari "env" di Vercel (VITE_SUPABASE_URL,
// VITE_SUPABASE_ANON_KEY) TIDAK bisa otomatis masuk ke kode yang
// jalan di browser. File ini isinya di-baca oleh supabase/config.js
// lewat window.__ENV__.
//
// GANTI nilai di bawah ini dengan URL & anon key project Supabase kamu
// (Project Settings > API di dashboard Supabase). Anon key AMAN untuk
// ditaruh di frontend karena akses datanya tetap dibatasi oleh RLS
// policy yang ada di database.sql.
window.__ENV__ = {
    VITE_SUPABASE_URL: 'https://xxxxxxxxxxxxx.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}
