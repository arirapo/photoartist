import { auth, db, storage, serverTimestamp } from "./firebase-init.js";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const provider = new GoogleAuthProvider();

const authSection = document.getElementById("authSection");
const adminSection = document.getElementById("adminSection");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

const fragmentForm = document.getElementById("fragmentForm");
const titleInput = document.getElementById("titleInput");
const slugInput = document.getElementById("slugInput");
const dateInput = document.getElementById("dateInput");
const statusInput = document.getElementById("statusInput");
const tagsInput = document.getElementById("tagsInput");
const excerptInput = document.getElementById("excerptInput");
const coverImageInput = document.getElementById("coverImageInput");
const blocksContainer = document.getElementById("blocksContainer");
const saveMessage = document.getElementById("saveMessage");

const addTextBlockBtn = document.getElementById("addTextBlockBtn");
const addImageBlockBtn = document.getElementById("addImageBlockBtn");
const addAudioBlockBtn = document.getElementById("addAudioBlockBtn");
const addVideoBlockBtn = document.getElementById("addVideoBlockBtn");

let currentUser = null;

setTodayDefault();
bindEvents();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    authSection.hidden = false;
    adminSection.hidden = true;
    logoutBtn.hidden = true;
    return;
  }

  const tokenResult = await user.getIdTokenResult();
  const isAdmin = !!tokenResult.claims.admin;

  if (!isAdmin) {
    currentUser = null;
    authSection.hidden = false;
    adminSection.hidden = true;
    logoutBtn.hidden = true;
    authMessage.textContent = "This account does not have admin access.";
    authMessage.className = "message error";
    await signOut(auth);
    return;
  }

  currentUser = user;
  authSection.hidden = true;
  adminSection.hidden = false;
  logoutBtn.hidden = false;
});

function bindEvents() {
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  fragmentForm.addEventListener("submit", handleSave);

  addTextBlockBtn.addEventListener("click", () => addBlock("text"));
  addImageBlockBtn.addEventListener("click", () => addBlock("image"));
  addAudioBlockBtn.addEventListener("click", () => addBlock("audio"));
  addVideoBlockBtn.addEventListener("click", () => addBlock("video"));
}

async function handleLogin(e) {
  e.preventDefault();
  authMessage.textContent = "Signing in with Google…";
  authMessage.className = "message";

  try {
    await signInWithPopup(auth, provider);
    authMessage.textContent = "";
  } catch (error) {
    console.error(error);
    authMessage.textContent = error.message || "Login failed.";
    authMessage.className = "message error";
  }
}

async function handleLogout() {
  await signOut(auth);
}

async function handleSave(e) {
  e.preventDefault();

  if (!currentUser) {
    saveMessage.textContent = "You must be signed in.";
    saveMessage.className = "message error";
    return;
  }

  saveMessage.textContent = "Saving…";
  saveMessage.className = "message";

  try {
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const slug = slugInput.value.trim() || slugify(title || `fragment-${date}`);
    const tags = tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    let coverImage = "";

    if (coverImageInput.files[0]) {
      coverImage = await uploadFile(coverImageInput.files[0], "images");
    }

    const blockItems = [...blocksContainer.querySelectorAll(".block-item")];
    const content = [];

    for (const item of blockItems) {
      const type = item.dataset.type;

      if (type === "text") {
        const text = item.querySelector('[data-field="text"]').value.trim();
        if (text) {
          content.push({ type: "text", text });
        }
      }

      if (type === "image") {
        const fileInput = item.querySelector('[data-field="file"]');
        const alt = item.querySelector('[data-field="alt"]').value.trim();
        const caption = item.querySelector('[data-field="caption"]').value.trim();

        if (fileInput.files[0]) {
          const src = await uploadFile(fileInput.files[0], "images");
          content.push({ type: "image", src, alt, caption });
        }
      }

      if (type === "audio") {
        const fileInput = item.querySelector('[data-field="file"]');
        const caption = item.querySelector('[data-field="caption"]').value.trim();

        if (fileInput.files[0]) {
          const src = await uploadFile(fileInput.files[0], "audio");
          content.push({ type: "audio", src, caption });
        }
      }

      if (type === "video") {
        const fileInput = item.querySelector('[data-field="file"]');
        const caption = item.querySelector('[data-field="caption"]').value.trim();

        if (fileInput.files[0]) {
          const src = await uploadFile(fileInput.files[0], "video");
          content.push({ type: "video", src, caption });
        }
      }
    }

    await addDoc(collection(db, "fragments"), {
      title,
      slug,
      date,
      status: statusInput.value,
      tags,
      excerpt: excerptInput.value.trim(),
      coverImage,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    fragmentForm.reset();
    blocksContainer.innerHTML = "";
    setTodayDefault();

    saveMessage.textContent = "Fragment saved.";
    saveMessage.className = "message ok";
  } catch (error) {
    console.error(error);
    saveMessage.textContent = error.message || "Save failed.";
    saveMessage.className = "message error";
  }
}

function addBlock(type) {
  const wrapper = document.createElement("div");
  wrapper.className = "block-item";
  wrapper.dataset.type = type;

  let inner = "";

  if (type === "text") {
    inner = `
      <div class="block-item__top">
        <span class="block-type">Text</span>
        <button type="button" class="block-remove">Remove</button>
      </div>
      <label>
        <span>Text</span>
        <textarea data-field="text" rows="5" placeholder="Write fragment text here"></textarea>
      </label>
    `;
  }

  if (type === "image") {
    inner = `
      <div class="block-item__top">
        <span class="block-type">Image</span>
        <button type="button" class="block-remove">Remove</button>
      </div>
      <label>
        <span>Image file</span>
        <input data-field="file" type="file" accept="image/*" />
      </label>
      <label>
        <span>Alt text</span>
        <input data-field="alt" type="text" />
      </label>
      <label>
        <span>Caption</span>
        <input data-field="caption" type="text" />
      </label>
    `;
  }

  if (type === "audio") {
    inner = `
      <div class="block-item__top">
        <span class="block-type">Audio</span>
        <button type="button" class="block-remove">Remove</button>
      </div>
      <label>
        <span>Audio file</span>
        <input data-field="file" type="file" accept="audio/*" />
      </label>
      <label>
        <span>Caption</span>
        <input data-field="caption" type="text" />
      </label>
    `;
  }

  if (type === "video") {
    inner = `
      <div class="block-item__top">
        <span class="block-type">Video</span>
        <button type="button" class="block-remove">Remove</button>
      </div>
      <label>
        <span>Video file</span>
        <input data-field="file" type="file" accept="video/*" />
      </label>
      <label>
        <span>Caption</span>
        <input data-field="caption" type="text" />
      </label>
    `;
  }

  wrapper.innerHTML = inner;

  wrapper.querySelector(".block-remove").addEventListener("click", () => {
    wrapper.remove();
  });

  blocksContainer.appendChild(wrapper);
}

async function uploadFile(file, folder) {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const fileRef = ref(storage, `fragments/${folder}/${safeName}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function setTodayDefault() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;
}
