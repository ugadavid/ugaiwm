// Récupère tous les éléments des onglets
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Ajouter un gestionnaire d'événements pour chaque onglet
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Retirer l'état actif de tous les onglets
        tabs.forEach(t => t.classList.remove('active'));
        // Masquer tous les contenus d'onglets
        tabContents.forEach(content => content.classList.remove('active'));

        // Activer l'onglet cliqué
        tab.classList.add('active');
        // Afficher le contenu correspondant à l'onglet cliqué
        const target = tab.getAttribute('data-tab');
        document.getElementById(target).classList.add('active');
    });
});