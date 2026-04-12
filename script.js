const userId = "1481454957512101950";

let activityInterval = null;

/* =========================
   UTILS
========================= */

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function setDisplay(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
}

/* =========================
   AVATAR EFFECT
========================= */

function applyAvatarDecoration(user) {
  const frameEl = document.getElementById("avatarFrame");
  if (!frameEl) return;

  const decoration = user.avatar_decoration_data;

  if (decoration && decoration.asset) {
    const asset = decoration.asset;
    const gifUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.gif`;
    const pngUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`;

    const testImg = new Image();

    testImg.onload = () => {
      frameEl.src = gifUrl;
      frameEl.style.display = "block";
    };

    testImg.onerror = () => {
      frameEl.src = pngUrl;
      frameEl.style.display = "block";
    };

    testImg.src = gifUrl;
  } else {
    frameEl.style.display = "none";
    frameEl.removeAttribute("src");
  }
}

/* =========================
   CUSTOM STATUS
========================= */

function applyCustomStatus(activities) {
  const customEl = document.getElementById("customStatus");
  const customEmojiEl = document.getElementById("customStatusEmoji");
  const customTextEl = document.getElementById("customStatusText");

  if (!customEl || !customEmojiEl || !customTextEl) return;

  const custom = activities.find(a => a.type === 4);

  if (custom) {
    customTextEl.innerText = custom.state || "";
    customEmojiEl.innerHTML = "";

    if (custom.emoji) {
      if (!custom.emoji.id) {
        customEmojiEl.textContent = custom.emoji.name || "";
      } else {
        const ext = custom.emoji.animated ? "gif" : "png";
        customEmojiEl.innerHTML = `<img src="https://cdn.discordapp.com/emojis/${custom.emoji.id}.${ext}?size=64&quality=lossless" alt="">`;
      }
    }

    if (!custom.state && !custom.emoji) {
      customEl.style.display = "none";
    } else {
      customEl.style.display = "flex";
    }
  } else {
    customEl.style.display = "none";
    customEmojiEl.innerHTML = "";
    customTextEl.innerText = "";
  }
}

/* =========================
   ACTIVITY
========================= */

function resetActivityTimer() {
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
}

function resetProgress() {
  const bar = document.getElementById("progressBar");
  const current = document.getElementById("timeCurrent");
  const total = document.getElementById("timeTotal");

  if (bar) bar.style.width = "0%";
  if (current) current.innerText = "";
  if (total) total.innerText = "";
}

function setFallbackActivity() {
  setDisplay("spotifyHeader", "none");
  setDisplay("spotifyProgressWrap", "none");
  setDisplay("activityCover", "none");
  setDisplay("activityIconFallback", "flex");

  const cover = document.getElementById("activityCover");
  if (cover) cover.removeAttribute("src");

  setText("activityName", "Available");
  setText("activityArtist", "No activity right now");
  resetProgress();
}

function setSpotifyActivity(spotify) {
  const cover = document.getElementById("activityCover");
  const bar = document.getElementById("progressBar");
  const currentText = document.getElementById("timeCurrent");
  const totalText = document.getElementById("timeTotal");

  setDisplay("spotifyHeader", "flex");
  setDisplay("spotifyProgressWrap", "block");
  setDisplay("activityIconFallback", "none");
  setDisplay("activityCover", "block");

  if (cover) {
    cover.src = spotify.album_art_url || "";
  }

  setText("activityName", spotify.song || "Spotify");
  setText("activityArtist", spotify.artist || "");

  const start = spotify.timestamps?.start;
  const end = spotify.timestamps?.end;

  if (start && end) {
    const update = () => {
      const now = Date.now();
      const total = Math.max(1, Math.floor((end - start) / 1000));
      const current = Math.max(0, Math.floor((now - start) / 1000));
      const percent = Math.min(100, Math.max(0, (current / total) * 100));

      if (bar) bar.style.width = `${percent}%`;
      if (currentText) currentText.innerText = formatTime(current);
      if (totalText) totalText.innerText = formatTime(total);
    };

    update();
    activityInterval = setInterval(update, 1000);
  } else {
    if (bar) bar.style.width = "0%";
    if (currentText) currentText.innerText = "0:00";
    if (totalText) totalText.innerText = "0:00";
  }
}

function setOtherActivity(activity) {
  const cover = document.getElementById("activityCover");
  const bar = document.getElementById("progressBar");

  setDisplay("spotifyHeader", "none");
  setDisplay("spotifyProgressWrap", "none");

  setText("activityName", activity.name || "Activity");
  setText("activityArtist", activity.details || activity.state || "");

  const largeImage = activity.assets?.large_image;
  if (largeImage && cover) {
    if (largeImage.startsWith("mp:external/")) {
      cover.src = `https://media.discordapp.net/${largeImage.slice(3)}`;
    } else if (activity.application_id) {
      cover.src = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImage}.png`;
    } else {
      cover.removeAttribute("src");
    }

    if (cover.getAttribute("src")) {
      cover.style.display = "block";
      setDisplay("activityIconFallback", "none");
    } else {
      cover.style.display = "none";
      setDisplay("activityIconFallback", "flex");
    }
  } else {
    if (cover) {
      cover.style.display = "none";
      cover.removeAttribute("src");
    }
    setDisplay("activityIconFallback", "flex");
  }

  if (bar) bar.style.width = "0%";
  setText("timeCurrent", "");
  setText("timeTotal", "");
}

/* =========================
   MAIN RENDER
========================= */

function renderDiscordPresence(payload) {
  if (!payload || !payload.discord_user) return;

  const user = payload.discord_user;
  const activities = payload.activities || [];
  const spotify = payload.spotify;

  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  const avatarEl = document.getElementById("avatar");
  if (avatarEl) avatarEl.src = avatar;

  setText("displayName", user.global_name || user.username || "Unknown");
  setText("tag", "@" + (user.username || "username"));

  const dot = document.getElementById("dot");
  if (dot) dot.className = "status-dot " + (payload.discord_status || "offline");

  applyAvatarDecoration(user);
  applyCustomStatus(activities);

  resetActivityTimer();

  if (payload.listening_to_spotify && spotify) {
    setSpotifyActivity(spotify);
    return;
  }

  const activity =
    activities.find(a => a.type === 0) ||
    activities.find(a => a.type === 1) ||
    activities.find(a => a.type === 3) ||
    activities.find(a => a.type === 5);

  if (activity) {
    setOtherActivity(activity);
  } else {
    setFallbackActivity();
  }
}

/* =========================
   API + SOCKET
========================= */

async function loadDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (data && data.success && data.data) {
      renderDiscordPresence(data.data);
    }
  } catch (error) {
    console.error("Failed to load Discord data:", error);
  }
}

function connectLanyard() {
  let socket = new WebSocket("wss://api.lanyard.rest/socket");

  socket.onopen = () => {
    socket.send(JSON.stringify({
      op: 2,
      d: { subscribe_to_id: userId }
    }));
  };

  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data);

    if (payload.op === 1) {
      socket.send(JSON.stringify({ op: 3 }));
      return;
    }

    if ((payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE") && payload.d) {
      renderDiscordPresence(payload.d);
    }
  };

  socket.onerror = () => {
    socket.close();
  };

  socket.onclose = () => {
    setTimeout(connectLanyard, 3000);
  };
}

/* =========================
   UI EFFECTS
========================= */

window.addEventListener("scroll", () => {
  const header = document.getElementById("siteHeader");
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }
});

const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("siteNav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.classList.toggle("active");
    toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll(".icons a").forEach(link => {
  link.addEventListener("click", () => {
    setTimeout(() => link.blur(), 100);
  });
});

/* =========================
   IMAGE PROTECTION
========================= */

document.querySelectorAll("img").forEach(img => {
  if (img.closest(".logo") || img.closest(".netflix-link") || img.closest(".pubgm-btn")) return;

  img.addEventListener("dragstart", e => e.preventDefault());
});

/* =========================
   YEAR
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }
});

/* =========================
   INIT
========================= */

loadDiscord();
connectLanyard();