import eventSystem from "./eventSystem.js";
import { generateOptions } from "./popups/options.js";
import { selfOrParentCheck } from "./utils.js";

//import { buildOptionsPopup } from "./popups/optionsPopup.js";
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

// Here, due to time constraints, we're breaking the MVC architecture. This class is both model, controller and view for all game-options
export default class Menu {
    constructor() {
        this.gameSettings = {
            difficulty: 3,
            timerMode: false,
            scoring: false,
            thoughtfulSol: true,
        };
        this.rendererSettings = {
            enableAnimations: true,
            feedbackDragged: true,
            feedbackDragOver: true,
            animationSpeeds: ANIMATION_SPEED_PRESETS.normal,
            redDeck: false
        };
        this.audioSettings = {
            music_enabled: false,
            music_volume: 0,
        };
        this.tempSettings = {};

        this.overlayEl = document.querySelector('.overlay');
        this.popupContainer = document.getElementById('options-popup');
        this.popupFooter = document.querySelector('.popup-footer');

        document.getElementById('animationSpeeds').onchange = () => this._updateTempOptions();

        this.onGameInitialized = this.onGameInitialized.bind(this);
        this.loadLocalSettings = this.loadLocalSettings.bind(this);
        this.onSettingsClicked = this.onSettingsClicked.bind(this);
        this.optionsController = this.optionsController.bind(this);
        this._buildOptionsButtons = this._buildOptionsButtons.bind(this);

        eventSystem.listen('game-initialized', this.onGameInitialized);
        eventSystem.listen('settings-clicked', this.onSettingsClicked);


        this.overlayEl.addEventListener('click', (evt) => {
            if (!selfOrParentCheck(evt, '#options-popup')) {
                this.hideOverlay();
                this.onOptionsCancelled();
            } else {
                this._updateTempOptions();
                this.optionsController(evt);
            }
        });
    }


    showOverlay() {
        this.overlayEl.classList.add('show');
        setTimeout(() => {
            this.overlayEl.style.opacity = 1;
        }, 50);
    }

    hideOverlay() {
        this.overlayEl.style.opacity = 0;
        setTimeout(() => {
            this.overlayEl.classList.remove('show');
        }, 300);
    }

    showMessage(msg) {

    }

    onOptionsCancelled() {
        eventSystem.trigger('options-menu-cancelled');
        this.tempSettings = {};
    }


    // Game Settings Actions

    onGameInitialized({ settings }) {
        // store settings when game begins
        this.gameSettings = settings;
    }


    get currentPresetName() {
        return Object.keys(ANIMATION_SPEED_PRESETS).find(key => ANIMATION_SPEED_PRESETS[key].flipDuration === this.currentSettings.renderer.animationSpeeds.flipDuration);
    }

    getPresetName(animationSpeeds) {
        return Object.keys(ANIMATION_SPEED_PRESETS).find(key => ANIMATION_SPEED_PRESETS[key].flipDuration === animationSpeeds.flipDuration);
    }


    onSettingsClicked() {
        this.tempSettings = JSON.parse(JSON.stringify(this.currentSettings));
        this._buildOptionsButtons();
        this.popupFooter.firstChild.remove();
        this.popupFooter.appendChild(this.btnContainer);

        this._handleVisualsSection();
        this.showOverlay();
    }

    applySettings() {
        this.rendererSettings = JSON.parse(JSON.stringify(this.tempSettings.renderer));
        this.gameSettings = JSON.parse(JSON.stringify(this.tempSettings.game));
        this.audioSettings = JSON.parse(JSON.stringify(this.tempSettings.audio));
        this.tempSettings = {};
        this.saveSettingsLocal();

    }

    onGameSettingsChanged() {
        this.applySettings();
        eventSystem.trigger('game-settings-changed', {
            action: 'settings-changed',
            ...this.currentSettings
        });
    }

    onRendererSettingsChanged() {
        this.applySettings();
        eventSystem.trigger('av-settings-changed', {
            action: 'settings-changed',
            renderer: this.currentSettings.renderer,
            audio: this.currentSettings.audio,
        });

    }

    _buildOptionsButtons() {
        this.btnContainer = document.createElement('div');
        this.btnContainer.style.display = 'flex';
        this.btnContainer.style.justifyContent = 'center';
        this.applyBtn = document.createElement('button');
        this.applyBtn.style.backgroundColor = 'lime';
        this.applyBtn.style.color = 'black';
        this.applyBtn.innerText = 'Apply';
        this.applyBtn.classList.add('hide');
        this.applyAndRestartBtn = document.createElement('button');
        this.applyAndRestartBtn.style.backgroundColor = 'lime';
        this.applyAndRestartBtn.style.color = 'black';
        this.applyAndRestartBtn.innerText = 'Apply & Restart';
        this.applyAndRestartBtn.classList.add('hide');
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.innerText = 'Cancel';
        this.cancelBtn.style.backgroundColor = 'orange';
        this.cancelBtn.style.color = 'black';
        this.cancelBtn.classList.add('hide');
        this.okBtn = document.createElement('button');
        this.okBtn.innerText = 'OK';
        this.btnContainer.appendChild(this.applyAndRestartBtn);
        this.btnContainer.appendChild(this.applyBtn);
        this.btnContainer.appendChild(this.okBtn);
        this.btnContainer.appendChild(this.cancelBtn);
    }

    optionsController(evt) {
        if (!this.tempSettings) return;

        const visualsChanged = JSON.stringify(this.tempSettings.renderer) !== JSON.stringify(this.currentSettings.renderer);
        const audioChanged = JSON.stringify(this.tempSettings.audio) !== JSON.stringify(this.currentSettings.audio);
        const gameChanged = JSON.stringify(this.tempSettings.game) !== JSON.stringify(this.currentSettings.game);
        this.popupFooter.firstChild.remove();
        this.popupFooter.appendChild(this.btnContainer);
        for (let child of this.btnContainer.children) {
            child.classList.add('hide');
        }
        if (gameChanged) {
            this.applyAndRestartBtn.classList.remove('hide');
            this.cancelBtn.classList.remove('hide');
        } else if (audioChanged || visualsChanged) {
            this.applyBtn.classList.remove('hide');
            this.cancelBtn.classList.remove('hide');
        } else {
            this.okBtn.classList.remove('hide');
        }

        if (selfOrParentCheck(evt, '.visuals')) {

            this._handleVisualsSection();
        } else if (selfOrParentCheck(evt, '.game')) {
            // game settings area
            this._handleGameSection();
        } else if (selfOrParentCheck(evt, '.audio')) {
            console.log('aiudio')
        } else if (selfOrParentCheck(evt, '.popup-footer')) {
            if (evt.target === this.cancelBtn || evt.target === this.okBtn) {
                this.onOptionsCancelled();
                this.hideOverlay();
            } else if (evt.target === this.applyAndRestartBtn) {
                this.onGameSettingsChanged();
                this.hideOverlay();
            } else if (evt.target === this.applyBtn) {
                this.onRendererSettingsChanged();
                this.hideOverlay();
            }
        }
    }

    _handleVisualsSection() {
        const deckColorRed = document.getElementById('reddeck');
        const deckColorBlue = document.getElementById('bluedeck');

        deckColorRed.checked = !!this.tempSettings.renderer.redDeck;
        deckColorBlue.checked = !!!this.tempSettings.renderer.redDeck;

        const draggedCardsChkbox = document.getElementById('feedbackDragged');
        const draggedOverChkbox = document.getElementById('feedbackDragOver');

        draggedCardsChkbox.checked = !!this.tempSettings.renderer.feedbackDragged;
        draggedOverChkbox.checked = !!this.tempSettings.renderer.feedbackDragOver;

        const animationsChkbox = document.getElementById('enableAnimations');

        animationsChkbox.checked = !!this.tempSettings.renderer.enableAnimations;

        const animationSpeedsDiv = document.getElementById('animation-speeds-div');
        if (this.tempSettings.renderer.enableAnimations) {
            animationSpeedsDiv.classList.remove('hide');
            const selectSpeed = document.getElementById('animationSpeeds');
            for (let child of selectSpeed) {
                child.selected = !!(child.value.toLowerCase() === this.getPresetName(this.tempSettings.renderer.animationSpeeds));
            }

        } else {
            animationSpeedsDiv.classList.add('hide');
        }
    }

    _handleGameSection() {

    }

    _updateTempOptions() {
        if (!this.tempSettings) return;
        const deckColorRed = document.getElementById('reddeck');
        const deckColorBlue = document.getElementById('bluedeck');

        this.tempSettings.renderer.redDeck = deckColorRed.checked;

        const draggedCardsChkbox = document.getElementById('feedbackDragged');
        const draggedOverChkbox = document.getElementById('feedbackDragOver');

        this.tempSettings.renderer.feedbackDragged = !!draggedCardsChkbox.checked;
        this.tempSettings.renderer.feedbackDragOver = !!draggedOverChkbox.checked;

        const animationsChkbox = document.getElementById('enableAnimations');

        this.tempSettings.renderer.enableAnimations = !!animationsChkbox.checked;

        if (this.tempSettings.renderer.enableAnimations) {
            const selectSpeed = document.getElementById('animationSpeeds');
            this.tempSettings.renderer.animationSpeeds = ANIMATION_SPEED_PRESETS[selectSpeed.value.toLowerCase()];
        }
    }

    // About Actions

    onAboutClicked() {

    }

    // Fast-forward/undo/redo



    get currentSettings() {
        const renderer = this.rendererSettings;
        const game = this.gameSettings;
        const audio = this.audioSettings;
        return {
            game,
            renderer,
            audio,
        }
    }

    // Retrieving localStorage - throws if unsuccessful

    get _localSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('allSettings'));
            const renderer = settings.renderer;
            const game = settings.game;
            const audio = settings.audio;
            return {
                game,
                renderer,
                audio,
            }
        } catch (e) {
            console.warn(`Couldn't load local store:\n`, e);
            throw e;
        }
    }

    // use this to get a valid setting, will return defaults or current if fails to load localStorage

    loadLocalSettings() {
        try {
            const settings = this._localSettings;
            this.gameSettings = settings.game;
            this.rendererSettings = settings.renderer;
            this.audioSettings = settings.audio;
        } catch (e) {
            console.warn('Loading defaults/current settings');
            return this.currentSettings;
        }
    }

    // saving settings to localStorage

    saveSettingsLocal() {
        try {
            localStorage.setItem('allSettings', JSON.stringify(this.currentSettings));
        } catch (e) {
            console.error('Failed to save settings.', e);
        }
    }
}