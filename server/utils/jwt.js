// utils/jwt.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // fallback for dev

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, accountType: user.accountType },
    JWT_SECRET
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
