const { cloudinary, configured } = require('../config/cloudinary');
const ApiError = require('../utils/apiError');

function uploadBuffer(
    buffer,
    { folder = 'expense-tracker/receipts', resourceType = 'auto' } = {}
) {
    if (!configured) {
        throw new ApiError(
            503,
            'Cloudinary is not configured. Add credentials to Backend/.env'
        );
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    bytes: result.bytes,
                    resourceType: result.resource_type || resourceType,
                });
            }
        );

        uploadStream.end(buffer);
    });
}

async function deleteUpload(publicId, resourceType = 'image') {
    if (!publicId || !configured) return;

    await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
    });
}

module.exports = {
    uploadBuffer,
    deleteUpload,
};
