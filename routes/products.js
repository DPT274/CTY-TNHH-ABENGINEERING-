const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH SẢN PHẨM (Dùng cho cả Web User, Admin và Zalo App)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. THÊM SẢN PHẨM MỚI VÀ UPLOAD ẢNH MÁY MÓC
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, is_featured } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng chọn ảnh sản phẩm!' });

        // Upload ảnh lên thư mục 'products/' trong bucket
        const fileName = `products/${Date.now()}_${file.originalname}`;
        const { error: uploadError } = await supabase.storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        // Lấy link ảnh công khai
        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

        // Lưu thông tin vào bảng products
        const { data, error: insertError } = await supabase
            .from('products')
            .insert([{
                name,
                description,
                image_url: publicUrl,
                is_featured: is_featured === 'true' || is_featured === true
            }])
            .select();

        if (insertError) throw insertError;
        res.json({ message: 'Thêm sản phẩm thành công!', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. SỬA THÔNG TIN SẢN PHẨM
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_featured } = req.body;
        const file = req.file;

        let updateData = {
            name,
            description,
            is_featured: is_featured === 'true' || is_featured === true
        };

        // Nếu người dùng có chọn ảnh mới thì mới upload lại
        if (file) {
            const fileName = `products/${Date.now()}_${file.originalname}`;
            await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            const { data: { publicUrl } } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);

            updateData.image_url = publicUrl;
        }

        const { error } = await supabase.from('products').update(updateData).eq('id', id);
        if (error) throw error;

        res.json({ message: 'Cập nhật sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. XÓA SẢN PHẨM
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Đã xóa sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;