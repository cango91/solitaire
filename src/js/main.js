/* CONSTANTS */

// Define the suits
const SUITS = {
    CLUBS: { name: 'clubs', value: 0, symbol: '♣' },
    HEARTS: { name: 'hearts', value: 1, symbol: '♥' },
    SPADES: { name: 'spades', value: 2, symbol: '♠' },
    DIAMONDS: { name: 'diamonds', value: 3, symbol: '♦' }
};

// Define the face values as a simple object
const FACE_VALUES = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K'
};

/*---- CLASSES ----*/

class Card {
    constructor(value, suit) {
        // Check for valid value
        if (value < 1 || value > 13)
            throw new Error(`Invalid card value: ${value}`);

        // Check for valid suit
        suit = suit.toUpperCase();
        if (!SUITS.hasOwnProperty(suit)) {
            suit = Object.keys(SUITS).find(el => el.startsWith(suit));
            if (!SUITS.hasOwnProperty(suit))
                throw new Error(`Invalid suit: ${suit}`);
        }

        this.value = value;
        this.suit = SUITS[suit];
        // this.faceValue = this.value > 0 && this.value < 10 ? this.value : FACE_VALUES[this.value];
    }


    static fromInteger(val) {
        if (val < 0 || val > 51)
            throw new Error(`To create Card from a single integer, value(${val}) must be between 0 and 51`);
        return new Card((val >> 2) + 1, Object.keys(SUITS)[val & 3]);
    }

    static toInteger(card) {
        return ((card.value - 1) << 2 | card.suit.value);
    }

    static fromCssClass(cssClass) {
        let suit = cssClass.substring(0, 1).toUpperCase();
        let val = cssClass.substring(1);
        val = Number.isNaN(parseInt(val)) ? Object.keys(FACE_VALUES).find(key => FACE_VALUES[key] === val.toUpperCase()) : parseInt(val);
        return new Card(val, suit);
    }

    static toCssClass(card) {
        return `${card.suit.name[0]}${card.value in FACE_VALUES ? FACE_VALUES[card.value] : `${card.value}`.padStart(2, '0')}`;
    }

    toString() {
        let valString = this.value in FACE_VALUES ? FACE_VALUES[this.value] : `${this.value}`.padStart(2, '0');
        return `${this.suit.symbol}${valString}`;
    }

    get cssClass() {
        return Card.toCssClass(this);
    }
}


/* DEBUGGING */
window.ConsoleObject = {};
window.ConsoleObject.Card = Card;
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