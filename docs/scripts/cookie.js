"use strict";
// Function to get a cookie by name
function getCookie(name) {
  let cookieArr = document.cookie.split(";");
  for (let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");
      if (name === cookiePair[0].trim()) {
          return decodeURIComponent(cookiePair[1]);
      }
  }
  return null;
}

// Display cookie banner if consent is not given
if (!getCookie("userConsent")) {
  document.getElementById("cookie-banner").style.display = "block";
}

document.getElementById("accept-cookies").addEventListener("click", function() {
  document.getElementById("cookie-banner").style.display = "none";
  document.cookie = "userConsent=true; max-age=31536000; path=/";
  // Setting default values for language and theme
  document.cookie = "language=en; max-age=31536000; path=/";
  document.cookie = "theme=light; max-age=31536000; path=/";
});

// Modify cookie preferences link
document.getElementById("modify-cookies").addEventListener("click", function() {
  document.getElementById("cookie-banner").style.display = "block";
});