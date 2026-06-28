const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH TIN TỨC
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. ĐĂNG BÀI VIẾT MỚI
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        let publicUrl = null;

        if (!title || !content) {
            return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và nội dung' });
        }

        // Nếu có up ảnh bìa
        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `news/${Date.now()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);

            publicUrl = urlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('news')
            .insert([{ title, content, image: publicUrl }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Đăng bài thành công!', data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. CẬP NHẬT BÀI VIẾT
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        let updateData = { title, content };

        // Nếu Admin chọn ảnh mới, up lên và ghi đè
        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `news/${Date.now()}.${extension}`;

            await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            const { data: urlData } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);

            updateData.image = urlData.publicUrl;
        }

        const { error } = await supabase.from('news').update(updateData).eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. XÓA BÀI VIẾT
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Xóa trong DB (Để an toàn và không mất thời gian, tạm thời chỉ xóa data trong bảng, ảnh cứ để trên Cloud làm kho lưu trữ)
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Đã xóa bài viết!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;