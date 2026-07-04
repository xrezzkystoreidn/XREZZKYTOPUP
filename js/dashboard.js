// ============================================================
// DASHBOARD.JS - XREZZKY TOP UP
// ============================================================

import { getCurrentUser, logoutUser, updateProfile, updatePassword } from '../supabase/auth.js'
import { getUserTransactions, getUserStats } from '../supabase/database.js'
import { uploadUserAvatar } from '../supabase/storage.js'

// ===== DASHBOARD =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const userResult = await getCurrentUser()
    if (!userResult.success) {
        window.location.href = 'login.html'
        return
    }

    const user = userResult.user

    // Kasih shortcut ke Admin Panel di nav buat user dengan role
    // admin/super_admin (sebelumnya nav di halaman dashboard/riwayat/profil
    // sama sekali tidak ada jalan pintas ke panel admin).
    if (['admin', 'super_admin'].includes(user.role)) {
        document.querySelectorAll('.nav-menu, .mobile-menu').forEach(menu => {
            const link = document.createElement('a')
            link.href = 'admin/index.html'
            link.textContent = '⚙️ Admin Panel'
            if (menu.tagName === 'UL') {
                const li = document.createElement('li')
                li.appendChild(link)
                menu.appendChild(li)
            } else {
                menu.insertBefore(link, menu.querySelector('.nav-actions'))
            }
        })
    }

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
        loadProfileStats(user.id)
    }

    // Logout
    document.querySelectorAll('#logoutBtn, #logoutBtnMobile, #logoutNav, #logoutMobileNav, #logoutBtnProfile').forEach(btn => {
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
            const msg = document.getElementById('profileMsg')
            const updates = {
                full_name: document.getElementById('fullname').value,
                username: document.getElementById('username').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            }
            const result = await updateProfile(user.id, updates)
            if (msg) {
                msg.textContent = result.success ? 'Profil berhasil diperbarui ✓' : 'Gagal: ' + result.error
                msg.className = 'form-msg ' + (result.success ? 'success' : 'error')
            }
            if (result.success) {
                document.getElementById('userName').textContent = updates.full_name || updates.username
                document.getElementById('userUsername').textContent = '@' + updates.username
            }
        })
    }

    // Password Form
    const passwordForm = document.getElementById('passwordForm')
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const msg = document.getElementById('passwordMsg')
            const newPassword = document.getElementById('newPassword').value
            const confirmPassword = document.getElementById('confirmPassword').value

            if (newPassword !== confirmPassword) {
                if (msg) {
                    msg.textContent = 'Konfirmasi password tidak cocok'
                    msg.className = 'form-msg error'
                }
                return
            }

            const result = await updatePassword(newPassword)
            if (msg) {
                msg.textContent = result.success ? 'Password berhasil diubah ✓' : 'Gagal: ' + result.error
                msg.className = 'form-msg ' + (result.success ? 'success' : 'error')
            }
            if (result.success) passwordForm.reset()
        })
    }

    // Avatar Upload
    const avatarInput = document.getElementById('avatarInput')
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0]
            if (!file) return

            const avatarEl = document.getElementById('userAvatar')
            const originalContent = avatarEl.innerHTML
            avatarEl.innerHTML = '⏳'

            const uploadResult = await uploadUserAvatar(user.id, file)
            if (uploadResult.success) {
                const updateResult = await updateProfile(user.id, { avatar_url: uploadResult.data.url })
                if (updateResult.success) {
                    avatarEl.innerHTML = `<img src="${uploadResult.data.url}" alt="Avatar" />`
                } else {
                    avatarEl.innerHTML = originalContent
                    alert('Gagal menyimpan foto profil: ' + updateResult.error)
                }
            } else {
                avatarEl.innerHTML = originalContent
                alert('Gagal upload foto: ' + uploadResult.error)
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

    const usernameLabel = document.getElementById('userUsername')
    if (usernameLabel) usernameLabel.textContent = user.username ? '@' + user.username : ''

    const emailReadonly = document.getElementById('emailReadonly')
    if (emailReadonly) emailReadonly.value = user.email || ''

    const roleBadge = document.getElementById('userRoleBadge')
    if (roleBadge) {
        const roleLabel = { user: 'Member', admin: 'Admin', super_admin: 'Super Admin' }
        roleBadge.textContent = roleLabel[user.role] || 'Member'
    }

    const balanceEl = document.getElementById('userBalance')
    if (balanceEl) balanceEl.textContent = 'Rp ' + (user.balance || 0).toLocaleString('id-ID')

    const joinedEl = document.getElementById('userJoined')
    if (joinedEl && user.created_at) {
        joinedEl.textContent = 'Bergabung sejak ' + new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const avatarEl = document.getElementById('userAvatar')
    if (avatarEl && user.avatar_url) {
        avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="Avatar" />`
    }
}

async function loadProfileStats(userId) {
    const result = await getUserStats(userId)
    if (!result.success) return

    const stats = result.data
    const totalEl = document.getElementById('statTotalTransactions')
    const successEl = document.getElementById('statSuccessTransactions')
    const spentEl = document.getElementById('statTotalSpent')
    const avgEl = document.getElementById('statAvgTransaction')

    if (totalEl) totalEl.textContent = stats.total_transactions || 0
    if (successEl) successEl.textContent = stats.total_success || 0
    if (spentEl) spentEl.textContent = 'Rp ' + Number(stats.total_spent || 0).toLocaleString('id-ID')
    if (avgEl) avgEl.textContent = 'Rp ' + Math.round(Number(stats.avg_transaction || 0)).toLocaleString('id-ID')
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
