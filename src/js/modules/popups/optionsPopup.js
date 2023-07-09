import { fadeInOutElement } from "../utils.js";
import eventSystem from "../eventSystem.js";

// ~~~~Options Popup~~~~
const optionsHeading = document.createElement('h1');
optionsHeading.innerText = "OPTIONS";
const optionsArea = document.createElement('div');
optionsArea.style.display = 'flex';
optionsArea.style.justifyContent = 'center';
optionsArea.style.alignItems = 'stretch';
optionsArea.id = "options-area";

//vertical-rule
const vr = document.createElement('div');
vr.style.display = 'flex';
vr.style.alignItems = 'center';
vr.style.margin = '0 20px';
vr.style.borderLeft = '1px solid white';
// how do you make a vertical rule on a flex-layout
// without specifying a fixed height for containers or parents?
// simple: you use the magic of invisible SVGs :)
const svgDot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svgDot.setAttribute("width", "5");
svgDot.setAttribute("height", "5");
svgDot.style.opacity = '0';
const svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
svgCircle.setAttribute("cx", "0.5");
svgCircle.setAttribute("cy", "0.5");
svgCircle.setAttribute("r", "0.5");
svgDot.appendChild(svgCircle);
vr.appendChild(svgDot);

const gameSettingsArea = document.createElement('div');
gameSettingsArea.style.display = 'flex';
gameSettingsArea.style.flexDirection = 'column';
gameSettingsArea.style.alignItems = 'center';
gameSettingsArea.style.justifyContent = 'flex-start';
const soundSettingsArea = document.createElement('div');
soundSettingsArea.style.display = 'flex';
soundSettingsArea.style.flexDirection = 'column';
soundSettingsArea.style.alignItems = 'center';
soundSettingsArea.style.justifyContent = 'center';
const gameSettingsHeading = document.createElement('h2');
gameSettingsHeading.innerText = 'Game Settings';
gameSettingsHeading.style.textAlign = "center";
const gameDifficultySelect = document.createElement('select');
gameDifficultySelect.innerHTML = `
    <option value="1">Draw-1</option>
    <option value="3">Draw-3</option>
`;
const gameDifficultyContainer = document.createElement('div');
gameDifficultyContainer.style.display = 'flex';
gameDifficultyContainer.style.flexDirection = 'column';
gameDifficultyContainer.style.alignItems = 'center';
gameDifficultyContainer.style.justifyContent = 'center';

const difficulties = [1, 3];
difficulties.forEach(difficulty => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = `draw-${difficulty}`;
    radio.name = 'difficulty';
    radio.value = difficulty

    const label = document.createElement('label');
    label.innerHTML = `Draw-${difficulty}`;
    label.htmlFor = `draw-${difficulty}`;

    gameDifficultyContainer.appendChild(label);
    gameDifficultyContainer.appendChild(radio);
});

gameSettingsArea.appendChild(gameSettingsHeading);
gameSettingsArea.appendChild(gameDifficultyContainer);

const soundSettingsHeading = document.createElement('h2');
soundSettingsHeading.innerText = 'Sound Settings';
const musicCheckbox = document.createElement('input');
musicCheckbox.type = 'checkbox';
musicCheckbox.id = 'musicCheckbox';
const soundFxCheckbox = document.createElement('input');
soundFxCheckbox.type = 'checkbox';
soundFxCheckbox.id = 'soundFxCheckbox';
const musicLabel = document.createElement('label');
const sub = document.createElement('sub');
sub.innerText = "Music will begin downloading when enabled";
sub.style.textAlign = 'center';
sub.style.marginTop = '1em';
musicLabel.innerHTML = 'Enable Music';
musicLabel.htmlFor = 'musicCheckbox';

const soundFxLabel = document.createElement('label');
soundFxLabel.innerHTML = 'Enable Sound FX';
soundFxLabel.htmlFor = 'soundFxCheckbox';
const musicSlider = document.createElement('input');
musicSlider.type = 'range';
musicSlider.value = 50;
musicSlider.id = 'musicSlider';
const soundFxSlider = document.createElement('input');
soundFxSlider.type = 'range';
soundFxSlider.value = 50;
soundFxSlider.id = 'soundFxSlider';
soundSettingsArea.appendChild(soundSettingsHeading);
soundSettingsArea.appendChild(musicLabel);
soundSettingsArea.appendChild(musicCheckbox);
soundSettingsArea.appendChild(musicSlider);
soundSettingsArea.appendChild(sub);

// for ice-box
// soundSettingsArea.appendChild(soundFxLabel);
// soundSettingsArea.appendChild(soundFxCheckbox);
// soundSettingsArea.appendChild(soundFxSlider);
const btnContainer = document.createElement('div');
btnContainer.style.display = 'flex';
btnContainer.style.justifyContent = 'center';
const applyBtn = document.createElement('button');
applyBtn.style.backgroundColor = 'lime';
applyBtn.style.color = 'black';
applyBtn.innerText = 'Apply';
const applyAndRestartBtn = document.createElement('button');
applyAndRestartBtn.style.backgroundColor = 'lime';
applyAndRestartBtn.style.color = 'black';
applyAndRestartBtn.innerText = 'Apply & Restart';
const cancelBtn = document.createElement('button');
cancelBtn.innerText = 'Cancel';
cancelBtn.style.backgroundColor = 'orange';
cancelBtn.style.color = 'black';
const okBtn = document.createElement('button');
okBtn.innerText = 'OK';
btnContainer.appendChild(applyAndRestartBtn);
btnContainer.appendChild(applyBtn);
btnContainer.appendChild(okBtn);
btnContainer.appendChild(cancelBtn);


optionsArea.appendChild(gameSettingsArea);
optionsArea.appendChild(vr);
optionsArea.appendChild(soundSettingsArea);

export async function buildOptionsPopup(options) {
    const popup = document.querySelector('.popup');
    const popupHeader = document.querySelector('.popup-header');
    const popupContent = document.querySelector('.popup-content');
    const popupFooter = document.querySelector('.popup-footer');
    popupHeader.innerHTML = '';
    popupContent.innerHTML = '';
    popupFooter.innerHTML = '';
    musicCheckbox.checked = options.soundSettings.music_enabled;
    musicSlider.disabled = !musicCheckbox.checked;
    popupHeader.appendChild(optionsHeading);
    popupContent.appendChild(optionsArea);
    popup.className = "popup";
    popup.classList.add('options-popup');
    for (const option of gameDifficultyContainer.children) {
        if (option.value == options.difficulty) {
            option.checked = true;
        } else {

        }
    }
    popupFooter.appendChild(btnContainer);
    applyAndRestartBtn.style.display = 'none';
    applyBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    okBtn.style.display = 'inline-block';
}

export function optionsPopupClickHandler(evt, options) {
    const newGameOpts = {};
    const newSoundOpts = {};
    for (const radio of gameDifficultyContainer.children) {
        if (radio.tagName === 'INPUT') {
            if (radio.checked) {
                newGameOpts.difficulty = radio.value;
            }
        }
    }
    newSoundOpts.music_enabled = musicCheckbox.checked;
    newSoundOpts.music_volume = musicSlider.value / 100;

    if (evt.target === musicCheckbox) {
        musicSlider.disabled = !musicCheckbox.checked;
    } else if (evt.target === okBtn || evt.target === cancelBtn) {
        
        eventSystem.trigger('options-popup-canceled');
    } else if (evt.target === applyBtn) {
        // TODO: make GameOptions class validate settings and apply

        eventSystem.trigger('sound-settings-changed');
    } else if (evt.target === applyAndRestartBtn) {
        eventSystem.trigger('game-ended');
        options.difficulty = newGameOpts.difficulty;


        eventSystem.trigger('game-settings-changed', { gameMode: options.gameMode, difficulty: options.difficulty })
    }

    // Choose which buttons we should display/hide
    let requiresRestart = false;
    let requiresApply = false;
    for (const key in newGameOpts) {
        if (newGameOpts[key] != options[key]) {
            requiresRestart = true;
            break;
        }
    }
    if (!requiresRestart) {
        for (let key in newSoundOpts) {
            if (newSoundOpts[key] != options.soundSettings[key]) {
                requiresApply = true;
                break;
            }
        }
    }

    // Show/hide appropriate buttons
    if (!requiresApply && !requiresRestart) {
        okBtn.style.display = 'inline-block';
        applyAndRestartBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        applyBtn.style.display = 'none';
    } else if (requiresRestart) {
        okBtn.style.display = 'none';
        applyAndRestartBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        applyBtn.style.display = 'none';
    } else {
        okBtn.style.display = 'none';
        applyAndRestartBtn.style.display = 'none';
        cancelBtn.style.display = 'inline-block';
        applyBtn.style.display = 'inline-block';
    }
}