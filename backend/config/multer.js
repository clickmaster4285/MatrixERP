// config/multer.js - UPDATED
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define folder path for work orders
const workOrdersFolder = path.join(__dirname, "../uploads/work-orders");
const attachmentsFolder = path.join(__dirname, '../uploads/attachments');



// Create folder if it doesn't exist
const ensureFolderExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

ensureFolderExists(attachmentsFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsFolder); // Everything goes here
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, unique + '-' + cleanName);
  },
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types for work orders
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Allowed types are images, Excel, PDF, and Word documents."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

module.exports = upload;