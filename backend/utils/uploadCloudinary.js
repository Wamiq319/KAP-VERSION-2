import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath) => {
  try {
    console.log("Cloudinary Config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "Present" : "Missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing",
    });

    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Cloudinary credentials are not properly configured");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "Kap/organizationsLogos",
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
    console.error("Detailed upload error:", error);
    // Ensure cleanup even if upload fails
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`Logo upload failed: ${error.message}`);
  }
};

// Add this function to test Cloudinary configuration
export const testCloudinaryConfig = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  console.log("Cloudinary Configuration:", {
    cloud_name: config.cloud_name ? "Set" : "Missing",
    api_key: config.api_key ? "Set" : "Missing",
    api_secret: config.api_secret ? "Set" : "Missing",
  });

  return Object.values(config).every((value) => value);
};
