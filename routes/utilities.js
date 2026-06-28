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
            .order('order_index', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. THÊM DANH MỤC (Đã bỏ yêu cầu Path, fix lỗi tên file tiếng Việt)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, order_index } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon!' });
        if (!name) return res.status(400).json({ error: 'Vui lòng nhập tên danh mục!' });

        // Tách đuôi file và đổi tên thành chuỗi số an toàn
        const extension = file.originalname.split('.').pop();
        const fileName = `utilities/${Date.now()}.${extension}`;

        await supabase.storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

        // Tự động gán path = '#' để DB không báo lỗi thiếu dữ liệu
        const { data, error } = await supabase
            .from('utilities')
            .insert([{ name, path: '#', image: publicUrl, order_index: parseInt(order_index) || 0 }])
            .select();

        if (error) throw error;
        res.json({ message: 'Thêm danh mục chức năng thành công!', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. SỬA DANH MỤC
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, order_index } = req.body;
        const file = req.file;

        let updateData = { name, order_index: parseInt(order_index) || 0 };

        if (file) {
            const extension = file.originalname.split('.').pop();
            const fileName = `utilities/${Date.now()}.${extension}`;

            await supabase.storage.from('ab_engineering_bucket').upload(fileName, file.buffer, { contentType: file.mimetype });
            const { data: { publicUrl } } = supabase.storage.from('ab_engineering_bucket').getPublicUrl(fileName);
            updateData.image = publicUrl;
        }

        const { error } = await supabase.from('utilities').update(updateData).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Cập nhật danh mục thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. THÊM MỚI: XÓA DANH MỤC VÀ DỌN ẢNH TRÊN STORAGE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy link ảnh trước khi xóa
        const { data: utility, error: fetchError } = await supabase
            .from('utilities')
            .select('image')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Xóa file ảnh trên Cloud
        if (utility && utility.image) {
            const parts = utility.image.split('/ab_engineering_bucket/');
            if (parts.length > 1) {
                const fileName = parts[1];
                await supabase.storage.from('ab_engineering_bucket').remove([fileName]);
            }
        }

        // Xóa dữ liệu trong DB
        const { error } = await supabase.from('utilities').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Đã xóa danh mục thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;