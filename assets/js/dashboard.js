// ============================================================
// DASHBOARD.JS - XREZZKY TOP UP
// ============================================================

import { getCurrentUser, logoutUser, updateProfile } from '../supabase/auth.js'
import { getUserTransactions } from '../supabase/database.js'

// ===== DASHBOARD =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const userResult = await getCurrentUser()
    if (!userResult.success) {
        window.location.href = 'login.html'
        return
    }

    const user = userResult.user

    // Greeting
    const greeting = document.getElementById('userGreeting')
    if (greeting) {
        greeting.textContent = `Halo, ${user.full_name || user.username || 'User'}!`
    }

    // Load Stats
    await loadStats(user.id)

    // Load Recent Transactions
    await loadRecentTransactions(user.id)

    // Profile Page
    if (window.location.pathname.includes('profile.html')) {
        loadProfile(user)
    }

    // Logout
    document.querySelectorAll('#logoutBtn, #logoutBtnMobile, #logoutNav, #logoutMobileNav').forEach(btn => {
        btn?.addEventListener('click', async (e) => {
            e.preventDefault()
            const result = await logoutUser()
            if (result.success) {
                window.location.href = 'index.html'
            }
        })
    })

    // Profile Form
    const profileForm = document.getElementById('profileForm')
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const updates = {
                full_name: document.getElementById('fullname').value,
                username: document.getElementById('username').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            }
            const result = await updateProfile(user.id, updates)
            if (result.success) {
                alert('Profil berhasil diperbarui!')
            } else {
                alert('Gagal memperbarui profil: ' + result.error)
            }
        })
    }
})

async function loadStats(userId) {
    const container = document.getElementById('dashboardStats')
    if (!container) return

    // Get transactions
    const result = await getUserTransactions(userId)
    if (!result.success) return

    const transactions = result.data || []
    const total = transactions.reduce((sum, t) => sum + (t.price || 0), 0)
    const successCount = transactions.filter(t => t.status === 'success').length

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div>
                <div class="stat-number">${transactions.length}</div>
                <div class="stat-label">Total Top Up</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div>
                <div class="stat-number">Rp ${total.toLocaleString()}</div>
                <div class="stat-label">Total Belanja</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div>
                <div class="stat-number">${successCount > 0 ? '4.8' : '-'}</div>
                <div class="stat-label">Rating</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎁</div>
            <div>
                <div class="stat-number">${transactions.filter(t => t.status === 'pending').length}</div>
                <div class="stat-label">Proses</div>
            </div>
        </div>
    `
}

async function loadRecentTransactions(userId) {
    const tbody = document.getElementById('recentBody')
    if (!tbody) return

    const result = await getUserTransactions(userId)
    if (!result.success) return

    const transactions = (result.data || []).slice(0, 5)
    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.games?.name || 'Game'}</td>
            <td>Rp ${(t.price || 0).toLocaleString()}</td>
            <td>${new Date(t.created_at).toLocaleDateString('id-ID')}</td>
            <td><span class="status-badge ${t.status === 'success' ? 'success' : t.status === 'pending' ? 'pending' : 'failed'}">${t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Proses' : 'Gagal'}</span></td>
        </tr>
    `).join('')
}

function loadProfile(user) {
    document.getElementById('userName').textContent = user.full_name || user.username || 'User'
    document.getElementById('userEmail').textContent = user.email || ''
    document.getElementById('fullname').value = user.full_name || ''
    document.getElementById('username').value = user.username || ''
    document.getElementById('phone').value = user.phone || ''
    document.getElementById('address').value = user.address || ''
}

// ===== HISTORY PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('history.html')) return

    const userResult = await getCurrentUser()
    if (!userResult.success) {
        window.location.href = 'login.html'
        return
    }

    await loadHistory(userResult.user.id)
})

// State untuk halaman riwayat
let historyAllTransactions = []
let historyCurrentPage = 1
const HISTORY_PAGE_SIZE = 10

async function loadHistory(userId) {
    const list = document.getElementById('historyList')
    if (!list) return

    const result = await getUserTransactions(userId)
    if (!result.success) return

    historyAllTransactions = result.data || []

    // Isi filter game dari game-game yang ada di riwayat user (select
    // #filterGame sebelumnya cuma punya opsi "Semua Game" dan tidak
    // pernah diisi apapun lagi).
    const filterGame = document.getElementById('filterGame')
    if (filterGame && filterGame.options.length <= 1) {
        const seen = new Set()
        historyAllTransactions.forEach(t => {
            const name = t.games?.name
            if (name && !seen.has(name)) {
                seen.add(name)
                const opt = document.createElement('option')
                opt.value = name
                opt.textContent = name
                filterGame.appendChild(opt)
            }
        })
    }

    // Sebelumnya #filterGame, #filterStatus, #prevPage, #nextPage tidak
    // punya event listener sama sekali, jadi tombol/filter itu ada di UI
    // tapi tidak melakukan apa-apa.
    filterGame?.addEventListener('change', () => {
        historyCurrentPage = 1
        renderHistoryPage()
    })
    document.getElementById('filterStatus')?.addEventListener('change', () => {
        historyCurrentPage = 1
        renderHistoryPage()
    })
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (historyCurrentPage > 1) {
            historyCurrentPage--
            renderHistoryPage()
        }
    })
    document.getElementById('nextPage')?.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(getFilteredHistory().length / HISTORY_PAGE_SIZE))
        if (historyCurrentPage < totalPages) {
            historyCurrentPage++
            renderHistoryPage()
        }
    })

    renderHistoryPage()
}

function getFilteredHistory() {
    const gameFilter = document.getElementById('filterGame')?.value || ''
    const statusFilter = document.getElementById('filterStatus')?.value || ''
    return historyAllTransactions.filter(t => {
        if (gameFilter && t.games?.name !== gameFilter) return false
        if (statusFilter && t.status !== statusFilter) return false
        return true
    })
}

function renderHistoryPage() {
    const list = document.getElementById('historyList')
    if (!list) return

    const filtered = getFilteredHistory()
    const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE))
    if (historyCurrentPage > totalPages) historyCurrentPage = totalPages

    const start = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE
    const pageItems = filtered.slice(start, start + HISTORY_PAGE_SIZE)

    if (pageItems.length === 0) {
        list.innerHTML = `<div class="history-empty">Belum ada transaksi.</div>`
    } else {
        list.innerHTML = pageItems.map(t => `
            <div class="history-item">
                <div class="history-game">${t.games?.icon || '🎮'} ${t.games?.name || 'Game'}</div>
                <div class="history-detail">
                    <div>${t.nominal || 0} 💎</div>
                    <div>Rp ${(t.price || 0).toLocaleString()}</div>
                    <div>${new Date(t.created_at).toLocaleString('id-ID')}</div>
                    <span class="status-badge ${t.status === 'success' ? 'success' : t.status === 'pending' ? 'pending' : 'failed'}">${t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Proses' : 'Gagal'}</span>
                </div>
            </div>
        `).join('')
    }

    const pageInfo = document.getElementById('pageInfo')
    if (pageInfo) pageInfo.textContent = `Halaman ${historyCurrentPage} dari ${totalPages}`

    const prevBtn = document.getElementById('prevPage')
    const nextBtn = document.getElementById('nextPage')
    if (prevBtn) prevBtn.disabled = historyCurrentPage <= 1
    if (nextBtn) nextBtn.disabled = historyCurrentPage >= totalPages
}
