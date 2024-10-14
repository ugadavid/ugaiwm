// Initialiser Shepherd
const tour = new Shepherd.Tour({
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
    classes: 'class-name-override',
    scrollTo: { behavior: 'smooth', block: 'center' }
  }
});

// Ajouter les étapes
tour.addStep({
  title: 'Étape 1',
  text: 'Bienvenue sur Suricate 360 !',
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
  text: 'Voici où vous pouvez créer votre première leçon.',
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
  text: 'Cliquez ici pour prévisualiser votre cours.',
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