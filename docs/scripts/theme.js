// Toggle theme button
document.getElementById("toggle-theme").addEventListener("click", function() {
  const body = document.body;
  const currentTheme = body.classList.contains("dark") ? "dark" : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  body.classList.toggle("dark");
  document.cookie = `theme=${newTheme}; max-age=31536000; path=/`;
  document.getElementById("toggle-theme").textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
});

// Apply saved theme on page load
const savedTheme = getCookie("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  document.getElementById("toggle-theme").textContent = "Light Mode";
}