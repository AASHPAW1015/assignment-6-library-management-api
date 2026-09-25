const { db } = require("../config/firebaseConfig");
const Books = require("../models/Books");
const BorrowRecords = require("../models/BorrowRecords");

// how long a student may keep a book
const BORROW_DAYS = 14;

// the still-open borrow of one book by one user, as a query we can read
// inside a transaction (all equality filters, so no composite index needed)
function activeBorrowQuery(userId, bookId) {
  return BorrowRecords.collection
    .where("userId", "==", userId)
    .where("bookId", "==", bookId)
    .where("status", "==", "borrowed")
    .limit(1);
}

async function borrowBook(request, response) {
  try {
    const bookId = request.params.id;
    const userId = request.user.id;

    const bookRef = Books.collection.doc(bookId);
    const activeQuery = activeBorrowQuery(userId, bookId);
    const recordRef = BorrowRecords.collection.doc(); // pre-allocate the id

    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DAYS);

    // Everything runs inside the transaction, including the "already borrowed?"
    // check. Two simultaneous requests (or a double-click) can't both pass it,
    // and availableCopies can never be double-decremented or pushed below 0.
    const record = await db.runTransaction(async (tx) => {
      // all reads first, then writes -- Firestore requires this ordering
      const bookDoc = await tx.get(bookRef);
      const activeSnap = await tx.get(activeQuery);

      if (!bookDoc.exists) {
        throw new Error("NOT_FOUND");
      }
      if (!activeSnap.empty) {
        throw new Error("ALREADY_BORROWED");
      }

      const book = bookDoc.data();
      if (book.availableCopies <= 0) {
        throw new Error("NO_COPIES");
      }

      tx.update(bookRef, { availableCopies: book.availableCopies - 1 });

      const data = {
        userId,
        bookId,
        bookTitle: book.title,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        returnDate: null,
        status: "borrowed",
      };
      tx.set(recordRef, data);
      return { id: recordRef.id, ...data };
    });

    return response.status(201).json({ message: "Book borrowed", record });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return response.status(404).json({ message: "Book not found" });
    }
    if (error.message === "ALREADY_BORROWED") {
      return response
        .status(400)
        .json({ message: "You already have this book borrowed" });
    }
    if (error.message === "NO_COPIES") {
      return response
        .status(400)
        .json({ message: "No copies available right now" });
    }
    return response.status(500).json({ message: error.message });
  }
}

async function returnBook(request, response) {
  try {
    const bookId = request.params.id;
    const userId = request.user.id;

    const bookRef = Books.collection.doc(bookId);
    const activeQuery = activeBorrowQuery(userId, bookId);

    // The "has an active borrow?" check runs inside the transaction too, so a
    // double-click can't bump availableCopies twice for one returned book.
    const record = await db.runTransaction(async (tx) => {
      // reads first
      const activeSnap = await tx.get(activeQuery);
      if (activeSnap.empty) {
        throw new Error("NO_ACTIVE");
      }
      const activeDoc = activeSnap.docs[0];
      const bookDoc = await tx.get(bookRef);

      // then writes -- the book might have been deleted while it was out; still
      // let the student return it, just skip the copy bump in that case.
      if (bookDoc.exists) {
        const book = bookDoc.data();
        const restored = Math.min(book.totalCopies, book.availableCopies + 1);
        tx.update(bookRef, { availableCopies: restored });
      }

      const returnDate = new Date().toISOString();
      tx.update(activeDoc.ref, { status: "returned", returnDate });
      return { id: activeDoc.id, ...activeDoc.data(), status: "returned", returnDate };
    });

    return response.status(200).json({ message: "Book returned", record });
  } catch (error) {
    if (error.message === "NO_ACTIVE") {
      return response
        .status(400)
        .json({ message: "You have no active borrow for this book" });
    }
    return response.status(500).json({ message: error.message });
  }
}

async function getMyHistory(request, response) {
  try {
    const records = await BorrowRecords.findByUser(request.user.id);
    return response.status(200).json({ count: records.length, records });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function getAllBorrowRecords(request, response) {
  try {
    const records = await BorrowRecords.findAll();
    return response.status(200).json({ count: records.length, records });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function getOverdue(request, response) {
  try {
    const records = await BorrowRecords.findOverdue();
    return response.status(200).json({ count: records.length, records });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

module.exports = {
  borrowBook,
  returnBook,
  getMyHistory,
  getAllBorrowRecords,
  getOverdue,
};
