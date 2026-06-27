// Thay bằng dòng chuẩn này:
const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// LẤY DANH SÁCH TIỆN ÍCH CHỨC NĂNG
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

// THÊM HOẶC CẬP NHẬT ICON DANH MỤC
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, path, order_index } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Vui lòng chọn Icon!' });

        const fileName = `utilities/${Date.now()}_${file.originalname}`;
        await supabase.storage
            .from('ab_engineering_bucket')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        const { data: { publicUrl } } = supabase.storage
            .from('ab_engineering_bucket')
            .getPublicUrl(fileName);

        const { data, error } = await supabase
            .from('utilities')
            .insert([{ name, path, image: publicUrl, order_index: parseInt(order_index) || 0 }])
            .select();

        if (error) throw error;
        res.json({ message: 'Thêm danh mục chức năng thành công!', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SỬA DANH MỤC KHÔNG CẦN TẢI LẠI ẢNH NẾU KHÔNG MUỐN
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, path, order_index } = req.body;
        const file = req.file;

        let updateData = { name, path, order_index: parseInt(order_index) || 0 };

        if (file) {
            const fileName = `utilities/${Date.now()}_${file.originalname}`;
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

module.exports = router;