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
document.querySelectorAll('.tableau').forEach(tab => tableaux.push(tab));
document.querySelectorAll('.foundation').forEach(foundation => foundations.push(foundation));

// let's sort them just to be safe, I don't know if querySelectorAll guarantees ordering as they appear in document - though it probably does since tree structure
tableaux.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));
foundations.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));


// conveneince function for checking those pesky sub-elements that get clicked on all the time
function selfOrParentCheck(event, parentSelector) {
    return event.target.matches(`${parentSelector}, ${parentSelector} *`);
}

const renderer = new Renderer();
renderer.initializeGameDOM(
    {
        deckElement: deckSlot,
        wasteElement: wasteSlot,
        foundationElements: foundations,
        tableauxElements: tableaux
    });
renderer.startRendering();
renderer.configureSettings({ enableAnimations: false });
const solitaire = new Solitaire();
solitaire.initialize();

//---- CONTROLLER(S) ----//

// drag controllers
//but first, a utility function
function getChildIdx(parentElement, childElement) {
    return Array.from(parentElement.children).indexOf(childElement);
}

function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    }
}
// let lastX = 0, lastY = 0, el;;
// function dragHandler(evt) {
//     evt.preventDefault();
//     if (!el) el = document.getElementById('draggedElement');
//     if (el) {

//         // const newX = evt.clientX;
//         // const newY = evt.clientY;

//         // // Only update the position if it has actually changed
//         // if (newX !== lastX || newY !== lastY) {
//         //     lastX = newX;
//         //     lastY = newY;

//         // Request a frame to update the position
//         requestAnimationFrame(() => {
//             el.style.left = `${evt.clientX}px`;
//             el.style.top = `${evt.clientY}px`;
//         });
//     }

// }
// let el;
// function dragHandler(evt) {
//     evt.preventDefault();
//     //const el = gameArea.querySelector('#draggedElement');
//     if (!el) el = document.getElementById('draggedElement');
//     //console.log(el);
//     requestAnimationFrame(()=>{
//         el.style.left = `${evt.clientX}px`;
//         el.style.top = `${evt.clientY}px`;
//     });
// }


gameArea.addEventListener('dragstart', (evt) => {
    //evt.preventDefault();
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
        //evt.target.ondrag = throttle(dragHandler, 33);
        //evt.target.ondrag = throttle(dragHandler, 13);
    }
});



gameArea.addEventListener('dragend', (evt) => {
    console.log('drag end');
    evt.target.removeEventListener('drag', throttle(dragHandler, 33));
    //evt.target.removeEventListener('drag', throttle(dragHandler, 17));
    gameArea.removeChild(el);
    el = null;
});

// click controllers
gameArea.addEventListener('click', (evt) => {
    if (selfOrParentCheck(evt, '#deck-slot')) {
        //solitaire.onDeckHit();
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