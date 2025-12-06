const socket = io();

let myUser = null;
let currentRoom = null;

let localStream = null;
let videoTrack = null;
let audioTrack = null;

let isMicOn = true;
let isCamOn = true;

// Kullanıcı bilgisi
fetch("/api/user").then(r => r.json()).then(u => myUser = u);

// -------------------------------
// KANAL LİSTESİ
// -------------------------------
socket.on("channelList", (channels) => {
  let box = document.getElementById("channelList");
  box.innerHTML = "";

  for (let id in channels) {
    let c = channels[id];
    let div = document.createElement("div");
    div.className = "channel";

    let lock = c.password ? "🔒" : "🔓";
    div.innerHTML = `<strong>${lock} ${c.name}</strong><br><small>${c.users.length} kişi</small>`;

    div.onclick = () => joinRoom(id, c.password);
    box.appendChild(div);
  }
});

// -------------------------------
// ODAYA GİRİŞ
// -------------------------------
function joinRoom(room, requiresPassword) {
  let pass = "";

  if (requiresPassword) {
    pass = prompt("Bu oda şifreli! Şifre nedir?");
    if (!pass) return;
  }

  socket.emit("joinRoom", { room, password: pass, user: myUser });
}

socket.on("joinedRoom", (room) => {
  currentRoom = room;
  document.getElementById("leaveRoom").style.display = "block";
  startMedia();
});

socket.on("wrongPassword", () => alert("❌ Yanlış şifre!"));

// -------------------------------
// SES + KAMERA BAŞLAT
// -------------------------------
async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  const video = document.getElementById("localVideo");
  video.srcObject = localStream;

  audioTrack = localStream.getAudioTracks()[0];
  videoTrack = localStream.getVideoTracks()[0];

  setupAudioDetection();
}

// -------------------------------
// MİKROFON AÇ / KAPA
// -------------------------------
document.getElementById("micBtn").onclick = () => {
  if (!audioTrack) return;
  
  isMicOn = !isMicOn;
  audioTrack.enabled = isMicOn;

  document.getElementById("micBtn").style.background = isMicOn ? "#1e293b" : "#dc2626";
};

// -------------------------------
// KAMERA AÇ / KAPA
// -------------------------------
document.getElementById("camBtn").onclick = () => {
  if (!videoTrack) return;

  isCamOn = !isCamOn;
  videoTrack.enabled = isCamOn;

  document.getElementById("camBtn").style.background = isCamOn ? "#1e293b" : "#dc2626";
};

// -------------------------------
// EKRAN PAYLAŞIMI
// -------------------------------
document.getElementById("screenBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

  document.getElementById("screenVideo").srcObject = stream;
};

// -------------------------------
// ODAYI TERK ETME (📞 Butonu)
// -------------------------------
document.getElementById("leaveCallBtn").onclick =
document.getElementById("leaveRoom").onclick = () => {

  if (!currentRoom) return;

  socket.emit("leaveRoom", { room: currentRoom, user: myUser });
  currentRoom = null;

  stopAllMedia();

  document.getElementById("leaveRoom").style.display = "none";
  alert("Odadan çıkıldı.");
};

// -------------------------------
// MEDYA DURDUR
// -------------------------------
function stopAllMedia() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  document.getElementById("localVideo").srcObject = null;
  document.getElementById("screenVideo").srcObject = null;
}

// -------------------------------
// SES ALGILAMA — Konuşunca YEŞİL HALKA
// -------------------------------
function setupAudioDetection() {
  const videoWrap = document.getElementById("localWrap");

  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  const micSource = audioCtx.createMediaStreamSource(localStream);

  micSource.connect(analyser);

  let data = new Uint8Array(analyser.frequencyBinCount);

  function loop() {
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b) / data.length;

    if (avg > 20 && isMicOn) {
      videoWrap.classList.add("speaking");
    } else {
      videoWrap.classList.remove("speaking");
    }

    requestAnimationFrame(loop);
  }

  loop();
}
