import Card from "./card.js";
import eventSystem from "./eventSystem.js";
import { Pile, Waste, Tableau, Foundation, Deck } from './piles.js'

// Define flipping animation duration in ms, should match CSS
let FLIP_DURATION = 150;
// Define card deal speed in px/sec
let MOVE_SPEED = 3000;
// Define how long it takes to move pile from waste to deck in ms
let WASTE_DURATION = 100;

export default class Renderer {
    constructor(settings = {}) {

        this.configureSettings(settings);
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
        this.renderMoveCards = this.renderMoveCards.bind(this);
        this.renderDragStartCard = this.renderDragStartCard.bind(this);
        this._renderDragStart = this._renderDragStart.bind(this);
        this._dragUpdate = this._dragUpdate.bind(this);
        this.renderValidDragOverPile = this.renderValidDragOverPile.bind(this);
        this.renderInvalidDragOverPile = this.renderInvalidDragOverPile.bind(this);
        this._removeDraggedFeedback = this._removeDraggedFeedback.bind(this);
        this._removeDragOverFeedback = this._removeDragOverFeedback.bind(this);
        this.removeAllFeedback = this.removeAllFeedback.bind(this);
        this.renderCancelDrag = this.renderCancelDrag.bind(this);

    }

    configureSettings(
        {
            enableAnimations = true,
            feedbackDragged = true,
            feedbackDragOver = true,
            animationSpeeds = {} = {
                flipDuration: FLIP_DURATION,
                moveSpeed: MOVE_SPEED,
                wasteDuration: WASTE_DURATION
            }
        } = {}) {
        this.enableAnimations = enableAnimations;
        this.animationSpeeds = animationSpeeds;
        this.feedbackDragOver = feedbackDragOver;
        this.feedbackDragged = feedbackDragged;
    }

    initializeGameDOM(
        {
            deckElement,
            wasteElement,
            foundationElements,
            tableauxElements,
            fakeDragDiv

        } = {}) {
        this.gameDOM.deckElement = deckElement;
        this.gameDOM.wasteElement = wasteElement;
        this.gameDOM.foundationElements = foundationElements;
        this.gameDOM.tableauxElements = tableauxElements;
        this.gameDOM.fakeDragDiv = fakeDragDiv;
        this.gameDOM.dragElement = null;
        this.gameDOM.lastPaintedFeedack = null;
        this.gameDOM.draggedFromPile = null;
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
        eventSystem.remove('game-initialized', this.renderInitialState);
        eventSystem.remove('move-card', this.renderMoveCard);
        eventSystem.remove('move-cards', this.renderMoveCards);
        eventSystem.remove('flip-top-card-at-pile', this.renderFlipTopCardAtPile);
        eventSystem.remove('flip-top-n-cards-at-pile', this.renderFlipNCardsAtPile);
        eventSystem.remove('flip-pile', this.renderFlipPile);
        eventSystem.remove('validated-drag-start-card', this.renderDragStartCard);
        eventSystem.remove('validated-drag-start-pile', this.renderDragStartPile);
        eventSystem.remove('valid-drag-over-pile', this.renderValidDragOverPile);
        eventSystem.remove('invalid-drag-over-pile', this.renderInvalidDragOverPile);
        eventSystem.remove('drag-update', this._dragUpdate);
        eventSystem.remove('drag-over-bg', this.removeAllFeedback)
        eventSystem.remove('drop-over-bg',this.renderCancelDrag);

    }

    attachListeners() {
        eventSystem.listen('game-initialized', this.renderInitialState);
        eventSystem.listen('move-card', this.renderMoveCard);
        eventSystem.listen('move-cards', this.renderMoveCards);
        eventSystem.listen('flip-top-card-at-pile', this.renderFlipTopCardAtPile);
        eventSystem.listen('flip-top-n-cards-at-pile', this.renderFlipNCardsAtPile);
        eventSystem.listen('flip-pile', this.renderFlipPile);
        eventSystem.listen('validated-drag-start-card', this.renderDragStartCard);
        eventSystem.listen('validated-drag-start-pile', this.renderDragStartPile);
        eventSystem.listen('valid-drag-over-pile', this.renderValidDragOverPile);
        eventSystem.listen('invalid-drag-over-pile', this.renderInvalidDragOverPile);
        eventSystem.listen('drag-update', this._dragUpdate);
        eventSystem.listen('drag-over-bg', this.removeAllFeedback)
        eventSystem.listen('drop-over-bg',this.renderCancelDrag);

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

    removeAllFeedback(){
        this._removeDragOverFeedback();
        this._removeDraggedFeedback();
    }

    renderValidDragOverPile(data) {
        this._repaintDraggedImage('valid');
        this._repaintDragoverPiles('valid', data);
    }

    renderInvalidDragOverPile(data) {
        this._repaintDraggedImage('invalid');
        this._repaintDragoverPiles('invalid',data);
    }

    renderDragStartCard(data) {
        this._renderDragStart(data);
    }

    renderDragStartPile(data) {
        this._renderDragStart(data);
    }

    async renderCancelDrag(){
        this.removeAllFeedback();
        this.gameDOM.lastPaintedFeedack = null;
        if(this.enableAnimations){

        }else{
            document.body.removeChild(this.gameDOM.dragElement);
            this.gameDOM.dragElement = null;
            this.gameDOM.fakeDragDiv.draggable = false;
            for(let child of this.gameDOM.draggedFromPile.children){
                child.style.opacity = 1;
            }
            this.gameDOM.draggedFromPile = null;
        }
    }

    _renderDragStart({ card, fromPile, cardIdx, evt }) {
        const pileDOM = this.getDOM(fromPile);
        this.gameDOM.draggedFromPile = pileDOM;
        this.gameDOM.fakeDragDiv.draggable = true;
        evt.dataTransfer.setDragImage(this.gameDOM.fakeDragDiv, 0, 0);
        const pileContainer = document.createElement('div');
        pileContainer.draggable = false;
        pileContainer.style.position = 'fixed';
        pileContainer.style.transition = 'none';
        pileContainer.className = 'clone-pile';
        pileContainer.style.left = `${evt.clientX - 65}px`;
        pileContainer.style.top = `${evt.clientY - 59}px`;
        const pileOfCards = Array.from(pileDOM.children).slice(cardIdx);
        pileOfCards.forEach((c, idx) => {
            const clone = c.cloneNode(true);
            if (this.feedbackDragged) {
                clone.classList.add('dragged');
                if (idx === 0)
                    clone.classList.add('pile-head');
                if (idx === pileOfCards.length - 1)
                    clone.classList.add('pile-end');
            }
            c.style.opacity = 0;
            clone.classList.remove('on-tableau');
            clone.classList.remove('on-waste');
            clone.classList.remove('on-foundation');
            clone.classList.add('on-tableau');
            clone.draggable = false;
            pileContainer.appendChild(clone);
        });
        document.body.appendChild(pileContainer);
        this.gameDOM.dragElement = pileContainer;
    }


    // renderDragStartCard({ card, fromPile, cardIdx, evt }) {
    //     const pileDOM = this.getDOM(fromPile);
    //     const draggedCard = this._makeCardElement(Card.FromSnapshot(card), 'dragged', 'pile-head', 'pile-end');
    //     const cardToHide = Array.from(pileDOM.children)[cardIdx];
    //     cardToHide.style.opacity = 0;
    //     draggedCard.style.position = 'fixed';
    //     draggedCard.style.pointerEvents = 'none';
    //     draggedCard.style.zIndex = '1000';
    //     draggedCard.style.left = `calc(${evt.clientX}px - 2em)`;
    //     draggedCard.style.top = `calc(${evt.clientY}px - 2.25em)`;
    //     document.body.appendChild(draggedCard);
    //     let rect = draggedCard.getBoundingClientRect();
    //     evt.dataTransfer.setDragImage(draggedCard, evt.clientX - rect.left, evt.clientY - rect.top);
    //     setTimeout(() => draggedCard.style.opacity = 0, 1);
    // }

    // renderDragStartPile({ card, fromPile, cardIdx, evt }) {
    //     const pileDOM = this.getDOM(fromPile);
    //     const pileOfCards = Array.from(pileDOM.children).slice(cardIdx);
    //     const pileContainer = document.createElement('div');
    //     pileContainer.className = 'clone-pile';
    //     pileContainer.style.position = 'fixed';
    //     pileContainer.style.pointerEvents = 'none';
    //     pileContainer.style.zIndex = 1000;
    //     pileOfCards.forEach((c,idx) => {
    //         const clone = c.cloneNode(true);
    //         clone.classList.add('dragged','on-tableau');
    //         if(idx===0)
    //             clone.classList.add('pile-head');
    //         if(idx === pileOfCards.length-1)
    //             clone.classList.add('pile-end');
    //         c.style.opacity = 0;
    //         pileContainer.appendChild(clone);
    //     });
    //     document.body.appendChild(pileContainer);
    //     let rect = pileContainer.getBoundingClientRect();
    //     pileContainer.style.left = `$calc(${evt.clientX}px - 2em)`;
    //     pileContainer.style.top = `$calc(${evt.clientY}px - 2.25em)`;
    //     evt.dataTransfer.setDragImage(pileContainer,evt.clientX-rect.left,evt.clientY-rect.top);
    //     setTimeout(()=>{
    //         Array.from(pileContainer.children).forEach(clone => clone.opacity=0);
    //     },1);
    // }


    renderMoveCard({ card, fromPile, toPile, callback }) {
        const pile = this._getCorrectPileState(fromPile);
        pile.addCard(Card.FromSnapshot(card));
        pile.stack = pile.stack.slice(-1);
        return this.renderMoveCards({ cardsPile: pile.snapshot(), fromPile, toPile, callback });
    }



    renderMoveCards({ cardsPile, fromPile, toPile, callback }) {
        if (this.enableAnimations) {
            return new Promise(async res => {
                const source = this._rebuildPileDOM(fromPile);
                const moveStack = this._getCorrectPileState(cardsPile).stack.map(card => this.decorateCardWithPile(this._makeCardElement(card), fromPile));
                moveStack.forEach(cardEl => source.appendChild(cardEl));

                const animations = moveStack.map(cardEl => this._animateMoveElement(cardEl, null, this.getDOM(toPile), this.animationSpeeds.moveSpeed));
                await Promise.all(animations)
                    .then(() => {
                        this._rebuildPileDOM(fromPile);
                        this._rebuildPileDOM(toPile)
                        if (callback) callback();
                        res();
                    });
            });
        } else {
            this._rebuildPileDOM(fromPile);
            this._rebuildPileDOM(toPile);
            if (callback) callback();
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
            // use .map to  _animateFlipCard on all nodes of stackEl, creating an array of Promises
            // return a promise that resolves when all _animateFlipCard promises are resolved
            const animations = Array.from(stackEl).map((element, index) => {
                return this._animateFlipCard(element, slice[index], this.animationSpeeds.flipDuration);
            });
            return new Promise(async resolve => {
                await Promise.all(animations).then(() => {
                    if (callback) callback();
                    resolve();
                });
            });
        } else {
            Array.from(stackEl).forEach((card, idx) => {
                if (slice[idx].faceUp) {
                    card.classList.remove('back');
                    card.classList.add(slice[idx].cssClass);
                } else {
                    card.classList.add('back');
                    card.classList.remove(slice[idx].cssClass);
                }
                card.draggable = slice[idx].isDraggable
            });
            if (callback) callback();
        }
    }

    _makeMovePile(elems) {
        const movePile = document.createElement('div');
        movePile.classList.add('slot', 'tableau');
        movePile.style.border = 'none';
        elems.forEach(elem => movePile.appendChild(elem));
        return movePile;
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
        return new Promise(res => {
            element.animate(stage1, options).onfinish = () => {
                if (card.faceUp) {
                    element.classList.remove('back');
                    element.classList.add(card.cssClass);
                } else {
                    element.classList.add('back');
                    element.classList.remove(card.cssClass);
                }
                element.draggable = card.isDraggable;
                element.animate(stage2, options).onfinish = () => res();
            }
        });
    }

    _rebuildPileDOM(pile) {
        const pileDOM = this.getDOM(pile);
        const truthPile = this._getCorrectPileState(pile);
        this.removeAllChildren(pileDOM);
        truthPile.stack.forEach(card => {
            pileDOM.append(this.decorateCardWithPile(this._makeCardElement(card), pile));
        });
        return pileDOM;
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
        let options = { duration, fill: 'forwards' };
        return await new Promise(res => {
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

    _repaintDraggedImage(cls) {
        if (!this.gameDOM.dragElement) console.error('Drag element not found');
        for (let child of this.gameDOM.dragElement.children) {
            child.classList.remove('invalid');
            child.classList.remove('valid');
            child.classList.add(cls);
        }
    }

    _repaintDragoverPiles(cls,{overPile}){
        //if (!this.gameDOM.dragElement) return;
        if(!this.feedbackDragOver) return;
        const pileElement = this.getDOM(overPile);
        if(this.gameDOM.lastPaintedFeedack && this.gameDOM.lastPaintedFeedack !== pileElement){
            this._removeDragOverFeedback();
        }

        if(pileElement.childElementCount){
            const firstFaceUpCard = Card.FromSnapshot(overPile.stack.find(card=>!!(card&1)));
            for(let child of pileElement.children){
                child.classList.add('feedback',cls, child === pileElement.lastElementChild ? 'pile-end' : null);
                if(child.classList.contains(firstFaceUpCard.cssClass)) child.classList.add('pile-head');
            }
        }else{
            console.log('no child');
        }
        this.gameDOM.lastPaintedFeedack = pileElement;
    }

    _dragUpdate({ x, y }) {
        this.gameDOM.dragElement.style.left = `${x - 65}px`;
        this.gameDOM.dragElement.style.top = `${y - 59}px`;
    }

    _removeDragOverFeedback(){
        if (this.feedbackDragOver) {
            // remove all feedback classes from standing piles
            this.gameDOM.tableauxElements.forEach(tableau=>{
                if(tableau.childElementCount){
                    for(let child of tableau.children){
                        child.classList.remove('feedback','valid','invalid');
                    }
                }else{
                    console.log('no child');
                }
            })
            
        }
    }

    _removeDraggedFeedback() {
        if (this.feedbackDragged) {
            // remove all valid/invalid classes from the dragged pile
            for (let child of this.gameDOM.dragElement.children) {
                child.classList.remove('valid');
                child.classList.remove('invalid');
            }
        }
    }



}