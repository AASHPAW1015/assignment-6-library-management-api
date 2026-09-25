const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

// Strip the password hash before a user object ever leaves the API.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// Shared by both register endpoints -- only the role differs.
async function registerWithRole(request, response, role) {
  const { name, password } = request.body;
  // normalize so "A@x.com" and "a@x.com" are the same account
  const email = (request.body.email || "").toLowerCase().trim();

  if (!name || !email || !password) {
    return response
      .status(400)
      .json({ message: "name, email and password are required" });
  }

  if (password.length < 6) {
    return response
      .status(400)
      .json({ message: "password must be at least 6 characters" });
  }

  const existing = await Users.findByEmail(email);
  if (existing) {
    return response.status(409).json({ message: "Email already registered" });
  }

  // 10 salt rounds. bcrypt stores the salt inside the hash, so no extra column.
  const hashed = await bcrypt.hash(password, 10);
  const user = await Users.create({ name, email, password: hashed, role });

  return response
    .status(201)
    .json({ message: "User registered", user: publicUser(user) });
}

async function register(request, response) {
  try {
    return await registerWithRole(request, response, "student");
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function registerLibrarian(request, response) {
  try {
    // A librarian account can only be created by someone who knows the secret.
    // Reject too when the env var is unset, otherwise undefined === undefined
    // would let anyone in by omitting secretKey.
    if (
      !process.env.LIBRARIAN_SECRET_KEY ||
      request.body.secretKey !== process.env.LIBRARIAN_SECRET_KEY
    ) {
      return response
        .status(403)
        .json({ message: "Invalid librarian secret key" });
    }
    return await registerWithRole(request, response, "librarian");
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function login(request, response) {
  try {
    const { password } = request.body;
    const email = (request.body.email || "").toLowerCase().trim();

    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await Users.findByEmail(email);
    if (!user) {
      return response.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return response.status(401).json({ message: "Invalid credentials" });
    }

    // role is baked into the token, so RBAC needs no extra DB read per request.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return response.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

async function getProfile(request, response) {
  try {
    const user = await Users.findById(request.user.id);
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }
    return response.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

module.exports = { register, registerLibrarian, login, getProfile };
