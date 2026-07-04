// ============================================================
// SUPABASE DATABASE
// ============================================================

import { supabase } from './config.js'

// ===== GAMES =====
export const getGames = async (filters = {}) => {
    try {
        let query = supabase.from('games').select('*')

        if (filters.category) {
            query = query.eq('category', filters.category)
        }
        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`)
        }
        if (filters.limit) {
            query = query.limit(filters.limit)
        }
        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }

        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getGameById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const createGame = async (gameData) => {
    try {
        const { data, error } = await supabase
            .from('games')
            .insert([{
                ...gameData,
                created_at: new Date().toISOString()
            }])
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const updateGame = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('games')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const deleteGame = async (id) => {
    try {
        const { error } = await supabase
            .from('games')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== TRANSACTIONS =====
export const createTransaction = async (transactionData) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .insert([{
                user_id: transactionData.userId,
                game_id: transactionData.gameId,
                nominal: transactionData.nominal,
                price: transactionData.price,
                player_id: transactionData.playerId || '',
                server: transactionData.server || '',
                status: 'pending',
                payment_method: transactionData.paymentMethod || 'QRIS',
                created_at: new Date().toISOString()
            }])
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getTransactionById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                games:game_id (name, icon),
                users:user_id (full_name, email, username)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getUserTransactions = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                games:game_id (name, icon)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getAllTransactions = async (filters = {}) => {
    try {
        let query = supabase
            .from('transactions')
            .select(`
                *,
                games:game_id (name),
                users:user_id (full_name, email)
            `)
            .order('created_at', { ascending: false })

        if (filters.status) {
            query = query.eq('status', filters.status)
        }
        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const updateTransactionStatus = async (id, status) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== PROMOS =====
export const getActivePromos = async () => {
    try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
            .from('promos')
            .select('*')
            .lte('start_date', now)
            .gte('end_date', now)
            .eq('is_active', true)

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getAllPromos = async () => {
    try {
        const { data, error } = await supabase
            .from('promos')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const createPromo = async (promoData) => {
    try {
        const { data, error } = await supabase
            .from('promos')
            .insert([{
                ...promoData,
                created_at: new Date().toISOString()
            }])
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== TESTIMONIALS =====
export const getTestimonials = async () => {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6)

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const createTestimonial = async (testimonialData) => {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .insert([{
                ...testimonialData,
                is_approved: false,
                created_at: new Date().toISOString()
            }])
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== USERS =====
export const getAllUsers = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getUserById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const updateUser = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) throw error
        return { success: true, data: data[0] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}