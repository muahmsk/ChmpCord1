import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "chmpcord_secret_123",
    resave: false,
    saveUninitialized: true,
  })
);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT = "http://localhost:3000/auth/callback";

// ---------- LOGIN ----------
app.get("/login", (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT
  )}&response_type=code&scope=identify`;
  res.redirect(url);
});

// ---------- CALLBACK ----------
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  const tokenReq = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = await tokenReq.json();

  const userReq = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  const user = await userReq.json();
  req.session.user = user;

  res.redirect("/panel");
});

// ---------- PANEL ----------
app.get("/panel", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "panel.html"));
});

// User API
app.get("/api/user", (req, res) => {
  res.json(req.session.user || null);
});

// Voice page
app.get("/voice", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "voice.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------------- SOCKET.IO ----------------
const server = http.createServer(app);
const io = new Server(server);

let channels = JSON.parse(fs.readFileSync("channels.json", "utf8"));

io.on("connection", (socket) => {
  console.log("Kullanıcı bağlandı:", socket.id);

  // Kanal listesi gönder
  socket.emit("channelList", channels);

  // Odaya giriş isteği
  socket.on("joinRoom", ({ room, password, user }) => {
    let ch = channels[room];
    if (!ch) return;

    if (ch.password && ch.password !== password) {
      socket.emit("wrongPassword");
      return;
    }

    socket.join(room);

    // Kullanıcıyı listeye ekle
    if (!ch.users.find((u) => u.id === user.id)) {
      ch.users.push(user);
    }

    io.emit("channelList", channels);
    socket.emit("joinedRoom", room);
  });

  // Odayı terk etme
  socket.on("leaveRoom", ({ room, user }) => {
    let ch = channels[room];
    if (!ch) return;

    ch.users = ch.users.filter((u) => u.id !== user.id);
    socket.leave(room);
    io.emit("channelList", channels);
  });

  // (İleride WebRTC signalling için kullanılabilir)
  socket.on("signal", (data) => {
    socket.to(data.room).emit("signal", data);
  });
});

server.listen(3000, () => {
  console.log("ChmpCord Voice çalışıyor → http://localhost:3000");
});
