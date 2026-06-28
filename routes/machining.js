const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/machining-request', async (req, res) => {
    try {
        // Bổ sung nhận thêm customerName từ Zalo App
        const { id, date, services, material, fileName, phone, email, customerName } = req.body;

        if (!id || !phone || !services) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
        }

        const { data, error } = await supabase
            .from('machining_requests')
            .insert([{
                id,
                date,
                services,
                material,
                file_name: fileName,
                phone,
                email,
                customer_name: customerName || 'Khách Zalo', // Lưu tên khách
                status: 'Chờ xử lý'
            }]);

        if (error) throw error;
        res.json({ success: true, message: 'Đã lưu yêu cầu!', data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/machining-history', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('machining_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = data.map(item => ({
            id: item.id,
            date: item.date,
            services: item.services,
            material: item.material,
            fileName: item.file_name,
            phone: item.phone,
            email: item.email,
            customerName: item.customer_name, // Đẩy tên khách ra Frontend
            status: item.status
        }));

        // Trả về chuẩn cấu trúc có { success: true, data: ... }
        res.json({ success: true, data: formattedData });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/machining-request/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { error } = await supabase.from('machining_requests').update({ status }).eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/machining-request/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('machining_requests').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa hồ sơ!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;