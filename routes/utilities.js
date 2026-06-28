const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH TIỆN ÍCH
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('utilities')
            .select('*')
            .order('id', { ascending: true }); // Chốt thứ tự theo ID

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CHỈ CẬP NHẬT ICON (Đã khóa chức năng sửa tên/đường dẫn)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon mới!' });

        // Lấy link ảnh cũ để xóa khỏi Storage (Tiết kiệm dung lượng)
        const { data: utility } = await supabase
            .from('utilities')
            .select('image')
            .eq('id', id)
            .single();

        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // Tải ảnh mới lên
        const extension = file.originalname.split('.').pop();
        const newFileName = `utilities/${Date.now()}.${extension}`;

        await supabase.storage
            .from('ab_engineering_bucket')
            .upload(newFileName, file.buffer, { contentType: file.mimetype });

        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(newFileName);

        // Lưu link ảnh mới vào DB
        const { error } = await supabase
            .from('utilities')
            .update({ image: publicUrl })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Cập nhật Icon thành công!', imageUrl: publicUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// KHÔNG CÓ ROUTER.POST VÀ ROUTER.DELETE NỮA

module.exports = router;