const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. LẤY DANH SÁCH HOTLINE (Dùng cho cả Zalo App và Admin)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('hotlines')
            .select('*')
            .order('created_at', { ascending: true }); // Xếp theo thứ tự tạo cũ đến mới

        if (error) throw error;
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. THÊM SỐ HOTLINE MỚI (Dùng cho Admin)
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đủ Tên và Số điện thoại' });
        }

        const { data, error } = await supabase
            .from('hotlines')
            .insert([{ name, phone }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Thêm Hotline thành công!', data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. XÓA SỐ HOTLINE (Dùng cho Admin)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('hotlines')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa Hotline thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;