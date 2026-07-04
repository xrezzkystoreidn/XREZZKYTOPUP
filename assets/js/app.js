// ============================================================
// APP.JS - XREZZKY TOP UP
// ============================================================

import { supabase, checkConnection } from '../supabase/config.js'
import { getCurrentUser, logoutUser } from '../supabase/auth.js'
import { getGames, getActivePromos, getAllPromos, getTestimonials } from '../supabase/database.js'

// ===== STATE =====
export const AppState = {
    user: null,
    isAuthenticated: false
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 XREZZKY TOP UP App Started')

    // Check Supabase
    const connected = await checkConnection()
    if (!connected) {
        console.warn('⚠️ Supabase connection issue')
    }

    // Check Auth
    const userResult = await getCurrentUser()
    if (userResult.success) {
        AppState.user = userResult.user
        AppState.isAuthenticated = true
        updateNavForAuth()
    }

    // Load Data
    await loadGames()
    await loadPromos()
    await loadPromoGrid()
    await loadTestimonials()
    await loadFAQ()
    await loadPayments()

    // Setup Events
    setupEvents()
})

// ===== LOAD DATA =====
async function loadGames() {
    const result = await getGames({ limit: 12 })
    const grid = document.getElementById('gameGrid')
    if (grid && result.success) {
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

async function loadPromos() {
    const result = await getActivePromos()
    const container = document.getElementById('promoContent')
    if (container && result.success && result.data.length > 0) {
        const promo = result.data[0]
        container.innerHTML = `
            <div>
                <h2>${promo.title}</h2>
                <p>${promo.description}</p>
            </div>
            <a href="promo.html" class="btn-primary" style="background:white; color:#1E3A8A; box-shadow:0 8px 20px rgba(0,0,0,0.1);">Klaim Sekarang</a>
        `
    }
}

// promo.html punya elemen #promoGrid untuk menampilkan SEMUA promo,
// tapi sebelumnya tidak ada fungsi yang mengisinya sama sekali —
// halaman promo selalu kosong.
async function loadPromoGrid() {
    const grid = document.getElementById('promoGrid')
    if (!grid) return
    const result = await getAllPromos()
    if (result.success) {
        grid.innerHTML = result.data.map(promo => `
            <div class="promo-card">
                <h3>${promo.title}</h3>
                <p>${promo.description || ''}</p>
                ${promo.discount ? `<span class="badge-glow">Diskon ${promo.discount}%</span>` : ''}
                ${promo.code ? `<div class="promo-code">Kode: <strong>${promo.code}</strong></div>` : ''}
            </div>
        `).join('')
    }
}

async function loadTestimonials() {
    const result = await getTestimonials()
    const grid = document.getElementById('testiGrid')
    if (grid && result.success) {
        grid.innerHTML = result.data.map(testi => `
            <div class="testi-card">
                <div class="stars">${'★'.repeat(testi.rating || 5)}</div>
                <p>"${testi.message}"</p>
                <div class="name">— ${testi.user_name || 'User'}</div>
            </div>
        `).join('')
    }
}

function loadFAQ() {
    const list = document.getElementById('faqList')
    if (!list) return
    const faqs = [
        { q: 'Apa saja game yang tersedia?', a: 'Tersedia 100+ game mulai dari ML, FF, PUBG, Genshin, dan lainnya.' },
        { q: 'Berapa lama proses top up?', a: 'Proses instan kurang dari 1 menit setelah pembayaran berhasil.' },
        { q: 'Apakah ada potongan biaya?', a: 'Tidak ada biaya tambahan, harga sudah termasuk semua.' },
        { q: 'Metode pembayaran apa saja?', a: 'QRIS, DANA, GoPay, OVO, ShopeePay, BCA, BRI, BNI, Mandiri, SeaBank.' }
    ]
    list.innerHTML = faqs.map((f, i) => `
        <div class="faq-item ${i === 0 ? 'active' : ''}">
            <div class="faq-question">${f.q} <i>▼</i></div>
            <div class="faq-answer">${f.a}</div>
        </div>
    `).join('')
    // FAQ toggle
    list.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', function() {
            const item = this.parentElement
            const isActive = item.classList.contains('active')
            list.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'))
            if (!isActive) item.classList.add('active')
        })
    })
}

function loadPayments() {
    const container = document.getElementById('paymentIcons')
    if (!container) return
    const methods = ['QRIS', 'DANA', 'GoPay', 'OVO', 'ShopeePay', 'BCA', 'BRI', 'BNI', 'Mandiri', 'SeaBank']
    container.innerHTML = methods.map(m => `<span class="payment-item">${m}</span>`).join('')
}

// ===== AUTH NAV =====
function updateNavForAuth() {
    const navActions = document.getElementById('navActions')
    const mobileNavActions = document.getElementById('mobileNavActions')
    if (navActions) {
        navActions.innerHTML = `
            <a href="dashboard.html" class="btn-outline btn-sm">Dashboard</a>
            <a href="#" class="btn-primary btn-sm" id="logoutNav">Logout</a>
        `
        document.getElementById('logoutNav')?.addEventListener('click', handleLogout)
    }
    if (mobileNavActions) {
        mobileNavActions.innerHTML = `
            <a href="dashboard.html" class="btn-outline">Dashboard</a>
            <a href="#" class="btn-primary" id="logoutMobileNav">Logout</a>
        `
        document.getElementById('logoutMobileNav')?.addEventListener('click', handleLogout)
    }
}

async function handleLogout(e) {
    e.preventDefault()
    const result = await logoutUser()
    if (result.success) {
        window.location.href = 'index.html'
    } else {
        alert('Logout failed: ' + result.error)
    }
}

// ===== EVENTS =====
function setupEvents() {
    // Hamburger
    const hamburger = document.getElementById('hamburger')
    const mobileMenu = document.getElementById('mobileMenu')
    hamburger?.addEventListener('click', () => {
        mobileMenu.classList.toggle('open')
    })
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav')) {
            mobileMenu?.classList.remove('open')
        }
    })

    // Contact Form
    const contactForm = document.getElementById('contactForm')
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const name = document.getElementById('contactName').value
        const email = document.getElementById('contactEmail').value
        const subject = document.getElementById('contactSubject').value
        const message = document.getElementById('contactMessage').value

        // Kirim ke Supabase atau email
        alert('Pesan terkirim! Kami akan merespon dalam 1x24 jam.')
        contactForm.reset()
    })

    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible')
            }
        })
    }, { threshold: 0.2 })

    document.querySelectorAll('.fade-up, .slide-left, .slide-right, .slide-up, .scale-in, .slide-in-bottom, .slide-in-left, .slide-in-right, .zoom-in, .blur-in, .stagger-children')
        .forEach(el => observer.observe(el))
}

// ===== TOP UP HANDLER =====
// Dipanggil dari game.html (js/games.js) setelah user pilih nominal &
// mengisi form. Sebelumnya fungsi ini dipanggil (import { handleTopUp }
// from './app.js') tapi tidak pernah didefinisikan/di-export di sini,
// jadi import-nya gagal dan seluruh js/games.js ikut error saat dimuat.
export function handleTopUp({ gameId, code, playerId, server, nominal, price }) {
    const params = new URLSearchParams({
        game: gameId,
        nominal,
        price,
        player: playerId,
        server: server || ''
    })
    window.location.href = `checkout.html?${params.toString()}`
}

// ===== EXPORTS =====
export { loadGames, loadPromos, loadTestimonials }