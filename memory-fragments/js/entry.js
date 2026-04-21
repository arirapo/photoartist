import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const entryContainer = document.getElementById("entryContainer");
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

init();

async function init() {
  if (!slug) {
    entryContainer.innerHTML = `<p class="error-state">Missing fragment slug.</p>`;
    return;
  }

  try {
    const q = query(
      collection(db, "fragments"),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      entryContainer.innerHTML = `<p class="error-state">Fragment not found.</p>`;
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    document.title = `${data.title || "Fragment"} — Fragments`;
    renderEntry(data);
  } catch (error) {
    console.error(error);
    entryContainer.innerHTML = `<p class="error-state">Unable to load fragment.</p>`;
  }
}

function renderEntry(data) {
  const title = escapeHtml(data.title || "Untitled fragment");
  const excerpt = escapeHtml(data.excerpt || "");
  const date = formatDate(data.date);
  const tags = (data.tags || [])
    .map((tag) => `<span class="fragment-tag">${escapeHtml(tag)}</span>`)
    .join("");

  const blocksHtml = (data.content || []).map(renderBlock).join("");

  entryContainer.innerHTML = `
    <header class="entry-header">
      <p class="eyebrow">${date}</p>
      <h1 class="entry-title">${title}</h1>
      ${excerpt ? `<p class="entry-excerpt">${excerpt}</p>` : ""}
    </header>

    <section class="entry-blocks">
      ${blocksHtml}
    </section>

    <footer class="entry-footer">
      ${tags ? `<div class="fragment-tags">${tags}</div>` : ""}
    </footer>
  `;
}

function renderBlock(block) {
  if (!block || !block.type) return "";

  switch (block.type) {
    case "text":
      return `
        <section class="entry-block entry-block--text">
          <p>${escapeHtml(block.text || "")}</p>
        </section>
      `;

    case "image":
      return `
        <section class="entry-block entry-block--image">
          <figure>
            <img src="${block.src}" alt="${escapeHtml(block.alt || "")}" loading="lazy" />
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
          </figure>
        </section>
      `;

    case "audio":
      return `
        <section class="entry-block entry-block--audio">
          <figure>
            <audio controls preload="metadata" src="${block.src}"></audio>
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
          </figure>
        </section>
      `;

    case "video":
      return `
        <section class="entry-block entry-block--video">
          <figure>
            <video controls preload="metadata" playsinline ${block.poster ? `poster="${block.poster}"` : ""}>
              <source src="${block.src}" />
            </video>
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
          </figure>
        </section>
      `;

    default:
      return "";
  }
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
