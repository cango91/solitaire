import { Deck, Waste, Tableau, Foundation, Pile } from './piles.js';
import Renderer from './renderer.js';

describe('decorateCardWithPile', () => {
    let cardElement;
    let renderer;
    let decorateCardWithPile;
    beforeEach(() => {
        renderer = new Renderer();
        decorateCardWithPile = renderer.decorateCardWithPile;
        cardElement = document.createElement('div');
        cardElement.classList.add('card', 'large');
    });

    afterEach(() => {
        cardElement.className = '';
    });

    it('should add the deck class when the pile is a Deck', () => {
        const deck = new Deck();
        decorateCardWithPile(cardElement, deck.snapshot());

        expect(cardElement.classList).toContain('deck');
    });

    it('should add the on-waste class when the pile is a Waste', () => {
        const waste = new Waste();
        decorateCardWithPile(cardElement, waste.snapshot());

        expect(cardElement.classList).toContain('on-waste');
    });

    it('should add the on-tableau class when the pile is a Tableau', () => {
        const tableau = new Tableau(1);
        decorateCardWithPile(cardElement, tableau.snapshot());

        expect(cardElement.classList).toContain('on-tableau');
    });

    it('should add the on-foundation class when the pile is a Foundation', () => {
        const foundation = new Foundation(2);
        decorateCardWithPile(cardElement, foundation.snapshot());

        expect(cardElement.classList).toContain('on-foundation');
    });

    it('should add extra classes when provided', () => {
        const deck = new Deck();
        decorateCardWithPile(cardElement, deck.snapshot(), 'extra-class', 'another-extra-class');

        expect(cardElement.classList).toContain('deck');
        expect(cardElement.classList).toContain('extra-class');
        expect(cardElement.classList).toContain('another-extra-class');
    });

    it('should remove old class decorations when adding new ones', () => {
        const deck = new Deck();
        const waste = new Waste();
        decorateCardWithPile(cardElement, deck.snapshot());
        decorateCardWithPile(cardElement, waste.snapshot());

        expect(cardElement.classList).toContain('on-waste');
        expect(cardElement.classList).not.toContain('deck');
    });

    it('should handle non-decorated piles gracefully', () => {
        const unknownPile = { ...new Deck().snapshot(), name: 'unknown' };
        decorateCardWithPile(cardElement, unknownPile);
        expect(cardElement.className).toBe('card large');
    });

    it('should preserve the initial classes of the card element', () => {
        const deck = new Deck();
        decorateCardWithPile(cardElement, deck.snapshot(), 'extra-class', 'another-extra-class');

        expect(cardElement.classList).toContain('deck');
        expect(cardElement.classList).toContain('card');
        expect(cardElement.classList).toContain('large');
        expect(cardElement.classList).toContain('extra-class');
        expect(cardElement.classList).toContain('another-extra-class');
    });

    it('should add specific card value class (e.g. cA for ace of clubs)', () => {
        const deck = new Deck();
        cardElement.classList.add('cA');
        decorateCardWithPile(cardElement, deck.snapshot());

        expect(cardElement.classList).toContain('deck');
        expect(cardElement.classList).toContain('cA');
    });

    it('should not remove specific card value class when adding new ones', () => {
        const deck = new Deck();
        const waste = new Waste();
        cardElement.classList.add('cA');
        decorateCardWithPile(cardElement, deck.snapshot());
        decorateCardWithPile(cardElement, waste.snapshot());

        expect(cardElement.classList).toContain('on-waste');
        expect(cardElement.classList).toContain('cA');
        expect(cardElement.classList).not.toContain('deck');
    });
});
