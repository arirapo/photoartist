const DATA_URL = "./src/data/gallery.json";
const IMAGE_BASE_PATH = "./images/";

const galleryGrid = document.getElementById("gallery-grid");
const galleryStatus = document.getElementById("gallery-status");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

let galleryItems = [];
let currentIndex = 0;

async function loadGallery() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load gallery data: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      galleryStatus.textContent = "No images found.";
      return;
    }

    galleryItems = data;
    renderGallery(data);
    galleryStatus.textContent = "";
  } catch (error) {
    console.error(error);
    galleryStatus.textContent = "Gallery data could not be loaded.";
  }
}

function renderGallery(items) {
  galleryGrid.innerHTML = "";

  items.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-item";

    const button = document.createElement("button");
    button.className = "gallery-button";
    button.type = "button";
    button.setAttribute("aria-label", item.title || `Open image ${index + 1}`);

    const img = document.createElement("img");
    img.className = "gallery-thumb";
    img.src = IMAGE_BASE_PATH + item.file;
    img.alt = item.title || item.file;
    img.loading = "lazy";

    button.addEventListener("click", () => openLightbox(index));
    button.appendChild(img);

    const meta = document.createElement("figcaption");
    meta.className = "gallery-meta";

    const title = document.createElement("div");
    title.className = "gallery-meta-title";
    title.textContent = item.title || "";

    const sublineParts = [item.date, item.location].filter(Boolean);
    const subline = document.createElement("div");
    subline.className = "gallery-meta-subline";
    subline.textContent = sublineParts.join(" · ");

    if (title.textContent) {
      meta.appendChild(title);
    }

    if (subline.textContent) {
      meta.appendChild(subline);
    }

    figure.appendChild(button);
    if (meta.children.length > 0) {
      figure.appendChild(meta);
    }

    galleryGrid.appendChild(figure);
  });
}

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxCaption.innerHTML = "";
}

function updateLightbox() {
  const item = galleryItems[currentIndex];
  if (!item) return;

  lightboxImage.src = IMAGE_BASE_PATH + item.file;
  lightboxImage.alt = item.title || item.file;

  const titleHtml = item.title
    ? `<div class="lightbox-caption-title">${escapeHtml(item.title)}</div>`
    : "";

  const metaParts = [item.date, item.location].filter(Boolean);
  const metaHtml = metaParts.length
    ? `<div class="lightbox-caption-meta">${escapeHtml(metaParts.join(" · "))}</div>`
    : "";

  const textHtml = item.text
    ? `<div class="lightbox-caption-text">${escapeHtml(item.text)}</div>`
    : "";

  lightboxCaption.innerHTML = `${titleHtml}${metaHtml}${textHtml}`;
}

function showNext() {
  if (!galleryItems.length) return;
  currentIndex = (currentIndex + 1) % galleryItems.length;
  updateLightbox();
}

function showPrev() {
  if (!galleryItems.length) return;
  currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  updateLightbox();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxNext.addEventListener("click", showNext);
lightboxPrev.addEventListener("click", showPrev);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  } else if (event.key === "ArrowRight") {
    showNext();
  } else if (event.key === "ArrowLeft") {
    showPrev();
  }
});

loadGallery();
