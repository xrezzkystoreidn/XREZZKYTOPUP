// ============================================================
// WEBHOOK - DIGIFLAZZ CALLBACK
// ============================================================

import { supabase } from '../supabase/config.js'

export default async function handler(req, res) {
    // Verify webhook signature
    const signature = req.headers['x-digiflazz-signature']
    if (!signature) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const data = req.body

        // Update transaction status
        const { data: transaction, error } = await supabase
            .from('transactions')
            .update({
                status: data.status === 'success' ? 'success' : data.status === 'pending' ? 'pending' : 'failed',
                updated_at: new Date().toISOString(),
                digiflazz_response: data
            })
            .eq('transaction_id', data.sn)
            .select()

        if (error) throw error

        return res.status(200).json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return res.status(500).json({ error: error.message })
    }
}