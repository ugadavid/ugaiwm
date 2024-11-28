// Initialiser Shepherd avec l'effet de voile gris (modal overlay)
const tour = new Shepherd.Tour({
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'class-name-override',
    scrollTo: { behavior: 'smooth', block: 'center' },
    highlightElement: true, // Mettre en avant l'élément sélectionné
    modalOverlayOpeningPadding: 10, // Espace autour de l'élément mis en avant
    modalOverlayOpeningRadius: 5,  // Bordures arrondies
  },
  useModalOverlay: true // Active le voile gris sur le reste de la page
});

// Ajouter les étapes avec focus et voile
tour.addStep({
  title: 'Étape 1',
  text: "Bienvenue sur Suricate 360 !<br/>Accès aux pages perso d'Anas",
  attachTo: {
    element: '#step-1',
    on: 'bottom'
  },
  buttons: [
    {
      text: 'Suivant',
      action: tour.next
    }
  ]
});

tour.addStep({
  title: 'Étape 2',
  text: "Accès aux pages perso de Serge-Patrice<br/>C'est du sérieux !",
  attachTo: {
    element: '#step-2',
    on: 'right'
  },
  buttons: [
    {
      text: 'Précédent',
      action: tour.back
    },
    {
      text: 'Suivant',
      action: tour.next
    }
  ]
});

tour.addStep({
  title: 'Étape 3',
  text: "Accès aux pages perso de David<br/>Attention déjanté ! :D",
  attachTo: {
    element: '#step-3',
    on: 'left'
  },
  buttons: [
    {
      text: 'Terminer',
      action: tour.complete
    }
  ]
});

// Démarrer le tutoriel au clic
document.getElementById('start-tour').addEventListener('click', function() {
  tour.start();
});