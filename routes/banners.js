const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

// Cấu hình Multer lưu tạm file vào RAM
const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH BANNER CHO ZALO APP (Chỉ lấy banner đang BẬT)
router.get('/', async (req, res) => {
    try {
        const { data: banners, error } = await supabase
            .from('banners')
            .select('image_url')
            .eq('is_active', true) // Chốt chặn: Chỉ lấy ảnh đã được Admin bật
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Biến đổi cấu trúc mảng để khớp 100% với giao diện Zalo App của bạn
        const imageUrls = banners.map(banner => banner.image_url);

        res.json({ images: imageUrls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. LẤY DANH SÁCH BANNER CHO ADMIN (Xem toàn bộ & Kèm thời gian lướt)
router.get('/admin', async (req, res) => {
    try {
        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ banners: banners, duration: 3000 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. THÊM BANNER MỚI TỪ TRANG QUẢN TRỊ
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

        // Lưu thông tin vào Database
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

// 4. CẬP NHẬT TRẠNG THÁI BANNER (Bật / Tạm ẩn)
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

// 5. XÓA BANNER KHỎI DATABASE VÀ DỌN DẸP STORAGE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy link ảnh trước khi xóa dữ liệu bảng
        const { data: banner, error: fetchError } = await supabase
            .from('banners')
            .select('image_url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Xóa file gốc trên Storage
        if (banner && banner.image_url) {
            const parts = banner.image_url.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // Xóa dòng dữ liệu trong Database
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã xóa banner vĩnh viễn!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;