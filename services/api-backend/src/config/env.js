const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

module.exports = {
  env: {
    PORT: Number(process.env.PORT || 8080),
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/smart_telehealth',
    JWT_SECRET: process.env.JWT_SECRET || 'smart_telehealth_dev_secret_key_123',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY || '',
    ASSEMBLYAI_BASE_URL: process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com/v2',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    RESEND_SENDER_EMAIL: process.env.RESEND_SENDER_EMAIL || 'alerts@telehealth.local',
    PHARMACY_SURGE_THRESHOLD: Number(process.env.PHARMACY_SURGE_THRESHOLD || 5),
    PHARMACY_SURGE_WINDOW_HOURS: Number(process.env.PHARMACY_SURGE_WINDOW_HOURS || 24),
  },
};
