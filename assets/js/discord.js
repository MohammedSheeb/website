const userId = "1481454957512101950";
let heartbeatTimer = null;

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
      frameEl.hidden = false;
    };

    testImg.onerror = () => {
      frameEl.src = pngUrl;
      frameEl.hidden = false;
    };

    testImg.src = gifUrl;
  } else {
    frameEl.hidden = true;
    frameEl.removeAttribute("src");
  }
}

function applyCustomStatus(activities) {
  const customEl = document.getElementById("customStatus");
  const customEmojiEl = document.getElementById("customStatusEmoji");
  const customTextEl = document.getElementById("customStatusText");

  if (!customEl || !customEmojiEl || !customTextEl) return;

  const custom = activities.find((a) => a.type === 4);

  if (custom) {
    customTextEl.innerText = custom.state || "";
    customEmojiEl.innerHTML = "";

    if (custom.emoji) {
      if (!custom.emoji.id && custom.emoji.name) {
        customEmojiEl.textContent = custom.emoji.name;
      } else if (custom.emoji.id) {
        const emojiExt = custom.emoji.animated ? "gif" : "png";
        const emojiUrl = `https://cdn.discordapp.com/emojis/${custom.emoji.id}.${emojiExt}?size=64&quality=lossless`;
        customEmojiEl.innerHTML = `<img src="${emojiUrl}" alt="">`;
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

function setDiscordStatus(status) {
  const dotEl = document.getElementById("dot");
  if (!dotEl) return;

  const labelMap = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Invisible"
  };

  dotEl.dataset.status = status;
  dotEl.setAttribute("aria-label", labelMap[status] || "Invisible");
}

function renderDiscordPresence(payload) {
  if (!payload || !payload.discord_user) return;

  const user = payload.discord_user;
  const status = payload.discord_status || "offline";
  const activities = payload.activities || [];
  const spotify = payload.spotify;
  const listeningToSpotify = payload.listening_to_spotify;

  const avatarEl = document.getElementById("avatar");
  const displayNameEl = document.getElementById("displayName");
  const tagEl = document.getElementById("tag");

  if (!avatarEl || !displayNameEl || !tagEl) return;

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  avatarEl.src = avatarUrl;
  displayNameEl.innerText = user.global_name || user.username || "Unknown";
  tagEl.innerText = `@${user.username || "username"}`;

  setDiscordStatus(status);
  applyAvatarDecoration(user);
  applyCustomStatus(activities);

  resetActivityTimer();

  if (listeningToSpotify && spotify) {
    setSpotifyActivity(spotify);
    return;
  }

  const activity =
    activities.find((a) => a.type === 0) ||
    activities.find((a) => a.type === 1) ||
    activities.find((a) => a.type === 2) ||
    activities.find((a) => a.type === 3) ||
    activities.find((a) => a.type === 5);

  if (activity) {
    setOtherActivity(activity);
  } else {
    setFallbackActivity();
  }
}

async function loadDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (data?.success && data.data) {
      renderDiscordPresence(data.data);
    }
  } catch (e) {
    console.error("Failed to load Discord data", e);
    setFallbackActivity();
  }
}

function connectLanyard() {
  const socket = new WebSocket("wss://api.lanyard.rest/socket");

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);

    if (payload.op === 1) {
      clearInterval(heartbeatTimer);

      heartbeatTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ op: 3 }));
        }
      }, payload.d.heartbeat_interval);

      socket.send(JSON.stringify({
        op: 2,
        d: {
          subscribe_to_id: userId
        }
      }));

      return;
    }

    if ((payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE") && payload.d) {
      renderDiscordPresence(payload.d);
    }
  });

  socket.addEventListener("close", () => {
    clearInterval(heartbeatTimer);
    setTimeout(connectLanyard, 3000);
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}