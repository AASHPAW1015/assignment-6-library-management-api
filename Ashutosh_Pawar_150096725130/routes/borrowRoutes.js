// Librarian-facing views over the borrow records. Mounted at /api, so the
// paths below read as /api/librarian/borrow-records and /api/reports/overdue.
const express = require("express");
const verifyToken = require("../middleware/auth");
const { verifyLibrarian } = require("../middleware/checkRole");
const {
  getAllBorrowRecords,
  getOverdue,
} = require("../controllers/borrowController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Librarian views over borrow records
 */

/**
 * @swagger
 * /api/librarian/borrow-records:
 *   get:
 *     summary: All active and past borrow records (librarian only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of every borrow record }
 *       403: { description: Librarians only }
 */
router.get(
  "/librarian/borrow-records",
  verifyToken,
  verifyLibrarian,
  getAllBorrowRecords,
);

/**
 * @swagger
 * /api/reports/overdue:
 *   get:
 *     summary: Books still out past their due date (librarian only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of overdue borrow records }
 *       403: { description: Librarians only }
 */
router.get("/reports/overdue", verifyToken, verifyLibrarian, getOverdue);

module.exports = router;
