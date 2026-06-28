const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 6 mục gốc bất di bất dịch của công ty
const REQUIRED_UTILITIES = [
    { id: 1, name: 'Giới Thiệu', path: '/about', image: '', is_hidden: false },
    { id: 2, name: 'Dự án', path: '/projects', image: '', is_hidden: false },
    { id: 3, name: 'Tuyển Dụng', path: '/jobs', image: '', is_hidden: false },
    { id: 4, name: 'Tin Tức', path: '/news', image: '', is_hidden: false },
    { id: 5, name: 'Liên Hệ', path: '/hotline', image: '', is_hidden: false },
    { id: 6, name: 'Gia công', path: '/product-info', image: '', is_hidden: false }
];

// 1. LẤY DANH SÁCH (Tự động bù lại mục Giới Thiệu đã mất khi bạn F5)
router.get('/', async (req, res) => {
    try {
        let { data, error } = await supabase.from('utilities').select('*').order('id', { ascending: true });
        if (error) throw error;

        // Tự động hồi phục nếu thiếu mục
        const missingItems = REQUIRED_UTILITIES.filter(reqItem => !data.some(dbItem => dbItem.id === reqItem.id));
        if (missingItems.length > 0) {
            await supabase.from('utilities').insert(missingItems);
            const { data: updatedData } = await supabase.from('utilities').select('*').order('id', { ascending: true });
            data = updatedData;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. SỬA THÔNG TIN (Tên, Đường dẫn, Ẩn/Hiện)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, path, is_hidden } = req.body;
        const { error } = await supabase.from('utilities').update({ name, path, is_hidden }).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. XÓA ẢNH ICON (Đưa ảnh về trống)
router.patch('/:id/clear-image', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: utility } = await supabase.from('utilities').select('image').eq('id', id).single();

        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                await supabase.storage.from('ab_engineering_bucket').remove([parts[1]]);
            }
        }

        const { error } = await supabase.from('utilities').update({ image: '' }).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Đã xóa ảnh icon!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. ĐỔI ICON MỚI
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Chưa chọn file!' });

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
        res.json({ imageUrl: publicUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;