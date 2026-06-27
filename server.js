const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Import các file chức năng Admin (Routes)
const bannerRoutes = require('./routes/banners');
const productRoutes = require('./routes/products');
const utilityRoutes = require('./routes/utilities');

// Khai báo đường dẫn API
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/utilities', utilityRoutes);

// Khởi động Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server AB Engineering đang chạy cực mượt trên port ${PORT}`);
});