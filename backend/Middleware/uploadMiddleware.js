const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getTenantUploadDir, getUploadedFileUrl } = require('../Utils/uploadPaths');

const rootUploadsDir = path.join(__dirname, '../uploads');

[
    rootUploadsDir,
    path.join(rootUploadsDir, 'shared'),
].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function getUploadCategory(req, file) {
    const isNews = req.originalUrl.includes('/news');
    const isAvatar = req.originalUrl.includes('/avatar') || file.fieldname === 'avatar';
    const isChat = req.originalUrl.includes('/chat') || req.originalUrl.includes('/messages');
    const isBranding = req.originalUrl.includes('/settings/branding') || file.fieldname === 'logo' || file.fieldname === 'favicon';

    if (isNews) return 'news';
    if (isAvatar) return 'profile-img';
    if (isChat) return 'chat';
    if (isBranding) return 'logo';
    if (file.fieldname === 'documents') return 'documents';
    return 'misc';
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = getTenantUploadDir(req, getUploadCategory(req, file));
        file.relativeUrl = getUploadedFileUrl({ path: path.join(dest, file.originalname) });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const isNews = req.originalUrl.includes('/news');
        const isAvatar = req.originalUrl.includes('/avatar') || file.fieldname === 'avatar';
        const isChat = req.originalUrl.includes('/chat') || req.originalUrl.includes('/messages');
        const isBranding = req.originalUrl.includes('/settings/branding') || file.fieldname === 'logo' || file.fieldname === 'favicon';

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let prefix = '';
        if (isNews) prefix = 'news-';
        else if (isChat) prefix = 'chat-';
        else if (isBranding) prefix = `${file.fieldname}-`;
        else if (isAvatar) prefix = 'avatar-';

        const filename = prefix + uniqueSuffix + path.extname(file.originalname);
        file.relativeUrl = getUploadedFileUrl({ path: path.join(getTenantUploadDir(req, getUploadCategory(req, file)), filename) });
        cb(null, filename);
    }
});

// File filter (Improved to support Images, Documents, and Voice Notes)
const fileFilter = (req, file, cb) => {
    // 1. Always allow "documents" or "file" field if it's general documents or chat attachments
    // Note: 'file' is used by ChatPopup for both images and audio Blobs
    if (file.fieldname === 'documents' || file.fieldname === 'file') {
        // We allow: Images, PDFs, Docs, and Audio MIME types
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4'
        ];

        if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            return cb(null, true);
        }

        // If it's a known extension but mime is generic, also allow (helpful for some OS/Browsers)
        const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|webm|ogg|wav|mp3|m4a/;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);

        return cb(null, true); // Fallback to allow for chat flexibility
    }

    // 2. Default restricted image filter for 'avatar' or 'image' fields (e.g. News)
    const allowedTypes = /jpeg|jpg|png|gif|webp|ico|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml' || file.mimetype === 'image/x-icon' || file.mimetype === 'image/vnd.microsoft.icon';

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for this field (jpeg, jpg, png, gif, webp)'));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (Supports ~10 mins of high quality audio or much more if compressed)
    },
    fileFilter: fileFilter
});

module.exports = upload;
