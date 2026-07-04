// ============================================================
// SUPABASE AUTH
// ============================================================

import { supabase } from './config.js'

// ===== REGISTER =====
export const registerUser = async (email, password, fullName, username) => {
    try {
        // Register to Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    username: username,
                }
            }
        })

        if (authError) throw authError

        // Save to users table
        const { error: userError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                email: email,
                full_name: fullName,
                username: username,
                created_at: new Date().toISOString()
            }])

        if (userError) throw userError

        return { success: true, data: authData }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== LOGIN =====
export const loginUser = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== LOGOUT =====
export const logoutUser = async () => {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== GET CURRENT USER =====
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!user) return { success: false, error: 'No user logged in' }

        // Get full user data from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        if (userError && userError.code !== 'PGRST116') throw userError

        return { success: true, user: { ...user, ...userData } }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== RESET PASSWORD =====
export const resetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/forgot-password.html'
        })
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== UPDATE PROFILE =====
export const updateProfile = async (userId, updates) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== UPDATE PASSWORD =====
export const updatePassword = async (newPassword) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}