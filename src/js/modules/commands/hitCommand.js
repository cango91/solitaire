import { Command } from "../command.js";
import eventSystem from "../eventSystem.js";
// Command to 'hit' card(s) from deck to waste pile
export default class HitCommand extends Command {
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
            numToRemove--;
        }

    }

    async undo() {
        let numToRemove = this.numHit;
        while (numToRemove) {
            let card = this.waste.removeTopCard();
            card.flip();
            this.deck.addCard(card);
            numToRemove--;
        }
    }
}