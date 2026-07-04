// ============================================================
// UTILS.JS - XREZZKY TOP UP
// ============================================================

// ===== FORMAT RUPIAH =====
export const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

// ===== FORMAT TANGGAL =====
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// ===== RANDOM ID =====
export const generateId = (length = 8) => {
    return Math.random().toString(36).substring(2, length + 2).toUpperCase()
}

// ===== VALIDASI EMAIL =====
export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ===== VALIDASI PASSWORD =====
export const isValidPassword = (password) => {
    return password.length >= 8
}

// ===== TRUNCATE TEXT =====
export const truncateText = (text, length = 50) => {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

// ===== DEBOUNCE =====
export const debounce = (func, delay = 300) => {
    let timeout
    return function(...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(this, args), delay)
    }
}

// ===== THROTTLE =====
export const throttle = (func, limit = 300) => {
    let inThrottle
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

// ===== GET URL PARAMETERS =====
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search)
    const result = {}
    for (const [key, value] of params) {
        result[key] = value
    }
    return result
}

// ===== COPY TO CLIPBOARD =====
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== DETECT DEVICE =====
export const detectDevice = () => {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'mobile'
    if (/tablet/i.test(ua)) return 'tablet'
    return 'desktop'
}

// ===== DETECT BROWSER =====
export const detectBrowser = () => {
    const ua = navigator.userAgent
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'chrome'
    if (/firefox/i.test(ua)) return 'firefox'
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'safari'
    if (/edge/i.test(ua)) return 'edge'
    return 'other'
}

// ===== SLEEP =====
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== RETRY =====
export const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn()
    } catch (error) {
        if (retries === 0) throw error
        await sleep(delay)
        return retry(fn, retries - 1, delay * 2)
    }
}

// ===== ERROR HANDLER =====
export const handleError = (error) => {
    console.error('Error:', error)
    const message = error.message || 'Terjadi kesalahan. Silakan coba lagi.'
    alert(message)
    return { success: false, error: message }
}