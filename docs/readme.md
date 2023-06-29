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
    // dragDrop(){} //(?)
    // Render method
}

class Deck {
    // Empty constructor will fill a deck with 52 cards
    // shuffle(){}
    // remove(n) => remove n top-down cards (game difficulty)
    // handleClick(){} //(?)
    // Render method(?)
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
    // flitTopCard(){}
    // Stores cards dropped on it (stack vs array?)
    // Constructor takes index (0-6) to determine number of face-down cards on beginning
    // Render
}

class Solitaire{
    // Constructor creates Foundation, Deck, Tableau objects
    // Fields to track game status
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
