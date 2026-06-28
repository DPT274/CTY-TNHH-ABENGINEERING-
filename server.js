const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Import các router - Đảm bảo các file này tồn tại và có 'module.exports = router'
try {
    app.use('/api/banners', require('./routes/banners'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/utilities', require('./routes/utilities'));
    app.use('/api/customers', require('./routes/customers'));
    app.use('/api/jobs', require('./routes/jobs'));
    app.use('/api/news', require('./routes/news'));
    app.use('/api/about', require('./routes/about'));
    app.use('/api/branches', require('./routes/branches'));
    app.use('/api/hotlines', require('./routes/hotlines'));
    app.use('/api/machining', require('./routes/machining'));
    app.use('/api/projects', require('./routes/projects'));
} catch (error) {
    console.error("Lỗi khi import routes: Kiểm tra xem các file trong thư mục routes có module.exports không!");
}

// Route kiểm tra server chạy ổn không
app.get('/', (req, res) => {
    res.send('Server AB Engineering is running!');
});

// Khởi động Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server AB Engineering đang chạy cực mượt trên port ${PORT}`);
});