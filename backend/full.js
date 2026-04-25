/*
👉 SSO UNIFICADO - Google OAuth + Legacy + Cookies cross-subdomain
*/

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   ENV
========================= */
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/* =========================
   GOOGLE CLIENTS
========================= */
const googleClient = new OAuth2Client(CLIENT_ID);

const googleCodeClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, "postmessage");

const googleRedirectClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

/* =========================
   MIDDLEWARES BASE
========================= */
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.use(
  cors({
    origin: ["https://live.frankgp.com", "https://back.frankgp.com", "http://localhost:3000"],
    credentials: true,
  }),
);

/* =========================
   SUBDOMAIN DETECTION
========================= */
app.use((req, res, next) => {
  const host = req.headers.host || "";

  req.subdomain = host.split(".")[0];

  req.isBackend = host.startsWith("back.");
  req.isFrontend = host.startsWith("live.");

  next();
});

/* =========================
   USER BUILDER
========================= */
const buildUser = (payload) => ({
  id: payload.sub,
  name: payload.name,
  email: payload.email,
  picture: payload.picture,
  status: "active",
  roles: ["user"],
});

/* =========================
   AUTH: GOOGLE UNIFICADO
========================= */
app.post("/auth/google", async (req, res) => {
  const { credential, code } = req.body;

  try {
    let payload;

    // 🔐 One Tap / ID Token
    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: CLIENT_ID,
      });

      payload = ticket.getPayload();
    }

    // 🔑 Popup OAuth
    else if (code) {
      const { tokens } = await googleCodeClient.getToken(code);

      if (!tokens.id_token) {
        return res.status(400).json({ error: "No id_token" });
      }

      const ticket = await googleCodeClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
      });

      payload = ticket.getPayload();
    } else {
      return res.status(400).json({
        error: "Missing credential or code",
      });
    }

    const user = buildUser(payload);

    // 🍪 COOKIE SSO CROSS-SUBDOMAIN
    res.cookie("sso_user", JSON.stringify(user), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".frankgp.com",
      path: "/",
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      error: "Auth failed",
    });
  }
});

/* =========================
   LEGACY LOGIN (redirect)
========================= */
app.get("/login", (req, res) => {
  const url = googleRedirectClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  res.redirect(url);
});

/* =========================
   LEGACY CALLBACK
========================= */
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send("No code");

  try {
    const { tokens } = await googleRedirectClient.getToken(code);

    const ticket = await googleRedirectClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const user = buildUser(ticket.getPayload());

    // 🍪 set cookie SSO
    res.cookie("sso_user", JSON.stringify(user), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".frankgp.com",
      path: "/",
    });

    res.redirect("/index.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Auth failed");
  }
});

/* =========================
   SESSION CHECK (SSO CORE)
========================= */
app.get("/auth/me", (req, res) => {
  try {
    const cookie = req.cookies.sso_user;

    if (!cookie) {
      return res.status(401).json({ user: null });
    }

    const user = JSON.parse(cookie);

    res.json({ user });
  } catch {
    res.status(400).json({ user: null });
  }
});

/* =========================
   LOGOUT GLOBAL SSO
========================= */
app.post("/auth/logout", (req, res) => {
  res.clearCookie("sso_user", {
    domain: ".frankgp.com",
    path: "/",
  });

  res.json({ ok: true });
});

/* =========================
   PROTECT BACKEND ROUTES
========================= */
const requireAuth = (req, res, next) => {
  const cookie = req.cookies.sso_user;

  if (!cookie) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = JSON.parse(cookie);
  next();
};

app.get("/api/private", requireAuth, (req, res) => {
  res.json({
    message: "Protected data",
    user: req.user,
  });
});

/* =========================
   FRONTEND SERVE
========================= */
app.use((req, res, next) => {
  if (req.isFrontend) {
    return express.static(path.join(__dirname, "public"))(req, res, next);
  }
  next();
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "SSO running",
    subdomain: req.subdomain,
  });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`🚀 SSO running on port ${PORT}`);
});
