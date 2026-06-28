const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('utilities').select('*').order('id', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CẬP NHẬT THÔNG TIN (Sửa Tên, Đường dẫn, Ẩn/Hiện)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, path, is_hidden } = req.body;

        const { error } = await supabase
            .from('utilities')
            .update({ name, path, is_hidden })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Cập nhật thông tin thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. CẬP NHẬT ICON
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon mới!' });

        const { data: utility } = await supabase.from('utilities').select('image').eq('id', id).single();
        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                await supabase.storage.from('ab_engineering_bucket').remove([parts[1]]);
            }
        }

        const extension = file.originalname.split('.').pop();
        const newFileName = `utilities/${Date.now()}.${extension}`;
        await supabase.storage.from('ab_engineering_bucket').upload(newFileName, file.buffer, { contentType: file.mimetype });
        const { data: { publicUrl } } = supabase.storage.from('ab_engineering_bucket').getPublicUrl(newFileName);

        const { error } = await supabase.from('utilities').update({ image: publicUrl }).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Cập nhật Icon thành công!', imageUrl: publicUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. XÓA DANH MỤC
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy ảnh để xóa khỏi Storage
        const { data: utility } = await supabase.from('utilities').select('image').eq('id', id).single();
        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                await supabase.storage.from('ab_engineering_bucket').remove([parts[1]]);
            }
        }

        const { error } = await supabase.from('utilities').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;