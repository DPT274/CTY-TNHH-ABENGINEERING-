const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase Client (Hãy đảm bảo bạn đã cấu hình biến môi trường này trong file .env hoặc trên Render)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// API xử lý đồng bộ và lưu thông tin khách hàng
router.post('/verify-zalo', async (req, res) => {
    try {
        const { phone, name, avatar } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào cơ bản
        if (!phone) {
            return res.status(400).json({ error: "Số điện thoại không được để trống!" });
        }

        // Định dạng lại số điện thoại cho chuẩn (Ví dụ bỏ khoảng trắng nếu có)
        const cleanPhone = phone.replace(/\s+/g, '');

        console.log(`Đang xử lý đồng bộ cho SĐT: ${cleanPhone}`);

        // 2. Tiến hành lưu hoặc cập nhật dữ liệu vào bảng customers dựa trên cột 'phone'
        const { data, error } = await supabase
            .from('customers')
            .upsert(
                {
                    phone: cleanPhone,
                    name: name || "Người dùng Zalo",
                    avatar: avatar || ""
                },
                { onConflict: 'phone' } // Nếu trùng số điện thoại thì cập nhật Tên và Avatar mới
            )
            .select();

        if (error) {
            console.error("Lỗi Supabase:", error.message);
            return res.status(500).json({ error: "Không thể lưu dữ liệu vào cơ sở dữ liệu", details: error.message });
        }

        // 3. Trả kết quả thành công về cho Frontend
        return res.status(200).json({
            success: true,
            message: "Đồng bộ thông tin khách hàng thành công!",
            customer: data[0]
        });

    } catch (err) {
        console.error("Lỗi hệ thống Backend:", err.message);
        return res.status(500).json({ error: "Lỗi hệ thống nghiêm trọng", details: err.message });
    }
});

module.exports = router;