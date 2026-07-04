// ============================================================
// PAYMENT API - VERCEL SERVERLESS
// ============================================================

import { topUpGame, checkPrice, checkTransactionStatus, getPriceList } from './digiflazz.js'
import { supabase } from '../supabase/config.js'

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    try {
        const { action } = req.query

        switch (action) {
            case 'pricelist': {
                const { gameCode } = req.body
                const result = await getPriceList(gameCode)
                return res.status(200).json(result)
            }

            case 'price': {
                const { gameCode } = req.body
                const result = await checkPrice(gameCode)
                return res.status(200).json(result)
            }

            case 'topup': {
                const { gameCode, customerId, nominal, userId, gameId } = req.body

                // 1. Top up via Digiflazz
                const topUpResult = await topUpGame(gameCode, customerId, nominal)
                if (!topUpResult.success) {
                    return res.status(400).json(topUpResult)
                }

                // 2. Save transaction to Supabase
                const { data: transaction, error } = await supabase
                    .from('transactions')
                    .insert([{
                        user_id: userId,
                        game_id: gameId,
                        nominal: topUpResult.data.nominal || nominal,
                        price: topUpResult.data.price || 0,
                        player_id: customerId,
                        status: topUpResult.data.status === 'success' ? 'success' : 'pending',
                        payment_method: 'digiflazz',
                        transaction_id: topUpResult.data.transactionId,
                        digiflazz_response: topUpResult.data,
                        created_at: new Date().toISOString()
                    }])
                    .select()

                if (error) throw error

                return res.status(200).json({
                    success: true,
                    data: {
                        transaction: transaction[0],
                        digiflazz: topUpResult.data
                    }
                })
            }

            case 'status': {
                const { transactionId } = req.body
                const result = await checkTransactionStatus(transactionId)

                // Update Supabase if status changed
                if (result.success) {
                    const statusMap = {
                        'success': 'success',
                        'pending': 'pending',
                        'failed': 'failed'
                    }
                    const status = statusMap[result.data.status] || 'pending'

                    await supabase
                        .from('transactions')
                        .update({
                            status: status,
                            updated_at: new Date().toISOString()
                        })
                        .eq('transaction_id', transactionId)
                }

                return res.status(200).json(result)
            }

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action. Available: pricelist, price, topup, status'
                })
        }
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}