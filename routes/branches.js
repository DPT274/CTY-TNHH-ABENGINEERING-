const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. LẤY DANH SÁCH CHI NHÁNH
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. THÊM CHI NHÁNH MỚI
router.post('/', async (req, res) => {
    try {
        const { name, address, phone, map_link } = req.body;

        if (!name || !address) {
            return res.status(400).json({ error: 'Tên và địa chỉ là bắt buộc' });
        }

        const { data, error } = await supabase
            .from('branches')
            .insert([{ name, address, phone, map_link }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Thêm chi nhánh thành công!', data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. SỬA THÔNG TIN CHI NHÁNH
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, map_link } = req.body;

        const { error } = await supabase
            .from('branches')
            .update({ name, address, phone, map_link })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. XÓA CHI NHÁNH
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('branches').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Đã xóa chi nhánh!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;