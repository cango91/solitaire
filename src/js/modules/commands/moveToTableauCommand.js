import { Command } from "../command.js";
import eventSystem from "../eventSystem.js";

export default class MoveToTableauCommand extends Command {
    constructor(cardsPile, fromPile, toPile) {
        super();
        this.cardsPile = cardsPile;
        this.fromPile = fromPile;
        this.toPile = toPile;
        this.flipTableauOnUndoFlag = false;
    }

    async execute() {
        // find idx of first card of cardsPile in fromPile
        let firstCard = this.cardsPile.bottomCard;
        let idx = this.fromPile.stack.findIndex((elem) => elem.value == firstCard.value && elem.suit.value == firstCard.suit.value);
        while (idx < this.fromPile.stack.length) {
            this.toPile.addCard(this.fromPile.removeTopCard());
        }
        new Promise(res => eventSystem.trigger('move-cards', {
            action: "user-action",
            cardsPile: this.cardsPile.snapshot(),
            fromPile: this.fromPile.snapshot(),
            toPile: this.toPile.snapshot(),
            callback: res

        })).then(async () => {
            if (!this.fromPile.isEmpty && !this.fromPile.topCard.faceUp) {
                this.flipTableauOnUndoFlag = true;
                this.fromPile.revealTopCard();
                await new Promise(res=>eventSystem.trigger('flip-top-card-at-pile',{
                    pile: this.fromPile.snapshot(),
                    callback: res
                }));
            }
        });
    }
    async undo() {

    }
}