const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const axios = require('axios'); // Nhớ cài đặt axios ở backend nếu chưa có

// 1. ADMIN LẤY DANH SÁCH KHÁCH HÀNG
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. ZALO APP GỬI THÔNG TIN VÀ TOKEN LÊN ĐỂ GIẢI MÃ
router.post('/verify-zalo', async (req, res) => {
    try {
        const { phoneToken, accessToken, name, avatar } = req.body;
        if (!phoneToken || !accessToken) return res.status(400).json({ error: 'Thiếu token từ Zalo' });

        // Giải mã token Zalo
        const ZALO_SECRET_KEY = process.env.ZALO_SECRET_KEY; // Lấy từ file .env
        const zaloResponse = await axios.get('https://graph.zalo.me/v2.0/me/info', {
            headers: {
                'access_token': accessToken,
                'code': phoneToken,
                'secret_key': ZALO_SECRET_KEY
            }
        });

        if (zaloResponse.data.error) {
            return res.status(400).json({ error: "Giải mã thất bại", details: zaloResponse.data });
        }

        // Lấy số thật và format về 090...
        let realPhone = zaloResponse.data.data.number;
        if (realPhone.startsWith('84')) realPhone = '0' + realPhone.slice(2);

        // Lưu vào Supabase (Dùng upsert như code gốc của bạn)
        const { data, error } = await supabase
            .from('customers')
            .upsert([{ phone: realPhone, name: name, avatar: avatar }])
            .select();

        if (error) throw error;

        // Trả SĐT thật về cho Mini App
        res.json({ success: true, phone: realPhone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;