// ============================================================
// DIGIFLAZZ API - XREZZKY TOP UP
// ============================================================

import crypto from 'crypto'

const DIGIFLAZZ_API_URL = 'https://api.digiflazz.com/v1'

// Environment variables (Vercel)
const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME || 'xxxxxxxx'
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY || 'xxxxxxxxxxxxxxxx'

// ===== GENERATE SIGNATURE =====
const generateSignature = (data) => {
    const stringToSign = `${DIGIFLAZZ_USERNAME}${DIGIFLAZZ_API_KEY}${data}`
    return crypto.createHash('md5').update(stringToSign).digest('hex')
}

// ===== GET PRICE LIST =====
export const getPriceList = async (gameCode = null) => {
    try {
        const body = {
            username: DIGIFLAZZ_USERNAME,
            sign: generateSignature('pricelist')
        }
        if (gameCode) {
            body.code = gameCode
        }

        const response = await fetch(`${DIGIFLAZZ_API_URL}/price-list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        const data = await response.json()
        if (data.success) {
            return { success: true, data: data.data }
        } else {
            throw new Error(data.message || 'Failed to get price list')
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== CHECK PRICE =====
// Catatan: endpoint ini dipakai untuk mengisi daftar tombol nominal di
// halaman game.html (lihat loadNominals() di js/games.js), yang butuh
// ARRAY of {nominal, price}. Sebelumnya fungsi ini pakai .find() dan
// mengembalikan satu object saja, jadi result.data.map(...) di frontend
// akan langsung error karena data.map bukan fungsi pada object biasa.
export const checkPrice = async (gameCode) => {
    try {
        const result = await getPriceList(gameCode)
        if (result.success && result.data.length > 0) {
            const items = result.data
                .filter(g => g.code === gameCode || g.buyer_sku_code === gameCode)
                .map(g => ({ nominal: g.nominal || g.product_name, price: g.price, name: g.name || g.product_name }))

            if (items.length > 0) {
                return { success: true, data: items }
            }
        }
        return { success: false, error: 'Game not found' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== TOP UP =====
export const topUpGame = async (gameCode, customerId, nominal) => {
    try {
        const transactionData = {
            username: DIGIFLAZZ_USERNAME,
            code: gameCode,
            hp: customerId,
            amount: nominal,
            sign: generateSignature(`${gameCode}${customerId}${nominal}`)
        }

        const response = await fetch(`${DIGIFLAZZ_API_URL}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        })

        const data = await response.json()
        if (data.success) {
            return {
                success: true,
                data: {
                    transactionId: data.data.sn,
                    status: data.data.status,
                    message: data.data.message,
                    nominal: data.data.nominal,
                    price: data.data.price
                }
            }
        } else {
            throw new Error(data.message || 'Top up failed')
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== CHECK TRANSACTION STATUS =====
export const checkTransactionStatus = async (transactionId) => {
    try {
        const response = await fetch(`${DIGIFLAZZ_API_URL}/transaction-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: DIGIFLAZZ_USERNAME,
                sn: transactionId,
                sign: generateSignature(transactionId)
            })
        })

        const data = await response.json()
        if (data.success) {
            return {
                success: true,
                data: {
                    status: data.data.status,
                    message: data.data.message,
                    nominal: data.data.nominal,
                    price: data.data.price
                }
            }
        } else {
            throw new Error(data.message || 'Failed to check status')
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== DEPOSIT SALDO =====
export const depositSaldo = async (amount) => {
    try {
        const response = await fetch(`${DIGIFLAZZ_API_URL}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: DIGIFLAZZ_USERNAME,
                amount: amount,
                sign: generateSignature(amount.toString())
            })
        })

        const data = await response.json()
        if (data.success) {
            return {
                success: true,
                data: {
                    balance: data.data.balance,
                    message: data.data.message
                }
            }
        } else {
            throw new Error(data.message || 'Deposit failed')
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== CHECK BALANCE =====
export const checkBalance = async () => {
    try {
        const response = await fetch(`${DIGIFLAZZ_API_URL}/balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: DIGIFLAZZ_USERNAME,
                sign: generateSignature('balance')
            })
        })

        const data = await response.json()
        if (data.success) {
            return {
                success: true,
                data: {
                    balance: data.data.balance
                }
            }
        } else {
            throw new Error(data.message || 'Failed to check balance')
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}