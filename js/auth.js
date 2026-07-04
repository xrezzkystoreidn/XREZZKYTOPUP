// ============================================================
// AUTH.JS - XREZZKY TOP UP
// ============================================================

import { loginUser, registerUser, resetPassword } from '../supabase/auth.js'

// ===== LOGIN =====
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm')
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const email = document.getElementById('email').value
            const password = document.getElementById('password').value

            const result = await loginUser(email, password)
            if (result.success) {
                window.location.href = 'dashboard.html'
            } else {
                alert('Login gagal: ' + result.error)
            }
        })
    }

    // ===== REGISTER =====
    const registerForm = document.getElementById('registerForm')
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const fullname = document.getElementById('fullname').value
            const username = document.getElementById('username').value
            const email = document.getElementById('email').value
            const password = document.getElementById('password').value
            const confirm = document.getElementById('confirm_password').value

            if (password !== confirm) {
                alert('Password tidak cocok!')
                return
            }
            if (password.length < 8) {
                alert('Password minimal 8 karakter!')
                return
            }

            const result = await registerUser(email, password, fullname, username)
            if (result.success) {
                alert('Pendaftaran berhasil! Silakan login.')
                window.location.href = 'login.html'
            } else {
                alert('Pendaftaran gagal: ' + result.error)
            }
        })
    }

    // ===== FORGOT PASSWORD =====
    const forgotForm = document.getElementById('forgotForm')
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const email = document.getElementById('email').value
            const result = await resetPassword(email)
            if (result.success) {
                alert('Link reset password telah dikirim ke email Anda.')
            } else {
                alert('Gagal: ' + result.error)
            }
        })
    }
})