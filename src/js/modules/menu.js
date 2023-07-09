import eventSystem from "./eventSystem.js";
const ANIMATION_SPEED_PRESETS = {
    'turtle': {
        flipDuration: 300,
        moveSpeed: 500,
        dropSpeed: 500,
    },
    'slow': {
        flipDuration: 200,
        moveSpeed: 2000,
        dropSpeed: 1000,
    },
    'normal': {
        flipDuration: 150,
        moveSpeed: 5000,
        dropSpeed: 2000,
    },
    'fast': {
        flipDuration: 100,
        moveSpeed: 7500,
        dropSpeed: 3000,
    },
    'lightning': {
        flipDuration: 50,
        moveSpeed: 10000,
        dropSpeed: 5000,
    }
}

// Here, due to time constraints, we're breaking the MVC architecture. This class is both model and view
export default class Menu {
    constructor() {
        this.gameSettings = {
            difficulty: 3,
            timerMode: false,
            scoring: false,
            thoughtfulSol: true,
        };
        this.rendererSettings = {
            enableAnimations : true,
            feedbackDragged : true,
            feedbackDragOver : true,
            animationSpeeds : ANIMATION_SPEED_PRESETS.normal,
            redDeck : false
        };
        this.audioSettings = {
            music_enabled: false,
            music_volume: 0,
        };

        this.onGameInitialized = this.onGameInitialized.bind(this);
        this.loadLocalSettings = this.loadLocalSettings.bind(this);

        eventSystem.listen('game-initialized', this.onGameInitialized);


    }
    

    showOverlay() {

    }

    hideOverlay() {

    }

    showMessage(msg) {

    }

    showTransition(elem) {

    }

    hideTransition(elem) {

    }


    // Game Settings Actions

    onGameInitialized({ settings }) {
        // store settings when game begins
        this.gameSettings = settings;

    }


    onSettingsClicked() {

    }

    onGameSettingsChanged(newSettings) {

    }

    // About Popup Actions

    onAboutClicked() {

    }

    // Fast-forward/undo/redo

    // Retrieving localStorage

    get currentSettings(){
        const renderer = this.rendererSettings;
        const game = this.gameSettings;
        const audio = this.audioSettings;
        return {
            game,
            renderer,
            audio,
        }
    }

    get localSettings(){
        try{
           const settings = JSON.parse(localStorage.getItem('allSettings'));
           const renderer = settings.renderer;
           const game = settings.game;
           const audio = settings.audio;
           return {
            game,
            renderer,
            audio,
           }
        }catch(e){
            console.warn(`Couldn't load local store:\n`,e);
            throw e;
        }
    }

    loadLocalSettings(){
        try{
            const settings = this.localSettings;
            this.gameSettings = settings.game;
            this.rendererSettings = settings.renderer;
            this.audioSettings = settings.audio;
        }catch(e){
            console.warn('Loading defaults/current settings');
            return this.currentSettings;
        }
    }

    // saving settings to localStorage

    saveSettingsLocal(){
        try {
            localStorage.setItem('allSettings', JSON.stringify(this.currentSettings));
        } catch (e) {
            console.error('Failed to save settings.', e);
        }
    }
}