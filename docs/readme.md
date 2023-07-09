# Solitaire (Klondike version)

+ [Figma Screens](https://www.figma.com/file/XcEostiwFMu5KNMkTEz4SB/Solitaire-(Klondike)-Browser-Game?type=design&node-id=0%3A1&mode=design&t=e1NEC8xCsmlnMaf9-1)
+ [Figma Protoype](https://www.figma.com/proto/XcEostiwFMu5KNMkTEz4SB/Solitaire-(Klondike)-Browser-Game?type=design&node-id=14-2&t=q113tvyCC0scQbAE-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=14%3A2&mode=design)

![screen designs](./Solitaire(Klondike)-Browser-Game.png)
## Planned MVP Scope
+ Single-draw difficulty
+ Bacground music
## Features for Future
Below features are not expected to be finished by MVP, but will be solid additions if time allows, in no particular order (except first one):
+ Game Options: 1 and 3-draw difficulties
+ Fast-forward option for definite win condition, but not win-state
+ Different layout options for mobile device portrait and landscape orientations
+ Game Options: Sound effects
+ Game Options: Timer-mode
+ Game Options: (Microsoft style) scoring system
+ Undo history (a.k.a thoughtful solitaire)
+ Save and Load games
+ Game Options: Enable/Disable animations
+ Game Options: Change animation speed
## Pseudo-code
```javascript

// ----- CLASSES ----- //
class DataObject{
    // abstract class that all data-holding game objects (a.k.a. Card, Deck, Tableaux, Waste, Foundations) extend this class.
    // Must implement snapshot() -> serialize object's current state
    // Must implement static FromSnapshot(snapshot) -> deserialize given snapshot to a valid object of type
}

class GameOptions {
    // Class to store user settings
    // Methods to validate settings on change
```

~~`//Render method to render options screen`~~

 Dedicated Renderer class added

```js
}
class Card {
    // Static fields will hold suite and color "coding"
    // Will hold the necessary information for a card, i.e. face up/down, value, suite
    // flip(){}
}

class Command {
    // Class for representing game actions to enable undo mechanics.
    // Agnostic to validity of a move within games' context, it is the creating classes responsiblity to ensure a stored move is valid
    // No fields, (async) execute() and undo()/redo() methods (abstract)
    // Derived classes (i.e. actual Commands) may return promises to consider UI changes taking time
}
```
~~`
class CommandHistory{
    // Class to store Commands and enable undo/redo action
    // Should work with promises to observe and wait for UI changes
}`~~

Command execution, history, undo, redo are now handled by `Solitaire` class.
```js

class EventSystem{
    // A class to separate DOM manipulation and animation concerns from game logic
    // When a state change occurs through an action or command, they should notify the event system, which will call their registered listeners for DOM manipulation
    // Singleton
}

class Deck {
    /*
    XX~~Empty constructor will fill a deck with 52 cards~~XX
    // constructor no longer fills with cards
    // generateCards() will fill the deck
    // shuffle(){} => initial shuffle. non-reversible
    XX~~deal() => initial dealing of cards. non-reversible~~XX
    // deal() is no longer Deck's responsibility
    // all classes that extend Pile handle the state of cards that enter that pile, or leave that pile.
    // Each pile has assumptions(which they ensure):
    // e.g. Deck assumes: 
    +any card being added to it must be face-down
    +all cards in it are un-draggable
    +doesn't assume about cards leaving it
    XX~~hit(n) => remove n top-down cards (game difficulty) - undoable~~XX
    // No longer Deck's responsibility.
    */
}

class Pile{
    // base class for Foundation, Waste, Tableau, Deck
    // main purpose is to have a common ancestor that stores a sequence of cards
    // implements (virtual) snapshot() and static FromSnapshot() methods that allow for saving the current state when passing as event data.
    // all derived classes either use the virtual implementation or override with necessary additions
    // Pile.FromSnapshot(DerivedClass).name returns the derived classes name, used by renderer.
    // Similarly, if a 
}

class Foundation{
    // Methods to check if can accept the card/s being dropped on it
    // constructor takes index

}

class Waste{
    // Waste pile

}

class Tableau{
    // Methods to check if can accept the card/s being dropped on it (reverse of foundation)
    // flipTopCard(){}
    // Stores cards dropped on it
    // Constructor takes index (0-6) to determine number of face-down cards on beginning
}

class Solitaire{
    // Constructor creates Foundation, Deck, Tableau objects
    // Fields to track game status (and history)
    // handlers
    // checkWinCondition(){}
    // newGame(){}
}

class Renderer{
    // has listeners to gameEvents
    // animated or static rendering
}
// ----- INITIALIZATION ----- //
// Declare and initialize DOM reference const's necessary for rendering of above objects
// Attach event listeners to relavant DOM variables.
// Create gameOptions and solitaire objects, call necessary functions.
// (If type="module" is used for whatever reason - i.e. increasing complexity) expose a window.DebuggingObject to contain functions and variables needed to interact from console

// main.js will act as bootstrapper and controller
// Solitaire will serve as the main logic/data layer, coordinating other classes with events and commands, whereas Renderer is responsible for all rendering through listening to events

```
## Refactored Architecture
![software architecture](./events/architecture.drawio.svg)
Also see [this readme](./events/readme.md) for a breakdown of game-events.