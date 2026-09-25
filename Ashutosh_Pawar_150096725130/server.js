// dotenv must load first -- config/firebaseConfig.js reads process.env the
// moment it is required, and the route files pull that in further down.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const apiLimiter = require("./middleware/rateLimiter");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a proxy (Render, etc.) the client IP is in X-Forwarded-For. Without
// this, every request looks like it comes from the proxy and the whole site
// shares one rate-limit bucket.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Interactive docs. Kept BEFORE the rate limiter so browsing the docs is
// never throttled.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (request, response) => {
  response.status(200).json({ message: "Library Management API is running" });
});

// Everything under /api is rate limited: 100 requests / 15 min / IP.
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", borrowRoutes);

// Anything that matched no route above.
app.use((request, response) => {
  response.status(404).json({ message: "Route not found" });
});

// Express 5 forwards errors thrown inside async handlers to here.
app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ message: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}!!`);
  console.log(`swagger docs at http://localhost:${PORT}/api-docs`);
});
