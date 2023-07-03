/*---- CONSTANTS ----*/

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

// Define flipping animation duration, better match CSS
const FLIP_DURATION = 300;
// Define card deal speed in px/sec
const DEAL_SPEED = 3000;

/*---- CLASSES ----*/

// abstract class for undoable actions. Actions that can be undone should be encapsulated as commands
class Command {
    execute() {
        throw new Error("Method 'execute' must be implemented");
    }
    undo() {
        throw new Error("Method 'undo' must be implemented");
    }
}

// Singleton pattern
class CommandHistory {
    constructor() {
        if (CommandHistory.instance)
            return CommandHistory.instance
        this.history = [];
        this.undoStack = [];
    }
    executeCommand(command) {
        command.execute();
        this.history.push(command);
        this.undoStack = [];
    }

    undo() {
        if (this.history.length) {
            let command = this.history.pop();
            command.undo();
            this.undoStack.push(command);
        }
    }

    redo() {
        if (this.undoStack.length) {
            let command = this.undoStack.pop();
            command.execute();
            this.history.push(command);
        }
    }
}

// Singleton pattern
// EventSystem is used to decouple game-logic from DOM manipulation. 
// Commands should notify the event system by triggering relevant events. 
// DOM manipulators should add listeners for their relevant events, perform DOM manipulation then callback. 
// Commands should use Promises to ensure DOM manipulation is complete before proceeding (i.e. provide their resolve as callback when triggering events).
class EventSystem {
    constructor() {
        if (EventSystem.instance) {
            return EventSystem.instance;
        }
        this.listeners = {};
        EventSystem.instance = this;
    }

    listen(eventName, callback) {
        if (!this.listeners[eventName])
            this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
    }

    trigger(eventName, eventData) {
        if (this.listeners[eventName])
            for (let callback of this.listeners[eventName]) {
                callback(eventData);
            }
    }
}

class Card {
    constructor(value, suit, faceUp = false) {
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
        this.faceUp = faceUp;
    }

    // Static methods to create Card objects in different ways than the constructor, also to convert back
    static fromInteger(val) {
        if (val < 0 || val > 51)
            throw new Error(`To create Card from a single integer, value(${val}) must be between 0 and 51`);
        return new Card((val >> 2) + 1, Object.keys(SUITS)[val & 3]);
    }

    static toInteger(card) {
        return ((card.value - 1) << 2 | card.suit.value);
    }

    static fromCssClass(cssClass) {
        let suit = cssClass.substring(0, 1);
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

    flip() {
        this.faceUp = !this.faceUp;
    }
}

class Pile {
    constructor() {
        this.stack = [];
    }

    removeTopCard() {
        return this.stack.pop();
    }

    addCard(card) {
        this.stack.push(card);
    }

    get topCard() {
        if (this.stack.length)
            return this.stack[this.stack.length - 1];
    }

}

class Tableau extends Pile {

}

class Foundation extends Pile {

}

class Waste extends Pile {

}

class Deck extends Pile {
    constructor() {
        super();
        // create 52 cards and store them
        for (let i = 0; i < 52; i++) {
            this.addCard(Card.fromInteger(i));
        }
        this.isShuffled = false;
    }

    shuffle() {
        let currentIndex = this.stack.length, tempValue, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            tempValue = this.stack[currentIndex];
            this.stack[currentIndex] = this.stack[randomIndex];
            this.stack[randomIndex] = tempValue;
        }
        this.isShuffled = true;
    }

    async deal(tableaux) {
        // deal to each tableau i+1 cards in total
        for (let i = 0; i < tableaux.length; i++) {
            // deal starting from index i
            const t = tableaux.slice(i)
            for (const tableau of t) {
                tableau.addCard(this.removeTopCard());
                // wait for the 'card-dealt' event to complete before moving to the next tableau
                await new Promise(res => new EventSystem().trigger('card-dealt', { tableau: tableau, callback: res }));
            }
            // flip the card at tableau i: doing so without invoking a Command here, because this part is undoable! Any flip action resulting from a user moving the cards and revealing a face-down top-card on a slot should invoke Command!
            const card = tableaux[i].topCard;
            card.flip();
            // wait for the 'top-card-flipped' event to complete before moving to the next tableau
            new Promise(res => new EventSystem().trigger('top-card-flipped', { card: card, pile: tableaux[i], callback: res }));
        }
    }

}



// Command to flip the single top card on a pile
class FlipTopCardCommand extends Command {
    constructor(card, pile) {
        super();
        this.card = card;
        this.pile = pile;
    }
    async execute() {
        this.pile.topCard.flip();
        return await new Promise(resolve => {
            new EventSystem().trigger('top-card-flipped', { card: this.card, pile: this.pile, callback: resolve });
        });
    }

    undo() {
        this.execute();
    }
}

// Command to 'hit' card(s) from deck to waste pile
class HitCommand extends Command {

}

// Command to collect waste pile and turn back into deck
class CollectWastePile extends Command {

}

// Command to move one or more cards from a pile to another
class MoveCards extends Command {

}

class Solitaire {
    constructor() {
        this.waste = new Waste();
        this.foundations = [];
        this.tableaux = [];
        this.history = new CommandHistory();
        this.eventSystem = new EventSystem();
        this.acceptInput = false;
        for (let i = 0, j = 0; i < 7; i++, j++) {
            if (j < 5)
                this.foundations.push(new Foundation());
            this.tableaux.push(new Tableau());
        }
        // BIND THIS MOFO! I HATE THIS I HATE THIS I HATE THIS I HATE THIS!!!!!!!!!!!!!!!!!
        // Javascript is just pretending to be Object Oriented -.-
        this.renderCardDealt = this.renderCardDealt.bind(this);
        this.renderFlipCard = this.renderFlipCard.bind(this);
        this.getTableauDOM = this.getTableauDOM.bind(this);
    }

    // initialize the DOM references, tableauxElements and foundationElements should be arrays that correspond to ltr order on the screen (leftmost should have index 0)
    initialize({ deckElement, wasteElement, foundationElements, tableauxElements, scoreElement, timerElement }) {
        this.DOM = { deckElement, wasteElement, foundationElements, tableauxElements, scoreElement };
        // add listeners for animations
        this.eventSystem.listen('card-dealt', this.renderCardDealt);
        this.eventSystem.listen('top-card-flipped', this.renderFlipCard);
    }

    newGame({ gameMode, difficulty }) {
        this.gameMode = gameMode;
        this.difficulty = difficulty;
        // Loop over all DOM elements, empty their children
        for (const key of Object.keys(this.DOM)) {
            const element = this.DOM[key];
            if (Array.isArray(element))
                element.forEach(subElement => subElement.innerHTML = "");
            else
                element.innerHTML = "";
        }
        // shuffle deck and add it to DOM
        this.deck = new Deck();
        this.deck.shuffle();
        this.deck.stack.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('card', 'large', 'deck', 'back');
            this.DOM.deckElement.append(cardEl);
        });
        // start accepting input
        this.enableInput();
    }

    disableInput() {
        this.acceptInput = false;
    }

    enableInput() {
        this.acceptInput = true;
    }

    async beginGame() {

        // trigger game begun event
        this.eventSystem.trigger('game-begun', this.deck.stack);
        this.disableInput();
        // deal
        await this.deck.deal(this.tableaux);
        this.enableInput();
    }

    handleClickEvent(evt) {
        if (selfOrParentCheck(evt, '#deck-slot')) {
            if (this.deck.stack.length === 52) return this.beginGame();
        }
    }

    handleDragEvent(evt) {

    }

    handleDropEvent(evt) {

    }

    getTableauDOM(tableau) {
        return this.DOM.tableauxElements[this.tableaux.findIndex(tab => tab === tableau)];
    }

    // animation functions.
    // A NOTE ON STYLE INCONSISTENY: 
    // I'd much prefer inconsistent styling here than explicit binding, which is VERY UGLY! ALSO VERY HARD TO DEBUG! SPENT HOURS BECAUSE I BOUND THE WRONG FUNCTION BY MISTAKE
    renderFlipCard({ card, pile, callback }) {
        const tableauEl = this.getTableauDOM(pile);
        const cardEl = tableauEl.childElementCount > 1 ? tableauEl.querySelector('.card:last-child') : tableauEl.firstElementChild;
        let classToAdd, classToRemove;
        if (cardEl.classList.contains('back')) {
            // we're flipping card face-up
            classToAdd = card.cssClass;
            classToRemove = 'back';
        } else {
            // we're flipping card face-down
            classToAdd = 'back';
            classToRemove = card.cssClass;
        }
        // begin animation
        cardEl.classList.add('flipping-first-half');
        setTimeout(function () {
            cardEl.classList.remove(classToRemove);
            cardEl.classList.remove('flipping-first-half');
            cardEl.classList.add(classToAdd);
            cardEl.classList.add('flipping-second-half')
            setTimeout(function () {
                cardEl.classList.remove('flipping-second-half');
                callback();
            }, FLIP_DURATION);
        }, FLIP_DURATION / 2);
    }

    renderCardDealt({ tableau, callback }) {
        const card = this.DOM.deckElement.childElementCount > 1 ? this.DOM.deckElement.querySelector('.card:last-child') : this.DOM.deckElement.firstElementChild;
        const tableauElement = this.getTableauDOM(tableau);
        // if the tableau is empty, use the slot's location, if not use the last child card's location as target
        const targetRect = tableauElement.childElementCount > 0 ? tableauElement.lastElementChild.getBoundingClientRect() : tableauElement.getBoundingClientRect();
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
            { transform: `translate(${targetRect.left - initialLeft}px, ${targetRect.top - initialTop}px)` }
        ];
        let duration = Math.sqrt((targetRect.left - initialLeft) ** 2 + (targetRect.top - initialTop) ** 2) / DEAL_SPEED * 1000;

        let options = {
            duration: duration,
            fill: 'forwards'
        };
        const newCard = document.createElement('div');
        newCard.classList.add('card', 'large', 'on-tableau', 'back');
        card.animate(keyframes, options).onfinish = () => {
            this.DOM.deckElement.removeChild(card);
            tableauElement.append(newCard);
            callback();
        };
    }



}

/*---- DOM REFERENCE VARIABLES ----*/

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

const gameArea = document.querySelector('.game-container');
const icons = {
    'game-options': document.getElementById('gme-options'),
    'about': document.getElementById('about'),
    'undo': document.getElementById('undo'),
    //    'redo': document.getElementById('redo'),    // REMINDER: ADD THIS ON HTML SIDE :)
};
const overlay = document.querySelector('.overlay');
const msgbox = document.querySelector('.message-box');
const newGameBtn = document.getElementById('new-game');


/* DOM MANIPULATION */
function fadeInOutElement(element, show = null, interval = 300) {
    if (!element) return;
    let hide = show === null ? element.classList.contains('show') : !show;
    if (hide) {
        element.style.opacity = 0;
        setTimeout(() => element.classList.remove('show'), interval);
    } else {
        element.classList.add('show');
        setTimeout(() => element.style.opacity = 1, interval);
    }
}

/*---- INITIALIZE GAME ----*/
const gameDOM = {
    deckElement: deckSlot,
    wasteElement: wasteSlot,
    foundationElements: foundations,
    tableauxElements: tableaux,
    scoreElement: scoreboardElement
}
let solitaire = new Solitaire();
solitaire.initialize(gameDOM);

// show beginning game message, hide new game button
// setup listener to hide the beginning message and show new game button when cards are dealt === game begun
msgbox.classList.add('show');

new EventSystem().listen('game-begun', () => {
    fadeInOutElement(msgbox);
    fadeInOutElement(newGameBtn);
});
new EventSystem().listen('game-ended', () => {
    fadeInOutElement(msgbox);
    fadeInOutElement(newGameBtn);
})
// icebox feature: add game save/load and localStore settings loading here
solitaire.newGame({ gameMode: 'default', difficulty: 1 });

/*---- DOM EVENT LISTENERS ----*/

// conveneince function for checking those pesky sub-elements that get clicked on all the time
function selfOrParentCheck(event, parentSelector) {
    return event.target.matches(`${parentSelector}, ${parentSelector} *`);
}

// delegated event listeners will further delegate to Solitaire class if one of the game icons are not the event targets
gameArea.addEventListener('click', evt => {
    // console.log(evt.target);
    if (selfOrParentCheck(evt, '.icon')) {
        // we'll handle this here
    } else if (selfOrParentCheck(evt, 'button')) {
        // we'll handle this here
        if (selfOrParentCheck(evt, '#new-game') && solitaire.acceptInput) {
            new EventSystem().trigger('game-ended');
            return solitaire.newGame({ gameMode: 'default', difficulty: 1 });
        }
    } else {
        // we'll delegate
        return solitaire.handleClickEvent(evt);
    }
});



/*---- DEBUGGING ----*/

window.ConsoleObject = {};
window.ConsoleObject.solitaire = solitaire;
window.ConsoleObject.vars = { tableaux, foundations };
window.ConsoleObject.fade = fadeInOutElement;
window.ConsoleObject.Card = Card;
window.ConsoleObject.Deck = Deck;
window.ConsoleObject.Commands = [FlipTopCardCommand];
window.ConsoleObject.History = new CommandHistory();
window.ConsoleObject.Tableau = Tableau;
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

window.ConsoleObject.tryDealing = function (numTableau, speed = 2500, dealingFrom = '#deck-slot', _card = null) { /* speed in px/sec */
    // get top card from deck
    const card = _card ? _card : document.querySelector('.card.deck:last-child');
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