const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH DỰ ÁN
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. ĐĂNG BÀI VIẾT DỰ ÁN MỚI
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, content, link } = req.body;
        let publicUrl = null;

        if (!title || !content) {
            return res.status(400).json({ error: 'Vui lòng nhập đủ tiêu đề và nội dung' });
        }

        // Xử lý upload ảnh bìa nếu có
        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `projects/${Date.now()}.${extension}`;

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
            .from('projects')
            .insert([{ title, content, link, image: publicUrl }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Đăng dự án thành công!', data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. CẬP NHẬT DỰ ÁN
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, link } = req.body;

        let updateData = { title, content, link };

        // Nếu Admin tải lên ảnh bìa mới
        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `projects/${Date.now()}.${extension}`;

            await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            const { data: urlData } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);

            updateData.image = urlData.publicUrl;
        }

        const { error } = await supabase.from('projects').update(updateData).eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. XÓA DỰ ÁN
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Đã xóa bài viết dự án!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;