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
const DEAL_SPEED = 10000;

/*---- CLASSES ----*/

// abstract class for undoable actions. Actions that can be undone should be encapsulated as commands
class Command {
    async execute() {
        throw new Error("Method 'execute' must be implemented");
    }
    async undo() {
        throw new Error("Method 'undo' must be implemented");
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

// Singleton pattern
class CommandHistory {
    constructor() {
        if (CommandHistory.instance)
            return CommandHistory.instance
        this.history = [];
        this.undoStack = [];
        CommandHistory.instance = this;
    }
    async executeCommand(command) {
        await command.execute();
        this.history.push(command);
        this.undoStack = [];
        new EventSystem().trigger('history-update', { history: this.history, undo: this.undoStack })
    }

    async undo() {
        if (this.history.length) {
            let command = this.history.pop();
            await command.undo();
            this.undoStack.push(command);
            new EventSystem().trigger('history-update', { history: this.history, undo: this.undoStack })
        }
    }

    async redo() {
        if (this.undoStack.length) {
            let command = this.undoStack.pop();
            await command.execute();
            this.history.push(command);
            new EventSystem().trigger('history-update', { history: this.history, undo: this.undoStack })
        }
    }

    clear() {
        this.history = [];
        this.undoStack = [];
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
    async collect(deck) {
        if (deck.stack.length)
            throw new Error(`Can't collect when deck's not empty!`);
        if (!this.stack.length)
            throw new Error(`No cards in waste pile to collect!`);
        await new CommandHistory().executeCommand(new CollectWastePile(this, deck));
    }

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
        if (this.stack.length !== 52)
            throw new Error(`Can't deal! Deck must have 52 cards at the beginning of the game`);
        // deal to each tableau i+1 cards in total
        for (let i = 0; i < tableaux.length; i++) {
            // deal starting from index i
            const t = tableaux.slice(i)
            for (const tableau of t) {
                tableau.addCard(this.removeTopCard());
                // wait for the 'card-dealt' event to complete before moving to the next tableau
                await new Promise(res => new EventSystem().trigger('card-dealt', { from: this, tableau: tableau, callback: res }));
            }
            // flip the card at tableau i: doing so without invoking a Command here, because this part is undoable! Any flip action resulting from a user moving the cards and revealing a face-down top-card on a slot should invoke Command!
            const card = tableaux[i].topCard;
            card.flip();
            // wait for the 'top-card-flipped' event to complete before moving to the next tableau
            new Promise(res => new EventSystem().trigger('top-card-flipped', { card: card, pile: tableaux[i], callback: res }));
        }
    }

    async hit(numHit, waste) {
        if (this.stack.length < 1)
            throw new Error(`Can't hit! Deck empty`);
        let numToRemove = Math.min(numHit, this.stack.length);
        await new CommandHistory().executeCommand(new HitCommand(this, waste, numToRemove));
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
        await new Promise(resolve => {
            new EventSystem().trigger('top-card-flipped', { card: this.card, pile: this.pile, callback: resolve });
        });
    }

    undo() {
        this.execute();
    }
}

// Command to 'hit' card(s) from deck to waste pile
class HitCommand extends Command {
    constructor(deck, waste, numHit) {
        super();
        this.deck = deck;
        this.waste = waste;
        this.numHit = numHit;
    }

    async execute() {
        let numToRemove = this.numHit;
        while (numToRemove) {
            let card = this.deck.removeTopCard();
            card.flip();
            this.waste.addCard(card);
            await new Promise(res => new EventSystem().trigger('card-dealt', { from: this.deck, tableau: this.waste, callback: res }));
            new Promise(res => new EventSystem().trigger('top-card-flipped', { card: card, pile: this.waste, callback: res }));
            numToRemove--;
        }
    }

    async undo() {
        let numToRemove = this.numHit;
        while (numToRemove) {
            let card = this.waste.removeTopCard();
            card.flip();
            this.deck.addCard(card);
            await new Promise(res => new EventSystem().trigger('card-dealt', { from: this.waste, tableau: this.deck, callback: res }));
            new Promise(res => new EventSystem().trigger('top-card-flipped', { card: card, pile: this.deck, callback: res }));
            numToRemove--;
        }
    }
}

// Command to collect waste pile and turn back into deck
class CollectWastePile extends Command {
    constructor(waste, deck) {
        super();
        this.waste = waste;
        this.deck = deck;
    }

    async execute() {
        while (this.waste.stack.length) {
            const card = this.waste.removeTopCard();
            card.flip();
            this.deck.addCard(card);
        }
        await new Promise(res => new EventSystem().trigger('waste-collected', { deck: this.deck, waste: this.waste, callback: res }));
    }

    async undo() {
        while (this.deck.stack.length) {
            const card = this.deck.removeTopCard();
            card.flip();
            this.waste.addCard(card);
        }
        await new Promise(res => new EventSystem().trigger('waste-collected', { deck: this.waste, waste: this.deck, callback: res }));
    }
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
        this.getFoundationDOM = this.getFoundationDOM.bind(this);
        this.getPileDOM = this.getPileDOM.bind(this);
        this.renderWasteCollected = this.renderWasteCollected.bind(this);
    }

    // initialize the DOM references, tableauxElements and foundationElements should be arrays that correspond to ltr order on the screen (leftmost should have index 0)
    initialize({ deckElement, wasteElement, foundationElements, tableauxElements, scoreElement, timerElement }) {
        this.DOM = { deckElement, wasteElement, foundationElements, tableauxElements, scoreElement };
        // add listeners for animations
        this.eventSystem.listen('card-dealt', this.renderCardDealt);
        this.eventSystem.listen('top-card-flipped', this.renderFlipCard);
        this.eventSystem.listen('waste-collected', this.renderWasteCollected);
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
        this.history.clear();
        // start accepting input
        this.enableInput();
    }

    disableInput() {
        this.acceptInput = false;
    }

    enableInput() {
        this.acceptInput = true;
    }

    async undo(){
        if(this.acceptInput && this.history.history.length){
            this.disableInput();
            await this.history.undo();
            this.enableInput();
        }
        return;
    }

    async redo(){
        if(this.acceptInput && this.history.undoStack.length){
            this.disableInput();
            await this.history.redo();
            this.enableInput();
        }
    }

    async beginGame() {

        // trigger game begun event
        this.eventSystem.trigger('game-begun', this.deck.stack);
        this.disableInput();
        // deal
        await this.deck.deal(this.tableaux);
        this.enableInput();
    }

    async handleClickEvent(evt) {
        if (!this.acceptInput) return;
        if (selfOrParentCheck(evt, '#deck-slot')) {
            if (this.deck.stack.length === 52) return this.beginGame();
            this.disableInput();
            try {
                await this.deck.hit(this.difficulty, this.waste);
                this.enableInput();
            } catch (error) {
                // deck is empty, we should check for win state and pre-win conditions
                if (this.checkPreWinConditions()) {
                    // enable fast-forward
                } else if (this.checkWinState()) {
                    // fire off game-ended and game-won event
                } else {
                    // collect pile and add it to deck (in reverse)
                    try {
                        await this.waste.collect(this.deck);
                        this.enableInput();
                    } catch (err) {
                        this.disableInput();
                    }
                }
            }
        }
        return;
    }

    handleDragEvent(evt) {

    }

    handleDropEvent(evt) {

    }

    checkWinState() {
        return false;
    }

    checkPreWinConditions() {
        return false;
    }

    getPileDOM(pile) {
        if (!pile instanceof Pile)
            throw new Error(`Not a Pile!`);
        if (pile === this.waste)
            return this.DOM.wasteElement;
        if (pile === this.deck)
            return this.DOM.deckElement
        let result;
        try {
            result = this.getTableauDOM(pile);
        } catch {
            result = this.getFoundationDOM(pile);
        } finally {
            if (result)
                return result;
            else
                throw new Error(`Pile not found!`);
        }
    }

    getTableauDOM(tableau) {
        return this.DOM.tableauxElements[this.tableaux.findIndex(tab => tab === tableau)];
    }

    getFoundationDOM(foundation) {
        return this.DOM.foundationElements[this.foundations.findIndex(found => found === foundation)];
    }

    getOnPileClassName(pile) {
        return pile instanceof Tableau ? 'on-tableau' : pile instanceof Waste ? 'on-waste' : pile instanceof Foundation ? 'on-foundation' : pile instanceof Deck ? 'deck' : '';
    }

    // animation functions.
    // A NOTE ON STYLE INCONSISTENY: 
    // I'd much prefer inconsistent styling here than explicit binding, which is VERY UGLY! ALSO VERY HARD TO DEBUG! SPENT HOURS BECAUSE I BOUND THE WRONG FUNCTION BY MISTAKE
    renderFlipCard({ card, pile, callback }) {
        const tableauEl = this.getPileDOM(pile);
        const cardEl = tableauEl.childElementCount > 1 ? tableauEl.querySelector('.card:last-child') : tableauEl.firstElementChild;
        let classToAdd, classToRemove;
        //if (cardEl.classList.contains('back')) {
        if (card.faceUp) {
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
        setTimeout(() => {
            cardEl.classList.remove(classToRemove);
            cardEl.classList.remove('flipping-first-half');
            cardEl.classList.add(classToAdd);
            cardEl.classList.add('flipping-second-half')
            setTimeout(() => {
                cardEl.classList.remove('flipping-second-half');
                callback();
            }, FLIP_DURATION / 2);
        }, FLIP_DURATION / 2);
    }

    async renderCardDealt({ from, tableau, callback }) {
        const source = this.getPileDOM(from);
        const card = source.childElementCount > 1 ? source.querySelector('.card:last-child') : source.firstElementChild;
        const tableauElement = this.getPileDOM(tableau);
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
        };
        const newCard = document.createElement('div');
        //let slotClass = tableau instanceof Tableau ? 'on-tableau' : tableau instanceof Waste ? 'on-waste' : tableau instanceof Foundation ? 'on-foundation' : 'deck';
        const slotClass = this.getOnPileClassName(tableau);
        newCard.classList.add('card', 'large', slotClass, 'back');
        card.animate(keyframes, options).onfinish = () => {
            source.removeChild(card);
            tableauElement.append(newCard);
            callback();
        };
    }

    async renderWasteCollected({ deck, waste, callback }) {
        const source = this.getPileDOM(waste);
        const target = this.getPileDOM(deck);
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const duration = 100;
        const options = { duration };
        let promises = [];
    
        const flipAndAnimateCards = () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    for (const card of source.children) {
                        card.classList.remove('flipping-second-half');
    
                        const keyframes = [
                            { transform: 'translate(0,0)' },
                            { transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px)` }
                        ];
    
                        const promise = new Promise((resolve) => {
                            const animation = card.animate(keyframes, options);
                            animation.onfinish = () => {
                                card.classList.remove(this.getOnPileClassName(waste));
                                card.classList.add(this.getOnPileClassName(deck));
                                target.append(card);
                                resolve(); // Resolve the promise once the animation is finished
                            };
                        });
    
                        promises.push(promise);
                    }
                    resolve();
                }, FLIP_DURATION / 2);
            });
        };
    
        const flipCards = (vals) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    if(!vals){
                        for (const card of source.children) {
                            card.className = '';
                            card.classList.add('card', 'large', 'back', 'flipping-second-half', this.getOnPileClassName(waste));
                        }
                    }else{
                        vals.forEach((card,idx)=>{
                            const cardEl = source.children[idx];
                            cardEl.classList.remove('back');
                            cardEl.classList.add(this.getOnPileClassName(deck),card.cssClass, 'flipping-second-half');
                        })
                    }
                    
    
                    resolve(flipAndAnimateCards());
                }, FLIP_DURATION / 2);
            });
        };
        
        if (!deck.stack[0].faceUp) {
            for (const card of source.children) {
                card.classList.add('flipping-first-half');
            }
            await flipCards();
        } else {
            // We're undoing a wasteCollection, and we need to know the ids of the cards.
            for (const card of target.children){
                card.classList.add('flipping-first-half')
            }
            await flipCards(deck.stack);
        }
    
        // Wait for all animations to finish before invoking the callback
        await Promise.all(promises);
        callback();
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
    'redo': document.getElementById('redo'),
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

// show beginning game message
// icebox feature: add game save/load and localStore settings loading here
solitaire.newGame({ gameMode: 'default', difficulty: 1 });

/*---- DOM EVENT LISTENERS ----*/

// setup listener to hide the beginning message and show new game button when game begun
msgbox.classList.add('show');

new EventSystem().listen('game-begun', () => {
    fadeInOutElement(msgbox);
    fadeInOutElement(newGameBtn);
});
new EventSystem().listen('game-ended', () => {
    fadeInOutElement(msgbox);
    fadeInOutElement(newGameBtn);
    fadeInOutElement(icons.undo, false, 100);
    fadeInOutElement(icons.redo, false, 100);
})

new EventSystem().listen('history-update', ({ history, undo }) => {
    if (history.length) {
        fadeInOutElement(icons.undo, true, 100);
    } else {
        fadeInOutElement(icons.undo, false, 100);
    }
    if (undo.length) {
        fadeInOutElement(icons.redo, true, 100);
    } else {
        fadeInOutElement(icons.redo, false, 100);
    }
})



// conveneince function for checking those pesky sub-elements that get clicked on all the time
function selfOrParentCheck(event, parentSelector) {
    return event.target.matches(`${parentSelector}, ${parentSelector} *`);
}

// delegated event listeners will further delegate to Solitaire class if one of the game icons are not the event targets
gameArea.addEventListener('click', async evt => {
    // console.log(evt.target);
    if (selfOrParentCheck(evt, '.icon')) {
        // we'll handle this here
        if (selfOrParentCheck(evt, '#undo')) {
            if (solitaire.history.history.length)
                await solitaire.undo();
        } else if (selfOrParentCheck(evt, "#redo")) {
            if (solitaire.history.undoStack.length)
                await solitaire.redo();
        }
    } else if (selfOrParentCheck(evt, 'button')) {
        // we'll handle this here
        if (selfOrParentCheck(evt, '#new-game') && solitaire.acceptInput) {
            new EventSystem().trigger('game-ended');
            return solitaire.newGame({ gameMode: 'default', difficulty: 1 });
        }
    } else {
        // we'll delegate
        await solitaire.handleClickEvent(evt);
        return;
    }
});