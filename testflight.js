// ------------------------------------------------------------------
// ⚠️ LA SEULE VALEUR À CHANGER quand TestFlight sera ouvert.
//
// Lue par /beta et par /join : un seul endroit, pour que les deux pages ne
// puissent jamais pointer vers deux liens différents.
//
// Chaîne vide = pas encore de lien public. /beta affiche alors un bouton
// désactivé « Bientôt disponible sur iPhone », /join le bloc « Bientôt
// disponible sur iPhone ». Y mettre le lien public TestFlight suffit à basculer les
// deux pages, il n'y a rien d'autre à toucher.
// ------------------------------------------------------------------
var TESTFLIGHT_URL = "https://testflight.apple.com/join/K4SZFxFX";
