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

let layoutData = null;
let selectedArtworkId = null;
let wallScale = 1;

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    layoutData = await response.json();

    ensureDefaults();
    populateWallInputs();
    populateImageSelect();
    renderAll();
    bindControls();
  } catch (error) {
    console.error(error);
    jsonOutput.value = "Could not load layout.json";
  }
}

function ensureDefaults() {
  if (!layoutData.wall) {
    layoutData.wall = { widthCm: 400, heightCm: 250, centerLineCm: 145 };
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

function bindControls() {
  wallWidthInput.addEventListener("input", () => {
    layoutData.wall.widthCm = clampNumber(wallWidthInput.value, 50, 5000);
    renderAll();
  });

  wallHeightInput.addEventListener("input", () => {
    layoutData.wall.heightCm = clampNumber(wallHeightInput.value, 50, 5000);
    renderAll();
  });

  centerLineInput.addEventListener("input", () => {
    layoutData.wall.centerLineCm = clampNumber(centerLineInput.value, 0, 5000);
    renderAll();
  });

  addArtworkButton.addEventListener("click", addArtworkFromForm);

  editTitleInput.addEventListener("input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.title = editTitleInput.value;
    renderAll();
  });

  editWidthInput.addEventListener("input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.widthCm = clampNumber(editWidthInput.value, 1, 5000);
    renderAll();
  });

  editHeightInput.addEventListener("input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.heightCm = clampNumber(editHeightInput.value, 1, 5000);
    renderAll();
  });

  editXInput.addEventListener("input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.xCm = clampNumber(editXInput.value, 0, 5000);
    renderAll();
  });

  editYInput.addEventListener("input", () => {
    const artwork = getSelectedArtwork();
    if (!artwork) return;
    artwork.yCm = clampNumber(editYInput.value, 0, 5000);
    renderAll();
  });

  duplicateButton.addEventListener("click", duplicateSelectedArtwork);
  deleteButton.addEventListener("click", deleteSelectedArtwork);
  copyJsonButton.addEventListener("click", copyJsonToClipboard);
}

function populateWallInputs() {
  wallWidthInput.value = layoutData.wall.widthCm;
  wallHeightInput.value = layoutData.wall.heightCm;
  centerLineInput.value = layoutData.wall.centerLineCm;
}

function populateImageSelect() {
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
    img.src = IMAGE_BASE_PATH + artwork.file;
    img.alt = artwork.title || artwork.file;

    const label = document.createElement("div");
    label.className = "artwork-label";
    label.textContent = artwork.title || artwork.file;

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

  wallElement.addEventListener("click", clearSelectionOnWallClick);
}

function clearSelectionOnWallClick(event) {
  if (event.target === wallElement) {
    selectedArtworkId = null;
    renderAll();
  }
}

function renderCenterLine() {
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
    thumb.src = IMAGE_BASE_PATH + artwork.file;
    thumb.alt = artwork.title || artwork.file;

    const textWrap = document.createElement("div");
    textWrap.className = "artwork-list-text";

    const title = document.createElement("div");
    title.className = "artwork-list-title";
    title.textContent = artwork.title || artwork.file;

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
  const artwork = getSelectedArtwork();

  if (!artwork) {
    selectedEmpty.classList.remove("hidden");
    selectedEditor.classList.add("hidden");
    return;
  }

  selectedEmpty.classList.add("hidden");
  selectedEditor.classList.remove("hidden");

  editTitleInput.value = artwork.title || "";
  editWidthInput.value = artwork.widthCm;
  editHeightInput.value = artwork.heightCm;
  editXInput.value = artwork.xCm;
  editYInput.value = artwork.yCm;
}

function renderJsonOutput() {
  jsonOutput.value = JSON.stringify(layoutData, null, 2);
}

function addArtworkFromForm() {
  const file = imageSelect.value;
  if (!file) return;

  const title = file;
  const widthCm = clampNumber(newWidthInput.value, 1, 5000);
  const heightCm = clampNumber(newHeightInput.value, 1, 5000);
  const xCm = clampNumber(newXInput.value, 0, 5000);
  const yCm = clampNumber(newYInput.value, 0, 5000);

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

  const wallRect = wallElement.getBoundingClientRect();
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
