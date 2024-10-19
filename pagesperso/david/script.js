const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const img = new Image();
img.src = "portrait.png"; // Remplace avec le chemin vers ton image

// Charger le son et configurer la répétition en boucle
let vent = new Audio("vent.mp3");
vent.loop = true; // Permet de jouer le son en boucle
vent.volume = 0.5; // Ajuste le volume si nécessaire (entre 0 et 1)

function playSound() {
  vent
    .play()
    .then(() => {
      console.log("Le son a démarré avec succès !");
    })
    .catch((error) => {
      console.log("Erreur lors de la lecture du son :", error);
    });
}
// Ajoute un écouteur de clic pour démarrer le son
document.addEventListener("click", function startAudio() {
  playSound();
  // Retire l'écouteur après le premier clic
  document.removeEventListener("click", startAudio);
});

// Charger le son du clic gauche
let clickSound = new Audio("tictac.mp3"); // Au clic
clickSound.volume = 0.8;

// Jouer les 3 premières secondes du son
function playClickSound() {
  clickSound.currentTime = 0; // Revenir au début du son
  clickSound
    .play()
    .then(() => {
      setTimeout(() => {
        clickSound.pause();
        clickSound.currentTime = 0; // Réinitialiser à 0 pour le prochain clic
      }, 3000); // Stopper après 3 secondes
    })
    .catch((error) => {
      console.log("Erreur lors de la lecture du son du clic :", error);
    });
}

// Charger le son du clic gauche
let rightclickSound = new Audio("radio.mp3"); // Au clic
rightclickSound.volume = 0.8;

// Jouer les 3 premières secondes du son
function playRightClickSound() {
  rightclickSound.currentTime = 0; // Revenir au début du son
  rightclickSound
    .play()
    .then(() => {
      setTimeout(() => {
        rightclickSound.pause();
        rightclickSound.currentTime = 0; // Réinitialiser à 0 pour le prochain clic
      }, 3000); // Stopper après 3 secondes
    })
    .catch((error) => {
      console.log("Erreur lors de la lecture du son du clic :", error);
    });
}

let boomSound = new Audio("tir.mp3");
boomSound.volume = 1.0;
// Variables pour gérer les clics et le combo
let leftClickCount = 0;
let rightClickCount = 0;
let comboTimeout;

function playBoomSound() {
  stopAllSounds();
  boomSound.currentTime = 0;
  boomSound.play().catch((error) => {
    console.log("Erreur lors de la lecture du son BOUM :", error);
  });
}

function stopAllSounds() {
  vent.pause();
  vent.currentTime = 0;
  clickSound.pause();
  clickSound.currentTime = 0;
  rightclickSound.pause();
  rightclickSound.currentTime = 0;
}

// Fonction pour redémarrer le son du vent après la désintégration
function restartSound() {
  setTimeout(() => {
    playSound();
  }, 1000); // Relance le son après 1 seconde
}

function startDisintegration() {
  let disintegrationProgress = 0;

  function disintegrate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Réduire progressivement la taille de l'image
    const scale = 1 - disintegrationProgress / 100;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = canvas.width / 2 - scaledWidth / 2;
    const y = canvas.height / 2 - scaledHeight / 2;
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    disintegrationProgress += 1;

    // Terminer la désintégration quand l'image disparaît complètement
    if (disintegrationProgress <= 100) {
      requestAnimationFrame(disintegrate);
    } else {
      restartSound(); // Redémarre le son après la désintégration
    }
  }

  disintegrate();
}

// Gérer le combo de clics
function handleLeftClick() {
  if (rightClickCount > 0) {
    resetCombo();
    return;
  }

  leftClickCount++;
  if (leftClickCount === 2) {
    startComboTimeout();
  }
}

function handleRightClick(e) {
  e.preventDefault();
  if (leftClickCount < 2) {
    resetCombo();
    return;
  }

  rightClickCount++;
  if (rightClickCount === 2) {
    triggerComboEvent();
  }
}

function startComboTimeout() {
  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(resetCombo, 5000); // Réinitialise si l'utilisateur prend trop de temps
}

function resetCombo() {
  leftClickCount = 0;
  rightClickCount = 0;
  clearTimeout(comboTimeout);
}

function triggerComboEvent() {
  resetCombo();
  playBoomSound();
  startDisintegration();
}

let ripples = [];
let vortices = [];

img.onload = () => {
  const imgWidth = img.width;
  const imgHeight = img.height;
  const x = canvas.width / 2 - imgWidth / 2;
  const y = canvas.height / 2 - imgHeight / 2;

  function drawImage(xDeform, yDeform, colorOffset) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Applique une transformation de couleurs pour un effet psychédélique
    ctx.filter = `hue-rotate(${colorOffset}deg)`;
    ctx.drawImage(
      img,
      x - xDeform,
      y - yDeform,
      imgWidth + xDeform * 2,
      imgHeight + yDeform * 2
    );
    ctx.filter = "none";
  }

  function drawRipples() {
    ripples.forEach((ripple, index) => {
      for (let i = 0; i < ripple.waveCount; i++) {
        ctx.beginPath();
        const currentRadius = ripple.radius + i * ripple.spacing;
        ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha - i * 0.05})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }

      ripple.radius += 2;
      ripple.alpha -= 0.01;

      if (ripple.alpha <= 0) {
        ripples.splice(index, 1);
      }
    });
  }

  function drawVortices() {
    vortices.forEach((vortex, index) => {
      ctx.save();
      ctx.translate(vortex.x, vortex.y);
      ctx.rotate(vortex.angle);

      ctx.beginPath();
      for (let i = 0; i < vortex.spiralCount; i++) {
        const angle = i * (Math.PI / 12);
        const length = i * 5;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      }
      ctx.strokeStyle = `rgba(255, 0, 255, ${vortex.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      vortex.angle += 0.1;
      vortex.alpha -= 0.01;

      if (vortex.alpha <= 0) {
        vortices.splice(index, 1);
      }
    });
  }

  canvas.addEventListener("click", (e) => {
    playClickSound();
    handleLeftClick();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    ripples.push({
      x: mouseX,
      y: mouseY,
      radius: 0,
      alpha: 1,
      waveCount: 5,
      spacing: 10,
    });
  });

  canvas.addEventListener("contextmenu", handleRightClick);

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // Empêche le menu contextuel par défaut du navigateur
    playRightClickSound();

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    vortices.push({
      x: mouseX,
      y: mouseY,
      angle: 0,
      alpha: 1,
      spiralCount: 12,
    });
  });

  let colorOffset = 0;

  canvas.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const xDeform = (mouseX - canvas.width / 2) / 10;
    const yDeform = (mouseY - canvas.height / 2) / 10;

    colorOffset += 5;
    if (colorOffset >= 360) colorOffset = 0;

    drawImage(xDeform, yDeform, colorOffset);
  });

  let initialDeform = 0;
  function animate() {
    drawImage(initialDeform, initialDeform, colorOffset);
    drawRipples();
    drawVortices();
    initialDeform = Math.sin(Date.now() / 300) * 20;
    colorOffset += 2;
    if (colorOffset >= 360) colorOffset = 0;
    requestAnimationFrame(animate);
  }

  animate();
};

document.addEventListener("keydown", (e) => {
  console.log(`Touche appuyée : ${e.key}`);
  if (e.key === "a") {
    alert("L'utilisateur a appuyé sur 'a' !");
    // Ajouter ici l'action à effectuer quand 'a' est pressé
  } else if (e.key === "Escape") {
    stopAllSounds();
    // Ajouter une autre action pour la touche 'Entrée'
  }
});
