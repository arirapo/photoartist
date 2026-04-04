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

  const items = files.map((file) => ({
    file,
    title: fileToTitle(file)
  }));

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2), "utf8");

  console.log(`gallery.json generated successfully.`);
  console.log(`Images found: ${items.length}`);
  console.log(`Output: ${outputFile}`);
}

generateGalleryJson();
