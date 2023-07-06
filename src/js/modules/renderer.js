import eventSystem from "./eventSystem.js";
import { Pile, Waste, Tableau, Foundation, Deck } from './piles.js'

// Define flipping animation duration in ms, should match CSS
let FLIP_DURATION = 150;
// Define card deal speed in px/sec
let MOVE_SPEED = 10000;
// Define how long it takes to move pile from waste to deck in ms
let WASTE_DURATION = 100;

export default class Renderer {
    constructor({
        enableAnimations = true,
        animationSpeeds = {} = {
            flipDuration: FLIP_DURATION,
            moveSpeed: MOVE_SPEED,
            wasteDuration: WASTE_DURATION
        } } = {}) {
        this.enableAnimations = enableAnimations;
        this.animationSpeeds = animationSpeeds;

        this.gameDOM = {};
        this.gameDOM.tableauxElements = [];
        this.gameDOM.foundationElements = [];

        this.configureSettings = this.configureSettings.bind(this);
        this.removeAllChildren = this.removeAllChildren.bind(this);
        this.initializeGameDOM = this.initializeGameDOM.bind(this);
        this.clearDOM = this.clearDOM.bind(this);
        this.attachListeners = this.attachListeners.bind(this);
        this.renderInitialState = this.renderInitialState.bind(this);
        this.getDOM = this.getDOM.bind(this);
        this.renderMoveCard = this.renderMoveCard.bind(this);
        this.renderFlipNCardsAtPile = this.renderFlipNCardsAtPile.bind(this);
        this.renderFlipTopCardAtPile = this.renderFlipTopCardAtPile.bind(this);
        this.renderFlipPile = this.renderFlipPile.bind(this);
    }

    configureSettings(
        {
            enableAnimations = true,
            animationSpeeds = {} = {
                flipDuration: FLIP_DURATION,
                dealSpeed: DEAL_SPEED,
                wasteDuration: WASTE_DURATION
            }
        } = {}) {
        this.enableAnimations = enableAnimations;
        this.animationSpeeds = animationSpeeds;
    }

    initializeGameDOM(
        {
            deckElement,
            wasteElement,
            foundationElements,
            tableauxElements,

        } = {}) {
        this.gameDOM.deckElement = deckElement;
        this.gameDOM.wasteElement = wasteElement;
        this.gameDOM.foundationElements = foundationElements;
        this.gameDOM.tableauxElements = tableauxElements;

    }

    startRendering() {
        this.clearDOM();
        this.clearListeners();
        this.attachListeners();
    }

    removeAllChildren(element) {
        for (const child of element.children) {
            child.remove;
        }
        element.innerHTML = "";
    }

    clearDOM() {
        this.removeAllChildren(this.gameDOM.deckElement);
        this.removeAllChildren(this.gameDOM.wasteElement);
        this.gameDOM.tableauxElements.forEach(tabEl => this.removeAllChildren(tabEl));
        this.gameDOM.foundationElements.forEach(foundEl => this.removeAllChildren(foundEl));
    }

    clearListeners() {
        eventSystem.remove('game-initialized');
        eventSystem.remove('move-card');
        eventSystem.remove('flip-top-card-at-pile');
    }

    attachListeners() {
        eventSystem.listen('game-initialized', this.renderInitialState);
        eventSystem.listen('move-card', this.renderMoveCard);
        eventSystem.listen('flip-top-card-at-pile', this.renderFlipTopCardAtPile);
    }

    renderInitialState({ deck, callback }) {
        return new Promise(res => {
            const reconstructedDeck = Deck.FromSnapshot(deck);
            for (const card of reconstructedDeck.stack) {
                this._addCard(this.gameDOM.deckElement, card, 'deck');
            }
            if (callback) callback();
            res();
        });
    }

    getDOM(pile) {
        const reconst = Pile.FromSnapshot(pile);
        switch (reconst.name) {
            case Deck.name:
                return this.gameDOM.deckElement;
            case Waste.name:
                return this.gameDOM.wasteElement;
            case Tableau.name:
                return this.gameDOM.tableauxElements[reconst.idx];
            case Foundation.name:
                return this.gameDOM.foundationElements[reconst.idx];
            default:
                throw new Error(`Invalid Pile name: ${reconst.name}, DOM element not found`);
        }
    }

    decorateCardWithPile(cardElement, pile, ...extraClasses) {
        let classDecoration;
        switch (Pile.FromSnapshot(pile).name) {
            case Deck.name:
                classDecoration = 'deck';
                break;
            case Waste.name:
                classDecoration = 'on-waste';
                break;
            case Tableau.name:
                classDecoration = 'on-tableau';
                break;
            case Foundation.name:
                classDecoration = 'on-foundation';
                break;
            default:
                classDecoration = '';
                break;
        }

        const classArray = Array.from(cardElement.classList);
        const removeArray = ['on-foundation', 'on-tableau', 'deck', 'on-waste'];
        if (classDecoration)
            removeArray.splice(removeArray.findIndex(cls => cls === classDecoration), 1);
        const classDecorations = classArray.filter(cls => !removeArray.includes(cls));
        if (classDecoration && !classDecorations.includes(classDecoration))
            classDecorations.push(classDecoration);
        cardElement.className = '';
        if (classDecorations.length || extraClasses.length)
            cardElement.classList.add(...classDecorations, ...extraClasses);
        return cardElement;
    }


    renderMoveCard({ card, fromPile, toPile, callback }) {
        const source = this.getDOM(fromPile);
        const target = this.getDOM(toPile);
        let cardEl = this._makeCardElement(card);
        const classArray = Array.from(cardEl.classList);
        cardEl = source.querySelector(`.${classArray.join('.')}:last-of-type`);
        if (this.enableAnimations) {
            return new Promise(res => {
                const toEl = target.childElementCount > 0 ? target.lastElementChild : target;
                this._animateMoveElement(cardEl, null, toEl, this.animationSpeeds.moveSpeed)
                    .then(() => {
                        target.append(cardEl);
                        this.decorateCardWithPile(cardEl, toPile);
                        callback();
                        res();
                    })
                    .catch(err => console.log(err));
            });
        } else {
            target.append(cardEl);
            this.decorateCardWithPile(cardEl, toPile);
            callback();
        }
    }

    renderFlipPile({ pile, callback }) {
        let numCards = Pile.FromSnapshot(pile).stack.length;
        return this.renderFlipNCardsAtPile({ pile, numCards, callback });
    }


    renderFlipTopCardAtPile({ pile, callback }) {
        return this.renderFlipNCardsAtPile({ pile, numCards: 1, callback });
    }

    renderFlipNCardsAtPile({ pile, numCards, callback }) {
        const pileElem = this.getDOM(pile);
        const stack = this._getCorrectPileState(pile).stack;
        const stackEl = pileElem.querySelectorAll(`.card:nth-last-child(-n+${numCards})`);
        const slice = stack.slice(-numCards);
        if (this.enableAnimations) {
            // use .map to  _animateFlipCard on all nodes of stackEl
            // return a promise that resolves when all _animateFlipCard promises are resolved
            const animations = Array.from(stackEl).map((element, index) => {
                return this._animateFlipCard(element, slice[index], this.animationSpeeds.flipDuration);
            });
            return Promise.all(animations).then(() => {
                callback();
            });
        } else {
            stackEl.forEach((card, idx) => {
                if (slice[idx].faceUp) {
                    card.classList.remove('back');
                    card.classList.add(slice[idx].cssClass);
                } else {
                    card.classList.add('back');
                    card.classList.remove(slice[idx].cssClass);
                }
                card.draggable = slice[idx].isDraggable
            });
            callback();
        }
    }

    _animateFlipCard(element, card, speed) {
        // 2 stages: first just rotate 90deg's
        // then rotate from -90 to 0 (because the cards are asymettrical, doing a 180deg turn creates a mirroring effect)
        let stage1 = [
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(90deg)' }
        ];
        let stage2 = [
            { transform: 'rotateY(-90deg)' },
            { transform: 'rotateY(0deg)' },
        ];
        let duration = speed / 2;
        let options = { duration };
        return new Promise(res=>{
            element.animate(stage1,options).onfinish = () =>{
                if(card.faceUp){
                    element.classList.remove('back');
                    element.classList.add(card.cssClass);
                }else{
                    element.classList.add('back');
                    element.classList.remove(card.cssClass);
                }
                element.animate(stage2,options).onfinish = () => res();
            }
        });
    }

    _getCorrectPileState(pile) {
        switch (Pile.FromSnapshot(pile).name) {
            case Deck.name:
                return Deck.FromSnapshot(pile);
            case Tableau.name:
                return Tableau.FromSnapshot(pile);
            case Foundation.name:
                return Foundation.FromSnapshot(pile);
            case Waste.name:
                return Waste.FromSnapshot(pile);
            default:
                return Pile.FromSnapshot(pile);
        }
    }



    _addCard(toElem, card, ...additional_class) {
        const cardEl = this._makeCardElement(card, ...additional_class);
        toElem.append(cardEl);
        return cardEl;
    }

    async _animateMoveElement(element, fromElement, toElement, speed) {
        const elementRect = element.getBoundingClientRect();
        const fromRect = fromElement ? fromElement.getBoundingClientRect() : elementRect;
        const toRect = toElement.getBoundingClientRect();
        let initialTop = fromRect.top;
        let initialLeft = fromRect.left;
        element.style.zIndex = 50;
        const deltaX = toRect.left - initialLeft;
        const deltaY = toRect.top - initialTop;
        let keyframes = [
            { transform: 'translate(0,0)' },
            { transform: `translate(${deltaX}px, ${deltaY}px)` }
        ];
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const duration = (distance / speed) * 1000; // convert to ms
        let options = { duration };
        await new Promise(res => {
            element.animate(keyframes, options).onfinish = () => {
                element.style = '';
                res();
            };
        });
    };

    _makeCardElement(card, ...additional_class) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card', 'large');
        if (card.faceUp) {
            cardEl.classList.add(card.cssClass);
        } else {
            cardEl.classList.add('back');
        }

        if (card.isDraggable) {
            cardEl.draggable = true;
        } else {
            cardEl.draggable = false;
        }
        if (additional_class.length) {
            cardEl.classList.add(...additional_class);
        }
        return cardEl;
    }
}