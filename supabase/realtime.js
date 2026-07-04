// ============================================================
// SUPABASE REALTIME
// ============================================================

import { supabase } from './config.js'

// ===== SUBSCRIBE TO TRANSACTIONS =====
export const subscribeToTransactions = (userId, callback) => {
    const channel = supabase
        .channel('transactions-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}

// ===== SUBSCRIBE TO GAMES =====
export const subscribeToGames = (callback) => {
    const channel = supabase
        .channel('games-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'games'
            },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}

// ===== SUBSCRIBE TO PROMOS =====
export const subscribeToPromos = (callback) => {
    const channel = supabase
        .channel('promos-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'promos'
            },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}

// ===== UNSUBSCRIBE =====
export const unsubscribe = (channel) => {
    if (channel) {
        supabase.removeChannel(channel)
    }
}

// ===== PRESENCE =====
export const trackPresence = (userId, channelName) => {
    const channel = supabase.channel(channelName, {
        config: {
            presence: {
                key: userId
            }
        }
    })

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({
                user_id: userId,
                online_at: new Date().toISOString()
            })
        }
    })

    return channel
}