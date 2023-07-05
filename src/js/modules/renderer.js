import eventSystem from "./eventSystem.js";
import { Pile, Waste, Tableau, Foundation, Deck } from './piles.js'

// Define flipping animation duration in ms, should match CSS
let FLIP_DURATION = 300;
// Define card deal speed in px/sec
let DEAL_SPEED = 10000;
// Define how long it takes to move pile from waste to deck in ms
let WASTE_DURATION = 100;

export default class Renderer {
    constructor({
        enableAnimations = true,
        animationSpeeds = {} = {
            flipDuration: FLIP_DURATION,
            dealSpeed: DEAL_SPEED,
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
        // eventSystem.listen('flip-top-card-at-pile');
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

    renderMoveCard({ card, fromPile, toPile, callback }) {
        const source = this.getDOM(fromPile);
        const target = this.getDOM(toPile);
        let cardEl = this._makeCardElement(card);
        const classArray = Array.from(cardEl.classList);
        cardEl = source.querySelector(`.${classArray.join('.')}:last-of-type`);
        callback();
    }

    _addCard(toElem, card, ...additional_class) {
        const cardEl = this._makeCardElement(card, ...additional_class);
        toElem.append(cardEl);
        return cardEl;
    }

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