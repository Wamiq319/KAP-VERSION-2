import multer from "multer";
import path from "path";
import fs from "fs";

// Configure temp directory (public/temp)
const tempDir = path.join(process.cwd(), "public", "temp");

// Create directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Accepted image types
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Generate random filename
const generateImageName = (originalName) => {
  const ext = path.extname(originalName);
  return `image-${Math.random().toString(36).substring(2, 10)}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateImageName(file.originalname));
  },
});

// Middleware for uploading a SINGLE IMAGE (field name: 'image')
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (imageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, or WEBP images are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("image");

// Utility to delete a file
export const deleteTempFile = (filename) => {
  const filePath = path.join(tempDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting temp file:", err);
  });
};
