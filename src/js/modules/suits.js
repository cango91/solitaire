class Suit {
    /* private fields */
    #value;
    #name;
    #symbol
    /**
     * 
     * @param {string} name - name of the suit
     * @param {number} value - numerical value of the suit
     * @param {string} symbol - utf symbol of the suit
     */
    constructor(name, value, symbol) {
        this.#name = name;
        this.#value = value;
        this.#symbol = symbol;
    }

    /* overrides */
    valueOf() {
        return this.#value;
    }
    toString() {
        return this.#name;
    }
    [Symbol.toPrimitive](hint) {
        switch (hint) {
            case 'string':
                return this.#name.toLowerCase()[0];
            case 'number':
            default:
                return this.#value;
        }
    }


    /* public getters */
    get symbol() {
        return this.#symbol;
    }
    get name() {
        return this.#name;
    }
    get value() {
        return this.#value;
    }
}
/* export a default collection of 4 suits for solitaire,
/* values allow for easy color-match checking `(suitA ^ suitB) & 1` will return true for opposing color suits, false for same color suits
*/
const SUITS = Object.freeze(
    {
        CLUBS: new Suit('clubs', 0, '♣'),
        HEARTS: new Suit('hearts', 1, '♥'),
        SPADES: new Suit('spades', 2, '♠'),
        DIAMONDS: new Suit('diamonds', 3, '♦')
    }
);

export default SUITS;