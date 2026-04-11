// js/auth.js
// Password gate logic — shared password stored in Firestore
// Visitor ID persisted in localStorage for reaction deduplication
// ?????????????????????????????????????????????????????????

import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AUTH_KEY = "hs_auth";
const VID_KEY  = "hs_vid";

/** Return the persistent visitor ID, generating one if needed. */
export function getVisitorId() {
  let vid = localStorage.getItem(VID_KEY);
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem(VID_KEY, vid);
  }
  return vid;
}

/** True if this session has already passed the password gate. */
export function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

/** Mark this session as authenticated. */
function markAuthed() {
  localStorage.setItem(AUTH_KEY, "true");
  // ensure a visitor ID exists
  getVisitorId();
}

/**
 * Fetch the password from Firestore (config/settings) and compare.
 * Returns true on match, false on mismatch, throws on network error.
 */
export async function checkPassword(input) {
  const snap = await getDoc(doc(db, "config", "settings"));
  if (!snap.exists()) {
    // No password document found — fail open so owner can still set up
    console.warn("config/settings document not found. Allowing access.");
    markAuthed();
    return true;
  }
  const { password } = snap.data();
  if (input === password) {
    markAuthed();
    return true;
  }
  return false;
}

/**
 * Wire up the password gate form.
 * Calls onSuccess() when the correct password is entered (or already authed).
 */
export function initAuth({ onSuccess }) {
  if (isAuthed()) {
    onSuccess();
    return;
  }

  const gate      = document.getElementById("gate");
  const form      = document.getElementById("gateForm");
  const input     = document.getElementById("gatePassword");
  const errorEl   = document.getElementById("gateError");
  const submitBtn = form.querySelector("button[type='submit']");

  // Confirm the listener is actually being attached
  console.log("[auth] initAuth: attaching submit listener");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log("[auth] submit fired");

    errorEl.textContent = "";
    const val = input.value.trim();
    if (!val) {
      errorEl.textContent = "Please enter the password.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";

    try {
      console.log("[auth] calling checkPassword");
      const ok = await checkPassword(val);
      console.log("[auth] checkPassword result:", ok);
      if (ok) {
        gate.style.transition = "opacity .4s ease";
        gate.style.opacity = "0";
        setTimeout(() => {
          gate.hidden = true;
          onSuccess();
        }, 400);
      } else {
        errorEl.textContent = "Wrong password — try again! ??";
        input.value = "";
        input.focus();
      }
    } catch (err) {
      console.error("[auth] Auth error:", err);
      errorEl.textContent = "Error: " + err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Open\u00a0it\u00a0up ??";
    }
  });
}
