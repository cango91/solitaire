export const Suit = Object.freeze(
    class Suit {
        /* Static Fields for Definitions */
        static Suits = Object.freeze(['clubs', 'hearts', 'spades', 'diamonds']);
        static Colors = Object.freeze(['black', 'red']);
        // for convenience use Suit.Clubs, etc. to get a valid Suit object
        static Clubs = new Suit(0);
        static Hearts = new Suit(1);
        static Spades = new Suit(2);
        static Diamonds = new Suit(3);

        /* Private fields and error classes */
        #val;
        #InvalidSuit = class InvalidSuitError extends Error {
            constructor(msg) {
                super(msg);
                this.name = "Invalid Suit Error";
            }
        };
        /**
         * @param {string|number} suit - 'c', 'clubs', 'h', 'hearts', 's', 'spades', 'd', 'diamonds' will create a valid suit (case insensitive)
         * alternatively numbers 0,1,2,3 will create a valid suit. Any other values will throw.
         * @throws InvalidSuitError
         */
        constructor(suit) {
            switch (typeof suit) {
                case 'string':
                    if (suit.length > 1) {
                        this.#val = Suit.Suits.findIndex(el => el === suit.toLowerCase());
                    } else {
                        this.#val = Suit.Suits.findIndex(el=> el.substring(0,1)===suit.toLowerCase());
                    }
                    break;
                case 'number':
                    this.#val = suit;
                    break;
                default:
                    throw new Error("Unkown parameter type in Suit constructor");
            }
            if (this.#val < 0 || this.#val > 3) throw new this.#InvalidSuit();
        }

        toString() {
            return this.string;
        }

        get color() {
            return Suit.Colors[this.#val & 1];
        }

        get value() {
            return this.#val;
        }

        get char() {
            return Suit.Suits[this.#val].substring(0, 1);
        }

        get string() {
            return Suit.Suits[this.#val];
        }

    });
export default Object.freeze(
    class Card {
        /* Static Field for Face Value Definitions */
        static FaceValues = Object.freeze(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);

        /* Private fields and custom errors*/
        #int;   // integer (or internal) representation of the card, will be used for serialization and deserialization post-MVP
        #suit;
        #faceValue;
        #InvalidValue = class InvalidCardError extends Error {
            constructor(msg) {
                super(msg);
                this.name = "Invalid Card Error";
            }
        }
        /* private methods (setters) */
        #setInt(val){
            if(parseInt(val)===val && val>=0 && val<52)
                this.#int = val;
            else
                throw new this.#InvalidValue(`Can't convert ${val} to integer representation`);
        }

        #setFaceValue(val){
            if(val>=0 && val<=12 && parseInt(val)===val)
                this.#faceValue =val;
            else
                throw new this.#InvalidValue(`${val} is not a valid faceValue for Card`);
        }

        #setSuit(val){
            this.#suit = new Suit(val);
        }

        /**
         * 
         * @param {string|number} suitOrCard - If faceValue is not null, must be one of 'c', 'clubs', 'h', 'hearts', 's', 'spades', 'd', 'diamonds' (case-insensitive)
         * 
         * If faceValue is null must be
         * 
         * either
         * 
         *  a string representation of the card: i.e. 'dA' for ace of diamonds, 'd02' for 2 of diamonds, etc. (case-insensitive)
         * 
         * or
         * 
         * Integer representation (used internally) of the card. Valid values are 0-52. Uses Suit.Suits representation for suits. Must be: [(FaceValue<<2) | Suit]
         * @param {number} faceValue - can be null. If not null, must be a valid index of Card.FaceValues array (0 to 12 for 'Ace' to 'King')
         * @throws InvalidCardError
         */

        constructor(suitOrCard, faceValue) {
            let suit, val;
            if (faceValue && parseInt(faceValue)===faceValue && faceValue >= 0 && faceValue <= 12) {
                suit = suitOrCard;
                val = faceValue;
            } else {
                switch(typeof suitOrCard){
                    case 'string':
                        suit = suitOrCard.substring(0,1);
                        val = parseInt(suitOrCard.substring(1))-1;
                        break;
                    case 'number':
                        suit = suitOrCard & 3;
                        val = suitOrCard >> 2;
                        break;
                    default:
                        throw new this.#InvalidValue();
                }
            }
            this.#setSuit(suit);
            this.#setFaceValue(val);
            this.#setInt((this.faceValue<<2)| this.suit.value);
        }
        /* getters */

        get int(){
            return this.#int;
        }
        get suit(){
            return this.#suit;
        }

        get value(){
            return this.#faceValue;
        }

        get valueString(){
            return Card.FaceValues[this.value];
        }

        get fullString(){
            let fullName;
            switch(Card.FaceValues[this.value]){
                case `A`:
                    fullName = 'ace';
                    break;
                case 'J':
                    fullName = 'jack';
                    break;
                case 'Q':
                    fullName = 'queen';
                    break;
                case 'K':
                    fullName = 'king';
                    break;
                default:
                    fullName = Card.FaceValues[this.value];
            }
            return `${fullName} of ${this.suit.string}`;
        }

        get shortString(){
            return `${this.suit.string.substring(0,1)}${this.value>0 && this.value<10 ? Card.FaceValues[this.value].padStart(2,'0') : Card.FaceValues[this.value]}`;
        }

        /* Public methods */

        toString(){
            return this.fullString;
        }
    });