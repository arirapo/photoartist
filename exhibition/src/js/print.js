const STORAGE_KEY = "exhibition-print-layout";
const IMAGE_BASE_PATH = "../gallery/images/";
const WALL_MAX_WIDTH_PX = 1400;
const WALL_MAX_HEIGHT_PX = 860;

const printWallElement = document.getElementById("print-wall");
const wallMetaElement = document.getElementById("wall-meta");
const printButton = document.getElementById("print-button");
const closeButton = document.getElementById("close-button");

let printData = null;
let wallScale = 1;

init();

function init() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      renderError("No layout data found.");
      return;
    }

    printData = JSON.parse(raw);

    if (!printData?.wall || !Array.isArray(printData?.artworks)) {
      renderError("Layout data is incomplete.");
      return;
    }

    bindControls();
    renderPrintView();
  } catch (error) {
    console.error("Print view failed:", error);
    renderError(`Print view error: ${error.message}`);
  }
}

function bindControls() {
  if (printButton) {
    printButton.addEventListener("click", () => {
      window.print();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      window.close();
    });
  }
}

function renderPrintView() {
  printWallElement.innerHTML = "";

  const wallWidthCm = Number(printData.wall.widthCm) || 500;
  const wallHeightCm = Number(printData.wall.heightCm) || 300;
  const centerLineCm = Number(printData.wall.centerLineCm) || 145;

  wallScale = Math.min(
    WALL_MAX_WIDTH_PX / wallWidthCm,
    WALL_MAX_HEIGHT_PX / wallHeightCm
  );

  const wallWidthPx = wallWidthCm * wallScale;
  const wallHeightPx = wallHeightCm * wallScale;

  printWallElement.style.width = `${wallWidthPx}px`;
  printWallElement.style.height = `${wallHeightPx}px`;

  renderCenterLine(centerLineCm);

  printData.artworks.forEach((artwork) => {
    const artworkEl = document.createElement("div");
    artworkEl.className = "print-artwork";

    artworkEl.style.left = `${Number(artwork.xCm) * wallScale}px`;
    artworkEl.style.top = `${Number(artwork.yCm) * wallScale}px`;
    artworkEl.style.width = `${Number(artwork.widthCm) * wallScale}px`;
    artworkEl.style.height = `${Number(artwork.heightCm) * wallScale}px`;

    const img = document.createElement("img");
    img.src = getArtworkImageSrc(artwork);
    img.alt = artwork.title || artwork.file || "Artwork";

    const sizeLabel = document.createElement("div");
    sizeLabel.className = "print-size-label";
    sizeLabel.textContent = `${artwork.widthCm} × ${artwork.heightCm} cm`;

    const titleLabel = document.createElement("div");
    titleLabel.className = "print-title-label";
    titleLabel.textContent = artwork.title || artwork.file || "Untitled";

    artworkEl.appendChild(img);
    artworkEl.appendChild(sizeLabel);
    artworkEl.appendChild(titleLabel);

    printWallElement.appendChild(artworkEl);
  });

  wallMetaElement.textContent = `Wall: ${wallWidthCm} × ${wallHeightCm} cm`;
}

function renderCenterLine(centerLineCm) {
  const line = document.createElement("div");
  line.className = "print-center-line";
  line.style.top = `${centerLineCm * wallScale}px`;

  const label = document.createElement("div");
  label.className = "print-center-line-label";
  label.style.top = `${centerLineCm * wallScale - 22}px`;
  label.textContent = `Center line ${centerLineCm} cm`;

  printWallElement.appendChild(line);
  printWallElement.appendChild(label);
}

function getArtworkImageSrc(artwork) {
  if (artwork.isPlaceholder) {
    return createPlaceholderDataUri(artwork.title || "Placeholder");
  }

  return IMAGE_BASE_PATH + artwork.file;
}

function createPlaceholderDataUri(labelText = "Placeholder") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#808080"/>
      <rect x="18" y="18" width="1164" height="764" fill="none" stroke="#666666" stroke-width="10"/>
      <line x1="18" y1="18" x2="1182" y2="782" stroke="#666666" stroke-width="8"/>
      <line x1="1182" y1="18" x2="18" y2="782" stroke="#666666" stroke-width="8"/>
      <text x="600" y="415" font-family="Arial, Helvetica, sans-serif" font-size="52" text-anchor="middle" fill="#f2f2f2">
        ${escapeHtml(labelText)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderError(message) {
  if (!printWallElement) return;
  printWallElement.innerHTML = `<div style="padding:2rem;font:16px sans-serif;">${message}</div>`;
}
