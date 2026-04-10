// js/reactions.js
// Reaction toggle logic with optimistic UI updates
// Uses Firestore transactions to safely increment / decrement counts
// ?????????????????????????????????????????????????????????

import { db } from "./firebase.js";
import { getVisitorId } from "./auth.js";
import {
  doc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Reaction labels per post type.
 */
export const REACTION_LABELS = {
  memory:     ["I was there ??", "miss this ??", "same ??"],
  collection: ["I was there ??", "miss this ??", "same ??"],
  thennow:    ["glow up ??",     "still them ??", "iconic ??"],
  quote:      ["too real ??",    "lol ??",        "guilty ??"],
  // confessions intentionally have no reactions
};

/**
 * Toggle a reaction on a post.
 *
 * @param {string} postId  - Firestore document ID
 * @param {string} label   - Reaction label string (must match stored key)
 * @param {Element} pillEl - The DOM pill button to update optimistically
 */
export async function toggleReaction(postId, label, pillEl) {
  const vid = getVisitorId();
  const postRef = doc(db, "posts", postId);

  // ?? Optimistic UI update ??????????????????????????????
  const wasReacted = pillEl.classList.contains("reacted");
  const countEl    = pillEl.querySelector(".pill-count");
  const currentCount = parseInt(countEl.textContent, 10) || 0;

  if (wasReacted) {
    pillEl.classList.remove("reacted");
    countEl.textContent = Math.max(0, currentCount - 1);
  } else {
    pillEl.classList.add("reacted");
    countEl.textContent = currentCount + 1;
  }

  // ?? Firestore transaction ?????????????????????????????
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(postRef);
      if (!snap.exists()) throw new Error("Post not found");

      const data      = snap.data();
      const reactions = data.reactions || {};
      const current   = reactions[label] || { count: 0, voters: [] };
      const voters    = Array.isArray(current.voters) ? [...current.voters] : [];
      const idx       = voters.indexOf(vid);

      let newCount;
      if (idx === -1) {
        // Add reaction
        voters.push(vid);
        newCount = (current.count || 0) + 1;
      } else {
        // Remove reaction
        voters.splice(idx, 1);
        newCount = Math.max(0, (current.count || 0) - 1);
      }

      tx.update(postRef, {
        [`reactions.${label}`]: { count: newCount, voters },
      });

      // Reconcile UI with server truth
      const serverReacted = idx === -1; // after toggle, now reacted if was not before
      countEl.textContent = newCount;
      pillEl.classList.toggle("reacted", serverReacted);
    });
  } catch (err) {
    // Roll back optimistic update
    console.error("Reaction error:", err);
    if (wasReacted) {
      pillEl.classList.add("reacted");
      countEl.textContent = currentCount;
    } else {
      pillEl.classList.remove("reacted");
      countEl.textContent = currentCount;
    }
  }
}

/**
 * Build reaction pill elements for a post and append them to `container`.
 *
 * @param {Element} container - DOM element to append pills into
 * @param {string}  postId    - Firestore post ID
 * @param {string}  type      - Post type key
 * @param {object}  reactions - reactions map from Firestore doc
 */
export function renderReactionPills(container, postId, type, reactions) {
  const labels = REACTION_LABELS[type];
  if (!labels) return; // e.g. confession — no reactions

  const vid = getVisitorId();

  labels.forEach((label) => {
    const data    = (reactions || {})[label] || { count: 0, voters: [] };
    const count   = data.count || 0;
    const voters  = Array.isArray(data.voters) ? data.voters : [];
    const reacted = voters.includes(vid);

    const pill = document.createElement("button");
    pill.className = "reaction-pill" + (reacted ? " reacted" : "");
    pill.setAttribute("aria-label", `React: ${label}, ${count} reactions`);
    pill.setAttribute("aria-pressed", reacted ? "true" : "false");
    pill.innerHTML = `${label} <span class="pill-count">${count}</span>`;

    pill.addEventListener("click", () => {
      pill.setAttribute("aria-pressed", pill.classList.contains("reacted") ? "false" : "true");
      toggleReaction(postId, label, pill);
    });

    container.appendChild(pill);
  });
}
