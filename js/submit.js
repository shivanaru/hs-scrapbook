// js/submit.js
// Submission sheet — multi-type form, Firebase Storage upload, Firestore write
// ?????????????????????????????????????????????????????????

import { storage }  from "./firebase.js";
import { addPost }  from "./posts.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ?????????????????????????????????????????????????????????
//  Storage helper — upload a single File, return download URL
// ?????????????????????????????????????????????????????????
async function uploadFile(file) {
  const ext      = file.name.split(".").pop() || "jpg";
  const filename = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ?????????????????????????????????????????????????????????
//  DOM refs — resolved once on initSubmit
// ?????????????????????????????????????????????????????????
let overlayEl, sheetEl, formEl, errorEl, submitBtnEl;
let authorEl, captionEl, dateEl;
let photoUploadGroupEl, uploadZoneEl, uploadZoneTextEl, uploadPreviewEl, photoInputEl;
let featuredEl;

// Type radio buttons
let typeRadios;

// Then & Now extras (injected dynamically)
let thenNowSection   = null;
let thenInput        = null;
let nowInput         = null;
let thenYearInput    = null;
let thenNowNameInput = null;

// Collection extras
let collectionSection = null;
let multiInput        = null;
let multiThumbsEl     = null;
let collectionFiles   = [];

// Quote extras
let quoteSection      = null;
let attributionInput  = null;

// onPostAdded callback (set by caller)
let _onPostAdded = null;

// ?????????????????????????????????????????????????????????
//  Type-specific form sections
// ?????????????????????????????????????????????????????????
const SECTION_IDS = {
  photo:      "sectionPhoto",
  story:      "sectionStory",
  collection: "sectionCollection",
  quote:      "sectionQuote",
  confession: "sectionConfession",
};

function buildDynamicSections(form) {
  // ?? Then & Now section ?????????????????????????????????
  thenNowSection = document.createElement("div");
  thenNowSection.id = SECTION_IDS.story;
  thenNowSection.hidden = true;

  const tnLabel = document.createElement("label");
  tnLabel.className = "form-label";
  tnLabel.textContent = "Then & Now photos";

  const tnUploads = document.createElement("div");
  tnUploads.className = "thennow-uploads";

  function makeHalfUpload(side) {
    const wrap = document.createElement("div");
    wrap.className = "upload-group";
    const lbl = document.createElement("label");
    lbl.className = "form-label";
    lbl.textContent = side === "then" ? "Then ??" : "Now ??";
    const zone = document.createElement("div");
    zone.className = "upload-zone";
    zone.style.minHeight = "90px";
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.className = "upload-zone__input";
    const txt = document.createElement("span");
    txt.className = "upload-zone__text";
    txt.textContent = `Upload ${side} photo`;
    txt.style.fontSize = ".8rem";
    const preview = document.createElement("img");
    preview.className = "upload-zone__preview";
    preview.hidden = true;
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        txt.hidden = true;
      }
    });
    zone.appendChild(input);
    zone.appendChild(txt);
    zone.appendChild(preview);
    wrap.appendChild(lbl);
    wrap.appendChild(zone);
    return { wrap, input };
  }

  const then = makeHalfUpload("then");
  const now  = makeHalfUpload("now");
  thenInput = then.input;
  nowInput  = now.input;
  tnUploads.appendChild(then.wrap);
  tnUploads.appendChild(now.wrap);

  const tnYearLbl = document.createElement("label");
  tnYearLbl.className = "form-label";
  tnYearLbl.textContent = "Year of 'Then' photo";
  thenYearInput = document.createElement("input");
  thenYearInput.type = "number"; thenYearInput.className = "form-input";
  thenYearInput.placeholder = "e.g. 2019"; thenYearInput.min = "1900"; thenYearInput.max = "2099";

  const tnNameLbl = document.createElement("label");
  tnNameLbl.className = "form-label";
  tnNameLbl.textContent = "Person's name";
  thenNowNameInput = document.createElement("input");
  thenNowNameInput.type = "text"; thenNowNameInput.className = "form-input";
  thenNowNameInput.placeholder = "e.g. Jamie";

  thenNowSection.appendChild(tnLabel);
  thenNowSection.appendChild(tnUploads);
  thenNowSection.appendChild(tnYearLbl);
  thenNowSection.appendChild(thenYearInput);
  thenNowSection.appendChild(tnNameLbl);
  thenNowSection.appendChild(thenNowNameInput);

  // ?? Collection section ?????????????????????????????????
  collectionSection = document.createElement("div");
  collectionSection.id = SECTION_IDS.collection;
  collectionSection.hidden = true;
  collectionFiles = [];

  const colLbl = document.createElement("label");
  colLbl.className = "form-label";
  colLbl.textContent = "Photos (select multiple)";

  const colZone = document.createElement("div");
  colZone.className = "upload-zone multi-upload-zone";
  multiInput = document.createElement("input");
  multiInput.type = "file"; multiInput.accept = "image/*"; multiInput.multiple = true;
  multiInput.className = "upload-zone__input";
  const colTxt = document.createElement("span");
  colTxt.className = "upload-zone__text";
  colTxt.textContent = "?? Click to add photos";
  multiThumbsEl = document.createElement("div");
  multiThumbsEl.className = "multi-upload-thumbs";

  multiInput.addEventListener("change", () => {
    Array.from(multiInput.files).forEach((file) => {
      collectionFiles.push(file);
      addThumb(file);
    });
    multiInput.value = ""; // allow re-selecting same file
  });

  colZone.appendChild(multiInput);
  colZone.appendChild(colTxt);
  colZone.appendChild(multiThumbsEl);

  const colTitleLbl = document.createElement("label");
  colTitleLbl.className = "form-label";
  colTitleLbl.textContent = "Album title";
  const colTitleInput = document.createElement("input");
  colTitleInput.type = "text"; colTitleInput.className = "form-input";
  colTitleInput.placeholder = "e.g. Prom Night 2023";
  colTitleInput.id = "colTitle";

  const colYearLbl = document.createElement("label");
  colYearLbl.className = "form-label";
  colYearLbl.textContent = "Year";
  const colYearInput = document.createElement("input");
  colYearInput.type = "number"; colYearInput.className = "form-input";
  colYearInput.placeholder = "e.g. 2023"; colYearInput.id = "colYear";

  collectionSection.appendChild(colLbl);
  collectionSection.appendChild(colZone);
  collectionSection.appendChild(colTitleLbl);
  collectionSection.appendChild(colTitleInput);
  collectionSection.appendChild(colYearLbl);
  collectionSection.appendChild(colYearInput);

  // ?? Quote section ??????????????????????????????????????
  quoteSection = document.createElement("div");
  quoteSection.id = SECTION_IDS.quote;
  quoteSection.hidden = true;

  const attrLbl = document.createElement("label");
  attrLbl.className = "form-label";
  attrLbl.textContent = "Attribution (optional)";
  attributionInput = document.createElement("input");
  attributionInput.type = "text"; attributionInput.className = "form-input";
  attributionInput.placeholder = "e.g. our English teacher, or leave blank";
  quoteSection.appendChild(attrLbl);
  quoteSection.appendChild(attributionInput);

  // ?? Confession section ?????????????????????????????????
  // No extra fields — author is always hidden/anonymous

  // Insert into form before the featured toggle
  const toggleLabel = formEl.querySelector(".toggle-label");
  formEl.insertBefore(thenNowSection,    toggleLabel);
  formEl.insertBefore(collectionSection, toggleLabel);
  formEl.insertBefore(quoteSection,      toggleLabel);
}

function addThumb(file) {
  const wrap = document.createElement("div");
  wrap.className = "multi-thumb";
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  const rm = document.createElement("button");
  rm.type = "button";
  rm.className = "multi-thumb__remove";
  rm.textContent = "?";
  rm.setAttribute("aria-label", `Remove ${file.name}`);
  rm.addEventListener("click", () => {
    const idx = collectionFiles.indexOf(file);
    if (idx !== -1) collectionFiles.splice(idx, 1);
    wrap.remove();
  });
  wrap.appendChild(img);
  wrap.appendChild(rm);
  multiThumbsEl.appendChild(wrap);
}

// ?????????????????????????????????????????????????????????
//  Show / hide sections based on selected type
// ?????????????????????????????????????????????????????????
function updateFormForType(type) {
  // Caption label changes
  const captionLabel = captionEl.previousElementSibling;

  // Author field visibility
  const authorGroup = authorEl.closest("label") || authorEl.parentElement;
  // Find the label element above authorEl
  const authorLabelEl = formEl.querySelector(`label[for="inputAuthor"]`);

  // Photo upload group visibility
  photoUploadGroupEl.hidden = type !== "memory";

  // Then & now section
  thenNowSection.hidden   = type !== "thennow";

  // Collection section
  collectionSection.hidden = type !== "collection";

  // Quote attribution
  quoteSection.hidden = type !== "quote";

  // Confession: hide author
  if (authorLabelEl) authorLabelEl.hidden = type === "confession";
  authorEl.hidden = type === "confession";

  // Caption placeholder & label
  const placeholders = {
    memory:     "What's the memory?",
    thennow:    "Add a caption for the Then & Now…",
    collection: "Describe the collection…",
    quote:      "Type the quote here…",
    confession: "Confess away… no one will know ??",
  };
  captionEl.placeholder = placeholders[type] || "What's the memory?";

  const captionLabels = {
    memory:     "Caption or story",
    thennow:    "Caption",
    collection: "Caption",
    quote:      "Quote",
    confession: "Confession",
  };
  if (captionLabel && captionLabel.tagName === "LABEL") {
    captionLabel.childNodes[0].textContent = captionLabels[type] || "Caption";
  }

  // Featured toggle: hide for confessions
  const featuredLabel = featuredEl.closest(".toggle-label");
  if (featuredLabel) featuredLabel.hidden = type === "confession";
}

// ?????????????????????????????????????????????????????????
//  Open / close sheet
// ?????????????????????????????????????????????????????????
function openSheet() {
  overlayEl.hidden = false;
  overlayEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // focus first input
  setTimeout(() => authorEl.focus(), 50);
}

function closeSheet() {
  overlayEl.hidden = true;
  overlayEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetForm();
}

function resetForm() {
  formEl.reset();
  // Reset previews
  uploadPreviewEl.hidden = true;
  uploadPreviewEl.src    = "";
  uploadZoneTextEl.hidden = false;
  // Reset collection thumbs
  if (multiThumbsEl) multiThumbsEl.innerHTML = "";
  collectionFiles = [];
  // Reset then/now previews
  if (thenNowSection) {
    thenNowSection.querySelectorAll(".upload-zone__preview").forEach(p => {
      p.hidden = true; p.src = "";
    });
    thenNowSection.querySelectorAll(".upload-zone__text").forEach(t => t.hidden = false);
  }
  errorEl.textContent = "";
  updateFormForType("memory"); // default back to memory
}

// ?????????????????????????????????????????????????????????
//  Collect form data and build post payload
// ?????????????????????????????????????????????????????????
async function buildPostPayload(type) {
  const author  = type === "confession" ? "anonymous" : (authorEl.value.trim() || "anonymous");
  const caption = captionEl.value.trim();
  const dateVal = dateEl.value || null;
  const featured = type !== "confession" && featuredEl.checked;

  const base = { type, author, featured };

  switch (type) {
    case "memory": {
      const file = photoInputEl.files[0] || null;
      let photoURL = null;
      if (file) photoURL = await uploadFile(file);
      const yearInput = formEl.querySelector("#inputDate");
      return {
        ...base,
        text: caption,
        photoURL,
        year: dateVal ? new Date(dateVal).getFullYear() : null,
      };
    }

    case "thennow": {
      const thenFile = thenInput.files[0] || null;
      const nowFile  = nowInput.files[0]  || null;
      if (!thenFile || !nowFile) throw new Error("Please upload both a 'then' and 'now' photo.");
      const [thenURL, nowURL] = await Promise.all([uploadFile(thenFile), uploadFile(nowFile)]);
      return {
        ...base,
        thenURL,
        nowURL,
        thenYear: thenYearInput.value ? parseInt(thenYearInput.value) : null,
        name:     thenNowNameInput.value.trim() || "",
        caption,
      };
    }

    case "collection": {
      if (collectionFiles.length === 0) throw new Error("Please add at least one photo.");
      const urls = await Promise.all(collectionFiles.map(uploadFile));
      const title = formEl.querySelector("#colTitle")?.value.trim() || "Photo Collection";
      const year  = formEl.querySelector("#colYear")?.value ? parseInt(formEl.querySelector("#colYear").value) : null;
      return { ...base, photoURLs: urls, title, year, caption };
    }

    case "quote": {
      return { ...base, text: caption, attribution: attributionInput.value.trim() || null };
    }

    case "confession": {
      return { ...base, text: caption };
    }

    default:
      return { ...base, text: caption };
  }
}

// ?????????????????????????????????????????????????????????
//  Validation
// ?????????????????????????????????????????????????????????
function validate(type) {
  const caption = captionEl.value.trim();
  if (!caption) {
    const labels = {
      quote: "Please enter a quote.", confession: "Please write your confession.",
      default: "Please add a caption or story.",
    };
    throw new Error(labels[type] || labels.default);
  }
  if (type === "memory" && !photoInputEl.files[0]) {
    // photo is optional for memory — skip
  }
}

// ?????????????????????????????????????????????????????????
//  Toast helper (imported by app.js too but duplicated here
//  to keep submit.js self-contained)
// ?????????????????????????????????????????????????????????
function showToast(msg, variant = "") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast${variant ? " toast--" + variant : ""}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ?????????????????????????????????????????????????????????
//  Public init
// ?????????????????????????????????????????????????????????

/**
 * Wire up the submit sheet.
 * @param {Function} onPostAdded - Called with the new post object after successful Firestore write.
 */
export function initSubmit({ onPostAdded }) {
  _onPostAdded = onPostAdded;

  overlayEl         = document.getElementById("submitOverlay");
  sheetEl           = document.getElementById("submitSheet");
  formEl            = document.getElementById("submitForm");
  errorEl           = document.getElementById("submitError");
  submitBtnEl       = document.getElementById("submitBtn");
  authorEl          = document.getElementById("inputAuthor");
  captionEl         = document.getElementById("inputCaption");
  dateEl            = document.getElementById("inputDate");
  photoUploadGroupEl= document.getElementById("photoUploadGroup");
  uploadZoneEl      = document.getElementById("uploadZone");
  uploadZoneTextEl  = document.getElementById("uploadZoneText");
  uploadPreviewEl   = document.getElementById("uploadPreview");
  photoInputEl      = document.getElementById("inputPhoto");
  featuredEl        = document.getElementById("inputFeatured");
  typeRadios        = formEl.querySelectorAll("input[name='postType']");

  // Build dynamic sections
  buildDynamicSections(formEl);

  // Photo preview
  photoInputEl.addEventListener("change", () => {
    const file = photoInputEl.files[0];
    if (file) {
      uploadPreviewEl.src    = URL.createObjectURL(file);
      uploadPreviewEl.hidden = false;
      uploadZoneTextEl.hidden = true;
    }
  });

  // Drag & drop on main photo zone
  uploadZoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZoneEl.classList.add("dragover");
  });
  uploadZoneEl.addEventListener("dragleave", () => uploadZoneEl.classList.remove("dragover"));
  uploadZoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZoneEl.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const dt = new DataTransfer();
      dt.items.add(file);
      photoInputEl.files = dt.files;
      uploadPreviewEl.src    = URL.createObjectURL(file);
      uploadPreviewEl.hidden = false;
      uploadZoneTextEl.hidden = true;
    }
  });

  // Keyboard activation of upload zone
  uploadZoneEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); photoInputEl.click(); }
  });

  // Type radio changes
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) updateFormForType(radio.value);
    });
  });

  // Open / close
  document.getElementById("openSubmit")?.addEventListener("click", openSheet);
  document.querySelector(".fab")?.addEventListener("click", openSheet);
  document.getElementById("closeSubmit").addEventListener("click", closeSheet);
  overlayEl.addEventListener("click", (e) => { if (e.target === overlayEl) closeSheet(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlayEl.hidden) closeSheet();
  });

  // Form submit
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const type = [...typeRadios].find((r) => r.checked)?.value || "memory";

    try {
      validate(type);
      setSubmitting(true);
      const payload = await buildPostPayload(type);
      const docRef  = await addPost(payload);
      const newPost = { id: docRef.id, ...payload, createdAt: { toDate: () => new Date() } };
      closeSheet();
      showToast("Memory posted! ??", "success");
      if (_onPostAdded) _onPostAdded(newPost);
    } catch (err) {
      console.error("Submit error:", err);
      errorEl.textContent = err.message || "Something went wrong. Please try again.";
    } finally {
      setSubmitting(false);
    }
  });

  // Initialize form state
  updateFormForType("memory");
}

function setSubmitting(on) {
  submitBtnEl.disabled = on;
  submitBtnEl.textContent = on ? "Posting…" : "Post Memory ??";
  formEl.classList.toggle("submitting", on);
}
