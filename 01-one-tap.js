const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

const { GOOGLE_CLIENT_ID } = process.env;

const app = express();

// 🔧 Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

// 🔐 Google OAuth client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * 🔑 Google Login (One Tap / Popup)
 */
app.post("/auth/google", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Missing credential" });
  }

  try {
    // ✅ Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // 📦 Build user object
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      status: "active",
      roles: ["student"],
    };

    // 👉 Here you could persist the user or create a session

    return res.json(user);
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
