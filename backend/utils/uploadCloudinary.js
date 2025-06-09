import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadLogoImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "logos",
      quality: "auto:best",
      fetch_format: "auto",
      width: 300,
      height: 300,
      crop: "limit",
    });

    // Cleanup temp file
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    // Ensure cleanup even if upload fails
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`Logo upload failed: ${error.message}`);
  }
};

/**
 * Uploads generic attachment to Cloudinary
 * @param {String} filePath - Path to temporary file
 * @returns {Promise<{url: String, public_id: String}>}
 */
export const uploadAttachment = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "government-sectors/attachments",
      resource_type: "auto", // Maintains original format
    });

    // Cleanup temp file
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`Attachment upload failed: ${error.message}`);
  }
};

export const deleteFromCloudinary = async (publicId, isImage = true) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: isImage ? "image" : "raw",
      invalidate: true, // Optional: clears CDN cache
    });

    if (result.result !== "ok") {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};
