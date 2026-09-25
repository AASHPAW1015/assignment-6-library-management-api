const express = require("express");
const verifyToken = require("../middleware/auth");
const { verifyStudent, verifyLibrarian } = require("../middleware/checkRole");
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const {
  borrowBook,
  returnBook,
  getMyHistory,
} = require("../controllers/borrowController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Catalog, inventory and borrow/return
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: List books (public) with optional search and category filter
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches title, author or ISBN
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of books
 */
router.get("/", getBooks);

/**
 * @swagger
 * /api/books/my-history:
 *   get:
 *     summary: The current student's borrowing history
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of borrow records }
 *       403: { description: Students only }
 */
// NOTE: must sit before "/:id" or Express would treat "my-history" as an id.
router.get("/my-history", verifyToken, verifyStudent, getMyHistory);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get a single book and its availability (public)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The book }
 *       404: { description: Book not found }
 */
router.get("/:id", getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, isbn, category, totalCopies]
 *             properties:
 *               title: { type: string, example: Introduction to Algorithms }
 *               author: { type: string, example: Thomas H. Cormen }
 *               isbn: { type: string, example: 978-0262033848 }
 *               category: { type: string, example: Computer Science }
 *               totalCopies: { type: integer, example: 10 }
 *     responses:
 *       201: { description: Book created }
 *       403: { description: Librarians only }
 */
router.post("/", verifyToken, verifyLibrarian, createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update book details or inventory (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               category: { type: string }
 *               totalCopies: { type: integer }
 *     responses:
 *       200: { description: Book updated }
 *       404: { description: Book not found }
 */
router.put("/:id", verifyToken, verifyLibrarian, updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Remove a book from the catalog (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Book deleted }
 *       404: { description: Book not found }
 */
router.delete("/:id", verifyToken, verifyLibrarian, deleteBook);

/**
 * @swagger
 * /api/books/{id}/borrow:
 *   post:
 *     summary: Borrow a copy of a book (student only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Book borrowed }
 *       400: { description: No copies available or already borrowed }
 *       404: { description: Book not found }
 */
router.post("/:id/borrow", verifyToken, verifyStudent, borrowBook);

/**
 * @swagger
 * /api/books/{id}/return:
 *   post:
 *     summary: Return a borrowed book (student only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Book returned }
 *       400: { description: No active borrow for this book }
 */
router.post("/:id/return", verifyToken, verifyStudent, returnBook);

module.exports = router;
