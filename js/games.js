// ============================================================
// GAMES.JS - XREZZKY TOP UP
// ============================================================

import { getGames, getGameById } from '../supabase/database.js'
import { handleTopUp } from './app.js'
import { getCurrentUser } from '../supabase/auth.js'

// ===== ALL GAMES PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('gameGrid')
    if (!grid) return

    await loadAllGames()

    const searchInput = document.getElementById('searchGame')
    const categoryFilter = document.getElementById('categoryFilter')

    searchInput?.addEventListener('input', loadAllGames)
    categoryFilter?.addEventListener('change', loadAllGames)
})

async function loadAllGames() {
    const grid = document.getElementById('gameGrid')
    if (!grid) return

    const search = document.getElementById('searchGame')?.value || ''
    const category = document.getElementById('categoryFilter')?.value || ''

    const result = await getGames({ search, category })
    if (result.success) {
        grid.innerHTML = result.data.map(game => `
            <div class="game-card">
                <div class="game-icon">${game.icon || '🎮'}</div>
                <h4>${game.name}</h4>
                <span class="game-price">Rp ${game.price?.toLocaleString() || '0'}</span>
                <a href="game.html?id=${game.id}" class="btn-primary btn-sm">Top Up</a>
            </div>
        `).join('')
    }
}

// ===== GAME DETAIL PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('id')

    if (!gameId) return

    const result = await getGameById(gameId)
    if (!result.success || !result.data) {
        window.location.href = 'games.html'
        return
    }

    const game = result.data

    document.getElementById('gameIcon').textContent = game.icon || '🎮'
    document.getElementById('gameName').textContent = game.name
    document.getElementById('gameDesc').textContent = game.description || 'Game favorit dengan harga terbaik'

    const meta = document.getElementById('gameMeta')
    if (meta && game.category) {
        meta.innerHTML = `<span class="badge-glow">${game.category}</span>`
    }

    const stats = document.getElementById('gameStats')
    if (stats) {
        stats.innerHTML = `
            <div><strong>${game.downloads || '1M+'}</strong> Downloads</div>
            <div><strong>${game.rating || '4.5'}</strong> ★ Rating</div>
        `
    }

    // Load nominal dari Digiflazz
    await loadNominals(game.code)

    // Handle Top Up
    const form = document.getElementById('topupForm')
    form?.addEventListener('submit', async (e) => {
        e.preventDefault()

        const userResult = await getCurrentUser()
        if (!userResult.success) {
            alert('Silakan login terlebih dahulu')
            window.location.href = 'login.html'
            return
        }

        const selected = document.querySelector('.nominal-btn.active')
        if (!selected) {
            alert('Pilih nominal terlebih dahulu')
            return
        }

        const playerId = document.getElementById('playerId').value
        const serverId = document.getElementById('serverId').value

        if (!playerId || !serverId) {
            alert('Masukkan ID Player dan Server')
            return
        }

        await handleTopUp({
            gameId: gameId,
            code: game.code,
            playerId: playerId,
            server: serverId,
            nominal: selected.dataset.nominal,
            price: selected.dataset.price
        })
    })
})

async function loadNominals(gameCode) {
    const grid = document.getElementById('nominalGrid')
    if (!grid) return

    try {
        const response = await fetch(`/api/payment?action=price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameCode })
        })

        const result = await response.json()
        if (result.success && result.data) {
            grid.innerHTML = result.data.map((item, i) => `
                <button type="button" class="nominal-btn ${i === 0 ? 'active' : ''}" 
                        data-nominal="${item.nominal}" data-price="${item.price}">
                    ${item.nominal} 💎
                    <span>Rp ${item.price.toLocaleString()}</span>
                </button>
            `).join('')

            grid.querySelectorAll('.nominal-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    grid.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('active'))
                    this.classList.add('active')
                })
            })
        }
    } catch (error) {
        console.error('Failed to load nominals:', error)
        // Fallback default
        const defaults = [
            { nominal: 86, price: 10000 },
            { nominal: 172, price: 20000 },
            { nominal: 257, price: 30000 },
            { nominal: 514, price: 50000 }
        ]
        grid.innerHTML = defaults.map((item, i) => `
            <button type="button" class="nominal-btn ${i === 0 ? 'active' : ''}" 
                    data-nominal="${item.nominal}" data-price="${item.price}">
                ${item.nominal} 💎
                <span>Rp ${item.price.toLocaleString()}</span>
            </button>
        `).join('')
        grid.querySelectorAll('.nominal-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                grid.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('active'))
                this.classList.add('active')
            })
        })
    }
}