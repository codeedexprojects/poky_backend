const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer-Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on request body or default to 'Products'
    const folder = req.body.folder || 'Products';

    return {
      folder: folder,
      format: 'jpg', // Convert all images to jpg (optional)
      public_id: `image-${Date.now()}-${file.originalname.split('.')[0]}`, // Custom filename
    };
  },
});

// Multer setup
const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      callback(null, true);
    } else {
      callback(null, false);
      return callback(
        new Error("Please upload images in the following formats: JPEG, PNG, JPG.")
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
});

// Middleware to handle uploaded files URLs
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    // Single file
    if (req.file) {
      req.fileUrl = req.file.path; // Cloudinary URL
    }

    // Multiple files
    if (req.files) {
      req.fileUrls = req.files.map(file => file.path);
    }

    next();
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ error: "Failed to upload file(s) to Cloudinary" });
  }
};

module.exports = { upload, uploadToCloudinaryMiddleware };
