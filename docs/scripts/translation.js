// Function to load JSON translation
async function loadTranslation(language) {
  try {
      const response = await fetch(`lang/${language}.json`);
      const translations = await response.json();

      if (document.getElementById("welcome-message")) {
          document.getElementById("welcome-message").textContent = translations.welcome_message;
      }
      if (document.getElementById("description-1")) {
          document.getElementById("description-1").textContent = translations.description_1;
      }
      if (document.getElementById("description-2")) {
          document.getElementById("description-2").textContent = translations.description_2;
      }
      if (document.getElementById("search-input")) {
          document.getElementById("search-input").setAttribute("placeholder", translations.search_placeholder);
      }
      if (document.getElementById("toggle-theme")) {
          document.getElementById("toggle-theme").textContent = document.body.classList.contains("dark")
              ? translations.light_mode
              : translations.dark_mode;
      }

      // Store language preference in a cookie
      document.cookie = `language=${language}; max-age=31536000; path=/`;
      } catch (error) {
          console.error("Error loading translation:", error);
      }
  }


  // Load saved language or default to 'en'
  const savedLanguage = getCookie("language") || "en";
  loadTranslation(savedLanguage);

  // Event listener for language change
  document.getElementById("language-selector").addEventListener("change", function() {
      loadTranslation(this.value);
  });