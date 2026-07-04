// ============================================================
// CHECKOUT.JS - XREZZKY TOP UP
// ============================================================

import { getCurrentUser } from '../supabase/auth.js'
import { createTransaction } from '../supabase/database.js'

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const userResult = await getCurrentUser()
    if (!userResult.success) {
        window.location.href = 'login.html'
        return
    }

    // Get checkout data from URL
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('game')
    const nominal = urlParams.get('nominal')
    const price = urlParams.get('price')
    const playerId = urlParams.get('player')
    const server = urlParams.get('server')

    if (!gameId || !nominal) {
        window.location.href = 'games.html'
        return
    }

    // Display checkout summary
    const item = document.getElementById('checkoutItem')
    if (item) {
        item.innerHTML = `
            <div class="checkout-game">🎮 Game</div>
            <div class="checkout-detail">
                <p>ID Player: ${playerId || '-'}</p>
                <p>Server: ${server || '-'}</p>
                <p>Nominal: ${nominal} 💎</p>
            </div>
            <div class="checkout-price">Rp ${parseInt(price).toLocaleString()}</div>
        `
    }

    document.getElementById('totalPrice').textContent = `Rp ${parseInt(price).toLocaleString()}`

    // Payment methods
    const methods = ['QRIS', 'DANA', 'GoPay', 'OVO', 'ShopeePay', 'BCA', 'BRI', 'BNI', 'Mandiri', 'SeaBank']
    const container = document.getElementById('paymentMethods')
    if (container) {
        container.innerHTML = methods.map((m, i) => `
            <button class="payment-method ${i === 0 ? 'active' : ''}" data-method="${m}">
                <span class="payment-icon">💳</span>
                <span>${m}</span>
            </button>
        `).join('')

        container.querySelectorAll('.payment-method').forEach(btn => {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'))
                this.classList.add('active')
            })
        })
    }

    // Pay button
    document.getElementById('payBtn')?.addEventListener('click', async () => {
        const selected = document.querySelector('.payment-method.active')
        const method = selected?.dataset.method || 'QRIS'

        const result = await createTransaction({
            userId: userResult.user.id,
            gameId: gameId,
            nominal: parseInt(nominal),
            price: parseInt(price),
            playerId: playerId || '',
            server: server || '',
            paymentMethod: method
        })

        if (result.success) {
            window.location.href = `payment.html?id=${result.data.id}`
        } else {
            alert('Gagal membuat transaksi: ' + result.error)
        }
    })
})