// js/render.js
// Card rendering for all post types
// Returns a fully-built DOM element ready to insert into the grid or carousel
// ?????????????????????????????????????????????????????????

import { renderReactionPills } from "./reactions.js";

// Stable per-card rotation: seed from post ID so it doesn't change on re-render
function seededRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Range: -3 to +3 degrees
  return ((Math.abs(hash) % 61) - 30) / 10;
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avatarLetter(author) {
  return (author || "A").charAt(0).toUpperCase();
}

function openLightbox(url, caption) {
  const lb  = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");
  img.src         = url;
  img.alt         = caption || "";
  cap.textContent = caption || "";
  lb.removeAttribute("hidden");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

/** Shared card meta bar (avatar + author + date) */
function buildMeta(author, createdAt, dark = false) {
  const meta = document.createElement("div");
  meta.className = "card__meta";

  const av = document.createElement("div");
  av.className = "card__avatar";
  av.textContent = avatarLetter(author);
  if (dark) {
    av.style.background = "rgba(255,255,255,.12)";
    av.style.color = "rgba(255,255,255,.8)";
  }

  const name = document.createElement("span");
  name.textContent = author || "Anonymous";

  const sep = document.createElement("span");
  sep.textContent = "·";
  sep.style.opacity = ".4";

  const date = document.createElement("span");
  date.textContent = formatDate(createdAt);

  meta.appendChild(av);
  meta.appendChild(name);
  if (createdAt) { meta.appendChild(sep); meta.appendChild(date); }
  return meta;
}

// ?????????????????????????????????????????????????????????
//  POLAROID CARD (memory with photo)
// ?????????????????????????????????????????????????????????
function renderPolaroid(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--polaroid";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  const deg = seededRotation(post.id);
  if (!forCarousel) card.style.transform = `rotate(${deg}deg)`;

  // Image
  const wrap = document.createElement("div");
  wrap.className = "polaroid__img-wrap";
  const img = document.createElement("img");
  img.src     = post.photoURL;
  img.alt     = post.text || "Memory photo";
  img.loading = "lazy";
  wrap.appendChild(img);
  wrap.addEventListener("click", () => openLightbox(post.photoURL, post.text));
  card.appendChild(wrap);

  // Body
  const body = document.createElement("div");
  body.className = "card__body";
  body.appendChild(buildMeta(post.author, post.createdAt));

  const caption = document.createElement("p");
  caption.className = "polaroid__caption";
  caption.textContent = post.text || "";
  body.appendChild(caption);

  if (post.year) {
    const yr = document.createElement("span");
    yr.className = "memory__year";
    yr.textContent = `Class of ${post.year}`;
    body.appendChild(yr);
  }
  card.appendChild(body);

  // Reactions
  const footer = document.createElement("div");
  footer.className = "card__footer";
  renderReactionPills(footer, post.id, "memory", post.reactions);
  card.appendChild(footer);

  return card;
}

// ?????????????????????????????????????????????????????????
//  TEXT MEMORY CARD
// ?????????????????????????????????????????????????????????
function renderMemoryText(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--memory-text";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  const body = document.createElement("div");
  body.className = "card__body";
  body.appendChild(buildMeta(post.author, post.createdAt));

  const text = document.createElement("p");
  text.className = "memory__text";
  text.textContent = post.text || "";
  body.appendChild(text);

  if (post.year) {
    const yr = document.createElement("span");
    yr.className = "memory__year";
    yr.textContent = `Class of ${post.year}`;
    body.appendChild(yr);
  }
  card.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "card__footer";
  renderReactionPills(footer, post.id, "memory", post.reactions);
  card.appendChild(footer);

  return card;
}

// ?????????????????????????????????????????????????????????
//  THEN & NOW CARD
// ?????????????????????????????????????????????????????????
function renderThenNow(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--thennow";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  // Split photo area
  const split = document.createElement("div");
  split.className = "thennow__split";
  split.style.position = "relative";

  // Then half
  const thenHalf = document.createElement("div");
  thenHalf.className = "thennow__half thennow__half--then";
  const thenImg = document.createElement("img");
  thenImg.src     = post.thenURL || "";
  thenImg.alt     = `${post.name || ""} — then`;
  thenImg.loading = "lazy";
  thenImg.addEventListener("click", () => openLightbox(post.thenURL, `${post.name} — Then (${post.thenYear || ""})`));
  thenImg.style.cursor = "pointer";
  const thenOverlay = document.createElement("div");
  thenOverlay.className = "thennow__overlay";
  const thenLabel = document.createElement("span");
  thenLabel.className = "thennow__label";
  thenLabel.textContent = post.thenYear ? `${post.thenYear}` : "THEN";
  thenHalf.appendChild(thenImg);
  thenHalf.appendChild(thenOverlay);
  thenHalf.appendChild(thenLabel);

  // Now half
  const nowHalf = document.createElement("div");
  nowHalf.className = "thennow__half thennow__half--now";
  const nowImg = document.createElement("img");
  nowImg.src     = post.nowURL || "";
  nowImg.alt     = `${post.name || ""} — now`;
  nowImg.loading = "lazy";
  nowImg.addEventListener("click", () => openLightbox(post.nowURL, `${post.name} — Now`));
  nowImg.style.cursor = "pointer";
  const nowOverlay = document.createElement("div");
  nowOverlay.className = "thennow__overlay";
  const nowLabel = document.createElement("span");
  nowLabel.className = "thennow__label";
  nowLabel.textContent = "NOW";
  nowHalf.appendChild(nowImg);
  nowHalf.appendChild(nowOverlay);
  nowHalf.appendChild(nowLabel);

  // Centre divider line
  const divider = document.createElement("div");
  divider.className = "thennow__divider";

  split.appendChild(thenHalf);
  split.appendChild(nowHalf);
  split.appendChild(divider);
  card.appendChild(split);

  // Info row
  const info = document.createElement("div");
  info.className = "thennow__info";
  info.appendChild(buildMeta(post.author, post.createdAt));
  if (post.name) {
    const name = document.createElement("p");
    name.className = "thennow__name";
    name.textContent = post.name;
    info.appendChild(name);
  }
  if (post.caption) {
    const cap = document.createElement("p");
    cap.className = "thennow__caption";
    cap.textContent = post.caption;
    info.appendChild(cap);
  }
  card.appendChild(info);

  const footer = document.createElement("div");
  footer.className = "card__footer";
  renderReactionPills(footer, post.id, "thennow", post.reactions);
  card.appendChild(footer);

  return card;
}

// ?????????????????????????????????????????????????????????
//  PHOTO COLLECTION CARD
// ?????????????????????????????????????????????????????????
function renderCollection(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--collection";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  const urls   = Array.isArray(post.photoURLs) ? post.photoURLs : [];
  const extras = urls.length > 3 ? urls.length - 3 : 0;

  // Stacked photos
  const stack = document.createElement("div");
  stack.className = "collection__stack";

  urls.slice(0, 3).forEach((url, i) => {
    const img = document.createElement("img");
    img.className = "collection__stack-img";
    img.src       = url;
    img.alt       = `Photo ${i + 1}`;
    img.loading   = "lazy";
    img.addEventListener("click", () => openLightbox(url, post.title || ""));
    stack.appendChild(img);
  });

  if (extras > 0) {
    const badge = document.createElement("span");
    badge.className  = "collection__badge";
    badge.textContent = `+${extras} more`;
    stack.appendChild(badge);
  }
  card.appendChild(stack);

  // Body
  const body = document.createElement("div");
  body.className = "card__body";
  body.appendChild(buildMeta(post.author, post.createdAt));

  const title = document.createElement("p");
  title.className  = "collection__title";
  title.textContent = post.title || "Photo Collection";
  body.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "collection__meta";
  const parts = [];
  if (post.year)    parts.push(`Class of ${post.year}`);
  if (post.caption) parts.push(post.caption);
  meta.textContent = parts.join(" · ");
  body.appendChild(meta);
  card.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "card__footer";
  renderReactionPills(footer, post.id, "collection", post.reactions);
  card.appendChild(footer);

  return card;
}

// ?????????????????????????????????????????????????????????
//  QUOTE CARD
// ?????????????????????????????????????????????????????????
function renderQuote(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--quote";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  const body = document.createElement("div");
  body.className = "card__body";
  body.appendChild(buildMeta(post.author, post.createdAt));

  const mark = document.createElement("span");
  mark.className   = "quote__mark";
  mark.textContent = "\u201C";
  body.appendChild(mark);

  const text = document.createElement("p");
  text.className   = "quote__text";
  text.textContent = post.text || "";
  body.appendChild(text);

  if (post.attribution) {
    const attr = document.createElement("span");
    attr.className   = "quote__attribution";
    attr.textContent = `— ${post.attribution}`;
    body.appendChild(attr);
  }
  card.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "card__footer";
  renderReactionPills(footer, post.id, "quote", post.reactions);
  card.appendChild(footer);

  return card;
}

// ?????????????????????????????????????????????????????????
//  CONFESSION CARD
// ?????????????????????????????????????????????????????????
function renderConfession(post, forCarousel = false) {
  const card = document.createElement("article");
  card.className = "card card--confession";
  card.dataset.id   = post.id;
  card.dataset.type = post.type;

  const body = document.createElement("div");
  body.className = "card__body";

  const icon = document.createElement("span");
  icon.className   = "confession__icon";
  icon.textContent = "??";
  body.appendChild(icon);

  const text = document.createElement("p");
  text.className   = "confession__text";
  text.textContent = post.text || "";
  body.appendChild(text);

  const tag = document.createElement("span");
  tag.className   = "confession__tag";
  tag.textContent = "anonymous";
  body.appendChild(tag);

  card.appendChild(body);
  // No reactions footer for confessions

  return card;
}

// ?????????????????????????????????????????????????????????
//  PUBLIC: renderCard — dispatches to correct renderer
// ?????????????????????????????????????????????????????????

/**
 * Render a post document as a DOM card element.
 *
 * @param {object}  post        - Firestore post data + id
 * @param {boolean} forCarousel - Skips rotation transform if true
 * @returns {HTMLElement}
 */
export function renderCard(post, forCarousel = false) {
  switch (post.type) {
    case "memory":
      return post.photoURL
        ? renderPolaroid(post, forCarousel)
        : renderMemoryText(post, forCarousel);
    case "thennow":
      return renderThenNow(post, forCarousel);
    case "collection":
      return renderCollection(post, forCarousel);
    case "quote":
      return renderQuote(post, forCarousel);
    case "confession":
      return renderConfession(post, forCarousel);
    default:
      return renderMemoryText(post, forCarousel);
  }
}
