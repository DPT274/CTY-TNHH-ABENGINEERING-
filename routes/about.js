const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Đường dẫn tới file cấu hình supabase của bạn

// 1. API LẤY THÔNG TIN HỒ SƠ NĂNG LỰC (GET)
router.get('/', async (req, res) => {
    try {
        console.log("=== API GET /api/settings/about được gọi từ Client ===");

        const { data, error } = await supabase
            .from('company_profile')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Chuyển đổi từ snake_case của Database sang camelCase của Frontend
        const responseData = data ? {
            companyName: data.company_name,
            slogan: data.slogan,
            bannerImg: data.banner_img,
            aboutText: data.about_text,
            statsImg: data.stats_img,
            visionText: data.vision_text,
            missionText: data.mission_text,

            core1Title: data.core1_title, core1Desc: data.core1_desc,
            core2Title: data.core2_title, core2Desc: data.core2_desc,
            core3Title: data.core3_title, core3Desc: data.core3_desc,
            core4Title: data.core4_title, core4Desc: data.core4_desc,

            stat1Num: data.stat1_num, stat1Text: data.stat1_text,
            stat2Num: data.stat2_num, stat2Text: data.stat2_text,
            stat3Num: data.stat3_num, stat3Text: data.stat3_text,
            stat4Num: data.stat4_num, stat4Text: data.stat4_text,

            field1Title: data.field1_title, field1Desc: data.field1_desc,
            field2Title: data.field2_title, field2Desc: data.field2_desc,
            field3Title: data.field3_title, field3Desc: data.field3_desc,
            field4Title: data.field4_title, field4Desc: data.field4_desc,
            field5Title: data.field5_title, field5Desc: data.field5_desc
        } : {};

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error("Lỗi GET About:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. API CẬP NHẬT THÔNG TIN HỒ SƠ NĂNG LỰC (POST)
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        console.log("=== API POST /api/settings/about nhận dữ liệu từ Admin ===");

        // Chuyển đổi ngược từ camelCase của Frontend sang snake_case lưu DB
        const dbPayload = {
            id: 1,
            company_name: payload.companyName || "",
            slogan: payload.slogan || "",
            banner_img: payload.bannerImg || "",
            about_text: payload.aboutText || "",
            stats_img: payload.statsImg || "",
            vision_text: payload.visionText || "",
            mission_text: payload.missionText || "",

            core1_title: payload.core1Title || "", core1_desc: payload.core1Desc || "",
            core2_title: payload.core2Title || "", core2_desc: payload.core2Desc || "",
            core3_title: payload.core3Title || "", core3_desc: payload.core3Desc || "",
            core4_title: payload.core4Title || "", core4_desc: payload.core4Desc || "",

            stat1_num: payload.stat1Num || "", stat1_text: payload.stat1Text || "",
            stat2_num: payload.stat2Num || "", stat2_text: payload.stat2Text || "",
            stat3_num: payload.stat3Num || "", stat3_text: payload.stat3Text || "",
            stat4_num: payload.stat4Num || "", stat4_text: payload.stat4Text || "",

            field1_title: payload.field1Title || "", field1_desc: payload.field1Desc || "",
            field2_title: payload.field2Title || "", field2_desc: payload.field2Desc || "",
            field3_title: payload.field3Title || "", field3_desc: payload.field3Desc || "",
            field4_title: payload.field4Title || "", field4_desc: payload.field4Desc || "",
            field5_title: payload.field5Title || "", field5_desc: payload.field5Desc || "",

            updated_at: new Date()
        };

        const { error } = await supabase.from('company_profile').upsert(dbPayload);
        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật hồ sơ năng lực thành công!' });
    } catch (error) {
        console.error("Lỗi POST About:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;