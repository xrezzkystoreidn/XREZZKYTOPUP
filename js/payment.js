// ============================================================
// PAYMENT.JS - XREZZKY TOP UP
// ============================================================

import { supabase } from '../supabase/config.js'
import { getCurrentUser } from '../supabase/auth.js'

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const transactionId = urlParams.get('id')

    if (!transactionId) {
        // Jika di payment.html tapi tidak ada ID
        if (window.location.pathname.includes('payment.html')) {
            window.location.href = 'dashboard.html'
        }
        return
    }

    await loadPaymentStatus(transactionId)
})

async function loadPaymentStatus(transactionId) {
    const { data: transaction, error } = await supabase
        .from('transactions')
        .select(`
            *,
            games:game_id (name, icon)
        `)
        .eq('id', transactionId)
        .single()

    if (error || !transaction) {
        document.getElementById('statusIcon').textContent = '❌'
        document.getElementById('statusTitle').textContent = 'Transaksi Tidak Ditemukan'
        document.getElementById('statusMessage').textContent = 'Maaf, transaksi tidak ditemukan.'
        return
    }

    const statusMap = {
        'success': { icon: '✅', title: 'Pembayaran Berhasil!', message: 'Top up Anda sedang diproses, akan selesai dalam 1-3 menit.' },
        'pending': { icon: '⏳', title: 'Menunggu Pembayaran', message: 'Silakan selesaikan pembayaran Anda.' },
        'failed': { icon: '❌', title: 'Pembayaran Gagal', message: 'Mohon coba lagi atau hubungi CS.' }
    }

    const status = statusMap[transaction.status] || statusMap['pending']

    // invoice.html tidak punya elemen statusIcon/statusTitle/statusMessage
    // (cuma ada invoiceDetail). Sebelumnya baris ini dipanggil tanpa optional
    // chaining, jadi di invoice.html langsung throw "Cannot set properties
    // of null" dan kode invoiceDetail di bawahnya tidak pernah jalan.
    const statusIconEl = document.getElementById('statusIcon')
    const statusTitleEl = document.getElementById('statusTitle')
    const statusMessageEl = document.getElementById('statusMessage')
    if (statusIconEl) statusIconEl.textContent = status.icon
    if (statusTitleEl) statusTitleEl.textContent = status.title
    if (statusMessageEl) statusMessageEl.textContent = status.message

    const detail = document.getElementById('statusDetail')
    if (detail) {
        detail.innerHTML = `
            <div><span>ID Transaksi</span> <strong>#${transaction.id.slice(0, 8)}</strong></div>
            <div><span>Game</span> <strong>${transaction.games?.name || 'Game'}</strong></div>
            <div><span>Nominal</span> <strong>${transaction.nominal} 💎</strong></div>
            <div><span>Total</span> <strong>Rp ${transaction.price.toLocaleString()}</strong></div>
            <div><span>Status</span> <span class="status-badge ${transaction.status}">${transaction.status === 'success' ? 'Berhasil' : transaction.status === 'pending' ? 'Proses' : 'Gagal'}</span></div>
        `
    }

    // Jika invoice page
    if (window.location.pathname.includes('invoice.html')) {
        const invoiceDetail = document.getElementById('invoiceDetail')
        if (invoiceDetail) {
            invoiceDetail.innerHTML = `
                <div><span>ID Transaksi</span> <strong>#${transaction.id.slice(0, 8)}</strong></div>
                <div><span>Game</span> <strong>${transaction.games?.name || 'Game'}</strong></div>
                <div><span>Nominal</span> <strong>${transaction.nominal} 💎</strong></div>
                <div><span>Total</span> <strong>Rp ${transaction.price.toLocaleString()}</strong></div>
                <div><span>ID Player</span> <strong>${transaction.player_id || '-'}</strong></div>
                <div><span>Server</span> <strong>${transaction.server || '-'}</strong></div>
                <div><span>Metode</span> <strong>${transaction.payment_method || '-'}</strong></div>
                <div><span>Tanggal</span> <strong>${new Date(transaction.created_at).toLocaleString('id-ID')}</strong></div>
            `
        }
    }

    // Auto refresh status jika pending
    if (transaction.status === 'pending') {
        let attempts = 0
        const maxAttempts = 30 // 30 detik
        const interval = setInterval(async () => {
            attempts++
            const { data: updated } = await supabase
                .from('transactions')
                .select('status')
                .eq('id', transactionId)
                .single()

            if (updated?.status !== 'pending') {
                clearInterval(interval)
                window.location.reload()
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval)
            }
        }, 1000)
    }
}