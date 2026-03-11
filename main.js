import { Game } from './game.js';

let currentGame = null;
let currentLevel = 1;
let score = 0;
let timer = 0;
let timerInterval = null;
let currentLang = 'zh';

const boardElement = document.getElementById('game-board');
const scoreValue = document.getElementById('score-value');
const levelValue = document.getElementById('level-value');
const timerValue = document.getElementById('timer-value');
const uiOverlay = document.getElementById('ui-overlay');
const startScreen = document.getElementById('start-screen');
const nextLevelBtn = document.getElementById('next-level-btn');
const startGameBtn = document.getElementById('start-game-btn');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');

const i18n = {
    zh: {
        subtitle: '考验你的色彩灵敏度',
        startBtn: '开始游戏',
        levelLabel: '关卡',
        scoreLabel: '得分',
        timeLabel: '用时',
        shuffleBtn: '打乱',
        restartBtn: '重置',
        nextLevel: '进入下一关',
        winTitle: '<span class="trophy">🏆</span>恭喜通关！',
        winMsg8: '恭喜成为顶级设计师！你的色彩敏锐度非常惊人。',
        levelComplete: '关卡 {level} 完成！',
        levelMsg: '色彩敏锐度非常出色，准备好下一关了吗？',
        restartGame: '重新挑战'
    },
    en: {
        subtitle: 'Test your color sensitivity',
        startBtn: 'Start Game',
        levelLabel: 'LEVEL',
        scoreLabel: 'SCORE',
        timeLabel: 'TIME',
        shuffleBtn: 'Shuffle',
        restartBtn: 'Restart',
        nextLevel: 'Next Level',
        winTitle: '<span class="trophy">🏆</span>Game Complete!',
        winMsg8: 'Congrats, you are a Top Designer! Your color vision is elite.',
        levelComplete: 'Level {level} Complete!',
        levelMsg: 'Excellent color acuity. Ready for the next challenge?',
        restartGame: 'Play Again'
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
    const satBase = theme.saturation !== undefined ? theme.saturation : 60;
    
    for (let i = 0; i < count; i++) {
        const s = satBase === 0 ? 0 : (satBase + Math.random() * 10); 
        const l = 30 + (i / count) * 40; 
        colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
    }
    return colors;
}

function initLevel(level) {
    let rows, cols, pairs, colors;
    boardElement.className = '';

    if (level === 1) {
        rows = 2; cols = 2; pairs = 2;
        colors = ['#ff4b2b', '#6366f1']; 
        boardElement.classList.add('density-low');
    } else if (level <= 8) {
        rows = 6; cols = 6; pairs = 18;
        const theme = shuffledThemes[level - 2];
        colors = generateSimilarColors(pairs, theme);
        boardElement.classList.add('density-medium');
    }

    currentGame = new Game({ rows, cols, pairs, colors, score });
    renderBoard();
    updateStats();
    startTimer();
}

function renderBoard() {
    boardElement.style.gridTemplateColumns = `repeat(${currentGame.cols}, var(--block-size))`;
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
        const el = document.getElementById(result.block.id);
        el.classList.add('selected');
    } else if (result.action === 'match') {
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
                showLevelComplete();
            }
        }, 500);
    }
}

function updateStats() {
    scoreValue.textContent = score;
    levelValue.textContent = currentLevel;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        const mins = Math.floor(timer / 60).toString().padStart(2, '0');
        const secs = (timer % 60).toString().padStart(2, '0');
        timerValue.textContent = `${mins}:${secs}`;
    }, 1000);
}

function showLevelComplete() {
    clearInterval(timerInterval);
    uiOverlay.classList.remove('hidden');
    
    const t = i18n[currentLang];
    if (currentLevel === 8) {
        modalTitle.innerHTML = t.winTitle;
        modalMsg.textContent = t.winMsg8;
        nextLevelBtn.textContent = t.restartGame;
    } else {
        modalTitle.textContent = t.levelComplete.replace('{level}', currentLevel);
        modalMsg.textContent = t.levelMsg;
        nextLevelBtn.textContent = t.nextLevel;
    }
}

// Event Listeners
startGameBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    initLevel(currentLevel);
});

nextLevelBtn.addEventListener('click', () => {
    if (currentLevel === 8) {
        currentLevel = 1;
        score = 0;
        shuffledThemes = [...themes].sort(() => Math.random() - 0.5);
    } else {
        currentLevel++;
    }
    uiOverlay.classList.add('hidden');
    initLevel(currentLevel);
});

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLanguage(btn.getAttribute('data-lang'));
    });
});

document.getElementById('restart-btn').addEventListener('click', () => {
    initLevel(currentLevel);
});

document.getElementById('shuffle-btn').addEventListener('click', () => {
    currentGame.shuffle();
    renderBoard();
});

// Initial Setup
updateLanguage('zh');
