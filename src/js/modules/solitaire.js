import CollectWastePileCommand from "./commands/collectWastePileCommand.js";
import HitCommand from "./commands/hitCommand.js";
import eventSystem from "./eventSystem.js";
import { Pile, Waste, Deck, Tableau, Foundation } from "./piles.js";

export default class Solitaire {
    acceptInput;
    constructor() {
        this.gameSettings = {};
        this.buildDataObjects = this.buildDataObjects.bind(this);
        this.clearHistory = this.clearHistory.bind(this);
        this.onDeckHit = this.onDeckHit.bind(this);
        this.undo = this.undo.bind(this);
        this.executeCommand = this.executeCommand.bind(this);
        this.onDragStartCard = this.onDragStartCard.bind(this);
        this.onDragOverPile = this.onDragOverPile.bind(this);
        this._dragStart = this._dragStart.bind(this);
        this._dragOver = this._dragOver.bind(this);
        this._getFoundationOfSuit = this._getFoundationOfSuit.bind(this);
        this._getFoundationWithId = this._getFoundationWithId.bind(this);
        this._getTableauWithId = this._getTableauWithId.bind(this);
        this.onCancelDrag = this.onCancelDrag.bind(this);

    }

    initialize(
        {
            difficulty = 3,
            timerMode = false,
            scoring = false
        } = {}) {
        this.gameSettings.difficulty = difficulty;
        this.gameSettings.timerMode = timerMode;
        this.gameSettings.scoring = scoring;
        this.clearHistory();
        this.buildDataObjects();

        this.deck.generateCards();
        this.deck.shuffle();

        //clear & register event listeners
        //eventSystem.remove('deck-clicked');
        //eventSystem.remove('pile-clicked');
        eventSystem.remove('deck-hit',this.onDeckHit);
        eventSystem.remove('drag-start-card',this.onDragStartCard);
        eventSystem.remove('drag-over-pile',this.onDragOverPile);
        eventSystem.remove('drop-over-bg',this.onCancelDrag);

        eventSystem.listen('deck-hit', this.onDeckHit);
        eventSystem.listen('drag-start-card', this.onDragStartCard)
        eventSystem.listen('drag-over-pile', this.onDragOverPile);
        eventSystem.listen('drop-over-bg', this.onCancelDrag);

        eventSystem.trigger('game-initialized', { settings: this.gameSettings, deck: this.deck.snapshot() });
        this._enableInputs();
    }

    buildDataObjects() {
        this.deck = new Deck();
        this.waste = new Waste();
        this.tableaux = [];
        this.foundations = [];
        for (let i = 0; i < 7; i++) {
            if (i < 4)
                this.foundations.push(new Foundation(i));
            this.tableaux.push(new Tableau(i));
        }
        this.foundationSuites = {
            0: null,
            1: null,
            2: null,
            3: null
        };
        this.draggedPile = null;
    }

    async executeCommand(command) {
        await new Promise(res => {
            command.execute();
            res();
        });
        this.history.push(command);
        this.undoStack = [];
        eventSystem.trigger('history-update', { action: 'executeCommand', history: this.history, undo: this.undoStack });
    }

    async undo() {
        if (this.history.length) {
            let command = this.history.pop();
            await command.undo();
            this.undoStack.push(command);
            eventSystem.trigger('history-update', { action: 'undo', history: this.history, undo: this.undoStack });
        }
    }

    async redo() {
        if (this.undoStack.length) {
            let command = this.undoStack.pop();
            await command.execute();
            this.history.push(command);
            eventSystem.trigger('history-update', { action: 'redo', history: this.history, undo: this.undoStack })
        }
    }

    clearHistory() {
        this.history = [];
        this.undoStack = [];
    }

    //---- GAME EVENT HANDLING ----//

    onDragOverPile(data) {
        //console.log('hey');
        if (!this.acceptInput) return;
        this._disableInputs();
        this._dragOver(data);
        this._enableInputs();
    }


    onDragStartCard(data) {
        if (!this.acceptInput) return;
        this._disableInputs();
        this._dragStart(data);
        this._enableInputs();
    }

    onCancelDrag(){
        this.draggedPile = null;
    }

    async onDeckHit() {
        if (!this.acceptInput) return
        
        // if deck is full, it means we deal
        if (this.deck.isFull) {
            this._disableInputs();
            await this._deal().then(()=>this._enableInputs());
            // if deck is not empty, it means we hit to waste pile
        } else if (!this.deck.isEmpty) {
            this._disableInputs();
            const numToHit = Math.min(this.deck.stack.length, this.gameSettings.difficulty);
            const hitCmd = new HitCommand(this.deck, this.waste, numToHit);
            await this.executeCommand(hitCmd).then(()=>this._enableInputs());
        } else if (!this.deck.stack.length && this.waste.stack.length) {
            this._disableInputs();
            const collectCmd = new CollectWastePileCommand(this.waste, this.deck);
            await this.executeCommand(collectCmd).then(()=>this._enableInputs());
        }
        //this._enableInputs();
    }

    async _deal() {
        for (let i = 0; i < this.tableaux.length; i++) {
            const t = this.tableaux.slice(i);
            for (const tableau of t) {
                tableau.addCard(this.deck.removeTopCard());
                await new Promise(res => eventSystem.trigger('move-card',
                    {
                        action: 'deal',
                        card: tableau.topCard.snapshot(),
                        fromPile: this.deck.snapshot(),
                        toPile: tableau.snapshot(),
                        callback: res
                    }));
            }
            this.tableaux[i].revealTopCard();
            await new Promise(res => eventSystem.trigger('flip-top-card-at-pile',
                {
                    action: 'deal',
                    pile: this.tableaux[i].snapshot(),
                    callback: res
                }));
        }
    }

    _disableInputs() {
        this.acceptInput = false;
    }
    _enableInputs() {
        this.acceptInput = true;
    }

    _dragStart({ cardIdx, fromPile, eventData }) {
        let card;
        const pile = new Pile();
        switch (fromPile.substring(0, 1).toLowerCase()) {
            case 'w':
                card = this.waste.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable) {
                    eventSystem.trigger('validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: this.waste.snapshot(),
                        cardIdx,
                        evt: eventData
                    });
                    pile.stack = [Card.FromSnapshot(card.snapshot())];
                }
                break;
            case 'f':
                const foundation = this._getFoundationWithId(fromPile)
                card = foundation.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable) {
                    eventSystem.trigger('validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: foundation.snapshot(),
                        cardIdx,
                        foundationIdx: foundation.idx,
                        evt: eventData
                    });
                    pile.stack = [Card.FromSnapshot(card.snapshot())]
                }
                break;
            case 't':
                const tableau = this._getTableauWithId(fromPile);
                card = tableau.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable) {
                    eventSystem.trigger('validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: tableau.snapshot(),
                        cardIdx,
                        tableauIdx: tableau.idx,
                        evt: eventData
                    });
                    pile.stack = tableau.stack.slice(cardIdx);
                }
                break;
            default:
                console.error('An error occured at drag-start-card event handler');
                break;
        }
        this.draggedPile = Pile.FromSnapshot(pile.snapshot());
    }

    _dragOver({ overPile, eventData }) {
        if (!this.draggedPile) return;
        if (overPile.startsWith('t')) {
            const tableau = this._getTableauWithId(overPile);
            let eventName = tableau.allowDrop(this.draggedPile) ? 'valid-drag-over-pile' : 'invalid-drag-over-pile';
            eventSystem.trigger(eventName, {
                action: "drag-over",
                overPile: tableau.snapshot(),
                evt: eventData
            });
        } else {

        }
    }

    _getFoundationOfSuit(suit) {
        return this.foundationSuites[suit.value];
    }


    _getTableauWithId(strId) {
        if (!strId.startsWith('t')) throw new Error(`Invalid tableau string ID: ${strId}`);
        const tableauIdx = Number(strId.substring(strId.length - 1)) - 1;
        return this.tableaux[tableauIdx];
    }

    _getFoundationWithId(strId) {
        if (!strId.startsWith('f')) throw new Error(`Invalid foundation string ID: ${strId}`);
        const foundationIdx = Number(strId.substring(strId.length - 1)) - 1;
        return this.foundations[foundationIdx];
    }
}