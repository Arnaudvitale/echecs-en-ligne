# Projet d'Échecs en ligne

Ce projet est une application web qui permet aux utilisateurs de jouer aux échecs en ligne.

## Structure du Projet

Voici une description de la structure de base du projet :

- **server.js** : C'est le fichier principal de notre application Node.js. Il configure notre serveur, les routes de notre application, la connexion à la base de données MongoDB et d'autres paramètres importants.

- **package.json** : Ce fichier contient des informations sur notre projet et les dépendances que nous avons installées.

- **package-lock.json** : Ce fichier est généré automatiquement par npm et contient un enregistrement précis des versions exactes des dépendances qui sont installées pour notre projet.

- **models/** : Ce dossier contient les définitions de nos modèles Mongoose qui nous permettent d'interagir avec notre base de données MongoDB :
    - **models/user.js** : Ce fichier contient la définition de notre modèle User.

- **routes/** : Ce dossier contient les définitions de nos routes Express. Chaque route est séparée dans son propre fichier, ce qui rend notre code plus modulaire et facile à gérer.

    - **routes/route.js** : Ce fichier contient les définitions de nos routes principales. Il contient également la définition de notre middleware d'authentification.

- **img/** : Ce dossier contient les images utilisées dans notre application.

- **public/** : Ce dossier contient les fichiers statiques qui seront servis par notre serveur. Voici une brève description de son contenu :

    - **public/index.html** : Le fichier HTML principal de notre application.
    - **public/chess.html** : Le fichier HTML de notre jeu d'échecs.
    - **public/chessPhone.html** : Le fichier HTML de notre jeu d'échecs pour mobile.
    - **public/js/app.js** : Notre code JavaScript côté client.
    - **public/js/log.js** : Redirection vers la page de connexion selon si l'utilisateur est sur mobile ou pc.

    - **public/css/style.css** : Nos styles CSS pour le jeu d'échecs sur pc.
    - **public/pc/** : Contient la page de connexion et d'inscription pour pc.
    - **public/phone/** : Contient la page de connexion et d'inscription pour mobile.

## Installation

Suivez ces étapes pour installer et exécuter le projet :

1. **Installer Node.js et npm :** [https://nodejs.org/](https://nodejs.org/).

2. **Installer les dépendances du projet :**

    Utilisez la commande `npm install` pour installer les dépendances du projet. npm lira le fichier `package.json` et installera tous les packages listés sous "dependencies".

    ```
    npm install
    ```

3. **Lancer le serveur :**

    Enfin, une fois que toutes les dépendances sont installées, vous pouvez lancer le serveur avec la commande `npm start`. Si vous avez configuré le script "start" dans votre `package.json`, il démarrera votre serveur Node.js. Si vous n'avez pas de script "start", vous pouvez démarrer votre serveur en exécutant directement votre fichier `server.js` avec Node.js, comme ceci :

    ```
    npm run app
    ```

Votre application devrait maintenant être en cours d'exécution et accessible à l'adresse [http://localhost:port](http://localhost:port), où "port" est le port sur lequel votre serveur est configuré pour écouter (par exemple, [http://localhost:8080](http://localhost:8080) si votre serveur écoute sur le port 8080).
