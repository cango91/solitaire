# Solitaire (Klondike version)

+ [Figma Screens](https://www.figma.com/file/XcEostiwFMu5KNMkTEz4SB/Solitaire-(Klondike)-Browser-Game?type=design&node-id=0%3A1&mode=design&t=e1NEC8xCsmlnMaf9-1)
+ [Figma Protoype](https://www.figma.com/proto/XcEostiwFMu5KNMkTEz4SB/Solitaire-(Klondike)-Browser-Game?type=design&node-id=14-2&t=q113tvyCC0scQbAE-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=14%3A2&mode=design)

![screen designs](./Solitaire(Klondike)-Browser-Game.png)
## Planned MVP Scope
+ Single-draw difficulty
+ Bacground music
## Features for Future
Below features are not expected to be finished by MVP, but will be solid additions if time allows, in no particular order (except first one):
+ 2 and 3-draw difficulties
+ Different layout options for mobile device portrait and landscape orientations
+ Sound effects
+ Timer-mode
+ Microsoft style scoring system
+ Undo history (a.k.a thoughtful solitaire)
+ Save and Load games -> Trivial with command pattern if Undo history is implemented
## Pseudo-code
```javascript
/*
// ----- CLASSES ----- //
class GameOptions {
    // Class to store user settings
    // Methods to validate settings on change
    // Render method to render options screen
}
class Card {
    // Static fields will hold suite and color "coding"
    // Static methods will provide comparing functionality
    // Will hold the necessary information for a card, i.e. face up/down, value, suite
    // flip(){}
    // Render method
    // Sub-render methods responsible for manipulating DOM elements and animations -> remove from owning slot, create in the new owning slot. Or is this better suited for the Pile class?
}

class Command {
    // Class for representing game actions to enable undo mechanics.
    // Agnostic to validity of a move within games' context, it is the creating classes responsiblity to ensure a stored move is valid
    // Fields: Action, Inverse (if null->Non-undoable action-> i.e. shuffle and deal which should only be done when beginning a new game, doesn't make sense to have these undoable as that would mean beginning a new game)
}

class Deck {
    // Empty constructor will fill a deck with 52 cards
    // shuffle(){} => initial shuffle. non-reversible
    // deal() => initial dealing of cards. non-reversible
    // hit(n) => remove n top-down cards (game difficulty) - undoable
    // handleClick(){} //(?)
    // Render method(?)
}

class Pile{
    // base class for Foundation, Waste, Tableau, Deck(?)
    // main purpose is to have a common ancestor that stores a sequence of cards
    // This would come in handy for dragging multiple cards as a "pile" as well
}

class Foundation{
    // Methods to check if can accept the card/s being dropped on it
    // handleDrop(){}
    // Render method
}

class Waste{
    // Waste pile
    // render()
}

class Tableau{
    // Methods to check if can accept the card/s being dropped on it (reverse of foundation)
    // handleDrop(){}
    // flipTopCard(){}
    // Stores cards dropped on it
    // Constructor takes index (0-6) to determine number of face-down cards on beginning
    // Render
}

class Solitaire{
    // Constructor creates Foundation, Deck, Tableau objects
    // Fields to track game status (and history)
    // handleDragDrop(){}
    // checkWinCondition(){}
    // render(){}
    // newGame(){}
}
// ----- INITIALIZATION ----- //
// Declare and initialize DOM reference const's necessary for rendering of above objects
// Attach event listeners to relavant DOM variables.
// Create gameOptions and solitaire objects, call necessary functions.
// (If type="module" is used for whatever reason) expose a window.DebuggingObject to contain any functions and variables needed to interact from console
*/
```
