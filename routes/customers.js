const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

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

// 2. ZALO APP GỬI THÔNG TIN LÊN ĐỂ LƯU (Bỏ giải mã Token)
router.post('/verify-zalo', async (req, res) => {
    try {
        const { phone, name, avatar } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Thiếu số điện thoại' });
        }

        // Lưu hoặc cập nhật vào Supabase
        const { data, error } = await supabase
            .from('customers')
            .upsert([{ phone: phone, name: name, avatar: avatar }])
            .select();

        if (error) throw error;

        // Báo thành công
        res.json({ success: true, phone: phone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;