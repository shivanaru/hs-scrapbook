// js/posts.js
// Firestore read / write for all post types
// ?????????????????????????????????????????????????????????

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const POSTS_COL = "posts";
const PAGE_SIZE = 12;

/**
 * Add a new post document to Firestore.
 * `data` should already contain all type-specific fields + photoURLs.
 * Returns the new DocumentReference.
 */
export async function addPost(data) {
  return addDoc(collection(db, POSTS_COL), {
    ...data,
    reactions: {},
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch the first page of posts ordered by createdAt desc.
 * Optionally filter by `type`.
 * Returns { posts: Array, lastDoc: QueryDocumentSnapshot|null }
 */
export async function fetchPosts({ type = null, lastDoc = null } = {}) {
  let q = query(
    collection(db, POSTS_COL),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  if (type && type !== "all") {
    q = query(
      collection(db, POSTS_COL),
      where("type", "==", type),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
  }

  if (lastDoc) {
    if (type && type !== "all") {
      q = query(
        collection(db, POSTS_COL),
        where("type", "==", type),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    } else {
      q = query(
        collection(db, POSTS_COL),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    }
  }

  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const last  = snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null;
  return { posts, lastDoc: last };
}

/**
 * Fetch featured posts for the hero carousel:
 * posts where featured === true, limited to 10 most recent.
 * Sorted client-side to avoid requiring a composite Firestore index.
 */
export async function fetchFeaturedPosts() {
  const q = query(
    collection(db, POSTS_COL),
    where("featured", "==", true),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
}
