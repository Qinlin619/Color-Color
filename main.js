import { Game } from './game.js';
import { audio } from './audio.js';

let currentGame = null;
let currentLevel = 1;
let score = 0;
let timer = 0;
let timerInterval = null;
let currentLang = 'zh';
let totalMismatches = 0;
let currentMode = 'rainbow'; // 'rainbow' or 'morandi'
let sessionTime = 0; // Total time for all levels in a session
let completedModes = JSON.parse(localStorage.getItem('completedModes')) || {
    rainbow: false,
    morandi: false,
    macaron: false,
    matisse: false
};

const boardElement = document.getElementById('game-board');
const timerValue = document.getElementById('timer-value');
const uiOverlay = document.getElementById('ui-overlay');
const startScreen = document.getElementById('start-screen');
const paletteScreen = document.getElementById('palette-screen');
const nextLevelBtn = document.getElementById('next-level-btn');
const startGameBtn = document.getElementById('start-game-btn');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const modalIcon = document.getElementById('modal-icon');

const i18n = {
    zh: {
        subtitle: 'match the ketchup',
        producer: '制作人：伞伞',
        startBtn: '开始调色',
        paletteTitle: '调色盘',
        rainbowMode: '彩虹色板',
        morandiMode: '莫兰迪色板',
        macaronMode: '马卡龙色板',
        matisseMode: '马蒂斯色板',
        backBtn: '返回',
        levelLabel: '关卡',
        timeLabel: '用时',
        menuBtn: '回到调色盘',
        shuffleBtn: '打乱',
        restartBtn: '重置',
        nextLevel: '进入下一关',
        winTitle: '<span class="trophy">🏆</span>恭喜通关！',
        winMsg8: '恭喜成为顶级设计师！你的色彩敏锐度非常惊人。',
        restartGame: '重新挑战',
        failTitle: '时间到！',
        failMsg: '别灰心，下次一定可以！',
        completedLabel: 'Color Match',
        levelComplete: '关卡 {level} 完成！',
        levelMsg: '干得漂亮！继续挑战吗？',
        mismatchLabel: '看走眼次数: {count}',
        mismatchLabelShort: '看走眼次数'
    },
    en: {
        subtitle: 'match the ketchup',
        producer: 'Produced by: Umbrella',
        startBtn: 'START PAINTING',
        paletteTitle: 'PALETTE',
        rainbowMode: 'Rainbow Palette',
        morandiMode: 'Morandi Palette',
        macaronMode: 'Macaron Palette',
        matisseMode: 'Matisse Palette',
        backBtn: 'BACK',
        levelLabel: 'LEVEL',
        timeLabel: 'TIME',
        menuBtn: 'BACK TO PALETTE',
        shuffleBtn: 'Shuffle',
        restartBtn: 'Restart',
        nextLevel: 'Next Level',
        winTitle: '<span class="trophy">🏆</span>Game Complete!',
        winMsg8: 'Congrats, you are a Top Designer! Your color vision is elite.',
        restartGame: 'Play Again',
        failTitle: 'TIME UP!',
        failMsg: "Don't give up, try again!",
        completedLabel: 'Color Match',
        levelComplete: 'Level {level} Complete!',
        levelMsg: 'Great job! Ready for more?',
        mismatchLabel: 'Mismatches: {count}',
        mismatchLabelShort: 'Mismatches'
    }
};

const themes = [
    { name: '红', hue: 0 },
    { name: '橙', hue: 30 },
    { name: '黄', hue: 50 },
    { name: '绿', hue: 120 },
    { name: '蓝', hue: 210 },
    { name: '紫', hue: 280 },
    { name: '灰', saturation: 0 }
];

const morandiThemes = [
    { name: '暮玫瑰', hue: 5, saturation: 12, lightness: 62 },
    { name: '石板青', hue: 195, saturation: 10, lightness: 58 },
    { name: '灰鼠色', hue: 35, saturation: 8, lightness: 60 },
    { name: '苍艾草', hue: 145, saturation: 12, lightness: 64 },
    { name: '沙砾炭', hue: 25, saturation: 15, lightness: 68 },
    { name: '烟缕蓝', hue: 215, saturation: 14, lightness: 66 },
    { name: '冷陶土', hue: 280, saturation: 6, lightness: 62 }
];

const macaronThemes = [
    { name: '樱花', hue: 350, saturation: 40, lightness: 85 },
    { name: '柠檬', hue: 60, saturation: 45, lightness: 88 },
    { name: '薄荷', hue: 160, saturation: 35, lightness: 85 },
    { name: '天空', hue: 200, saturation: 40, lightness: 88 },
    { name: '薰衣草', hue: 270, saturation: 30, lightness: 86 },
    { name: '奶油', hue: 40, saturation: 40, lightness: 90 },
    { name: '蜜桃', hue: 15, saturation: 45, lightness: 86 }
];

const matisseThemes = [
    { name: '野兽红', hue: 355, saturation: 85, lightness: 50 },
    { name: '金合欢', hue: 50, saturation: 90, lightness: 55 },
    { name: '群青', hue: 220, saturation: 80, lightness: 45 },
    { name: '松石绿', hue: 170, saturation: 75, lightness: 40 },
    { name: '钴紫', hue: 280, saturation: 70, lightness: 50 },
    { name: '深赭', hue: 25, saturation: 80, lightness: 45 },
    { name: '亮橙', hue: 35, saturation: 95, lightness: 55 }
];

let shuffledThemes = [...themes].sort(() => Math.random() - 0.5);

function updateLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            el.innerHTML = i18n[lang][key];
        }
    });

    // Update modal if it's visible
    if (!uiOverlay.classList.contains('hidden')) {
        showLevelComplete();
    }
}

function generateSimilarColors(count, theme) {
    const colors = [];
    const hue = theme.hue !== undefined ? theme.hue : 0;
    
    if (currentMode === 'morandi') {
        const satBase = theme.saturation !== undefined ? theme.saturation : 15;
        const lightBase = theme.lightness !== undefined ? theme.lightness : 70;
        for (let i = 0; i < count; i++) {
            const s = satBase + (Math.random() * 5); 
            const l = lightBase - 15 + (i / count) * 30; // Muted range
            colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
        }
    } else if (currentMode === 'macaron') {
        const satBase = theme.saturation !== undefined ? theme.saturation : 40;
        const lightBase = theme.lightness !== undefined ? theme.lightness : 85;
        for (let i = 0; i < count; i++) {
            const s = satBase + (Math.random() * 10); 
            const l = lightBase - 10 + (i / count) * 20; // Very light/pastel range
            colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
        }
    } else if (currentMode === 'matisse') {
        const satBase = theme.saturation !== undefined ? theme.saturation : 80;
        const lightBase = theme.lightness !== undefined ? theme.lightness : 50;
        for (let i = 0; i < count; i++) {
            const s = satBase - 10 + (Math.random() * 20); 
            const l = lightBase - 15 + (i / count) * 30; // High contrast range
            colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
        }
    } else {
        const satBase = theme.saturation !== undefined ? theme.saturation : 80;
        for (let i = 0; i < count; i++) {
            const s = satBase === 0 ? 0 : (satBase + Math.random() * 10); 
            const l = 45 + (i / count) * 35; // Brighter range: 45% to 80%
            colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
        }
    }
    return colors;
}

function updateBestTimeUI() {
    const modes = ['rainbow', 'morandi', 'macaron', 'matisse'];
    const t = i18n[currentLang];
    modes.forEach(mode => {
        const btn = document.getElementById(`${mode}-mode-btn`);
        if (btn) {
            const timeSpan = btn.querySelector('.best-time');
            if (completedModes[mode]) {
                timeSpan.textContent = t.completedLabel;
                timeSpan.style.display = 'block';
            } else {
                timeSpan.style.display = 'none';
            }
        }
    });
}

function initLevel(level) {
    let rows, cols, pairs, colors;
    boardElement.className = '';

    if (level === 1) {
        rows = 2; cols = 2; pairs = 2;
        if (currentMode === 'morandi') {
            colors = ['#a89c94', '#94a4a8'];
        } else if (currentMode === 'macaron') {
            colors = ['#ffc0cb', '#e0ffff']; // Pink and Mint
        } else if (currentMode === 'matisse') {
            colors = ['#ff4b2b', '#22c55e']; // Bold Red and Green
        } else {
            colors = ['#ff3e8d', '#ffae3e'];
        }
        boardElement.classList.add('density-low');
    } else if (level <= 8) {
        rows = 6; cols = 6; pairs = 18;
        const theme = shuffledThemes[level - 2];
        colors = generateSimilarColors(pairs, theme);
        boardElement.classList.add('density-medium');
    }

    currentGame = new Game({ rows, cols, pairs, colors });
    renderBoard();
    updateStats();
    
    // Reset session time at level 1
    if (level === 1) {
        sessionTime = 0;
    }
    
    startTimer();
}

function renderBoard() {
    boardElement.style.gridTemplateColumns = `repeat(${currentGame.cols}, 1fr)`;
    boardElement.innerHTML = '';

    for (let r = 1; r <= currentGame.rows; r++) {
        for (let c = 1; c <= currentGame.cols; c++) {
            const blockData = currentGame.grid[r][c];
            const div = document.createElement('div');
            div.className = 'block';
            if (!blockData) {
                div.classList.add('hidden');
            } else {
                div.style.backgroundColor = blockData.color;
                div.style.color = blockData.color;
                div.dataset.r = r;
                div.dataset.c = c;
                div.id = blockData.id;
                div.addEventListener('click', () => handleBlockClick(r, c));
            }
            boardElement.appendChild(div);
        }
    }
}

function handleBlockClick(r, c) {
    const result = currentGame.select(r, c);
    if (!result) return;

    document.querySelectorAll('.block').forEach(b => b.classList.remove('selected'));

    if (result.action === 'select') {
        if (result.mismatch) {
            audio.playMismatch();
        } else {
            audio.playSelect();
        }
        const el = document.getElementById(result.block.id);
        el.classList.add('selected');
    } else if (result.action === 'match') {
        audio.playMatch();
        boardElement.style.pointerEvents = 'none';
        result.blocks.forEach(b => {
            const el = document.getElementById(b.id);
            el.classList.add('matched');
        });

        setTimeout(() => {
            renderBoard();
            boardElement.style.pointerEvents = 'auto';
            score = result.score;
            updateStats();
            if (result.isComplete) {
                totalMismatches += currentGame.mismatches;
                showLevelComplete();
            }
        }, 500);
    }
}

function updateStats() {
    updateLevelDots();
}

function updateLevelDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.className = 'dot';
        if (index + 1 < currentLevel) {
            dot.classList.add('completed');
        } else if (index + 1 === currentLevel) {
            dot.classList.add('active');
        }
    });
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    // Set time based on mode
    let timeLimit = 120; // Default: Rainbow (2:00)
    if (currentMode === 'morandi') timeLimit = 110; // 1:50
    else if (currentMode === 'macaron') timeLimit = 100; // 1:40
    else if (currentMode === 'matisse') timeLimit = 90; // 1:30
    
    timer = timeLimit;
    
    // Initial display
    const mins = Math.floor(timer / 60).toString().padStart(2, '0');
    const secs = (timer % 60).toString().padStart(2, '0');
    timerValue.textContent = `${mins}:${secs}`;
    timerValue.style.color = 'inherit';

    timerInterval = setInterval(() => {
        timer--;
        const mins = Math.floor(timer / 60).toString().padStart(2, '0');
        const secs = (timer % 60).toString().padStart(2, '0');
        timerValue.textContent = `${mins}:${secs}`;
        
        if (timer <= 10) {
            timerValue.style.color = '#ff3e8d';
            if (timer % 2 === 0) audio.playClick(); // Ticking sound for last 10s
        }

        if (timer <= 0) {
            clearInterval(timerInterval);
            handleGameOver();
        }
    }, 1000);
}

function handleGameOver() {
    uiOverlay.classList.remove('hidden');
    const t = i18n[currentLang];
    modalIcon.innerHTML = '⏰';
    modalTitle.textContent = t.failTitle;
    modalMsg.textContent = t.failMsg;
    nextLevelBtn.textContent = i18n[currentLang].restartBtn;
    audio.playMismatch();
}

function showLevelComplete() {
    clearInterval(timerInterval);
    sessionTime += timer; // Add current level time to session total
    uiOverlay.classList.remove('hidden');

    const t = i18n[currentLang];
    if (currentLevel === 8) {
        audio.playWin();
        // Mark mode as completed
        completedModes[currentMode] = true;
        localStorage.setItem('completedModes', JSON.stringify(completedModes));
        updateBestTimeUI();

        const mins = Math.floor(sessionTime / 60).toString().padStart(2, '0');
        const secs = (sessionTime % 60).toString().padStart(2, '0');
        const finalTimeStr = `${mins}:${secs}`;

        modalIcon.innerHTML = '👑';
        modalTitle.innerHTML = t.winTitle;
        modalMsg.innerHTML = `${t.winMsg8}<br><br>` +
                           `<div style="display:flex; justify-content:center; gap:1.5rem; margin-top:0.5rem; font-size:0.9rem; font-weight:600;">` +
                           `<span>${t.mismatchLabelShort}: ${totalMismatches}</span>` +
                           `</div>`;
        nextLevelBtn.textContent = t.restartGame;
    } else {
        modalIcon.innerHTML = '✨';
        modalTitle.textContent = t.levelComplete.replace('{level}', currentLevel);
        modalMsg.textContent = t.levelMsg;
        nextLevelBtn.textContent = t.nextLevel;
        audio.playLevelComplete();
    }
}

// Event Listeners
startGameBtn.addEventListener('click', () => {
    audio.playClick();
    audio.playBGM();
    startScreen.classList.add('hidden');
    paletteScreen.classList.remove('hidden');
    updateBestTimeUI();
});

document.getElementById('rainbow-mode-btn').addEventListener('click', () => {
    audio.playClick();
    currentMode = 'rainbow';
    shuffledThemes = [...themes].sort(() => Math.random() - 0.5);
    paletteScreen.classList.add('hidden');
    initLevel(currentLevel);
});

document.getElementById('morandi-mode-btn').addEventListener('click', () => {
    audio.playClick();
    currentMode = 'morandi';
    shuffledThemes = [...morandiThemes].sort(() => Math.random() - 0.5);
    paletteScreen.classList.add('hidden');
    initLevel(currentLevel);
});

document.getElementById('macaron-mode-btn').addEventListener('click', () => {
    audio.playClick();
    currentMode = 'macaron';
    shuffledThemes = [...macaronThemes].sort(() => Math.random() - 0.5);
    paletteScreen.classList.add('hidden');
    initLevel(currentLevel);
});

document.getElementById('matisse-mode-btn').addEventListener('click', () => {
    audio.playClick();
    currentMode = 'matisse';
    shuffledThemes = [...matisseThemes].sort(() => Math.random() - 0.5);
    paletteScreen.classList.add('hidden');
    initLevel(currentLevel);
});

document.getElementById('palette-back-btn').addEventListener('click', () => {
    audio.playClick();
    paletteScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

nextLevelBtn.addEventListener('click', () => {
    audio.playClick();
    
    // If we failed (timer ran out), reset to level 1
    if (timer <= 0) {
        currentLevel = 1;
        totalMismatches = 0;
        sessionTime = 0;
    } else if (currentLevel === 8) {
        currentLevel = 1;
        totalMismatches = 0;
        sessionTime = 0;
    } else {
        currentLevel++;
    }

    // Refresh themes for the mode
    let baseThemes;
    if (currentMode === 'morandi') baseThemes = morandiThemes;
    else if (currentMode === 'macaron') baseThemes = macaronThemes;
    else if (currentMode === 'matisse') baseThemes = matisseThemes;
    else baseThemes = themes;
    shuffledThemes = [...baseThemes].sort(() => Math.random() - 0.5);

    uiOverlay.classList.add('hidden');
    initLevel(currentLevel);
});

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLanguage(btn.getAttribute('data-lang'));
    });
});

document.getElementById('restart-btn').addEventListener('click', () => {
    audio.playClick();
    initLevel(currentLevel);
});

document.getElementById('shuffle-btn').addEventListener('click', () => {
    audio.playClick();
    currentGame.shuffle();
    renderBoard();
});

document.getElementById('menu-btn').addEventListener('click', () => {
    audio.playClick();
    clearInterval(timerInterval);
    paletteScreen.classList.remove('hidden');
    currentLevel = 1;
    totalMismatches = 0;
    timer = 0;
    timerValue.textContent = '00:00';
});

// Initial Setup
updateLanguage('zh');

// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
const rootBody = document.body;

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    rootBody.classList.add('dark-mode');
}

themeBtn.addEventListener('click', () => {
    audio.playClick();
    rootBody.classList.toggle('dark-mode');
    const isDarkMode = rootBody.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Smooth pulse effect on button
    themeBtn.style.transform = 'scale(0.8) rotate(180deg)';
    setTimeout(() => {
        themeBtn.style.transform = '';
    }, 300);
});

// Audio Toggle Logic
const audioBtn = document.getElementById('audio-toggle');
if (audio.isMuted) {
    audioBtn.classList.add('muted');
}

audioBtn.addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    audioBtn.classList.toggle('muted', isMuted);
    
    if (!isMuted) {
        audio.playClick();
    }

    // Animation
    audioBtn.style.transform = 'scale(0.8)';
    setTimeout(() => {
        audioBtn.style.transform = '';
    }, 300);
});
