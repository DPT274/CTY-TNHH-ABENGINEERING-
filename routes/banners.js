const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

// Cấu hình Multer lưu tạm file vào RAM
const upload = multer({ storage: multer.memoryStorage() });

// LẤY DANH SÁCH BANNER (Kèm thời gian lướt)
router.get('/admin', async (req, res) => {
    try {
        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Trả về kèm cấu hình thời gian chuyển banner mặc định
        res.json({ banners: banners, duration: 3000 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// THÊM BANNER MỚI (Đã tối ưu hóa đặt tên file an toàn)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng tải lên một ảnh!' });

        // Tách đuôi file (ví dụ: .jpg, .png) và tạo tên file bằng số chống lỗi kí tự lạ
        const extension = file.originalname.split('.').pop();
        const fileName = `banners/${Date.now()}.${extension}`;

        // Upload trực tiếp lên Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        // Lấy đường dẫn Public URL của ảnh
        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

        // Lưu thông tin vào bảng banners trong Database
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

// CẬP NHẬT TRẠNG THÁI BANNER (Bật / Tạm ẩn)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
        if (error) throw error;

        res.json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// XÓA BANNER (Đã tối ưu dọn rác ảnh trên Storage)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Lấy thông tin lấy link ảnh trước khi xóa dữ liệu bảng
        const { data: banner, error: fetchError } = await supabase
            .from('banners')
            .select('image_url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Nếu có ảnh, thực hiện xóa file gốc trên Storage
        if (banner && banner.image_url) {
            const parts = banner.image_url.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // 3. Xóa dòng dữ liệu trong Database
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã xóa banner vĩnh viễn!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;