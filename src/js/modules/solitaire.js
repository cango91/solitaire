import CollectWastePileCommand from "./commands/collectWastePileCommand.js";
import HitCommand from "./commands/hitCommand.js";
import eventSystem from "./eventSystem.js";
import { Pile, Waste, Deck, Tableau, Foundation } from "./piles.js";

export default class Solitaire {
    acceptInput;
    constructor() {
        this.gameSettings = {};
        this.foundationSuites = {
            0: null,
            1: null,
            2: null,
            3: null
        };
        this.buildDataObjects = this.buildDataObjects.bind(this);
        this.clearHistory = this.clearHistory.bind(this);
        this.onDeckHit = this.onDeckHit.bind(this);
        this.undo = this.undo.bind(this);
        this.executeCommand = this.executeCommand.bind(this);
        this.onDragStartCard = this.onDragStartCard.bind(this);
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
        eventSystem.remove('deck-clicked');
        eventSystem.remove('pile-clicked');
        eventSystem.remove('pile-dragged');
        eventSystem.remove('drag-start-card');

        eventSystem.listen('deck-hit', this.onDeckHit);
        eventSystem.listen('drag-start-card', this.onDragStartCard)


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

    onDragStartCard({ cardIdx, fromPile, eventData }) {
        if (!this.acceptInput) return;
        this._disableInputs();
        let card;
        switch (fromPile.substring(0, 1).toLowerCase()) {
            case 'w':
                card = this.waste.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable)
                    eventSystem.trigger('validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: this.waste.snapshot(),
                        cardIdx, 
                        evt: eventData
                    });
                break;
            case 'f':
                const foundationIdx = Number(fromPile.substring(fromPile.length - 1)) - 1;
                const foundation = this.foundations[foundationIdx];
                card = foundation.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable)
                    eventSystem.trigger('validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: foundation.snapshot(),
                        cardIdx,
                        foundationIdx,
                        evt: eventData
                    });
                break;
            case 't':
                const tableauIdx = Number(fromPile.substring(fromPile.length - 1)) - 1;
                const tableau = this.tableaux[tableauIdx];
                card = tableau.getCardAt(cardIdx);
                if (!card) break;
                if (card.isDraggable)
                    eventSystem.trigger(cardIdx + 1 < tableau.stack.length ? 'validated-drag-start-pile' : 'validated-drag-start-card', {
                        action: "drag-start",
                        card: card.snapshot(),
                        fromPile: tableau.snapshot(),
                        cardIdx,
                        tableauIdx,
                        evt: eventData
                    });
                break;
            default:
                console.log('nop');
                break;
        }
        this._enableInputs();
    }

    async onDeckHit() {
        if (!this.acceptInput) return
        // if deck is full, it means we deal
        this._disableInputs();
        if (this.deck.stack.length === 52) {
            await this._deal();
            // if deck is not empty, it means we hit to waste
        } else if (this.deck.stack.length > 0) {
            const numToHit = Math.min(this.deck.stack.length, this.gameSettings.difficulty);
            const hitCmd = new HitCommand(this.deck, this.waste, numToHit);
            await this.executeCommand(hitCmd);
        } else if (!this.deck.stack.length && this.waste.stack.length) {
            const collectCmd = new CollectWastePileCommand(this.waste, this.deck);
            await this.executeCommand(collectCmd);
        }
        this._enableInputs();
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


}