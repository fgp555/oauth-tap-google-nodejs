/* 
👉 SSO (Single Sign-On)
*/

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ENV
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// 🔹 Cliente base (ID token)
const googleClient = new OAuth2Client(CLIENT_ID);

// 🔹 Cliente popup (postmessage)
const googleCodeClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, "postmessage");

// 🔹 Cliente legacy (redirect callback)
const googleRedirectClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================
// 🔐 HELPER
// =========================
const buildUser = (payload) => ({
  id: payload.sub,
  name: payload.name,
  email: payload.email,
  picture: payload.picture,
  status: "active",
  roles: ["student"],
});

// =========================
// 🔥 AUTH UNIFICADO (API)
// =========================
app.post("/auth/google", async (req, res) => {
  const { credential, code } = req.body;

  try {
    let payload;

    // 🔐 1. One Tap / ID Token
    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: CLIENT_ID,
      });

      payload = ticket.getPayload();
    }

    // 🔑 2. Popup OAuth (code + postmessage)
    else if (code) {
      const { tokens } = await googleCodeClient.getToken(code);

      if (!tokens.id_token) {
        return res.status(400).json({ error: "No id_token received" });
      }

      const ticket = await googleCodeClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
      });

      payload = ticket.getPayload();
    }

    // ❌ error
    else {
      return res.status(400).json({
        error: "Missing credential or code",
      });
    }

    const user = buildUser(payload);

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
});

// =========================
// 🔁 LEGACY LOGIN (redirect)
// =========================
app.get("/login", (req, res) => {
  const authUrl = googleRedirectClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  res.redirect(authUrl);
});

// =========================
// 🔁 LEGACY CALLBACK
// =========================
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code received");
  }

  try {
    const { tokens } = await googleRedirectClient.getToken(code);

    googleRedirectClient.setCredentials(tokens);

    const ticket = await googleRedirectClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = buildUser(payload);

    // 👉 ejemplo: redirigir con datos
    const query = new URLSearchParams(user).toString();

    res.redirect(`/03-callback-success.html?${query}`);
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).send("Authentication failed");
  }
});

// =========================
// 🧪 TEST
// =========================
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// 🚀 START
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
