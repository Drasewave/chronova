/**
 * Script exécuté avant le premier rendu, en tête de <body>.
 *
 * Il décide si le rideau d'entrée doit s'afficher AVANT que le navigateur ne
 * peigne quoi que ce soit : pas de clignotement de la page d'accueil à la
 * première visite, pas de rideau fantôme aux visites suivantes.
 *
 * Le rideau est caché par défaut (`.intro-curtain` dans globals.css) : sans
 * JavaScript, ou si ce script échoue, la page est simplement là. Quand le
 * rideau doit jouer, le script l'affiche et retarde l'entrée du héros
 * (`--entree-retard`) pour qu'elle commence sous le volet qui se lève.
 *
 * Il n'écrit aucun attribut sur <html> ni sur <body> : React gère ces nœuds et
 * signalerait une différence entre le rendu serveur et le rendu client. Il
 * injecte une feuille de style et pose un indicateur global, deux choses que
 * l'hydratation ignore.
 */

/** Attribut qui marque la feuille injectée ; `IntroCurtain` la vide en sortant. */
export const INTRO_STYLE_SELECTOR = 'style[data-chronova="intro"]';

/** Instant où le héros commence son entrée, sous le volet (voir globals.css). */
const RETARD_HEROS_MS = 1000;

export const INTRO_BOOT = `(function(){
var off=true;
try{
  var vu=sessionStorage.getItem("chronova:intro")==="vu";
  var calme=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  off=vu||calme;
}catch(e){off=true;}
if(off){window.__chronovaIntro="off";return;}
var s=document.createElement("style");
s.setAttribute("data-chronova","intro");
s.textContent=".intro-curtain{display:grid!important}:root{--entree-retard:${RETARD_HEROS_MS}ms}";
document.head.appendChild(s);
})();`;
