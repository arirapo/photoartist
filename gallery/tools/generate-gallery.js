const fs = require("fs");
const path = require("path");

const galleryRoot = path.resolve(__dirname, "..");
const imagesDir = path.join(galleryRoot, "images");
const outputDir = path.join(galleryRoot, "src", "data");
const outputFile = path.join(outputDir, "gallery.json");

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif"
]);

function fileToTitle(filename) {
  const nameWithoutExt = path.parse(filename).name;
  return nameWithoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadExistingGalleryData() {
  if (!fs.existsSync(outputFile)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Could not read existing gallery.json, starting fresh.`);
    console.warn(error.message);
    return [];
  }
}

function generateGalleryJson() {
  if (!fs.existsSync(imagesDir)) {
    console.error(`Images folder not found: ${imagesDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(imagesDir)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return allowedExtensions.has(ext);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const existingItems = loadExistingGalleryData();
  const existingMap = new Map();

  for (const item of existingItems) {
    if (item && typeof item.file === "string") {
      existingMap.set(item.file, item);
    }
  }

  const items = files.map((file) => {
    const existing = existingMap.get(file);

    return {
      file,
      title:
        existing && typeof existing.title === "string"
          ? existing.title
          : fileToTitle(file),
      date:
        existing && typeof existing.date === "string"
          ? existing.date
          : "",
      location:
        existing && typeof existing.location === "string"
          ? existing.location
          : "",
      text:
        existing && typeof existing.text === "string"
          ? existing.text
          : ""
    };
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2), "utf8");

  const newFiles = files.filter((file) => !existingMap.has(file));
  const removedFiles = existingItems
    .map((item) => item.file)
    .filter((file) => typeof file === "string" && !files.includes(file));

  console.log(`gallery.json generated successfully.`);
  console.log(`Images found: ${items.length}`);
  console.log(`Output: ${outputFile}`);

  if (newFiles.length) {
    console.log(`New images added: ${newFiles.length}`);
    newFiles.forEach((file) => console.log(`  + ${file}`));
  }

  if (removedFiles.length) {
    console.log(`Missing images removed from JSON: ${removedFiles.length}`);
    removedFiles.forEach((file) => console.log(`  - ${file}`));
  }
}

generateGalleryJson();
