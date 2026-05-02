var LANGS = {
    en: {
        'about':             'About',
        'sign-in-tab':       'Sign In',
        'register-tab':      'Register',
        'username-ph':       'Username',
        'password-ph':       'Password',
        'sign-in-btn':       'Sign In',
        'register-btn':      'Register',
        'create-account-btn':'Create Account',
        'welcome-back-h':    'Welcome Back',
        'welcome-back-p':    'Already have an account?<br>Sign in and play.',
        'join-game-h':       'Join the Game',
        'join-game-p':       'No account yet?<br>Create one and start playing.',
        'guest-btn':         'Continue as Guest',
        'lobby-title':       'Chess Lobby',
        'active-games':      'Active Games',
        'new-game':          'New Game',
        'no-games':          'No active games.',
        'no-games-hint':     'Create one to start playing!',
        'no-games-hint-guest':'Games will appear here once created.',
        'slot-open':         'Open',
        'status-playing':    'In progress',
        'status-waiting':    'Waiting',
        'btn-enter':         'Enter',
        'logout':            'Logout',
        'choose-team':       'Choose Team',
        'white':             'White',
        'black':             'Black',
        'restart':           'Restart',
        'request':           'Request ',
        'move-history':      'Move History',
        'chat-title':        'Chat',
        'message-ph':        'Message\u2026',
        'moves-btn':         'Moves',
        'status-loading':    'Loading\u2026',
        'turn':              'Turn',
        'login-to-play':     'Login to play',
        'you-won':           'You won! Well played.',
        'you-lost':          'You lost. Better luck next time.',
        'draw':              'Game ended in a draw!',
        'wants-restart':     ' wants to restart. Accept?',
        'yes':               'Yes',
        'no':                'No',
        'restart-declined':  'Restart declined.',
        'king-check':        'King in check!',
        'game-over':         'Game over',
        'game-name-prompt':  'Name your game (leave blank for default):',
        'create-game-title': 'New Game',
        'create-game-ph':    'Game name (optional)',
        'cancel':            'Cancel',
        'create':            'Create',
        'preview-hint':      'Click anywhere to return to the game',
        'timer-option':      'Time control',
        'timer-none':        'No timer',
        'forfeit':           'Forfeit',
        'opponent-left':     ' disconnected.',
        'disconnected-choose': 'Restart the game or count it as a forfeit?'
    },
    fr: {
        'about':             '\u00c0 propos',
        'sign-in-tab':       'Connexion',
        'register-tab':      'S\'inscrire',
        'username-ph':       'Nom d\'utilisateur',
        'password-ph':       'Mot de passe',
        'sign-in-btn':       'Se connecter',
        'register-btn':      'S\'inscrire',
        'create-account-btn':'Cr\u00e9er un compte',
        'welcome-back-h':    'Bon retour',
        'welcome-back-p':    'D\u00e9j\u00e0 un compte\u00a0?<br>Connectez-vous et jouez.',
        'join-game-h':       'Rejoindre la partie',
        'join-game-p':       'Pas encore de compte\u00a0?<br>Cr\u00e9ez-en un et commencez.',
        'guest-btn':         'Continuer en tant qu\'invit\u00e9',
        'lobby-title':       'Salon des parties',
        'active-games':      'Parties actives',
        'new-game':          'Nouvelle partie',
        'no-games':          'Aucune partie active.',
        'no-games-hint':     'Cr\u00e9ez-en une pour commencer\u00a0!',
        'no-games-hint-guest':'Les parties appara\u00eetront ici une fois cr\u00e9\u00e9es.',
        'slot-open':         'Libre',
        'status-playing':    'En cours',
        'status-waiting':    'En attente',
        'btn-enter':         'Entrer',
        'logout':            'D\u00e9connexion',
        'choose-team':       '\u00c9quipe',
        'white':             'Blanc',
        'black':             'Noir',
        'restart':           'Recommencer',
        'request':           'Demander ',
        'move-history':      'Historique',
        'chat-title':        'Chat',
        'message-ph':        'Message\u2026',
        'moves-btn':         'Coups',
        'status-loading':    'Chargement\u2026',
        'turn':              'Tour',
        'login-to-play':     'Connectez-vous pour jouer',
        'you-won':           'Vous avez gagn\u00e9\u00a0! Bien jou\u00e9.',
        'you-lost':          'Vous avez perdu. Bonne chance la prochaine fois.',
        'draw':              'Partie nulle\u00a0!',
        'wants-restart':     ' veut recommencer. Accepter\u00a0?',
        'yes':               'Oui',
        'no':                'Non',
        'restart-declined':  'Recommencer refus\u00e9.',
        'king-check':        'Roi en \u00e9chec\u00a0!',
        'game-over':         'Partie termin\u00e9e',
        'game-name-prompt':  'Nommez votre partie (vide pour nom par d\u00e9faut)\u00a0:',
        'create-game-title': 'Nouvelle partie',
        'create-game-ph':    'Nom de la partie (facultatif)',
        'cancel':            'Annuler',
        'create':            'Cr\u00e9er',
        'preview-hint':      'Cliquez n\u2019importe o\u00f9 pour revenir \u00e0 la partie',
        'timer-option':      'Contr\u00f4le du temps',
        'timer-none':        'Sans minuterie',
        'forfeit':           'Forfait',
        'opponent-left':     ' s\u2019est d\u00e9connect\u00e9.',
        'disconnected-choose': 'Recommencer ou compter comme forfait\u00a0?'
    }
};

function getLang() {
    return localStorage.getItem('lang') || 'fr';
}

function t(key) {
    var lang = getLang();
    var v = LANGS[lang] && LANGS[lang][key] !== undefined ? LANGS[lang][key] : LANGS.en[key];
    return v !== undefined ? v : key;
}

function applyTranslations() {
    var lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var val = LANGS[lang] && LANGS[lang][key] !== undefined ? LANGS[lang][key] : LANGS.en[key];
        if (val !== undefined) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-ph');
        var val = LANGS[lang] && LANGS[lang][key] !== undefined ? LANGS[lang][key] : LANGS.en[key];
        if (val !== undefined) el.placeholder = val;
    });
    var btn = document.getElementById('lang-toggle');
    if (btn) {
        if (btn.tagName === 'IMG') {
            btn.src = lang === 'fr' ? 'https://flagcdn.com/fr.svg' : 'https://flagcdn.com/gb.svg';
            btn.alt = lang === 'fr' ? 'FR' : 'EN';
        } else {
            btn.textContent = lang === 'fr' ? '\uD83C\uDDEB\uD83C\uDDF7' : '\uD83C\uDDEC\uD83C\uDDE7';
        }
    }
}

function toggleLang() {
    localStorage.setItem('lang', getLang() === 'fr' ? 'en' : 'fr');
    applyTranslations();
    if (typeof onLangChange === 'function') onLangChange();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
    applyTranslations();
}
