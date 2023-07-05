// Define flipping animation duration in ms, should match CSS
const FLIP_DURATION = 300;
// Define card deal speed in px/sec
const DEAL_SPEED = 10000;
// Define how long it takes to move pile from waste to deck in ms
const WASTE_DURATION = 100;

// Define default sound settings
const MUSIC_ENABLED = false;
const MUSIC_VOLUME = 0.5;
const SOUNDS_ENABLED = false;
const SOUNDS_VOLUME = 0.5;

// Singleton pattern
// Ideally, use LoadLocal() static method to create the singleton
// But if created with new keyword, should still have a valid singleton object with default config
class GameOptions {
    constructor({
        difficulty = 3,
        animationsEnabled = true,
        animationSpeeds = {} = {
            flip_duration: FLIP_DURATION,
            deal_speed: DEAL_SPEED,
            waste_duration: WASTE_DURATION
        },
        undoEnabled,
        gameMode = 'default',
        soundSettings = {} = {
            music_enabled: MUSIC_ENABLED,
            music_volume: MUSIC_VOLUME,
            sounds_enabled: SOUNDS_ENABLED,
            sounds_volume: SOUNDS_VOLUME
        }
    } = {}) {
        if (GameOptions.instance) {
            return GameOptions.instance;
        }
        this.difficulty = difficulty;
        this.animationsEnabled = animationsEnabled;
        this.animationSpeeds = animationSpeeds;
        this.undoEnabled = undoEnabled;
        this.gameMode = gameMode;
        this.soundSettings = soundSettings;
        GameOptions.instance = this;
    }

    static LoadLocal() {
        let settings;
        try {
            settings = JSON.parse(localStorage.getItem('gameOptions'));
        } catch (e) {
            console.error('Failed to parse saved settings, using defaults.', e);
        }
        // Even if settings is undefined, should still return a valid object with default configuration thanks to 'destructuring assignment with default values' we have for the constructor
        if (!GameOptions.instance) {
            new GameOptions();
        } else if (settings) {
            // If the instance already exists, set its fields with the loaded settings
            GameOptions.instance.difficulty = settings.difficulty;
            GameOptions.instance.animationsEnabled = settings.animationsEnabled;
            GameOptions.instance.animationSpeeds = settings.animationSpeeds;
            GameOptions.instance.undoEnabled = settings.undoEnabled;
            GameOptions.instance.gameMode = settings.gameMode;
            GameOptions.instance.soundSettings = settings.soundSettings;
        }
        return GameOptions.instance;
    }

    saveLocal() {
        try {
            localStorage.setItem('gameOptions', JSON.stringify(this));
        } catch (e) {
            console.error('Failed to save settings.', e);
        }
    }
    loadLocal(){
        return GameOptions.LoadLocal();
    }
}

const gameOptions = GameOptions.LoadLocal();
export default gameOptions;