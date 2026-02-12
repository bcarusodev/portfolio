const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { encode } = require("blurhash");

const projectsDir = path.join(process.cwd(), "data", "projects");
const publicDir = path.join(process.cwd(), "public");

const getImageData = (image) => {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async (imagePath) => {
  try {
    const image = await loadImage(imagePath);
    // Resize for faster processing while maintaining aspect ratio
    const maxSize = 64;
    let width = image.width;
    let height = image.height;

    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    return encode(imageData.data, imageData.width, imageData.height, 4, 4);
  } catch (error) {
    console.error(`Error encoding ${imagePath}:`, error);
    return null;
  }
};

const processProjects = async () => {
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(projectsDir, file);
    let content = fs.readFileSync(filePath, "utf-8");

    // Extract thumbnail path
    const thumbnailMatch = content.match(/thumbnail:\s*"([^"]+)"/);
    if (!thumbnailMatch) {
      console.log(`No thumbnail found in ${file}`);
      continue;
    }

    const thumbnailPath = thumbnailMatch[1];
    const fullImagePath = path.join(publicDir, thumbnailPath);

    // Check if blurhash already exists
    if (content.includes("thumbnailBlurhash:")) {
      console.log(`Blurhash already exists in ${file}, skipping...`);
      continue;
    }

    console.log(`Processing ${file}...`);

    try {
      const blurhash = await encodeImageToBlurhash(fullImagePath);
      if (blurhash) {
        // Insert blurhash after thumbnail line
        content = content.replace(
          /(thumbnail:\s*"[^"]+")/,
          `$1\nthumbnailBlurhash: "${blurhash}"`
        );
        fs.writeFileSync(filePath, content);
        console.log(`  Added blurhash: ${blurhash}`);
      }
    } catch (error) {
      console.error(`  Error processing ${file}:`, error);
    }
  }

  console.log("\nDone!");
};

processProjects();
