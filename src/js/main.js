
import Card, {Suit} from './card.js';

/* DEBUGGING TOOLS */
window.ConsoleObject = {}
window.ConsoleObject.Card = Card;
window.ConsoleObject.Suit = Suit;
window.ConsoleObject.makeCard = function (arg){
    return new Card(arg);
}
window.ConsoleObject.tryFlipping = function (card, cardClass, oldClass = 'back') {
    card.classList.add('flipping-first-half');
    setTimeout(function () {
        card.classList.remove(oldClass);
        card.classList.remove('flipping-first-half')
        card.classList.add(cardClass);
        card.classList.add('flipping-second-half')
        setTimeout(function () {
            card.classList.remove('flipping-second-half');
        }, 500);
    }, 250);
}

window.ConsoleObject.tryDealing = function (numTableau, speed = 2500, dealingFrom = '#deck-slot') { /* speed in px/sec */
    // get top card from deck
    const card = document.querySelector('.card.deck:last-child');
    const slot = document.querySelector(`${typeof numTableau === 'number' ? `#tableau-${numTableau}` : numTableau}`);
    const dealingSlot = document.querySelector(dealingFrom);
    let slotRect = slot.firstElementChild ? slot.lastElementChild.getBoundingClientRect() : slot.getBoundingClientRect();

    const cardRect = card.getBoundingClientRect();
    let initialTop = cardRect.top;
    let initialLeft = cardRect.left;

    // set the card's position to fixed and move it to the initial position
    card.style.position = 'fixed';
    card.style.top = `${initialTop}px`;
    card.style.left = `${initialLeft}px`;
    card.style.zIndex = 500;
    let keyframes = [
        // initial state (card's current position)
        { transform: 'translate(0, 0)' },
        // final state (offset from the card's position to the slot's position)
        { transform: `translate(${slotRect.left - initialLeft}px, ${slotRect.top - initialTop}px)` }
    ];

    let duration = Math.sqrt((slotRect.left - initialLeft) ** 2 + (slotRect.top - initialTop) ** 2) / speed * 1000;

    let options = {
        duration: duration,
        fill: 'forwards'
    };
    const newCard = document.createElement('div');
    newCard.classList.add('card', 'large', 'on-tableau', 'back');
    card.animate(keyframes, options).onfinish = () => {
        dealingSlot.removeChild(card);
        slot.append(newCard);
    };
    return newCard;
}

window.ConsoleObject.tryWaste = function (num = 1) {
    for (let i = 0; i < num; i++) {
        const card = window.ConsoleObject.tryDealing("#waste-slot");
        card.classList.remove('on-tableau');
        card.classList.add('on-waste');
        window.ConsoleObject.tryFlipping(card, 'dA');
    }
}