// Liens du site, en source unique.
//
// ⚠️ DISCORD_URL : LA SEULE VALEUR À CHANGER quand le serveur Discord sera
// ouvert. Chaîne vide = pas encore de lien : le bloc communauté de l'accueil
// et le lien du pied de page ne sont pas affichés du tout (ni HTML, ni
// place réservée). Y mettre le lien d'invitation suffit à les faire
// apparaître au prochain build.
export const DISCORD_URL = "";

// Pendant la beta, tous les appels à l'action mènent ici. Au lancement
// public, les boutons deviendront des badges App Store et Play Store.
export const BETA_PATH = "/beta";

export const CONTACT_EMAIL = "contact@getbraiz.com";

// Android : le fichier de l'application, Release GitHub (lien stable, la
// dernière version). Environ 155 Mo.
export const APK_URL = "https://github.com/ItsK0PS/braiz-site/releases/latest/download/braiz.apk";

// iPhone : TestFlight sur l'App Store. Le lien de la beta elle-même,
// TESTFLIGHT_URL, reste dans public/testflight.js (source unique, lue aussi
// par /join au chargement).
export const TESTFLIGHT_STORE_URL = "https://apps.apple.com/app/testflight/id899247664";
