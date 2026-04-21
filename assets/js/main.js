document.addEventListener("DOMContentLoaded", () => {
  loadDiscord();
  connectLanyard();

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});