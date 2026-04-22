const express = require("express");
const morgan = require("morgan");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ENV
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// OAuth client
const googleClient = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Middlewares
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

// =========================
// LOGIN
// =========================
app.get("/login", (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline", // refresh_token
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  res.redirect(authUrl);
});

// =========================
// CALLBACK
// =========================
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code received");
  }

  try {
    // 1. code → tokens
    const { tokens } = await googleClient.getToken(code);

    googleClient.setCredentials(tokens);

    // 2. verify id_token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    // 3. redirect con datos (demo)
    const query = new URLSearchParams(user).toString();

    res.redirect(`/03-callback-success.html?${query}`);
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).send("Authentication failed");
  }
});

// =========================
// START
// =========================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});