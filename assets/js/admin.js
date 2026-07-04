// ============================================================
// ADMIN.JS - XREZZKY TOP UP
// ============================================================

import { supabase } from '../supabase/config.js'
import { getCurrentUser } from '../supabase/auth.js'

// ===== ADMIN CHECK =====
document.addEventListener('DOMContentLoaded', async () => {
    const userResult = await getCurrentUser()
    if (!userResult.success) {
        window.location.href = '../login.html'
        return
    }

    // Check if user is admin (role = 'admin')
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userResult.user.id)
        .single()

    // database.sql menganggap 'admin' DAN 'super_admin' sebagai admin
    // (lihat fungsi is_admin()). Sebelumnya di sini cuma dicek === 'admin',
    // jadi user dengan role 'super_admin' malah ditendang keluar dari
    // halaman admin miliknya sendiri.
    if (!['admin', 'super_admin'].includes(userData?.role)) {
        window.location.href = '../dashboard.html'
        return
    }

    // Load admin dashboard
    await loadAdminStats()
    await loadRecentTransactions()
})

async function loadAdminStats() {
    const container = document.querySelector('.admin-stats')
    if (!container) return

    // .select('count') TIDAK mengembalikan jumlah baris — itu mencoba
    // select kolom bernama "count" (yang tidak ada di tabel manapun di
    // sini), jadi hasilnya selalu kosong. Cara yang benar: count: 'exact',
    // head: true, lalu baca properti `count` dari response-nya.
    const [usersCount, transactionsCount, gamesCount, promosCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('games').select('*', { count: 'exact', head: true }),
        supabase.from('promos').select('*', { count: 'exact', head: true })
    ])

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div>
                <div class="stat-number">${usersCount.count || 0}</div>
                <div class="stat-label">Total User</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div>
                <div class="stat-number">${transactionsCount.count || 0}</div>
                <div class="stat-label">Total Transaksi</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div>
                <div class="stat-number">${gamesCount.count || 0}</div>
                <div class="stat-label">Total Game</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎁</div>
            <div>
                <div class="stat-number">${promosCount.count || 0}</div>
                <div class="stat-label">Total Promo</div>
            </div>
        </div>
    `
}

async function loadRecentTransactions() {
    const tbody = document.getElementById('adminRecentBody')
    if (!tbody) return

    const { data } = await supabase
        .from('transactions')
        .select(`
            *,
            users:user_id (full_name, email),
            games:game_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    if (data) {
        tbody.innerHTML = data.map(t => `
            <tr>
                <td>${t.users?.full_name || 'User'}</td>
                <td>${t.games?.name || 'Game'}</td>
                <td>Rp ${t.price.toLocaleString()}</td>
                <td><span class="status-badge ${t.status}">${t.status}</span></td>
                <td>${new Date(t.created_at).toLocaleString('id-ID')}</td>
            </tr>
        `).join('')
    }
}