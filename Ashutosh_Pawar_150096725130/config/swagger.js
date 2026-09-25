// Swagger / OpenAPI 3.0 config. swagger-jsdoc reads the @swagger JSDoc blocks
// written above each route in ./routes/*.js and builds the spec from them.
// The shared schemas below are referenced from those blocks with $ref.
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Library Management API",
      version: "1.0.0",
      description:
        "Institutional library system: Firebase Firestore store, JWT + bcrypt " +
        "role-based auth (student vs librarian), rate limiting and Swagger docs.",
    },
    // relative, so "Try it out" hits whichever host serves the docs
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "kJ2h9sLpQ..." },
            name: { type: "string", example: "Jane Smith" },
            email: { type: "string", example: "jane@university.edu" },
            role: { type: "string", enum: ["student", "librarian"] },
            createdAt: { type: "string", example: "2026-03-01T12:00:00.000Z" },
          },
        },
        Book: {
          type: "object",
          properties: {
            id: { type: "string", example: "book_doc_id_101" },
            title: { type: "string", example: "Introduction to Algorithms" },
            author: { type: "string", example: "Thomas H. Cormen" },
            isbn: { type: "string", example: "978-0262033848" },
            category: { type: "string", example: "Computer Science" },
            totalCopies: { type: "integer", example: 10 },
            availableCopies: { type: "integer", example: 7 },
            createdAt: { type: "string", example: "2026-03-01T12:00:00.000Z" },
          },
        },
        BorrowRecord: {
          type: "object",
          properties: {
            id: { type: "string", example: "borrow_doc_id_999" },
            userId: { type: "string" },
            bookId: { type: "string" },
            bookTitle: { type: "string" },
            borrowDate: { type: "string", example: "2026-03-01T14:00:00.000Z" },
            dueDate: { type: "string", example: "2026-03-15T14:00:00.000Z" },
            returnDate: { type: "string", nullable: true, example: null },
            status: { type: "string", enum: ["borrowed", "returned"] },
          },
        },
        Message: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
