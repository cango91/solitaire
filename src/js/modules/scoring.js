import eventSystem from './eventSystem.js';


export default class Scoring{
    constructor(scoringSchema={}){
        this.configureScoring(scoringSchema);

        this.onGameInitialized = this.onGameInitialized.bind(this);
        this.onGameEnded = this.onGameEnded.bind(this);
        this.attachListeners = this.attachListeners.bind(this);
        this.removeListeners = this.removeListeners.bind(this);

        // we'll always listen to these 2 to set a flag according to game settings and either attach or remove the other listeners
        eventSystem.listen('game-initialized',this.onGameInitialized);
        eventSystem.listen('game-ended',this.onGameEnded);
    }

    configureScoring({
        moveToFoundation = 10,
        wasteToTableau = 5,
        flippedAtTableau = 5,
        foundationToTableau = -15,
        passThruDeck = {} = {
            1: {}={
                after: 1,
                score:-10
            },
            3: {} = {
                after: 4,
                score: -20
            }
        }
    }={}){
        this.schema.moveToFoundation = moveToFoundation;
        this.schema.wasteToTableau = wasteToTableau;
        this.schema.flippedAtTableau = flippedAtTableau;
        this.schema.foundationToTableau = foundationToTableau;
        this.schema.passThruDeck = passThruDeck;
    }

    attachListeners(){

    }

    removeListeners(){

    }

    onGameInitialized(data){
        this.keepSocre = data.settings.scoring;
    }

    onGameEnded(data){

    }

}