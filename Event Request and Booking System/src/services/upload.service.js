const { cloudinary, isConfigured } = require("../config/cloudinary");
const AppError = require("../utils/AppError");

function uploadBuffer(buffer, folder = "event-booking-system/events") {
  if (!isConfigured) {
    throw new AppError(
      "Cloudinary is not configured. Add Cloudinary credentials to .env.",
      503
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId || !isConfigured) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image"
  });
}

module.exports = { uploadBuffer, deleteImage };