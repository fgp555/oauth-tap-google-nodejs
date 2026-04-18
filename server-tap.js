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

// 🔐 Cliente de Google
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * 🔑 Login con Google (popup)
 */
app.post("/auth/google", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Missing credential" });
  }

  try {
    // ✅ Verificar token JWT
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // 📦 Datos del usuario
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      status: "active",
      roles: ["student"],
    };

    // 👉 Aquí podrías guardar en DB o sesión

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
