const { db } = require("../config/firebaseConfig");
const Books = require("../models/Books");

async function getBooks(request, response) {
  try {
    // ?search=algorithms&category=Computer Science  (both optional)
    const books = await Books.findAll({
      search: request.query.search,
      category: request.query.category,
    });
    return response.status(200).json({ count: books.length, books });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function getBookById(request, response) {
  try {
    const book = await Books.findById(request.params.id);
    if (!book) {
      return response.status(404).json({ message: "Book not found" });
    }
    return response.status(200).json({ book });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function createBook(request, response) {
  try {
    // Coerce text fields to trimmed strings so a JSON number like
    // "isbn": 9780131103627 can't be stored as a number and later break search.
    const title = String(request.body.title ?? "").trim();
    const author = String(request.body.author ?? "").trim();
    const isbn = String(request.body.isbn ?? "").trim();
    const category = String(request.body.category ?? "").trim();
    const { totalCopies } = request.body;

    if (!title || !author || !isbn || !category || totalCopies === undefined) {
      return response.status(400).json({
        message: "title, author, isbn, category and totalCopies are required",
      });
    }

    const copies = Number(totalCopies);
    if (!Number.isInteger(copies) || copies < 1) {
      return response
        .status(400)
        .json({ message: "totalCopies must be a whole number of at least 1" });
    }

    const book = await Books.create({
      title,
      author,
      isbn,
      category,
      totalCopies: copies,
    });

    return response.status(201).json({ message: "Book created", book });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function updateBook(request, response) {
  try {
    // Only these fields can be edited; anything else in the body is ignored.
    // Text fields are coerced to trimmed strings (same reason as create).
    const fields = {};
    const textFields = ["title", "author", "isbn", "category"];
    for (const key of textFields) {
      if (request.body[key] !== undefined) {
        fields[key] = String(request.body[key]).trim();
      }
    }

    let copies;
    if (request.body.totalCopies !== undefined) {
      copies = Number(request.body.totalCopies);
      if (!Number.isInteger(copies) || copies < 1) {
        return response
          .status(400)
          .json({ message: "totalCopies must be a whole number of at least 1" });
      }
      fields.totalCopies = copies;
    }

    if (Object.keys(fields).length === 0) {
      return response.status(400).json({ message: "No valid fields to update" });
    }

    // Transaction so a borrow/return happening at the same moment can't be
    // overwritten: availableCopies is recomputed from the value read INSIDE
    // the transaction, not a stale read from before it.
    const bookRef = Books.collection.doc(request.params.id);
    const book = await db.runTransaction(async (tx) => {
      const doc = await tx.get(bookRef);
      if (!doc.exists) {
        throw new Error("NOT_FOUND");
      }

      const current = doc.data();
      const patch = { ...fields };

      if (copies !== undefined) {
        // Keep availableCopies in step with the change in total, never below 0
        // or above the new total.
        const borrowed = current.totalCopies - current.availableCopies;
        patch.availableCopies = Math.max(0, Math.min(copies, copies - borrowed));
      }

      tx.update(bookRef, patch);
      return { id: doc.id, ...current, ...patch };
    });

    return response.status(200).json({ message: "Book updated", book });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return response.status(404).json({ message: "Book not found" });
    }
    return response.status(500).json({ message: error.message });
  }
}

async function deleteBook(request, response) {
  try {
    const book = await Books.remove(request.params.id);
    if (!book) {
      return response.status(404).json({ message: "Book not found" });
    }
    return response.status(200).json({ message: "Book deleted", book });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
