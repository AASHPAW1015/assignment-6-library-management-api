// Data layer for the "users" Firestore collection. Controllers call these
// helpers instead of touching Firestore directly, the same way the mongoose /
// supabase models did in earlier assignments.
const { db } = require("../config/firebaseConfig");

const collection = db.collection("users");

// Returns the full doc INCLUDING the password hash -- only login uses this.
async function findByEmail(email) {
  const snapshot = await collection.where("email", "==", email).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function findById(id) {
  const doc = await collection.doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function create({ name, email, password, role }) {
  const data = {
    name,
    email,
    password, // already bcrypt-hashed by the controller
    role,
    createdAt: new Date().toISOString(),
  };
  const ref = await collection.add(data);
  return { id: ref.id, ...data };
}

module.exports = { collection, findByEmail, findById, create };
