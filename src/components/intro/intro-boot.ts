/**
 * Script exécuté avant le premier rendu, en tête de <body>.
 *
 * Il décide si le rideau d'entrée doit s'afficher AVANT que le navigateur ne
 * peigne quoi que ce soit : pas de clignotement de la page d'accueil à la
 * première visite, pas de rideau fantôme aux visites suivantes.
 *
 * Il n'écrit aucun attribut sur <html> ni sur <body> : React gère ces nœuds et
 * signalerait une différence entre le rendu serveur et le rendu client. Il
 * injecte une feuille de style et pose un indicateur global, deux choses que
 * l'hydratation ignore.
 */
export const INTRO_BOOT = `(function(){
var off=true;
try{
  var vu=sessionStorage.getItem("chronova:intro")==="vu";
  var calme=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  off=vu||calme;
}catch(e){off=true;}
if(!off)return;
window.__chronovaIntro="off";
var s=document.createElement("style");
s.setAttribute("data-chronova","intro");
s.textContent=".intro-curtain{display:none!important}";
document.head.appendChild(s);
})();`;
