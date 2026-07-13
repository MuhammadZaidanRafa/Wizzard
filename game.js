/* =====================================================
   WIZARD SANCTUARY - Raycasting FPS
   game.js - VERSI FINAL + MUSIK
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const wand = document.getElementById("wand");

const hpUI = document.getElementById("hp-ui");
const scoreUI = document.getElementById("score-ui");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restartBtn");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("startBtn");

// ====================== AUDIO MUSIC ======================
const bgm = document.getElementById("bgm");
bgm.volume = 0.65;   // Atur volume musik di sini

// ====================== KONFIGURASI ======================
const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;

const map = [
    1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,0,1,0,0,0,0,0,1,
    1,0,1,1,0,1,0,1,1,1,0,1,
    1,0,1,0,0,0,0,0,0,1,0,1,
    1,0,1,0,1,1,1,1,0,1,0,1,
    1,0,0,0,1,0,0,1,0,0,0,1,
    1,0,1,0,1,0,0,1,0,1,0,1,
    1,0,1,0,1,1,0,1,0,1,0,1,
    1,0,1,0,0,0,0,0,0,1,0,1,
    1,0,1,1,1,1,0,1,1,1,0,1,
    1,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1
];

// Player
let player = {
    x: 1.5, y: 1.5, angle: 0,
    hp: 100, score: 0, alive: true
};

// Raycasting Settings
const FOV = Math.PI / 3;
const HALF_FOV = FOV / 2;
const NUM_RAYS = 400;
const RAY_WIDTH = canvas.width / NUM_RAYS;
const DELTA_ANGLE = FOV / NUM_RAYS;
const MAX_DEPTH = 16;

// Game Objects
let spells = [];
let enemySpells = [];
let enemies = [];
let gameStarted = false;

// Input
const keys = { w: false, a: false, s: false, d: false };

// Mobile Controls
let moveForward = false;
let moveBackward = false;
let turnLeft = false;
let turnRight = false;

// ====================== EVENT LISTENERS ======================
window.addEventListener("keydown", e => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false;
});

// Mouse Shoot (Desktop)
canvas.addEventListener("mousedown", e => {
    if (!player.alive || !gameStarted || e.button !== 0) return;
    shoot();
});

// ====================== MOBILE CONTROLS ======================
const joystickArea = document.getElementById("joystick-area");
const joystickKnob = document.getElementById("joystick-knob");
const shootBtn = document.getElementById("shoot-btn");

let joystickActive = false;
let joystickCenterX = 0;
let joystickCenterY = 0;

joystickArea.addEventListener("touchstart", e => {
    joystickActive = true;
    const rect = joystickArea.getBoundingClientRect();
    joystickCenterX = rect.left + rect.width / 2;
    joystickCenterY = rect.top + rect.height / 2;
});

joystickArea.addEventListener("touchmove", e => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    let dx = touch.clientX - joystickCenterX;
    let dy = touch.clientY - joystickCenterY;
    const distance = Math.min(45, Math.hypot(dx, dy));

    joystickKnob.style.transform = `translate(${dx * 0.4}px, ${dy * 0.4}px)`;

    moveForward = dy < -15;
    moveBackward = dy > 15;
    turnLeft = dx < -20;
    turnRight = dx > 20;
});

joystickArea.addEventListener("touchend", () => {
    joystickActive = false;
    joystickKnob.style.transform = "translate(-50%, -50%)";
    moveForward = moveBackward = turnLeft = turnRight = false;
});

// Shoot Button (Mobile)
shootBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    if (player.alive && gameStarted) shoot();
});

function shoot() {
    wand.classList.remove("shoot-anim");
    void wand.offsetWidth;
    wand.classList.add("shoot-anim");

    spells.push({
        x: player.x,
        y: player.y,
        dirX: Math.cos(player.angle),
        dirY: Math.sin(player.angle),
        speed: 0.28
    });
}

// ====================== MUSUH ======================
function spawnEnemy() {
    if (!player.alive || enemies.length >= 7) return;

    let rx, ry, tries = 0;
    do {
        rx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        ry = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        tries++;
    } while (tries < 25 && (map[ry * MAP_WIDTH + rx] === 1 || 
           Math.hypot(rx + 0.5 - player.x, ry + 0.5 - player.y) < 4));

    if (tries >= 25) return;

    const colors = ['#ef4444', '#f97316', '#ec4899', '#8b5cf6'];
    
    enemies.push({
        x: rx + 0.5,
        y: ry + 0.5,
        hp: 3,
        speed: 0.023,
        color: colors[Math.floor(Math.random() * colors.length)],
        lastShot: Date.now(),
        bob: Math.random() * 100
    });
}

// ====================== START & GAME OVER ======================
function startGame() {
    gameStarted = true;
    startScreen.style.display = "none";

    player = { x: 1.5, y: 1.5, angle: 0, hp: 100, score: 0, alive: true };
    spells = [];
    enemySpells = [];
    enemies = [];
    for (let i = 0; i < 4; i++) spawnEnemy();

    hpUI.textContent = "100";
    scoreUI.textContent = "0";

    // PUTAR MUSIK
    bgm.play().catch(err => {
        console.log("Musik tidak bisa diputar otomatis:", err);
    });
}

function triggerGameOver() {
    player.alive = false;
    gameStarted = false;
    finalScore.textContent = player.score;
    gameOverScreen.style.display = "flex";

    // MATIKAN MUSIK SAAT GAME OVER
    bgm.pause();
}

// ====================== UPDATE ======================
function update() {
    if (!player.alive || !gameStarted) return;

    const moveSpeed = 0.065;
    const rotSpeed = 0.045;

    if (keys.a || turnLeft) player.angle -= rotSpeed;
    if (keys.d || turnRight) player.angle += rotSpeed;

    const dx = Math.cos(player.angle) * moveSpeed;
    const dy = Math.sin(player.angle) * moveSpeed;

    if (keys.w || moveForward) {
        if (map[Math.floor(player.y) * MAP_WIDTH + Math.floor(player.x + dx * 3)] === 0) player.x += dx;
        if (map[Math.floor(player.y + dy * 3) * MAP_WIDTH + Math.floor(player.x)] === 0) player.y += dy;
    }
    if (keys.s || moveBackward) {
        if (map[Math.floor(player.y) * MAP_WIDTH + Math.floor(player.x - dx * 3)] === 0) player.x -= dx;
        if (map[Math.floor(player.y - dy * 3) * MAP_WIDTH + Math.floor(player.x)] === 0) player.y -= dy;
    }

    // Player Spells
    for (let i = spells.length - 1; i >= 0; i--) {
        const s = spells[i];
        s.x += s.dirX * s.speed;
        s.y += s.dirY * s.speed;

        if (map[Math.floor(s.y) * MAP_WIDTH + Math.floor(s.x)] === 1) {
            spells.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(e.x - s.x, e.y - s.y) < 0.45) {
                e.hp--;
                spells.splice(i, 1);
                if (e.hp <= 0) {
                    enemies.splice(j, 1);
                    player.score += 20;
                    scoreUI.textContent = player.score;
                }
                break;
            }
        }
    }

    // Enemies AI + Shooting
    const now = Date.now();
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const edx = player.x - e.x;
        const edy = player.y - e.y;
        const dist = Math.hypot(edx, edy);
        e.bob += 0.12;

        if (dist > 3) {
            const nx = e.x + (edx / dist) * e.speed;
            const ny = e.y + (edy / dist) * e.speed;
            if (map[Math.floor(e.y) * MAP_WIDTH + Math.floor(nx)] === 0) e.x = nx;
            if (map[Math.floor(ny) * MAP_WIDTH + Math.floor(e.x)] === 0) e.y = ny;
        }

        if (dist < 8 && now - e.lastShot > 1800) {
            const angle = Math.atan2(edy, edx) + (Math.random() - 0.5) * 0.15;
            enemySpells.push({
                x: e.x, y: e.y,
                dirX: Math.cos(angle), dirY: Math.sin(angle),
                speed: 0.13, color: '#f87171'
            });
            e.lastShot = now;
        }
    }

    // Enemy Spells
    for (let i = enemySpells.length - 1; i >= 0; i--) {
        const es = enemySpells[i];
        es.x += es.dirX * es.speed;
        es.y += es.dirY * es.speed;

        if (map[Math.floor(es.y) * MAP_WIDTH + Math.floor(es.x)] === 1) {
            enemySpells.splice(i, 1);
            continue;
        }

        if (Math.hypot(player.x - es.x, player.y - es.y) < 0.4) {
            player.hp -= 18;
            hpUI.textContent = Math.max(0, Math.floor(player.hp));
            enemySpells.splice(i, 1);
            if (player.hp <= 0) triggerGameOver();
        }
    }
}

// ====================== DRAW ======================
function draw() {
    ctx.fillStyle = "#0f0a1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#1f1a2e";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    const depthBuffer = [];

    for (let i = 0; i < NUM_RAYS; i++) {
        const rayAngle = (player.angle - HALF_FOV) + (i * DELTA_ANGLE);
        let distance = 0;
        let hit = false;

        const eyeX = Math.cos(rayAngle);
        const eyeY = Math.sin(rayAngle);

        while (!hit && distance < MAX_DEPTH) {
            distance += 0.04;
            const tx = Math.floor(player.x + eyeX * distance);
            const ty = Math.floor(player.y + eyeY * distance);

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
                hit = true;
            } else if (map[ty * MAP_WIDTH + tx] === 1) {
                hit = true;
            }
        }

        const correctedDist = distance * Math.cos(rayAngle - player.angle);
        depthBuffer[i] = correctedDist;

        const wallHeight = Math.min(canvas.height, canvas.height / correctedDist);
        const shade = Math.max(0.15, 1 - (correctedDist / MAX_DEPTH) * 0.85);

        ctx.fillStyle = `rgb(${40*shade}, ${25*shade}, ${70*shade})`;
        ctx.fillRect(i * RAY_WIDTH, (canvas.height - wallHeight)/2, RAY_WIDTH + 1, wallHeight);
    }

    let sprites = [];

    enemies.forEach(e => {
        sprites.push({ x: e.x, y: e.y, type: 'enemy', color: e.color, bob: Math.sin(e.bob)*0.12 });
    });
    spells.forEach(s => sprites.push({ x: s.x, y: s.y, type: 'spell', color: '#67e8f9', size: 0.18 }));
    enemySpells.forEach(es => sprites.push({ x: es.x, y: es.y, type: 'spell', color: es.color, size: 0.16 }));

    sprites.forEach(s => {
        const sx = s.x - player.x;
        const sy = s.y - player.y;
        s.dist = Math.hypot(sx, sy);
        let angle = Math.atan2(sy, sx) - player.angle;
        while (angle < -Math.PI) angle += Math.PI*2;
        while (angle > Math.PI) angle -= Math.PI*2;
        s.angle = angle;
    });

    sprites.sort((a, b) => b.dist - a.dist);

    sprites.forEach(s => {
        if (Math.abs(s.angle) > HALF_FOV + 0.5 || s.dist < 0.3) return;

        const spriteSize = (canvas.height / s.dist) * (s.size || 0.65);
        const screenX = ((s.angle + HALF_FOV) / FOV) * canvas.width - spriteSize / 2;
        const screenY = canvas.height / 2 - spriteSize / 2 + (s.bob ? s.bob * (canvas.height / s.dist) : 0);

        for (let col = 0; col < spriteSize; col++) {
            const px = Math.floor(screenX + col);
            const rayIdx = Math.floor((s.angle + HALF_FOV) / DELTA_ANGLE + col * (NUM_RAYS / spriteSize) - NUM_RAYS / 20);

            if (px >= 0 && px < canvas.width && rayIdx >= 0 && rayIdx < NUM_RAYS) {
                if (depthBuffer[rayIdx] > s.dist) {
                    ctx.fillStyle = s.color;
                    if (s.type === 'spell') {
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = s.color;
                    }
                    ctx.fillRect(px, screenY, 2, spriteSize);
                    ctx.shadowBlur = 0;
                }
            }
        }
    });
}

// ====================== GAME LOOP ======================
function gameLoop() {
    if (gameStarted) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// ====================== BUTTON EVENTS ======================
startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", () => {
    gameOverScreen.style.display = "none";
    startGame();
});

// Spawn interval
setInterval(() => {
    if (gameStarted && player.alive) spawnEnemy();
}, 3800);

// Mulai Game
gameLoop();
