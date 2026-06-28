const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ==========================================
// 1. LẤY DANH SÁCH KHÁCH HÀNG (DÀNH CHO ADMIN)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false }); // Xếp người mới nhất lên đầu

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. LƯU HOẶC CẬP NHẬT KHÁCH HÀNG (TỪ ZALO APP)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Thiếu thông tin Họ tên hoặc Số điện thoại' });
        }

        // Dùng lệnh upsert: Nếu SĐT đã tồn tại -> Cập nhật tên mới. Nếu chưa có -> Thêm mới.
        const { data, error } = await supabase
            .from('customers')
            .upsert([{ phone, name }])
            .select();

        if (error) throw error;
        res.json({ message: 'Lưu thông tin khách hàng thành công!', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. XÓA KHÁCH HÀNG (DÀNH CHO ADMIN)
// ==========================================
router.delete('/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('phone', phone);

        if (error) throw error;
        res.json({ message: 'Đã xóa lịch sử khách hàng thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;