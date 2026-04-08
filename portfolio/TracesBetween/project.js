async function loadProjectData() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error("Could not load project data.");
    }

    const data = await response.json();
    applyProjectData(data);
  } catch (error) {
    console.error(error);
  }
}

function applyProjectData(data) {
  document.title = data.title || "Project";
  setText("projectType", data.type);
  setText("projectTitle", data.title);
  setText("projectSummary", data.summary);
  setText("projectYear", data.year);
  setText("projectMedium", data.medium);
  setText("projectStatus", data.status);

  const descriptionContainer = document.getElementById("projectDescription");
  descriptionContainer.innerHTML = "";
  (data.description || []).forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    descriptionContainer.appendChild(p);
  });

  const imageGrid = document.getElementById("imageGrid");
  imageGrid.innerHTML = "";
  (data.images || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "image-card";

    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    placeholder.textContent = item.placeholder || "Image placeholder";

    const caption = document.createElement("div");
    caption.className = "image-caption";

    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled";

    const text = document.createElement("p");
    text.textContent = item.caption || "";

    caption.appendChild(title);
    caption.appendChild(text);

    card.appendChild(placeholder);
    card.appendChild(caption);
    imageGrid.appendChild(card);
  });

  const linksList = document.getElementById("projectLinks");
  linksList.innerHTML = "";
  (data.links || []).forEach((item) => {
    const li = document.createElement("li");

    const a = document.createElement("a");
    a.href = item.url || "#";
    a.textContent = item.label || "Related link";

    if (item.external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    li.appendChild(a);

    if (item.note) {
      const note = document.createElement("span");
      note.className = "link-note";
      note.textContent = item.note;
      li.appendChild(note);
    }

    linksList.appendChild(li);
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) {
    element.textContent = value;
  }
}

loadProjectData();
