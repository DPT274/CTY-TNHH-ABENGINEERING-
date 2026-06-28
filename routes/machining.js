const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ===============================================
// 1. ZALO APP GỬI YÊU CẦU GIA CÔNG LÊN HỆ THỐNG
// ===============================================
router.post('/machining-request', async (req, res) => {
    try {
        const { id, date, services, material, fileName, phone, email } = req.body;

        if (!id || !phone || !services) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
        }

        const { data, error } = await supabase
            .from('machining_requests')
            .insert([{
                id,
                date,
                services, // Supabase sẽ tự động hiểu kiểu mảng thành JSONB
                material,
                file_name: fileName,
                phone,
                email,
                status: 'Chờ xử lý'
            }]);

        if (error) throw error;
        res.json({ success: true, message: 'Đã lưu yêu cầu!', data });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===============================================
// 2. ADMIN/ZALO APP LẤY DANH SÁCH HỒ SƠ 
// ===============================================
router.get('/machining-history', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('machining_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Chuyển đổi tên biến (file_name -> fileName) để khớp 100% với Code Frontend
        const formattedData = data.map(item => ({
            id: item.id,
            date: item.date,
            services: item.services,
            material: item.material,
            fileName: item.file_name,
            phone: item.phone,
            email: item.email,
            status: item.status
        }));

        res.json(formattedData);

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===============================================
// 3. ADMIN CẬP NHẬT TRẠNG THÁI TIẾN ĐỘ ĐƠN
// ===============================================
router.put('/machining-request/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase
            .from('machining_requests')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===============================================
// 4. ADMIN XÓA BỎ HỒ SƠ GIA CÔNG
// ===============================================
router.delete('/machining-request/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('machining_requests')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa hồ sơ!' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;