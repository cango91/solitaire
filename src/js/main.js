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
solitaire.initialize({difficulty:1});

//---- CONTROLLER(S) ----//

let preventDragging = false;

eventSystem.listen('dealing-finished',()=>{
    preventDragging = false;
    //renderer.configureSettings({ enableAnimations: true });
});
eventSystem.listen('dealing',()=>{
    preventDragging = true;
})

// drag controllers
gameArea.addEventListener('dragstart', (evt) => {
    if(preventDragging) {
        evt.preventDefault();
        return;
    }
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
        evt.dataTransfer.effectAllowed = "move";
        preventDragging=true;
    }
});

gameArea.addEventListener('drag', (evt)=>{
    eventSystem.trigger('drag-update',{
        x: evt.clientX,
        y: evt.clientY
    })
});

document.addEventListener('dragover', (evt) => {
    evt.preventDefault();
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, ".tableau")
        || selfOrParentCheck(evt, '.on-tableau')
        || selfOrParentCheck(evt, '.on-foundation')) {
        eventSystem.trigger('drag-over-pile', {
            action: "controller",
            overPile: evt.target.parentNode.id ? evt.target.parentNode.id : evt.target.id, // if foundation or tableau is empty, i.e. has no children

            eventData: evt
        });
    }else{
        eventSystem.trigger('drag-over-bg');
    }
});

document.addEventListener('drop', (evt)=>{
    evt.preventDefault();
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, ".tableau")
        || selfOrParentCheck(evt, '.on-tableau')
        || selfOrParentCheck(evt, '.on-foundation')) {
            eventSystem.trigger('drop-over-pile',{
                action: "controller",
                onPile: evt.target.parentNode.id ? evt.target.parentNode.id : evt.target.id,
                eventData: evt
            });
        }else{
            eventSystem.trigger('drop-over-bg');
        }
});

document.addEventListener('dragend',evt=>{
    evt.preventDefault();
    preventDragging = false;
    if(evt.dataTransfer.dropEffect==="none"){
        eventSystem.trigger('drop-over-bg');
    }

})

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
window.setDragging = (val) => preventDragging = val;
