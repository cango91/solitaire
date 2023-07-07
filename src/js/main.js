import Card from './modules/card.js';
import { Waste, Deck, Tableau, Foundation, Pile } from './modules/piles.js';
import Solitaire from './modules/solitaire.js';
import Renderer from './modules/renderer.js';
import eventSystem from './modules/eventSystem.js';

//---- DOM REFERENCES ----//
const gameArea = document.querySelector('.game-container');
const deckSlot = document.getElementById('deck-slot');
const wasteSlot = document.getElementById('waste-slot');
const scoreboardElement = document.getElementById('scoreboard');
const foundations = [];
const tableaux = [];
const fakeDragDiv = document.getElementById('fake-drag');
document.querySelectorAll('.tableau').forEach(tab => tableaux.push(tab));
document.querySelectorAll('.foundation').forEach(foundation => foundations.push(foundation));

// let's sort them just to be safe, I don't know if querySelectorAll guarantees ordering as they appear in document - though it probably does since tree structure
tableaux.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));
foundations.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));


// conveneince function for checking those pesky sub-elements that get clicked on all the time
function selfOrParentCheck(event, parentSelector) {
    return event.target.matches(`${parentSelector}, ${parentSelector} *`);
}
// convenience function for getting an element's order amongst its siblings
function getChildIdx(parentElement, childElement) {
    return Array.from(parentElement.children).indexOf(childElement);
}


const renderer = new Renderer();
renderer.initializeGameDOM(
    {
        deckElement: deckSlot,
        wasteElement: wasteSlot,
        foundationElements: foundations,
        tableauxElements: tableaux,
        fakeDragDiv
    });
renderer.startRendering();
renderer.configureSettings({ enableAnimations: false });
const solitaire = new Solitaire();
solitaire.initialize();

//---- CONTROLLER(S) ----//

// let dragEl = document.createElement('div');
// dragEl.className = 'clone-pile';
// dragEl.style.transition = 'none';
// dragEl.style.position = 'fixed';
// dragEl.style.zIndex = 1000;
// let lastX = 0, lastY = 0;
// document.body.appendChild(dragEl);
// let fakeEl = document.createElement('div');

// fakeEl.appendChild(document.createTextNode(`&nbsp;`))
// //document.body.appendChild(fakeEl);
// //dragEl = document.querySelector('.clone-pile');
// // experimental
// fakeEl = document.getElementById('fake-drag');
// gameArea.addEventListener('dragstart', (evt) => {
//     if (selfOrParentCheck(evt, ".foundation")
//         || selfOrParentCheck(evt, "#waste-slot")
//         || selfOrParentCheck(evt, ".tableau")
//     ) {
//         //evt.preventDefault();
//         evt.dataTransfer.setDragImage(fakeEl, 99999, 0);
//         //evt.target.parentElement.removeChild(evt.target);
//         //dragEl.appendChild(evt.target);
//         const clone = evt.target.cloneNode(true);
//         clone.style.transition = "none";
//         dragEl.appendChild(clone);
//         evt.target.style.opacity = 0;
//         dragEl.style.top = evt.clientY;
//         dragEl.style.left = evt.clientX;
//         dragEl.style.opacity = 1;
//         lastX = evt.clientX;
//         lastY = evt.clientY;
//         evt.target.addEventListener('drag', dragHandler);
//     }
// });

// function dragHandler(evt) {
//     // console.log('at least we here');
//     // dragEl.style.left = evt.clientX + 'px';
//     // dragEl.style.top = evt.clientY + 'px';
//     //evt.preventDefault();
//     eventSystem.trigger('drag-update',{evt, dragEl});
// }




// drag controllers

function dragHandler(evt){
    evt.preventDefault();
    eventSystem.trigger('drag-update',{evt});
}

gameArea.addEventListener('dragstart', (evt) => {
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, "#waste-slot")
        || selfOrParentCheck(evt, ".tableau")
    ) {
        eventSystem.trigger('drag-start-card', {
            action: "controller",
            cardIdx: getChildIdx(evt.target.parentNode, evt.target),
            fromPile: evt.target.parentNode.id,
            eventData: evt
        });
        evt.target.addEventListener('drag',dragHandler);
    }
});

gameArea.addEventListener('dragover', (evt) => {
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, ".tableau")
        || selfOrParentCheck(evt, '.on-tableau')
        || selfOrParentCheck(evt, '.on-foundation')) {
        eventSystem.trigger('drag-over-pile', {
            action: "controller",
            overPile: evt.target.parentNode.id ? evt.target.parentNode.id : evt.target.id, // if foundation or tableau is empty, i.e. has no children
            eventData: evt
        });
    }
});

gameArea.addEventListener('dragend', (evt) => {

});

// click controllers
gameArea.addEventListener('click', (evt) => {
    if (selfOrParentCheck(evt, '#deck-slot')) {
        eventSystem.trigger('deck-hit', {});
    }
})



//---- DEBUGGING -----//
window.Card = Card;
window.Waste = Waste;
window.Deck = Deck;
window.Tableau = Tableau;
window.Foundation = Foundation;
window.Pile = Pile;
window.Solitaire = Solitaire;
window.Renderer = Renderer;
window.renderer = renderer;
window.references = { deckSlot, wasteSlot, foundations, tableaux };
window.solitaire = solitaire;