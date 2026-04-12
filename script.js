const userId = "1481454957512101950";

let activityInterval;

async function loadDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    const user = data.data.discord_user;
    const status = data.data.discord_status;
    const activities = data.data.activities;

    const isAnimated = user.avatar && user.avatar.startsWith("a_");
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isAnimated ? "gif" : "png"}`;

    document.getElementById("avatar").src = avatarUrl;

    const name = user.global_name ? user.global_name : user.username;
    document.getElementById("displayName").innerText = name;
    document.getElementById("tag").innerText = user.username;
    document.getElementById("dot").className = "status-dot " + status;

    const customEl = document.getElementById("customStatus");
    const activityCard = document.getElementById("activityCard");
    const activityName = document.getElementById("activityName");
    const activityDesc = document.getElementById("activityDesc");

    let custom = activities.find(a => a.type === 4);
    customEl.innerText = custom ? (custom.state || "") : "";

    let activity =
      activities.find(a => a.type === 2) ||
      activities.find(a => a.type === 0) ||
      activities.find(a => a.type === 1);

    clearInterval(activityInterval);

    if (activity) {
      activityCard.style.display = "flex";
      activityName.innerText = activity.name || "Activity";

      if (activity.timestamps && activity.timestamps.start) {
        const start = activity.timestamps.start;

        function updateTime() {
          const now = Date.now();
          const diff = Math.floor((now - start) / 1000);

          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;

          activityDesc.innerText =
            `${minutes}:${seconds.toString().padStart(2, "0")} elapsed`;
        }

        updateTime();
        activityInterval = setInterval(updateTime, 1000);
      } else if (activity.details || activity.state) {
        activityDesc.innerText =
          (activity.details || "") +
          (activity.state ? " • " + activity.state : "");
      } else {
        activityDesc.innerText = "Active now";
      }

    } else {
      activityCard.style.display = "flex";
      activityName.innerText = "Just Chilling";
      activityDesc.innerText = "No current activity";
    }

  } catch (e) {
    console.error("Failed to load Discord data");
  }
}

const header = document.getElementById("siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 8);
});

const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

menuToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
  menuToggle.classList.toggle("active");

  const expanded = siteNav.classList.contains("open");
  menuToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
});

siteNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const socialLinks = document.querySelectorAll(".icons a");

socialLinks.forEach(link => {
  link.addEventListener("click", () => {
    setTimeout(() => link.blur(), 0);
  });

  link.addEventListener("mouseup", () => link.blur());
  link.addEventListener("touchend", () => link.blur());
});

window.addEventListener("pageshow", () => {
  socialLinks.forEach(link => link.blur());
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    socialLinks.forEach(link => link.blur());
  }
});

document.addEventListener("contextmenu", function(e) {
  if (e.target.tagName === "IMG" && !e.target.closest(".logo")) {
    e.preventDefault();
  }
});

document.querySelectorAll("img").forEach(img => {
  if (img.closest(".logo")) return;

  img.addEventListener("dragstart", e => e.preventDefault());
  img.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  img.addEventListener("mousedown", e => {
    if (e.button === 2) e.preventDefault();
  });
});

loadDiscord();
setInterval(loadDiscord, 30000);

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});