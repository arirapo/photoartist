const DATA_URL = "./src/data/layout.json";
const IMAGE_BASE_PATH = "../gallery/images/";
const WALL_MAX_WIDTH_PX = 1100;
const WALL_MAX_HEIGHT_PX = 720;

const wallElement = document.getElementById("wall");
const artworkListElement = document.getElementById("artwork-list");
const imageSelect = document.getElementById("image-select");
const jsonOutput = document.getElementById("json-output");

const wallWidthInput = document.getElementById("wall-width");
const wallHeightInput = document.getElementById("wall-height");
const centerLineInput = document.getElementById("center-line");

const addArtworkButton = document.getElementById("add-artwork");
const newWidthInput = document.getElementById("new-width");
const newHeightInput = document.getElementById("new-height");
const newXInput = document.getElementById("new-x");
const newYInput = document.getElementById("new-y");

const selectedEmpty = document.getElementById("selected-empty");
const selectedEditor = document.getElementById("selected-editor");
const editTitleInput = document.getElementById("edit-title");
const editWidthInput = document.getElementById("edit-width");
const editHeightInput = document.getElementById("edit-height");
const editXInput = document.getElementById("edit-x");
const editYInput = document.getElementById("edit-y");
const duplicateButton = document.getElementById("duplicate-artwork");
const deleteButton = document.getElementById("delete-artwork");
const copyJsonButton = document.getElementById("copy-json");

const appShell = document.querySelector(".app-shell");
const leftPanel = document.querySelector(".panel-left");
const rightPanel = document.querySelector(".panel-right");
const toggleLeftPanelButton = document.getElementById("toggle-left-panel");
const toggleRightPanelButton = document.getElementById("toggle-right-panel");
const toggleFocusModeButton = document.getElementById("toggle-focus-mode");

const presetSelect = document.getElementById("preset-select");
const applyPresetButton = document.getElementById("apply-preset");

let layoutData = null;
let selectedArtworkId = null;
let wallScale = 1;

let isLeftPanelHidden = false;
let isRightPanelHidden = false;
let isFocusMode = false;

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when loading ${DATA_URL}`);
    }

    layoutData = await response.json();

    ensureDefaults();
    ensurePanelState();
    populateWallInputs();
    populateImageSelect();
    bindControls();
    applyPanelVisibility();
    renderAll();
  } catch (error) {
    console.error("Planner init failed:", error);

    if (jsonOutput) {
      jsonOutput.value = `Init error: ${error.message}`;
    }
  }
}

function on(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
}

function ensureDefaults() {
  if (!layoutData.wall) {
    layoutData.wall = { widthCm: 500, heightCm: 300, centerLineCm: 145 };
  }

  if (!Array.isArray(layoutData.availableImages)) {
    layoutData.availableImages = [];
  }

  if (!Array.isArray(layoutData.artworks)) {
    layoutData.artworks = [];
  }

  layoutData.artworks = layoutData.artworks.map((artwork, index) => ({
    id: artwork.id || `art-${index + 1}-${Date.now()}`,
    title: artwork.title || artwork.file || `Artwork ${index + 1}`,
    widthCm: Number(artwork.widthCm) || 50,
    heightCm: Number(artwork.heightCm) || 50,
    xCm: Number(artwork.xCm) || 0,
    yCm: Number(artwork.yCm) || 0,
    ...artwork
  }));
}

function ensurePanelState() {
  try {
    const savedLeft = localStorage.getItem("exhibition-left-panel-hidden");
    const savedRight = localStorage.getItem("exhibition-right-panel-hidden");
    const savedFocus = localStorage.getItem("exhibition-focus-mode");

    isLeftPanelHidden = savedLeft === "true";
    isRightPanelHidden = savedRight === "true";
    isFocusMode = savedFocus === "true";

    if (isFocusMode) {
      isLeftPanelHidden = true;
      isRightPanelHidden = true;
    }
  } catch (error) {
    console.warn("localStorage unavailable:", error);
    isLeftPanelHidden = false;
    isRightPanelHidden = false;
    isFocusMode = false;
  }
}

function savePanelState() {
  try {
    localStorage.setItem("exhibition-left-panel-hidden", String(isLeftPanelHidden));
    localStorage.setItem("exhibition-right-panel-hidden", String(isRightPanelHidden));
    localStorage.setItem("exhibition-focus-mode", String(isFocusMode));
  } catch (error) {
    console.warn("Could not save panel state:", error);
  }
}

function applyPanelVisibility() {
  if (leftPanel) {
    leftPanel.classList.toggle("is-collapsed", isLeftPanelHidden);
  }

  if (rightPanel) {
    rightPanel.classList.toggle("is-collapsed", isRightPanelHidden);
  }

  if (appShell) {
    appShell.classList.toggle("left-panel-hidden", isLeftPanelHidden);
    appShell.classList.toggle("right-panel-hidden", isRightPanelHidden);
  }

  if (toggleLeftPanelButton) {
    toggleLeftPanelButton.textContent = isLeftPanelHidden ? "Show left panel" : "Hide left panel";
    toggleLeftPanelButton.setAttribute("aria-pressed", String(isLeftPanelHidden));
  }

  if (toggleRightPanelButton) {
    toggleRightPanelButton.textContent = isRightPanelHidden ? "Show right panel" : "Hide right panel";
    toggleRightPanelButton.setAttribute("aria-pressed", String(isRightPanelHidden));
  }

  if (toggleFocusModeButton) {
    toggleFocusModeButton.textContent = isFocusMode ? "Exit focus mode" : "Focus mode";
    toggleFocusModeButton.setAttribute("aria-pressed", String(isFocusMode));
  }
}

function bindControls() {
  on(wallWidthInput, "input", () => {
    layoutData.wall.widthCm = clampNumber(wallWidthInput.value, 50, 5000);
    renderAll();
  });

  on(wallHeightInput, "input", () => {
    layoutData.wall.heightCm = clampNumber(wallHeightInput.value, 50, 5000);
    renderAll();
  });

  on(centerLineInput, "input", () => {
    layoutData.wall.centerLineCm = clampNumber(centerLineInput.value, 0, 5000);
    renderAll();
  });

  on(addArtworkButton, "click", addArtworkFromForm);

  on(editTitleInput, "input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.title = editTitleInput.value;
    renderAll();
  });

  on(editWidthInput, "input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.widthCm = clampNumber(editWidthInput.value, 1, 5000);
    renderAll();
  });

  on(editHeightInput, "input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.heightCm = clampNumber(editHeightInput.value, 1, 5000);
    renderAll();
  });

  on(editXInput, "input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.xCm = clampNumber(editXInput.value, 0, 5000);
    renderAll();
  });

  on(editYInput, "input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.yCm = clampNumber(editYInput.value, 0, 5000);
    renderAll();
  });

  on(duplicateButton, "click", duplicateSelectedArtwork);
  on(deleteButton, "click", deleteSelectedArtwork);
  on(copyJsonButton, "click", copyJsonToClipboard);

  on(toggleLeftPanelButton, "click", () => {
    isLeftPanelHidden = !isLeftPanelHidden;
    isFocusMode = false;
    savePanelState();
    applyPanelVisibility();
    renderWall();
  });

  on(toggleRightPanelButton, "click", () => {
    isRightPanelHidden = !isRightPanelHidden;
    isFocusMode = false;
    savePanelState();
    applyPanelVisibility();
    renderWall();
  });

  on(toggleFocusModeButton, "click", () => {
    isFocusMode = !isFocusMode;

    if (isFocusMode) {
      isLeftPanelHidden = true;
      isRightPanelHidden = true;
    } else {
      isLeftPanelHidden = false;
      isRightPanelHidden = false;
    }

    savePanelState();
    applyPanelVisibility();
    renderWall();
  });

  on(applyPresetButton, "click", applySelectedPreset);
}

function populateWallInputs() {
  if (wallWidthInput) wallWidthInput.value = layoutData.wall.widthCm;
  if (wallHeightInput) wallHeightInput.value = layoutData.wall.heightCm;
  if (centerLineInput) centerLineInput.value = layoutData.wall.centerLineCm;
}

function populateImageSelect() {
  if (!imageSelect) return;

  imageSelect.innerHTML = "";

  layoutData.availableImages.forEach((file) => {
    const option = document.createElement("option");
    option.value = file;
    option.textContent = file;
    imageSelect.appendChild(option);
  });
}

function renderAll() {
  renderWall();
  renderArtworkList();
  renderSelectedEditor();
  renderJsonOutput();
}

function renderWall() {
  if (!wallElement) return;

  wallElement.innerHTML = "";

  const wallWidthCm = Number(layoutData.wall.widthCm);
  const wallHeightCm = Number(layoutData.wall.heightCm);

  wallScale = Math.min(
    WALL_MAX_WIDTH_PX / wallWidthCm,
    WALL_MAX_HEIGHT_PX / wallHeightCm
  );

  const widthPx = wallWidthCm * wallScale;
  const heightPx = wallHeightCm * wallScale;

  wallElement.style.width = `${widthPx}px`;
  wallElement.style.height = `${heightPx}px`;

  renderCenterLine();

  layoutData.artworks.forEach((artwork) => {
    const artworkEl = document.createElement("div");
    artworkEl.className = "artwork";

    if (artwork.id === selectedArtworkId) {
      artworkEl.classList.add("is-selected");
    }

    artworkEl.style.left = `${artwork.xCm * wallScale}px`;
    artworkEl.style.top = `${artwork.yCm * wallScale}px`;
    artworkEl.style.width = `${artwork.widthCm * wallScale}px`;
    artworkEl.style.height = `${artwork.heightCm * wallScale}px`;
    artworkEl.dataset.id = artwork.id;

    const img = document.createElement("img");
    img.src = getArtworkImageSrc(artwork);
    img.alt = artwork.title || artwork.file || "Placeholder";

    const label = document.createElement("div");
    label.className = "artwork-label";
    label.textContent = artwork.title || artwork.file || "Placeholder";

    artworkEl.appendChild(img);
    artworkEl.appendChild(label);

    artworkEl.addEventListener("mousedown", startDrag);
    artworkEl.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedArtworkId = artwork.id;
      renderAll();
    });

    wallElement.appendChild(artworkEl);
  });

  wallElement.removeEventListener("click", clearSelectionOnWallClick);
  wallElement.addEventListener("click", clearSelectionOnWallClick);
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
      <rect x="20" y="20" width="1160" height="760" fill="none" stroke="#6a6a6a" stroke-width="10"/>
      <line x1="20" y1="20" x2="1180" y2="780" stroke="#6a6a6a" stroke-width="8"/>
      <line x1="1180" y1="20" x2="20" y2="780" stroke="#6a6a6a" stroke-width="8"/>
      <text x="600" y="410" font-family="Arial, Helvetica, sans-serif" font-size="54" text-anchor="middle" fill="#f2f2f2">
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

function clearSelectionOnWallClick(event) {
  if (event.target === wallElement) {
    selectedArtworkId = null;
    renderAll();
  }
}

function renderCenterLine() {
  if (!wallElement) return;

  const line = document.createElement("div");
  line.className = "center-line";
  line.style.top = `${Number(layoutData.wall.centerLineCm) * wallScale}px`;

  const label = document.createElement("div");
  label.className = "center-line-label";
  label.style.top = `${Number(layoutData.wall.centerLineCm) * wallScale}px`;
  label.textContent = `Center line ${layoutData.wall.centerLineCm} cm`;

  wallElement.appendChild(line);
  wallElement.appendChild(label);
}

function renderArtworkList() {
  if (!artworkListElement) return;

  artworkListElement.innerHTML = "";

  if (!layoutData.artworks.length) {
    artworkListElement.innerHTML = `<div class="muted-box">No artworks on wall yet.</div>`;
    return;
  }

  layoutData.artworks.forEach((artwork) => {
    const item = document.createElement("div");
    item.className = "artwork-list-item";

    if (artwork.id === selectedArtworkId) {
      item.classList.add("is-selected");
    }

    item.addEventListener("click", () => {
      selectedArtworkId = artwork.id;
      renderAll();
    });

    const thumb = document.createElement("img");
    thumb.className = "artwork-list-thumb";
    thumb.src = getArtworkImageSrc(artwork);
    thumb.alt = artwork.title || artwork.file || "Placeholder";

    const textWrap = document.createElement("div");
    textWrap.className = "artwork-list-text";

    const title = document.createElement("div");
    title.className = "artwork-list-title";
    title.textContent = artwork.title || artwork.file || "Placeholder";

    const meta = document.createElement("div");
    meta.className = "artwork-list-meta";
    meta.textContent = `${artwork.widthCm} × ${artwork.heightCm} cm · x ${artwork.xCm} · y ${artwork.yCm}`;

    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    item.appendChild(thumb);
    item.appendChild(textWrap);

    artworkListElement.appendChild(item);
  });
}

function renderSelectedEditor() {
  if (!selectedEmpty || !selectedEditor) return;

  const artwork = getSelectedArtwork();

  if (!artwork) {
    selectedEmpty.classList.remove("hidden");
    selectedEditor.classList.add("hidden");
    return;
  }

  selectedEmpty.classList.add("hidden");
  selectedEditor.classList.remove("hidden");

  if (editTitleInput) editTitleInput.value = artwork.title || "";
  if (editWidthInput) editWidthInput.value = artwork.widthCm;
  if (editHeightInput) editHeightInput.value = artwork.heightCm;
  if (editXInput) editXInput.value = artwork.xCm;
  if (editYInput) editYInput.value = artwork.yCm;
}

function renderJsonOutput() {
  if (!jsonOutput) return;
  jsonOutput.value = JSON.stringify(layoutData, null, 2);
}

function addArtworkFromForm() {
  if (!imageSelect) return;

  const file = imageSelect.value;
  if (!file) return;

  const title = file;
  const widthCm = clampNumber(newWidthInput?.value, 1, 5000);
  const heightCm = clampNumber(newHeightInput?.value, 1, 5000);
  const xCm = clampNumber(newXInput?.value, 0, 5000);
  const yCm = clampNumber(newYInput?.value, 0, 5000);

  const artwork = {
    id: createId(),
    file,
    title,
    widthCm,
    heightCm,
    xCm,
    yCm
  };

  layoutData.artworks.push(artwork);
  selectedArtworkId = artwork.id;
  renderAll();
}

function duplicateSelectedArtwork() {
  const artwork = getSelectedArtwork();
  if (!artwork) return;

  const clone = {
    ...artwork,
    id: createId(),
    xCm: artwork.xCm + 10,
    yCm: artwork.yCm + 10,
    title: `${artwork.title} copy`
  };

  layoutData.artworks.push(clone);
  selectedArtworkId = clone.id;
  renderAll();
}

function deleteSelectedArtwork() {
  if (!selectedArtworkId) return;

  layoutData.artworks = layoutData.artworks.filter(
    (artwork) => artwork.id !== selectedArtworkId
  );

  selectedArtworkId = null;
  renderAll();
}

function applySelectedPreset() {
  const preset = presetSelect?.value;
  if (!preset) return;

  layoutData.wall.widthCm = 500;
  layoutData.wall.heightCm = 300;

  if (!centerLineInput || !centerLineInput.value) {
    layoutData.wall.centerLineCm = 145;
  }

  layoutData.artworks = buildPresetArtworks(preset);
  selectedArtworkId = null;
  populateWallInputs();
  renderAll();
}

function buildPresetArtworks(preset) {
  switch (preset) {
    case "grid-5x5":
      return buildGrid5x5Preset();
    case "single-wide-200":
      return buildSingleWidePreset();
    case "symmetric-3":
      return buildSymmetricThreePreset();
    case "quad-2x2":
      return buildQuadPreset();
    case "wide-plus-row":
      return buildWidePlusRowPreset();
    default:
      return [];
  }
}

function buildGrid5x5Preset() {
  const artworks = [];
  const size = 20;
  const gap = 10;
  const cols = 5;
  const rows = 5;

  const totalWidth = cols * size + (cols - 1) * gap;
  const totalHeight = rows * size + (rows - 1) * gap;

  const startX = (500 - totalWidth) / 2;
  const startY = (300 - totalHeight) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      artworks.push(createPlaceholderArtwork({
        title: `Grid ${row + 1}-${col + 1}`,
        widthCm: size,
        heightCm: size,
        xCm: Math.round(startX + col * (size + gap)),
        yCm: Math.round(startY + row * (size + gap))
      }));
    }
  }

  return artworks;
}

function buildSingleWidePreset() {
  const widthCm = 200;
  const heightCm = 100;
  const xCm = Math.round((500 - widthCm) / 2);
  const yCm = Math.round((300 - heightCm) / 2);

  return [
    createPlaceholderArtwork({
      title: "Wide 2:1",
      widthCm,
      heightCm,
      xCm,
      yCm
    })
  ];
}

function buildSymmetricThreePreset() {
  const leftSize = 50;
  const centerWidth = 100;
  const centerHeight = 50;
  const gap = 20;

  const totalWidth = leftSize + gap + centerWidth + gap + leftSize;
  const startX = (500 - totalWidth) / 2;
  const centerY = (300 - 50) / 2;

  return [
    createPlaceholderArtwork({
      title: "Left square",
      widthCm: 50,
      heightCm: 50,
      xCm: Math.round(startX),
      yCm: Math.round(centerY)
    }),
    createPlaceholderArtwork({
      title: "Center wide",
      widthCm: centerWidth,
      heightCm: centerHeight,
      xCm: Math.round(startX + leftSize + gap),
      yCm: Math.round(centerY)
    }),
    createPlaceholderArtwork({
      title: "Right square",
      widthCm: 50,
      heightCm: 50,
      xCm: Math.round(startX + leftSize + gap + centerWidth + gap),
      yCm: Math.round(centerY)
    })
  ];
}

function buildQuadPreset() {
  const size = 50;
  const gap = 20;

  const totalWidth = size * 2 + gap;
  const totalHeight = size * 2 + gap;

  const startX = (500 - totalWidth) / 2;
  const startY = (300 - totalHeight) / 2;

  return [
    createPlaceholderArtwork({
      title: "Top left",
      widthCm: size,
      heightCm: size,
      xCm: Math.round(startX),
      yCm: Math.round(startY)
    }),
    createPlaceholderArtwork({
      title: "Top right",
      widthCm: size,
      heightCm: size,
      xCm: Math.round(startX + size + gap),
      yCm: Math.round(startY)
    }),
    createPlaceholderArtwork({
      title: "Bottom left",
      widthCm: size,
      heightCm: size,
      xCm: Math.round(startX),
      yCm: Math.round(startY + size + gap)
    }),
    createPlaceholderArtwork({
      title: "Bottom right",
      widthCm: size,
      heightCm: size,
      xCm: Math.round(startX + size + gap),
      yCm: Math.round(startY + size + gap)
    })
  ];
}

function buildWidePlusRowPreset() {
  const artworks = [];

  const wideWidth = 200;
  const wideHeight = 100;
  const wideX = Math.round((500 - wideWidth) / 2);
  const wideY = 40;

  artworks.push(createPlaceholderArtwork({
    title: "Top wide 2:1",
    widthCm: wideWidth,
    heightCm: wideHeight,
    xCm: wideX,
    yCm: wideY
  }));

  const size = 20;
  const gap = 10;
  const count = 7;
  const totalWidth = count * size + (count - 1) * gap;
  const rowStartX = (500 - totalWidth) / 2;
  const rowY = wideY + wideHeight + 25;

  for (let i = 0; i < count; i += 1) {
    artworks.push(createPlaceholderArtwork({
      title: `Small ${i + 1}`,
      widthCm: size,
      heightCm: size,
      xCm: Math.round(rowStartX + i * (size + gap)),
      yCm: Math.round(rowY)
    }));
  }

  return artworks;
}

function createPlaceholderArtwork({ title, widthCm, heightCm, xCm, yCm }) {
  return {
    id: createId(),
    title,
    file: "",
    widthCm,
    heightCm,
    xCm,
    yCm,
    isPlaceholder: true
  };
}

function getSelectedArtwork() {
  return layoutData.artworks.find((artwork) => artwork.id === selectedArtworkId) || null;
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}

function createId() {
  return `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function copyJsonToClipboard() {
  if (!copyJsonButton) return;

  const text = JSON.stringify(layoutData, null, 2);

  navigator.clipboard.writeText(text)
    .then(() => {
      copyJsonButton.textContent = "Copied";
      setTimeout(() => {
        copyJsonButton.textContent = "Copy layout JSON";
      }, 1200);
    })
    .catch(() => {
      copyJsonButton.textContent = "Copy failed";
      setTimeout(() => {
        copyJsonButton.textContent = "Copy layout JSON";
      }, 1200);
    });
}

function startDrag(event) {
  const artworkId = event.currentTarget.dataset.id;
  const artwork = layoutData.artworks.find((item) => item.id === artworkId);
  if (!artwork) return;

  selectedArtworkId = artwork.id;

  const startMouseX = event.clientX;
  const startMouseY = event.clientY;
  const startX = artwork.xCm;
  const startY = artwork.yCm;

  function onMouseMove(moveEvent) {
    const dxPx = moveEvent.clientX - startMouseX;
    const dyPx = moveEvent.clientY - startMouseY;

    let nextXCm = startX + dxPx / wallScale;
    let nextYCm = startY + dyPx / wallScale;

    nextXCm = Math.max(0, Math.min(nextXCm, layoutData.wall.widthCm - artwork.widthCm));
    nextYCm = Math.max(0, Math.min(nextYCm, layoutData.wall.heightCm - artwork.heightCm));

    artwork.xCm = Math.round(nextXCm);
    artwork.yCm = Math.round(nextYCm);

    renderAll();
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

init();
