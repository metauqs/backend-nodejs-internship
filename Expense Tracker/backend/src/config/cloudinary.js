const cloudinary = require('cloudinary').v2;

const hasExplicit = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);
const hasUrl = Boolean(process.env.CLOUDINARY_URL);

const configured = hasExplicit || hasUrl;

if (hasUrl) {
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
    });
} else if (hasExplicit) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

module.exports = {
    cloudinary,
    configured,
};
