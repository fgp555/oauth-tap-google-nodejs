const express = require("express");
const morgan = require("morgan");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = 3000;

app.use(morgan("dev"));

// Environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// OAuth client
const googleClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.send(`
    <h2>Login with Google</h2>
    <a href="/login">Sign in</a>
  `);
});

// =========================
// LOGIN (redirect flow)
// =========================
app.get("/login", (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  return res.redirect(authUrl);
});

// =========================
// CALLBACK
// =========================
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not received");
  }

  try {
    // =========================
    // 1. Exchange code → tokens
    // =========================
    const { tokens } = await googleClient.getToken(code);

    // tokens: { access_token, id_token, refresh_token, ... }
    googleClient.setCredentials(tokens);

    // =========================
    // 2. Verify ID token & get user info
    // =========================
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

    // =========================
    // RESPONSE
    // =========================
    return res.send(`
      <h2>Login successful</h2>
      <p>${user.name}</p>
      <p>${user.email}</p>
      <img src="${user.picture}" width="100"/>
    `);
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).send("Authentication failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
