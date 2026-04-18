const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

const app = express();

app.use(express.static("public"));

/**
 * 🔗 Paso 1: iniciar login
 */
app.get("/auth/google", (req, res) => {
  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

  res.redirect(url);
});

/**
 * 🔁 Paso 2: callback
 */
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Falta el parámetro code");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      return res.status(400).json(data);
    }

    // 🔴 SOLO PARA TEST
    res.redirect(`/success.html?token=${data.access_token}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en autenticación");
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
