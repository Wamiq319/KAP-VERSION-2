import multer from "multer";
import path from "path";
import fs from "fs";

// Configure temp directory (public/temp)
const tempDir = path.join(process.cwd(), "public", "temp");

// Create directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Accepted file types
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const attachmentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

// Generate random characters (8 chars)
const generateRandomChars = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Custom filename generators
const generateImageName = (originalName) => {
  const ext = path.extname(originalName);
  return `logoImage-${generateRandomChars()}${ext}`;
};

const generateAttachmentName = (originalName) => {
  const ext = path.extname(originalName);
  return `file-${generateRandomChars()}${ext}`;
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    let uniqueName;
    if (imageMimeTypes.includes(file.mimetype)) {
      uniqueName = generateImageName(file.originalname);
    } else {
      uniqueName = generateAttachmentName(file.originalname);
    }
    cb(null, uniqueName);
  },
});

// Middleware for uploading a SINGLE IMAGE
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
}).single("logoImage");

// Middleware for uploading a SINGLE ATTACHMENT
export const uploadAttachment = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (attachmentMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for attachment"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("attachment");

// Utility to delete a file
export const deleteTempFile = (filename) => {
  const filePath = path.join(tempDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting temp file:", err);
  });
};
