const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify-zalo', async (req, res) => {
    try {
        const { phoneToken, accessToken, name, avatar } = req.body;

        // 1. Luôn ưu tiên lưu Name và Avatar vào trước dù chưa có SĐT
        if (name || avatar) {
            await supabase.from('customers').upsert([{
                // Nếu không có SĐT thì dùng ID tạm để lưu avatar/tên, nếu có sđt sẽ update sau
                phone: 'chua_co_sdt_' + Date.now(),
                name: name || 'Khách',
                avatar: avatar || ''
            }]);
        }

        if (!phoneToken || !accessToken) return res.status(400).json({ error: 'Thiếu token từ Zalo' });

        const ZALO_SECRET_KEY = process.env.ZALO_SECRET_KEY;
        const zaloResponse = await axios.get('https://graph.zalo.me/v2.0/me/info', {
            headers: { 'access_token': accessToken, 'code': phoneToken, 'secret_key': ZALO_SECRET_KEY }
        });

        if (zaloResponse.data.error) {
            return res.status(400).json({ error: "Giải mã thất bại", details: zaloResponse.data });
        }

        let realPhone = zaloResponse.data.data.number;
        if (realPhone.startsWith('84')) realPhone = '0' + realPhone.slice(2);

        // 2. Nếu giải mã SĐT thành công, update lại đúng số đó
        const { data, error } = await supabase
            .from('customers')
            .upsert([{ phone: realPhone, name: name, avatar: avatar }])
            .select();

        if (error) throw error;

        res.json({ success: true, phone: realPhone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;