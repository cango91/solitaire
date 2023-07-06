import { Pile, Tableau, Waste, Foundation, Deck } from "./piles.js";
import Card from "./card.js";

test("Pile functionality", () => {
    const pile = new Pile();
    expect(pile.stack.length).toBe(0);

    const card = new Card(2, "hearts", true);
    pile.addCard(card);
    expect(pile.stack.length).toBe(1);

    const topCard = pile.topCard;
    expect(topCard).toEqual(card);

    const removedCard = pile.removeTopCard();
    expect(removedCard).toEqual(card);
    expect(pile.stack.length).toBe(0);
});

test("Tableau functionality", () => {
    const tableau = new Tableau();
    const card = new Card(2, "hearts", true);
    tableau.addCard(card);
    expect(tableau.topCard.isDraggable).toBe(true);
});

test("Waste functionality", () => {
    const waste = new Waste();
    const card = new Card(2, "hearts", true);
    waste.addCard(card);
    expect(waste.topCard.isDraggable).toBe(true);
});

test("Foundation functionality", () => {
    const foundation = new Foundation();
    const card = new Card(2, "hearts", true);
    foundation.addCard(card);
    expect(foundation.topCard.isDraggable).toBe(true);
});

test("Deck functionality", () => {
    const deck = new Deck();
    expect(deck.stack.length).toBe(0);
    
    deck.generateCards();
    expect(deck.stack.length).toBe(52);

    const initialSnapshot = deck.snapshot();
    expect(initialSnapshot.isShuffled).toBe(false);

    deck.shuffle();
    expect(deck.isShuffled).toBe(true);

    const shuffledSnapshot = deck.snapshot();
    expect(shuffledSnapshot.isShuffled).toBe(true);
    expect(shuffledSnapshot.stack).not.toEqual(initialSnapshot.stack);
});

test("Snapshot functionality", () => {
    const pile = new Pile();
    const card = new Card(2, "hearts", false);
    pile.addCard(card);

    const snapshot = pile.snapshot();
    const restoredPile = Pile.FromSnapshot(snapshot);

    expect(restoredPile.stack.length).toBe(1);
    expect(restoredPile.topCard.value).toBe(card.value);
    expect(restoredPile.topCard.suit).toBe(card.suit);
    expect(!!restoredPile.topCard.faceUp).toBe(!!card.faceUp);
});

test("Tableau snapshot functionality", () => {
    const tab = new Tableau(5);
    const card = new Card(2, "clubs", false);
    tab.addCard(card);

    const snapshot = tab.snapshot();
    const restoredTableau = Tableau.FromSnapshot(snapshot);

    expect(restoredTableau.stack.length).toBe(1);
    expect(restoredTableau.topCard.value).toBe(card.value);
    expect(restoredTableau.topCard.suit).toBe(card.suit);
    expect(restoredTableau.idx).toBe(tab.idx);
});

test("Foundation snapshot functionality", () => {
    const tab = new Foundation(2);
    const card = new Card(2, "clubs", false);
    tab.addCard(card);

    const snapshot = tab.snapshot();
    const restoredTableau = Foundation.FromSnapshot(snapshot);

    expect(restoredTableau.stack.length).toBe(1);
    expect(restoredTableau.topCard.value).toBe(card.value);
    expect(restoredTableau.topCard.suit).toBe(card.suit);
    expect(restoredTableau.idx).toBe(tab.idx);
});

test("Waste snapshot functionality", () => {
    const tab = new Waste();
    const card = new Card(2, "clubs", false);
    tab.addCard(card);

    const snapshot = tab.snapshot();
    const restoredTableau = Tableau.FromSnapshot(snapshot);

    expect(restoredTableau.stack.length).toBe(1);
    expect(restoredTableau.topCard.value).toBe(card.value);
    expect(restoredTableau.topCard.suit).toBe(card.suit);
    expect(restoredTableau.idx).toBe(null);
});

test("Deck card assumptions", () => {
    const deck = new Deck();
    deck.generateCards();
    const card = new Card(2, "hearts", true);

    deck.addCard(card);
    expect(deck.topCard.faceUp).toBe(false);
    expect(deck.topCard.isDraggable).toBe(false);
});

test("Tableau card assumptions", () => {
    const tableau = new Tableau();
    const card = new Card(2, "hearts", true);
    const card2 = new Card(3, "spades", false);

    tableau.addCard(card);
    tableau.addCard(card2);
    expect(tableau.topCard.isDraggable).toBe(false); // card2 is not face up

    card2.faceUp = true;
    tableau.addCard(card2);
    expect(tableau.topCard.isDraggable).toBe(true); // card2 is now face up

    const removedCard = tableau.removeTopCard();
    expect(removedCard.faceUp).toBe(true);
});

test("Foundation card assumptions", () => {
    const foundation = new Foundation();
    const card = new Card(2, "hearts", false);

    foundation.addCard(card);
    expect(foundation.topCard.faceUp).toBe(true); // card should be flipped up
    expect(foundation.topCard.isDraggable).toBe(true);

    const card2 = new Card(3, "spades", false);
    foundation.addCard(card2);
    expect(foundation.topCard.isDraggable).toBe(true);
    expect(card.isDraggable).toBe(false); // card is not the top card anymore

    const removedCard = foundation.removeTopCard();
    expect(removedCard.faceUp).toBe(true);
});

test("Waste card assumptions", () => {
    const waste = new Waste();
    const card = new Card(2, "hearts", false);

    waste.addCard(card);
    expect(waste.topCard.faceUp).toBe(true); // card should be flipped up
    expect(waste.topCard.isDraggable).toBe(true);

    const card2 = new Card(3, "spades", false);
    waste.addCard(card2);
    expect(waste.topCard.isDraggable).toBe(true);
    expect(card.isDraggable).toBe(false); // card is not the top card anymore
});

test("Pile FromSnapshot successfully reconstructs name and idx", () => {
    const waste = new Waste();
    const tableau = new Tableau(1);
    const deck = new Deck();
    const foundation = new Foundation(2);

    const pileWaste = Pile.FromSnapshot(waste.snapshot());
    const pileTableau = Pile.FromSnapshot(tableau.snapshot());
    const pileDeck = Pile.FromSnapshot(deck.snapshot());
    const pileFoundation = Pile.FromSnapshot(foundation.snapshot());

    expect(pileWaste.name).not.toBe(null);
    expect(pileWaste.name).not.toBe(undefined);
    expect(pileWaste.name).toBe(Waste.name);
    expect(pileTableau.name).toBe(Tableau.name);
    expect(pileTableau.idx).toBe(tableau.idx);
    expect(pileDeck.name).toBe(Deck.name);
    expect(pileFoundation.name).toBe(Foundation.name);
    expect(pileFoundation.idx).toBe(foundation.idx);
});