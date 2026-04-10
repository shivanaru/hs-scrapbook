// js/carousel.js
// Hero carousel — auto-advances every 5s, snap-scroll, dot indicators
// ?????????????????????????????????????????????????????????

import { fetchFeaturedPosts } from "./posts.js";
import { renderCard }         from "./render.js";

const AUTO_INTERVAL = 5000; // ms

let currentIndex  = 0;
let totalSlides   = 0;
let autoTimer     = null;
let trackEl       = null;
let dotsEl        = null;
let slideEls      = [];

// ?????????????????????????????????????????????????????????
//  Helpers
// ?????????????????????????????????????????????????????????
function scrollToSlide(index) {
  if (!slideEls.length) return;
  const slide = slideEls[index];
  if (!slide) return;

  slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  updateDots(index);
  currentIndex = index;
}

function updateDots(index) {
  dotsEl.querySelectorAll(".carousel__dot").forEach((dot, i) => {
    const active = i === index;
    dot.setAttribute("aria-selected", active ? "true" : "false");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
  });
}

function startAuto() {
  stopAuto();
  if (totalSlides <= 1) return;
  autoTimer = setInterval(() => {
    const next = (currentIndex + 1) % totalSlides;
    scrollToSlide(next);
  }, AUTO_INTERVAL);
}

function stopAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
}

// ?????????????????????????????????????????????????????????
//  Build carousel from posts array
// ?????????????????????????????????????????????????????????
function buildCarousel(posts) {
  const carouselEl = document.getElementById("carousel");
  const emptyEl    = document.getElementById("carouselEmpty");

  trackEl  = document.getElementById("carouselTrack");
  dotsEl   = document.getElementById("carouselDots");
  trackEl.innerHTML = "";
  dotsEl.innerHTML  = "";
  slideEls  = [];
  totalSlides = posts.length;

  if (!posts.length) {
    carouselEl.hidden = true;
    emptyEl.hidden    = false;
    return;
  }

  carouselEl.hidden = false;
  emptyEl.hidden    = true;

  posts.forEach((post, i) => {
    // Slide wrapper (list item)
    const li = document.createElement("li");
    li.className = "carousel__slide";
    li.setAttribute("role", "listitem");
    li.setAttribute("aria-label", `Slide ${i + 1} of ${posts.length}`);

    const card = renderCard(post, true);
    li.appendChild(card);
    trackEl.appendChild(li);
    slideEls.push(li);

    // Dot
    const dot = document.createElement("button");
    dot.className = "carousel__dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => { stopAuto(); scrollToSlide(i); startAuto(); });
    dotsEl.appendChild(dot);
  });

  // Scroll observer to keep dots in sync when user swipes
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = slideEls.indexOf(entry.target);
          if (idx !== -1) updateDots(idx);
        }
      });
    },
    { root: trackEl, threshold: 0.6 }
  );
  slideEls.forEach((s) => observer.observe(s));

  updateDots(0);
  startAuto();
}

// ?????????????????????????????????????????????????????????
//  Prepend a single new featured card (after user submits)
// ?????????????????????????????????????????????????????????
export function prependCarouselSlide(post) {
  if (!trackEl) return;

  const carouselEl = document.getElementById("carousel");
  const emptyEl    = document.getElementById("carouselEmpty");
  carouselEl.hidden = false;
  emptyEl.hidden    = true;

  const li = document.createElement("li");
  li.className = "carousel__slide";
  li.setAttribute("role", "listitem");

  const card = renderCard(post, true);
  li.appendChild(card);
  trackEl.insertBefore(li, trackEl.firstChild);
  slideEls.unshift(li);
  totalSlides = slideEls.length;

  // Add a dot
  const dot = document.createElement("button");
  dot.className = "carousel__dot";
  dot.setAttribute("role", "tab");
  dot.setAttribute("aria-selected", "false");
  dotsEl.insertBefore(dot, dotsEl.firstChild);

  scrollToSlide(0);
  startAuto();
}

// ?????????????????????????????????????????????????????????
//  Init — fetch + wire arrow buttons
// ?????????????????????????????????????????????????????????
export async function initCarousel() {
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  prevBtn.addEventListener("click", () => {
    stopAuto();
    const prev = (currentIndex - 1 + totalSlides) % totalSlides;
    scrollToSlide(prev);
    startAuto();
  });
  nextBtn.addEventListener("click", () => {
    stopAuto();
    const next = (currentIndex + 1) % totalSlides;
    scrollToSlide(next);
    startAuto();
  });

  // Pause auto on hover / focus
  const hero = document.querySelector(".hero");
  hero.addEventListener("mouseenter", stopAuto);
  hero.addEventListener("focusin",   stopAuto);
  hero.addEventListener("mouseleave", startAuto);
  hero.addEventListener("focusout",  startAuto);

  try {
    const posts = await fetchFeaturedPosts();
    buildCarousel(posts);
  } catch (err) {
    console.error("Carousel fetch error:", err);
    document.getElementById("carouselEmpty").hidden = false;
    document.getElementById("carousel").hidden       = true;
  }
}
