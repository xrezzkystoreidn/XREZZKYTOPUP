// ============================================================
// SUPABASE STORAGE
// ============================================================

import { supabase } from './config.js'

const BUCKET_NAME = 'assets'

// ===== UPLOAD FILE =====
export const uploadFile = async (file, path) => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (error) throw error

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path)

        return { success: true, data: { ...data, url: urlData.publicUrl } }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== DELETE FILE =====
export const deleteFile = async (path) => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path])

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== GET FILE URL =====
export const getFileUrl = (path) => {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path)

    return data.publicUrl
}

// ===== LIST FILES =====
export const listFiles = async (path = '') => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(path)

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ===== UPLOAD GAME ICON =====
export const uploadGameIcon = async (gameId, file) => {
    const path = `games/${gameId}/${file.name}`
    return uploadFile(file, path)
}

// ===== UPLOAD USER AVATAR =====
export const uploadUserAvatar = async (userId, file) => {
    const path = `users/${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    return uploadFile(file, path)
}

// ===== UPLOAD PAYMENT PROOF =====
export const uploadPaymentProof = async (transactionId, file) => {
    const path = `payments/${transactionId}/${file.name}`
    return uploadFile(file, path)
}