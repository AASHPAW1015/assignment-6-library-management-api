// Data layer for the "books" Firestore collection.
const { db } = require("../config/firebaseConfig");

const collection = db.collection("books");

// Search + category filtering is done in memory. Firestore has no "contains"
// text search, and mixing a where() with orderBy() would need a composite
// index, so for a catalog this size we read the list and filter in JS.
async function findAll({ search, category } = {}) {
  const snapshot = await collection.get();
  let books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (search) {
    const needle = String(search).toLowerCase();
    // String(...) guards against any legacy doc where a field was stored as a
    // number/null -- otherwise .toLowerCase() would throw and 500 the list.
    books = books.filter(
      (book) =>
        String(book.title || "").toLowerCase().includes(needle) ||
        String(book.author || "").toLowerCase().includes(needle) ||
        String(book.isbn || "").toLowerCase().includes(needle),
    );
  }

  if (category) {
    const wanted = String(category).toLowerCase();
    books = books.filter(
      (book) => String(book.category || "").toLowerCase() === wanted,
    );
  }

  // newest first
  books.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return books;
}

async function findById(id) {
  const doc = await collection.doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function create({ title, author, isbn, category, totalCopies }) {
  const data = {
    title,
    author,
    isbn,
    category,
    totalCopies,
    availableCopies: totalCopies, // all copies free when a book is first added
    createdAt: new Date().toISOString(),
  };
  const ref = await collection.add(data);
  return { id: ref.id, ...data };
}

// Returns null when no book has that id -- that is the controller's 404 signal.
async function update(id, fields) {
  const ref = collection.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return null;
  }
  await ref.update(fields);
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

async function remove(id) {
  const ref = collection.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return null;
  }
  await ref.delete();
  return { id: doc.id, ...doc.data() };
}

module.exports = { collection, findAll, findById, create, update, remove };
