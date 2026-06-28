const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH TIỆN ÍCH (Chốt thứ tự cố định theo ID)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('utilities')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CHỈ CẬP NHẬT ICON (Khóa tính năng đổi tên/đường dẫn để bảo vệ cấu trúc Mini App)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon mới!' });

        // BƯỚC 1: Lấy link ảnh cũ để xóa khỏi Storage (Tiết kiệm dung lượng)
        const { data: utility } = await supabase
            .from('utilities')
            .select('image')
            .eq('id', id)
            .single();

        if (utility && utility.image) {
            // Tách chuỗi URL để lấy tên file thực tế trên Storage
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                // Xóa ảnh cũ
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // BƯỚC 2: Tải ảnh mới lên Storage
        const extension = file.originalname.split('.').pop();
        const newFileName = `utilities/${Date.now()}.${extension}`;

        await supabase.storage
            .from('ab_engineering_bucket')
            .upload(newFileName, file.buffer, { contentType: file.mimetype });

        // Lấy URL công khai
        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(newFileName);

        // BƯỚC 3: Lưu link ảnh mới vào DB
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

// KHÔNG CÓ ROUTER.POST (Thêm) VÀ ROUTER.DELETE (Xóa) ĐỂ CHỐT CỨNG 6 MỤC

module.exports = router;