const express = require("express");
const morgan = require("morgan");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = 3000;

app.use(morgan("dev"));

// Variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Cliente OAuth
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.send(`
    <h2>Login con Google</h2>
    <a href="/login">Iniciar sesión</a>
  `);
});

// =========================
// LOGIN (redirect)
// =========================
app.get("/login", (req, res) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  res.redirect(url);
});

// =========================
// CALLBACK
// =========================
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.send("No se recibió code");
  }

  try {
    // =========================
    // 1. Intercambiar code → tokens
    // =========================
    const { tokens } = await client.getToken(code);

    // tokens: { access_token, id_token, refresh_token, ... }

    client.setCredentials(tokens);

    // =========================
    // 2. Obtener info del usuario
    // =========================
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    // =========================
    // RESPUESTA
    // =========================
    res.send(`
      <h2>Login exitoso</h2>
      <p>${user.name}</p>
      <p>${user.email}</p>
      <img src="${user.picture}" width="100"/>
    `);
  } catch (error) {
    console.error("Auth error:", error.message);
    res.send("Error en autenticación");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
