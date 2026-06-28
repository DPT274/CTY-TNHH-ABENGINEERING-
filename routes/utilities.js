const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// Cấu trúc 6 mục gốc bắt buộc phải có của dự án
const REQUIRED_UTILITIES = [
    { id: 1, name: 'Giới Thiệu', path: '/about', image: '', is_hidden: false },
    { id: 2, name: 'Dự án', path: '/projects', image: '', is_hidden: false },
    { id: 3, name: 'Tuyển Dụng', path: '/jobs', image: '', is_hidden: false },
    { id: 4, name: 'Tin Tức', path: '/news', image: '', is_hidden: false },
    { id: 5, name: 'Liên Hệ', path: '/hotline', image: '', is_hidden: false },
    { id: 6, name: 'Gia công', path: '/product-info', image: '', is_hidden: false }
];

// 1. LẤY DANH SÁCH (Tự động bù các mục nếu vô tình bị xóa mất)
router.get('/', async (req, res) => {
    try {
        let { data, error } = await supabase.from('utilities').select('*').order('id', { ascending: true });
        if (error) throw error;

        // TÍNH NĂNG TỰ HỒI PHỤC: Kiểm tra xem có ID nào bị thiếu không
        const missingItems = REQUIRED_UTILITIES.filter(reqItem => !data.some(dbItem => dbItem.id === reqItem.id));

        if (missingItems.length > 0) {
            // Chèn lại các mục bị thiếu vào DB
            const { error: insertError } = await supabase.from('utilities').insert(missingItems);
            if (insertError) throw insertError;

            // Tải lại dữ liệu mới nhất sau khi hồi phục
            const { data: updatedData } = await supabase.from('utilities').select('*').order('id', { ascending: true });
            data = updatedData;
        }

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

// 3. XÓA RIÊNG ẢNH ICON (Gỡ ảnh đưa về mặc định)
router.patch('/:id/clear-image', async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy link ảnh cũ để xóa khỏi Storage cho đỡ nặng bộ nhớ
        const { data: utility } = await supabase.from('utilities').select('image').eq('id', id).single();
        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                await supabase.storage.from('ab_engineering_bucket').remove([parts[1]]);
            }
        }

        // Cập nhật cột image thành chuỗi rỗng trong DB
        const { error } = await supabase.from('utilities').update({ image: '' }).eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã gỡ ảnh thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. CẬP NHẬT ICON MỚI (UPLOAD)
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

// 5. XÓA HẲN DANH MỤC KHỎI HỆ THỐNG
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
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