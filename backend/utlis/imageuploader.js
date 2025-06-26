const fs = require("fs");
const path = require("path");

/**
 * Saves a local image file into the public/uploads folder with a unique filename.
 * @param {string} inputFilePath - Full path to the image file to be copied.
 * @returns {string} Relative path to the saved image (e.g., /uploads/123456789.jpg)
 */
exports.saveImageToPublic= async (inputFilePath) =>{
  // Ensure file exists
  if (!fs.existsSync(inputFilePath)) {
    throw new Error("Image file does not exist.");
  }

  // Get file extension
  const ext = path.extname(inputFilePath);
  const uniqueName = Date.now() + ext;

  const destDir = path.join(__dirname, "public/uploads");
  const destPath = path.join(destDir, uniqueName);

  // Create folder if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy file
  fs.copyFileSync(inputFilePath, destPath);

  console.log("Saved image to:", destPath);
  return `/uploads/${uniqueName}`;
}

