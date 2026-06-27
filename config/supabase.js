const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Đảm bảo dotenv đọc đúng file .env nằm ở thư mục gốc backend
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Lỗi: Chưa tìm thấy cấu hình Supabase trong file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;