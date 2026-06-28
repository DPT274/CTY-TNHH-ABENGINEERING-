const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// 1. LẤY DANH SÁCH VIỆC LÀM
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. THÊM VIỆC LÀM MỚI (CÓ UPLOAD ẢNH)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const bodyData = req.body;
        let publicUrl = null;

        // Nếu có file ảnh đính kèm
        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `jobs/${Date.now()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);
            
            publicUrl = urlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('jobs')
            .insert([{
                title: bodyData.title,
                company: bodyData.company,
                salary: bodyData.salary,
                contact: bodyData.contact,
                email: bodyData.email,
                description: bodyData.description,
                requirements: bodyData.requirements,
                benefits: bodyData.benefits,
                expertise: bodyData.expertise,
                location: bodyData.location,
                deadline: bodyData.deadline,
                image: publicUrl
            }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Thêm việc làm thành công!', data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. SỬA VIỆC LÀM (CÓ THỂ ĐỔI ẢNH MỚI)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const bodyData = req.body;
        
        let updateData = {
            title: bodyData.title,
            company: bodyData.company,
            salary: bodyData.salary,
            contact: bodyData.contact,
            email: bodyData.email,
            description: bodyData.description,
            requirements: bodyData.requirements,
            benefits: bodyData.benefits,
            expertise: bodyData.expertise,
            location: bodyData.location,
            deadline: bodyData.deadline,
        };

        if (req.file) {
            const file = req.file;
            const extension = file.originalname.split('.').pop();
            const fileName = `jobs/${Date.now()}.${extension}`;

            await supabase.storage
                .from('ab_engineering_bucket')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            const { data: urlData } = supabase.storage
                .from('ab_engineering_bucket')
                .getPublicUrl(fileName);
            
            updateData.image = urlData.publicUrl;
        }

        const { error } = await supabase.from('jobs').update(updateData).eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. XÓA VIỆC LÀM
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('jobs').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Đã xóa việc làm!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;