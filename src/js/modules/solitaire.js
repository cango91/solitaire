import eventSystem from "./eventSystem.js";
import { Pile, Waste, Deck, Tableau, Foundation } from "./piles.js";

export default class Solitaire {
    constructor() {
        this.gameSettings = {};
        this.buildDataObjects = this.buildDataObjects.bind(this);
        this.clearHistory = this.clearHistory.bind(this);
        this.onDeckHit = this.onDeckHit.bind(this);
        
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
        this.deck.shuffle();

        //clear & register event listeners
        eventSystem.remove('deck-clicked');
        eventSystem.remove('pile-clicked');
        eventSystem.remove('pile-dragged');

        eventSystem.listen('deck-clicked', this.onDeckHit);

        eventSystem.trigger('game-initialized', { settings: this.gameSettings, deck: this.deck.snapshot() });
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
        await command.execute();
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

    async onDeckHit() {
        // if deck is full, it means we deal
        if (this.deck.stack.length === 52) {
            await this._deal();
        }
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
            await new Promise(res=>eventSystem.trigger('flip-top-card-at-pile',
            {
                action: 'deal',
                pile: this.tableaux[i].snapshot(),
                callback: res
            }));
        }
    }


}