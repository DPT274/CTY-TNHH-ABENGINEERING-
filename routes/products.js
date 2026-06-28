const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH SẢN PHẨM
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

// 2. THÊM SẢN PHẨM MỚI VÀ UPLOAD ẢNH (Đã fix lỗi tên file tiếng Việt)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, is_featured } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng chọn ảnh sản phẩm!' });

        // Tách đuôi file và đổi tên thành chuỗi số an toàn tuyệt đối
        const extension = file.originalname.split('.').pop();
        const fileName = `products/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

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

// 3. SỬA THÔNG TIN SẢN PHẨM (Đã fix lỗi tên file)
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

        if (file) {
            const extension = file.originalname.split('.').pop();
            const fileName = `products/${Date.now()}.${extension}`;

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

// 4. XÓA SẢN PHẨM (Nâng cấp: Dọn sạch ảnh trên Cloud khi xóa)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy link ảnh trước khi xóa
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('image_url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Xóa file ảnh trên Cloud
        if (product && product.image_url) {
            const parts = product.image_url.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // Xóa dữ liệu trong DB
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã xóa sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;