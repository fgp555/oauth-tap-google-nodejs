const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

// CORS: permitir frontend
app.use(
  cors({
    origin: "https://live.frankgp.com",
    credentials: true,
  }),
);

// Detectar subdominio
app.use((req, res, next) => {
  const host = req.headers.host || "";

  if (host.startsWith("back.")) {
    req.subdomainType = "backend";
  } else if (host.startsWith("live.")) {
    req.subdomainType = "frontend";
  }

  next();
});

// ==============================
// 🍪 LOGIN (crea cookie)
// ==============================
app.post("/api/login", (req, res) => {
  if (req.subdomainType !== "backend") {
    return res.sendStatus(403);
  }

  const { user } = req.body;

  // demo simple
  if (!user) {
    return res.status(400).json({ error: "user requerido" });
  }

  res.cookie("user", user, {
    httpOnly: true,
    secure: true, // ⚠️ requiere HTTPS
    sameSite: "None", // ⚠️ necesario cross-subdomain
    domain: ".frankgp.com",
    path: "/",
  });

  res.json({ ok: true });
});

// ==============================
// 👀 VALIDAR COOKIE
// ==============================
app.get("/api/me", (req, res) => {
  if (req.subdomainType !== "backend") {
    return res.sendStatus(403);
  }

  const user = req.cookies.user;

  if (!user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user });
});

// ==============================
// 🚪 LOGOUT
// ==============================
app.post("/api/logout", (req, res) => {
  res.clearCookie("user", {
    domain: ".frankgp.com",
    path: "/",
  });

  res.json({ ok: true });
});

// ==============================
// 🌐 FRONTEND
// ==============================
app.use((req, res, next) => {
  if (req.subdomainType === "frontend") {
    return express.static("public")(req, res, next);
  }
  next();
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
