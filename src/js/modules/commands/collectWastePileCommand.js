import { Command } from "../command.js";
import eventSystem from "../eventSystem.js";

// Command to collect waste pile and turn back into deck
export default class CollectWastePileCommand extends Command {
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

    }

    async undo() {
        while (this.deck.stack.length) {
            const card = this.deck.removeTopCard();
            card.flip();
            this.waste.addCard(card);
        }
    }
}