const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

// const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "postmessage", // 🔥 obligatorio en popup flow
);

/**
 * 🔑 Google OAuth (Popup con code)
 */
app.post("/auth/google", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    // 🔥 1. Intercambio usando la librería
    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).json({ error: "No id_token received" });
    }

    // 🔐 2. Verificar ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      status: "active",
      roles: ["student"],
    };

    res.json(user);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Auth failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
