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
    figure.appendChild(button);
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
  lightboxCaption.textContent = "";
}

function updateLightbox() {
  const item = galleryItems[currentIndex];
  if (!item) return;

  lightboxImage.src = IMAGE_BASE_PATH + item.file;
  lightboxImage.alt = item.title || item.file;
  lightboxCaption.textContent = item.title || "";
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
