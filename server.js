const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// 1. Import tất cả các file trong thư mục routes
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const utilityRoutes = require('./routes/utilities');
const customerRoutes = require('./routes/customers');
const jobRoutes = require('./routes/jobs');        // Đã thêm
const newsRoutes = require('./routes/news');        // Đã thêm
const aboutRoutes = require('./routes/about');      // Đã thêm
const branchRoutes = require('./routes/branches');  // Đã thêm
const hotlineRoutes = require('./routes/hotlines'); // Đã thêm
const machiningRoutes = require('./routes/machining');// Đã thêm
const projectRoutes = require('./routes/projects'); // Đã thêm

// 2. Khai báo các đường dẫn API
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);        // Đã thêm
app.use('/api/news', newsRoutes);        // Đã thêm
app.use('/api/about', aboutRoutes);      // Đã thêm
app.use('/api/branches', branchRoutes);  // Đã thêm
app.use('/api/hotlines', hotlineRoutes); // Đã thêm
app.use('/api/machining', machiningRoutes);// Đã thêm
app.use('/api/projects', projectRoutes); // Đã thêm

// Khởi động Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server AB Engineering đang chạy cực mượt trên port ${PORT}`);
});