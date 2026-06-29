const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Phục vụ giao diện Web User từ thư mục dist
app.use(express.static(path.join(__dirname, 'dist')));

// =======================================================
// 1. IMPORT TOÀN BỘ CÁC FILE CHỨC NĂNG (ROUTES)
// =======================================================
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const utilityRoutes = require('./routes/utilities');
const customerRoutes = require('./routes/customers');
const aboutRoutes = require('./routes/about');
const branchRoutes = require('./routes/branches');
const hotlineRoutes = require('./routes/hotlines');
const jobRoutes = require('./routes/jobs');
const newsRoutes = require('./routes/news');
const projectRoutes = require('./routes/projects');
const machiningRoutes = require('./routes/machining');

// =======================================================
// 2. KHAI BÁO ĐƯỜNG DẪN API CHO TOÀN BỘ HỆ THỐNG
// =======================================================
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/customers', customerRoutes);

app.use('/api/settings/about', aboutRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/hotlines', hotlineRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/projects', projectRoutes);

app.use('/api', machiningRoutes);

// =======================================================
// 3. ĐIỀU HƯỚNG GIAO DIỆN WEB USER (Đã sửa lỗi Express 5.x)
// =======================================================
app.use((req, res, next) => {
    // Nếu request là gọi API mà không khớp route nào ở trên -> Trả về lỗi 404 JSON
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'API Not Found' });
    }
    // Nếu request là chuyển trang trên Frontend -> Trả về file index.html để React/Vue tự xử lý
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =======================================================
// 4. KHỞI ĐỘNG SERVER
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server AB Engineering đang chạy cực mượt trên port ${PORT}`);
});