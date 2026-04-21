import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fragmentsList = document.getElementById("fragmentsList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const tagFilters = document.getElementById("tagFilters");
const resultsCount = document.getElementById("resultsCount");

let allFragments = [];
let activeTag = "";
let searchTerm = "";
let currentSort = "date-desc";

init();

async function init() {
  try {
    const q = query(
      collection(db, "fragments"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);
    allFragments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderTagFilters(allFragments);
    renderFragments();
    bindEvents();
  } catch (error) {
    console.error(error);
    fragmentsList.innerHTML = `<p class="error-state">Unable to load fragments.</p>`;
    resultsCount.textContent = "Error";
  }
}

function bindEvents() {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderFragments();
  });

  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderFragments();
  });
}

function renderTagFilters(items) {
  const tags = [...new Set(items.flatMap((item) => item.tags || []))].sort((a, b) =>
    a.localeCompare(b)
  );

  tagFilters.innerHTML = "";

  const allBtn = createTagButton("All", "");
  allBtn.classList.add("active");
  tagFilters.appendChild(allBtn);

  tags.forEach((tag) => {
    const btn = createTagButton(tag, tag);
    tagFilters.appendChild(btn);
  });
}

function createTagButton(label, value) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tag-btn";
  btn.textContent = label;

  btn.addEventListener("click", () => {
    activeTag = value;

    [...tagFilters.querySelectorAll(".tag-btn")].forEach((b) => {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    renderFragments();
  });

  return btn;
}

function renderFragments() {
  let filtered = [...allFragments];

  if (activeTag) {
    filtered = filtered.filter((item) => (item.tags || []).includes(activeTag));
  }

  if (searchTerm) {
    filtered = filtered.filter((item) => {
      const haystack = [
        item.title || "",
        item.excerpt || "",
        ...(item.tags || []),
        ...(item.content || []).map((block) => block.text || block.caption || "")
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }

  filtered.sort((a, b) => {
    if (currentSort === "date-asc") {
      return (a.date || "").localeCompare(b.date || "");
    }
    return (b.date || "").localeCompare(a.date || "");
  });

  resultsCount.textContent = `${filtered.length} fragment${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    fragmentsList.innerHTML = `<p class="empty-state">No fragments found.</p>`;
    return;
  }

  fragmentsList.innerHTML = filtered.map(renderCard).join("");
}

function renderCard(item) {
  const title = escapeHtml(item.title || "Untitled fragment");
  const excerpt = escapeHtml(item.excerpt || "");
  const date = formatDate(item.date);
  const tags = (item.tags || [])
    .map((tag) => `<span class="fragment-tag">${escapeHtml(tag)}</span>`)
    .join("");

  const imageHtml = item.coverImage
    ? `<div class="fragment-card__image"><img src="${item.coverImage}" alt="${title}" loading="lazy" /></div>`
    : `<div class="fragment-card__image"></div>`;

  const slug = encodeURIComponent(item.slug || item.id);

  return `
    <article class="fragment-card">
      ${imageHtml}
      <div class="fragment-card__body">
        <div class="fragment-meta">
          <span>${date}</span>
        </div>

        <h2 class="fragment-title">
          <a href="./entry.html?slug=${slug}">${title}</a>
        </h2>

        ${excerpt ? `<p class="fragment-excerpt">${excerpt}</p>` : ""}

        ${tags ? `<div class="fragment-tags">${tags}</div>` : ""}
      </div>
    </article>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
