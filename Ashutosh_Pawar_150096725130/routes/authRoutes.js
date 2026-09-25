const express = require("express");
const verifyToken = require("../middleware/auth");
const {
  register,
  registerLibrarian,
  login,
  getProfile,
} = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login and profile
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Smith }
 *               email: { type: string, example: jane@university.edu }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Missing or invalid fields
 *       409:
 *         description: Email already registered
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/register-librarian:
 *   post:
 *     summary: Register a librarian account (requires the secret key)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, secretKey]
 *             properties:
 *               name: { type: string, example: Mr. Bibliothecarius }
 *               email: { type: string, example: librarian@university.edu }
 *               password: { type: string, example: secret123 }
 *               secretKey: { type: string, example: super-secret-librarian-key }
 *     responses:
 *       201:
 *         description: Librarian registered
 *       403:
 *         description: Invalid librarian secret key
 */
router.post("/register-librarian", registerLibrarian);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT (role embedded in the token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane@university.edu }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful, returns token and user
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the current logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user
 *       401:
 *         description: No or invalid token
 */
router.get("/profile", verifyToken, getProfile);

module.exports = router;
