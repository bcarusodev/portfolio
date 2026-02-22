const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const sharp = require("sharp");
const { encode } = require("blurhash");

const PROJECTS_DIR = path.join(process.cwd(), "data", "work");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_WIDTH = 32;
const IMAGE_HEIGHT = 32;
const COMPONENT_X = 4;
const COMPONENT_Y = 3;

const getMarkdownFiles = (dirPath) => {
  return fs
    .readdirSync(dirPath)
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => path.join(dirPath, entry));
};

const resolveThumbnailPath = (thumbnail) => {
  if (!thumbnail) {
    return null;
  }

  const normalized = thumbnail.replace(/^\/+/, "");
  return path.join(PUBLIC_DIR, normalized);
};

const generateBlurhash = async (imagePath) => {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    COMPONENT_X,
    COMPONENT_Y
  );
};

const updateMarkdownFile = async (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const thumbnail = parsed.data.thumbnail;
  const imagePath = resolveThumbnailPath(thumbnail);

  if (!imagePath || !fs.existsSync(imagePath)) {
    console.warn(
      `Skipping ${path.basename(filePath)}: missing thumbnail at ${thumbnail}`
    );
    return;
  }

  const blurhash = await generateBlurhash(imagePath);
  const nextData = {
    ...parsed.data,
    blurhash,
  };

  const nextContent = matter.stringify(parsed.content, nextData);
  fs.writeFileSync(filePath, nextContent, "utf8");
  console.log(`Updated ${path.basename(filePath)}`);
};

const run = async () => {
  const files = getMarkdownFiles(PROJECTS_DIR);

  for (const file of files) {
    await updateMarkdownFile(file);
  }
};

run().catch((error) => {
  console.error("Failed to generate blurhashes", error);
  process.exit(1);
});
