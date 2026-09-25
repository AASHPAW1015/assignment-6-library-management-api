// Data layer for the "borrow_records" Firestore collection.
// The actual borrow/return writes happen inside a transaction in
// borrowController, because they must change a book AND a record together.
const { db } = require("../config/firebaseConfig");

const collection = db.collection("borrow_records");

// One student's whole history. Sorted in memory to avoid a composite index
// (equality filter + orderBy on a different field would require one).
async function findByUser(userId) {
  const snapshot = await collection.where("userId", "==", userId).get();
  const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  records.sort((a, b) => (a.borrowDate < b.borrowDate ? 1 : -1));
  return records;
}

// Every record, newest first -- for the librarian dashboard.
async function findAll() {
  const snapshot = await collection.orderBy("borrowDate", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Still borrowed AND past the due date. Pull the "borrowed" ones (single
// equality filter) then compare dueDate to now in JS.
async function findOverdue() {
  const now = new Date().toISOString();
  const snapshot = await collection.where("status", "==", "borrowed").get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((record) => record.dueDate < now)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)); // most overdue first
}

module.exports = {
  collection,
  findByUser,
  findAll,
  findOverdue,
};
