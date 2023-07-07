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

test("Pile.FromSnapshot successfully reconstructs name and idx", () => {
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

test("Pile.FromSnapshot can inform about ascendants' deck length", ()=>{
    const deck = new Deck();
    deck.generateCards();
    deck.shuffle();
    const snapshot = deck.snapshot();
    
    const pile = Pile.FromSnapshot(snapshot);
    expect(pile.stack.length).toBe(deck.stack.length);
});

test("Pile.FromSnapshot can inform about stack order of its descendants", ()=>{
    const deck = new Deck();
    deck.generateCards();
    deck.shuffle();
    const snapshot = deck.snapshot();
    
    const pile = Pile.FromSnapshot(snapshot);
    pile.stack.forEach((card,idx)=>{
        expect(card.value).toBe(deck.stack[idx].value);
        expect(card.suit.value).toBe(deck.stack[idx].suit.value);
        expect(!!card.faceUp).toBe(!!deck.stack[idx].faceUp);
    });
});

test("Pile.FromSnapshot can inform about faceUp of all its descendants' cards", ()=>{
    const deck = new Deck();
    const waste = new Waste();
    const tableau = new Tableau(2);
    const foundation = new Foundation(1);
    deck.generateCards();
    deck.shuffle();
    waste.addCard(deck.removeTopCard());
    waste.addCard(deck.removeTopCard());
    tableau.addCard(deck.removeTopCard());
    tableau.addCard(deck.removeTopCard());
    foundation.addCard(deck.removeTopCard());
    foundation.addCard(deck.removeTopCard());
    
    const wastePile = Pile.FromSnapshot(waste.snapshot());
    const tabPile = Pile.FromSnapshot(tableau.snapshot());
    const foundPile = Pile.FromSnapshot(foundation.snapshot());
    for(let i=0;i<2;i++){
        expect(!!wastePile.stack[i].faceUp).toBe(!!waste.stack[i].faceUp);
        expect(!!tabPile.stack[i].faceUp).toBe(!!tableau.stack[i].faceUp);
        expect(!!foundPile.stack[i].faceUp).toBe(!!foundation.stack[i].faceUp);
    }

});

test("Empty tableau accepts valid card drops",()=>{
    const tableau = new Tableau(1);
    const cK = new Card(13,'c',true);
    const hK = new Card(13,'h',true);
    const dK = new Card(13,'d',true);
    const sK = new Card(13,'s',true);
    expect(tableau.allowDrop(cK)).toBe(true);
    expect(tableau.allowDrop(hK)).toBe(true);
    expect(tableau.allowDrop(dK)).toBe(true);
    expect(tableau.allowDrop(sK)).toBe(true);
});

test("Empty tableau rejects cards other than Kings", ()=>{
    const tableau = new Tableau(1);
    const deck = new Deck();
    deck.generateCards();
    const noKingsDeck = deck.stack.filter(card=>card.value !==13);
    expect(noKingsDeck.map(card=>{
        card.flip(); // should be face up
        return tableau.allowDrop(card);
    }).every(val=>!val)).toBe(true);
});

test("Empty tableau rejects face-down card (should not be possible)",()=>{
    const tableau = new Tableau(1);
    expect(tableau.allowDrop(new Card(13,'c',false))).toBe(false);
});

test("Non-empty tableau rejects same color card", ()=>{
    const tableau = new Tableau(1);
    tableau.addCard(new Card(13,'h',true));
    tableau.addCard(new Card(12,'c',true));
    expect(tableau.allowDrop(new Card(11,'c',true))).toBe(false);
    expect(tableau.allowDrop(new Card(11,'s',true))).toBe(false);
});

test("Non-empty tableau rejects card with correct color but wrong value",()=>{
    const tableau = new Tableau(1);
    tableau.addCard(new Card(13,'h',true));
    tableau.addCard(new Card(12,'c',true));
    expect(tableau.allowDrop(new Card(10,'h',true))).toBe(false);
    expect(tableau.allowDrop(new Card(12,'d',true))).toBe(false);
});

describe("tableau.allowDrop",()=>{
    let tableau;
    let pile1, pile2, pile3, pile4;
    let hPileArray;
    let dPileArray;
    let sPileArray;
    let cPileArray;


    beforeEach(()=>{
        tableau = new Tableau(1);
        pile1 = new Pile();
        pile2 = new Pile();
        pile3 = new Pile();
        pile4 = new Pile();
        hPileArray = [Card.fromCssClass('hK'),Card.fromCssClass('cQ')];
        dPileArray = [Card.fromCssClass('dK'),Card.fromCssClass('cQ')];
        sPileArray = [Card.fromCssClass('sK'),Card.fromCssClass('dQ')];
        cPileArray = [Card.fromCssClass('cK'),Card.fromCssClass('dQ')];
    });

    it("should accept Pile starting with K of any color, if it is empty",()=>{
        pile1.stack = dPileArray;
        pile2.stack = hPileArray;
        pile3.stack = sPileArray;
        pile4.stack = cPileArray;
        expect(tableau.allowDrop(pile1)).toBe(true);
        expect(tableau.allowDrop(pile2)).toBe(true);
        expect(tableau.allowDrop(pile3)).toBe(true);
        expect(tableau.allowDrop(pile4)).toBe(true);
    });

    it("should reject Pile starting with other than K, if it is empty",()=>{
        pile1.stack = dPileArray.reverse();
        pile2.stack = hPileArray.reverse();
        pile3.stack = sPileArray.reverse();
        pile4.stack = cPileArray.reverse();
        expect(tableau.allowDrop(pile1)).toBe(false);
        expect(tableau.allowDrop(pile2)).toBe(false);
        expect(tableau.allowDrop(pile3)).toBe(false);
        expect(tableau.allowDrop(pile4)).toBe(false);
    });

    it("should accept vallid piles if it is not empty",()=>{
        const validContinuationArray = [Card.fromCssClass('dJ'), Card.fromCssClass('c10')];
        tableau.stack = dPileArray;
        pile1.stack = validContinuationArray;
        expect(tableau.allowDrop(pile1)).toBe(true);
        tableau.stack[0].flip();
        expect(tableau.allowDrop(pile1)).toBe(true);
    });

});