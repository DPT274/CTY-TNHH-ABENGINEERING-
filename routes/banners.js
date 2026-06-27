const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

// Cấu hình Multer để giữ file trong bộ nhớ tạm (RAM) trước khi đẩy lên Supabase
const upload = multer({ storage: multer.memoryStorage() });

// LẤY DANH SÁCH BANNER (Kèm thời gian lướt)
router.get('/admin', async (req, res) => {
    try {
        const { data: banners, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        // Giả sử lấy duration từ 1 bảng settings, ở đây fix tạm 3000ms
        res.json({ banners: banners, duration: 3000 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// THÊM BANNER MỚI (Có upload ảnh)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng tải lên một ảnh!' });

        // 1. Đặt tên file duy nhất chống trùng lặp
        const fileName = `banners/${Date.now()}_${file.originalname}`;

        // 2. Upload thẳng lên Supabase Storage (Bucket: ab_engineering_bucket)
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        // 3. Lấy Public URL của ảnh vừa upload
        const { data: { publicUrl } } = supabase
            .storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

        // 4. Lưu URL vào Database
        const { data: insertData, error: insertError } = await supabase
            .from('banners')
            .insert([{ image_url: publicUrl, is_active: true }])
            .select();

        if (insertError) throw insertError;
        res.json({ message: 'Đăng Banner thành công!', data: insertData });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CẬP NHẬT TRẠNG THÁI (Bật / Tạm ẩn)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
        if (error) throw error;

        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// XÓA BANNER
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã xóa banner vĩnh viễn' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;