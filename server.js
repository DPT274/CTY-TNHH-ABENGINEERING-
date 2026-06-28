const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// =======================================================
// 1. IMPORT TOÀN BỘ CÁC FILE CHỨC NĂNG (ROUTES)
// =======================================================
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const utilityRoutes = require('./routes/utilities');
const customerRoutes = require('./routes/customers');
const aboutRoutes = require('./routes/about');       // Hồ sơ năng lực
const branchRoutes = require('./routes/branches');   // Chi nhánh
const hotlineRoutes = require('./routes/hotlines'); // Đường dây nóng
const jobRoutes = require('./routes/jobs');         // Tuyển dụng
const newsRoutes = require('./routes/news');       // Tin tức
const projectRoutes = require('./routes/projects'); // Dự án
const machiningRoutes = require('./routes/machining'); // Yêu cầu gia công

// =======================================================
// 2. KHAI BÁO ĐƯỜNG DẪN API CHO TOÀN BỘ HỆ THỐNG
// =======================================================
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/customers', customerRoutes);

// Các chức năng mới thêm
app.use('/api/settings/about', aboutRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/hotlines', hotlineRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/projects', projectRoutes);

// Riêng phần gia công, dùng tiền tố này để khớp với /api/machining-request và /api/machining-history
// THAY BẰNG DÒNG NÀY (Chỉ giữ lại /api):
app.use('/api', machiningRoutes);

// =======================================================
// 3. KHỞI ĐỘNG SERVER
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server AB Engineering đang chạy cực mượt trên port ${PORT}`);
});