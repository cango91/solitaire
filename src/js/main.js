import Card from './modules/card.js';
import { Waste, Deck, Tableau, Foundation } from './modules/piles.js';
import Solitaire from './modules/solitaire.js';
import Renderer from './modules/renderer.js';

//---- DOM REFERENCES ----//
const gameArea = document.querySelector('.game-container');
const deckSlot = document.getElementById('deck-slot');
const wasteSlot = document.getElementById('waste-slot');
const scoreboardElement = document.getElementById('scoreboard');
const foundations = [];
const tableaux = [];
document.querySelectorAll('.tableau').forEach(tab => tableaux.push(tab));
document.querySelectorAll('.foundation').forEach(foundation => foundations.push(foundation));

// let's sort them just to be safe, I don't know if querySelectorAll guarantees ordering as they appear in document - though it probably does since tree structure
tableaux.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));
foundations.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));

gameArea.addEventListener('drag',(evt)=>{
    console.log(evt);
})

const renderer = new Renderer();
renderer.initializeGameDOM(
    {
        deckElement: deckSlot,
        wasteElement: wasteSlot,
        foundationElements: foundations,
        tableauxElements: tableaux
    });
renderer.startRendering();


//---- DEBUGGING -----//
window.Card = Card;
window.Waste = Waste;
window.Deck = Deck;
window.Tableau = Tableau;
window.Foundation = Foundation;
window.Solitaire = Solitaire;
window.Renderer = Renderer;
window.renderer = renderer;
window.references = { deckSlot, wasteSlot, foundations, tableaux };