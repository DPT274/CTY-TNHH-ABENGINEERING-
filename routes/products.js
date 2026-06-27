const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// LẤY DANH SÁCH SẢN PHẨM NỔI BẬT
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('is_featured', true).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// THÊM SẢN PHẨM MỚI
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, is_featured } = req.body;
        const file = req.file;
        let imageUrl = '';

        if (!file) return res.status(400).json({ error: 'Cần có hình ảnh máy móc!' });

        const fileName = `products/${Date.now()}_${file.originalname}`;
        const { error: uploadError } = await supabase.storage.from('ab_engineering_bucket').upload(fileName, file.buffer, { contentType: file.mimetype });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('ab_engineering_bucket').getPublicUrl(fileName);
        imageUrl = data.publicUrl;

        const { data: insertData, error } = await supabase.from('products').insert([{
            name,
            description,
            image_url: imageUrl,
            is_featured: is_featured === 'true'
        }]).select();

        if (error) throw error;
        res.json({ message: 'Thêm sản phẩm thành công', data: insertData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// XÓA SẢN PHẨM
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Đã xóa sản phẩm' });
    } catch (error) {
        res.