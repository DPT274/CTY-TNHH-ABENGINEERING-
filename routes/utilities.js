const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH TIỆN ÍCH (Kèm tính năng tự động khởi tạo nếu DB trống)
router.get('/', async (req, res) => {
    try {
        let { data, error } = await supabase
            .from('utilities')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        // TỰ ĐỘNG CHÈN 6 MỤC MẶC ĐỊNH NẾU DATABASE ĐANG TRỐNG
        if (!data || data.length === 0) {
            const defaultUtilities = [
                { id: 1, name: 'Giới Thiệu', path: '/about', image: '' },
                { id: 2, name: 'Dự án', path: '/projects', image: '' },
                { id: 3, name: 'Tuyển Dụng', path: '/jobs', image: '' },
                { id: 4, name: 'Tin Tức', path: '/news', image: '' },
                { id: 5, name: 'Liên Hệ', path: '/hotline', image: '' },
                { id: 6, name: 'Gia công', path: '/product-info', image: '' }
            ];

            const { error: insertError } = await supabase.from('utilities').insert(defaultUtilities);
            if (insertError) throw insertError;

            data = defaultUtilities; // Trả về luôn data vừa tạo cho Web Admin
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CHỈ CẬP NHẬT ICON
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon mới!' });

        // Lấy link ảnh cũ để xóa khỏi Storage
        const { data: utility } = await supabase.from('utilities').select('image').eq('id', id).single();

        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // Tải ảnh mới
        const extension = file.originalname.split('.').pop();
        const newFileName = `utilities/${Date.now()}.${extension}`;

        await supabase.storage
            .from('ab_engineering_bucket')
            .upload(newFileName, file.buffer, { contentType: file.mimetype });

        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(newFileName);

        // Lưu link mới vào DB
        const { error } = await supabase.from('utilities').update({ image: publicUrl }).eq('id', id);

        if (error) throw error;
        res.json({ message: 'Cập nhật Icon thành công!', imageUrl: publicUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;