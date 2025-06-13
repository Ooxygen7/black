// =================================
//  1. 初始化和设置
// =================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const UI_SCALE = 0.8;
canvas.width = 1600 * UI_SCALE;
canvas.height = 1000 * UI_SCALE;

// =================================
//  2. 游戏配置
// =================================
const TANK_TYPES = {
    CANNON: { name: '炮弹坦克', color: '#2ecc71', maxHp: 15, fireRate: 500, bulletDamage: 4, description: '射速和伤害适中。适合全距离作战'},
    MACHINE_GUN: { name: '机枪坦克', color: '#3498db', maxHp: 20, fireRate: 250, bulletDamage: 0.3, description: '高血量，通过高射速的散射弹幕压制敌人' },
    MORTAR: { name: '迫击炮坦克', color: '#e74c3c', maxHp: 8, fireRate: 3000, bulletDamage: 8, description: '对指定区域进行打击。适合超射程作战' },
    SNIPER: { name: '狙击坦克', color: '#9b59b6', maxHp: 8, fireRate: 2000, bulletDamage: 10, description: '远程精准打击，距离越远伤害越高。' },
    FLAMETHROWER: { name: '火焰坦克', color: '#e67e22', maxHp: 20, fireRate: 100, bulletDamage: 0.4, description: '近距离喷吐可穿透敌人的火焰。血量较高' }
};

const SKILLS = {
    BERSERK: { name: '狂暴模式', description: '启用后攻击间隔-30%', cooldown: 15000, duration: 5000 },
    SHIELD: { name: '护盾发生', description: '启用后立刻进入无敌状态', cooldown: 20000, duration: 5000 },
    DAMAGE_BOOST: { name: '攻击加强', description: '启用后伤害+20%', cooldown: 15000, duration: 5000 },
    SENTRY_GUN: { name: '哨戒机枪', description: '放置一个自动攻击的机枪炮塔', cooldown: 40000, duration: 20000 },
    LIFE_STEAL: { name: '血量汲取', description: '启用后命中时恢复伤害33%的生命', cooldown: 15000, duration: 5000 },
    ARTILLERY_BARRAGE: { name: '弹幕掩护', description: '在随机位置呼叫5轮延迟炮击', cooldown: 30000, duration: 6000 }
};

const MODULES = {
    CANNON: {
        MODULE_1: { name: '音速弹', description: '炮弹速度x2，基础伤害降低为3' },
        MODULE_2: { name: '震爆炮弹', description: '命中时眩晕敌人0.2秒' }
    },
    MACHINE_GUN: {
        MODULE_1: { name: '五联装机枪', description: '每轮齐射变为五发子弹' },
        MODULE_2: { name: '加特林机枪', description: '按住预热，射速越来越快，移速降低60%' }
    },
    MORTAR: {
        MODULE_1: { name: '殉爆炮弹', description: '落地1秒后再次爆炸' },
        MODULE_2: { name: '连珠炮弹', description: '点按三次后齐射三发炮弹' }
    },
    SNIPER: {
        MODULE_1: { name: '蓄能狙击', description: '长按蓄力，伤害更高，移速降低70%' },
        MODULE_2: { name: '隐匿狙击', description: '静止1秒后隐身，移动不破隐' } //【更新】
    },
    FLAMETHROWER: {
        MODULE_1: { name: '反应装甲', description: '被攻击时反伤，并每秒恢复2%生命' }, //【更新】
        MODULE_2: { name: '燃烧反应', description: '攻击附加3秒虚弱效果' }
    }
};


const DIFFICULTIES = {
    EASY: { name: '简单-6个敌人', enemyCount: 6 },
    MEDIUM: { name: '中等-8个敌人', enemyCount: 8 },
    HARD: { name: '困难-10个敌人', enemyCount: 10 },
    IMPOSSIBLE: { name: '不可能-14个敌人', enemyCount: 14 }
};

const ENEMY_HP = 10;
const AI_AGGRO_RADIUS = 350;
const AI_DEAGGRO_RADIUS = 500;
const AI_MIN_ATTACK_DISTANCE = 150;
const SENTRY_GUN_CONFIG = {
    hp: 15,
    fireRate: 100,
    bulletDamage: 0.4,
    range: 320 * UI_SCALE,
    color: '#E0E0E0'
};
const REACTIVE_ARMOR_CONFIG = {
    damage: 2,
    range: 150 * UI_SCALE,
    cooldown: 500
};
const artillerySound = new Audio('audio/daodan.mp3');
const hitSound = new Audio('audio/hit.mp3');
const killSound = new Audio('audio/kill.mp3');
const chargeShotSound = new Audio('audio/xulishoot.mp3');
const sniperSound = new Audio('audio/jvjishoot.mp3');
const machineGunSound = new Audio('audio/jiqiangshoot.mp3');
const cannonSound = new Audio('audio/paoshoot.mp3');
const mortarFireSound = new Audio('audio/paijipao.mp3');
const explosionSound = new Audio('audio/boom.mp3');
const flamethrowerSound = new Audio('audio/fire.mp3');
flamethrowerSound.loop = true;
const sentryDeploySound = new Audio('audio/shaobing.mp3');
const sentryShootSound = new Audio('audio/shaobingshoot.mp3');
const berserkSound = new Audio('audio/powerup.mp3');
const damageBoostSound = new Audio('audio/damage.mp3');
const shieldSound = new Audio('audio/shield.mp3');
const lifeStealSound = new Audio('audio/blood.mp3');
const enemyShootSound = new Audio('audio/ems.mp3');
const gatlingSound = new Audio('audio/jiatelin.mp3');

const allSounds = [artillerySound, hitSound, killSound, chargeShotSound, sniperSound, cannonSound, mortarFireSound, explosionSound, machineGunSound, flamethrowerSound, sentryDeploySound, sentryShootSound, berserkSound, damageBoostSound, shieldSound, lifeStealSound, enemyShootSound, gatlingSound];


// =================================
//  3. 游戏状态管理
// =================================
let gameState = 'splashScreen';
let selectedTankType = null;
let selectedDifficulty = 'EASY';
let selectedSkills = { q: 'BERSERK', e: 'SHIELD' };
let selectedModule = null;
let hoveredTank = null;
let hoveredModule = null;
let animationFrame = 0;
let splashScreenStartTime = 0;
const SPLASH_DURATION = 1000;
let flamethrowerUnlocked = true;
let artilleryUnlocked = true;
let updateModalClosed = false;

let player = {};
let enemies = [];
let friendlies = [];
let projectiles = [];
let obstacles = [];
const mouse = { x: 0, y: 0, clicked: false };
const keys = {};

let scoreFeed = [];

// =================================
//  4. 选择与结束界面逻辑
// =================================
const selectionScreenUI = {
    title: { text: '选择你的装备', x: canvas.width / 2, y: 80 * UI_SCALE, font: `${50 * UI_SCALE}px Arial`, color: 'white' },
    tankTitle: { text: '选择坦克', x: 250 * UI_SCALE, y: 180 * UI_SCALE, font: `${30 * UI_SCALE}px Arial` },
    moduleTitle: { text: '选择模组', x: 575 * UI_SCALE, y: 180 * UI_SCALE, font: `${30 * UI_SCALE}px Arial` },
    skillTitle: { text: '选择技能 (Q / E)', x: 1100 * UI_SCALE, y: 180 * UI_SCALE, font: `${30 * UI_SCALE}px Arial` },
    nextButton: { x: canvas.width / 2 - (100 * UI_SCALE), y: canvas.height - (120 * UI_SCALE), width: 200 * UI_SCALE, height: 50 * UI_SCALE, text: '选择难度' },
    tankButtons: [],
    moduleButtons: [],
    skillButtons: { q: [], e: [] }
};
const difficultyScreenUI = {
    title: { text: '选择游戏难度', x: canvas.width/2, y: 200 * UI_SCALE, font: `${50*UI_SCALE}px Arial`},
    buttons: [],
    startButton: { x: canvas.width / 2 - (100 * UI_SCALE), y: canvas.height - (120 * UI_SCALE), width: 200 * UI_SCALE, height: 50 * UI_SCALE, text: '开始游戏' },
    backButton: { x: 50 * UI_SCALE, y: canvas.height - (80 * UI_SCALE), width: 150 * UI_SCALE, height: 50 * UI_SCALE, text: '返回' }
};
const endScreenUI = {
    button: { x: canvas.width / 2 - (100 * UI_SCALE), y: canvas.height / 2 + (50 * UI_SCALE), width: 200 * UI_SCALE, height: 50 * UI_SCALE, text: '确定' }
};

function setupUI() {
    selectionScreenUI.tankButtons = [];
    let yPos = 220 * UI_SCALE;
    for (const type in TANK_TYPES) {
        selectionScreenUI.tankButtons.push({ type, x: 100 * UI_SCALE, y: yPos, width: 300 * UI_SCALE, height: 100 * UI_SCALE });
        yPos += 120 * UI_SCALE;
    }
    
    selectionScreenUI.skillButtons.q = [];
    selectionScreenUI.skillButtons.e = [];
    yPos = 220 * UI_SCALE;
    for(const type in SKILLS){
        selectionScreenUI.skillButtons.q.push({ type, key: 'q', x: 950 * UI_SCALE, y: yPos, width: 200 * UI_SCALE, height: 60 * UI_SCALE });
        selectionScreenUI.skillButtons.e.push({ type, key: 'e', x: 1200 * UI_SCALE, y: yPos, width: 200 * UI_SCALE, height: 60 * UI_SCALE });
        yPos += 80 * UI_SCALE;
    }

    difficultyScreenUI.buttons = [];
    yPos = 300 * UI_SCALE;
    for (const diff in DIFFICULTIES) {
        difficultyScreenUI.buttons.push({ type: diff, x: canvas.width/2 - 125 * UI_SCALE, y: yPos, width: 250 * UI_SCALE, height: 50 * UI_SCALE });
        yPos += 80 * UI_SCALE;
    }
}

function setupModuleButtons() {
    selectionScreenUI.moduleButtons = [];
    const availableModules = MODULES[selectedTankType];
    let yPos = 220 * UI_SCALE;
    if (availableModules) {
        Object.keys(availableModules).forEach(moduleKey => {
            selectionScreenUI.moduleButtons.push({ type: moduleKey, x: 450 * UI_SCALE, y: yPos, width: 250 * UI_SCALE, height: 60 * UI_SCALE });
            yPos += 80 * UI_SCALE;
        });
    }
    selectionScreenUI.moduleButtons.push({ type: null, x: 450 * UI_SCALE, y: yPos, width: 250 * UI_SCALE, height: 50 * UI_SCALE });
}

function drawSelectionScreen() {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ecf0f1';
    
    ctx.font = selectionScreenUI.title.font;
    ctx.fillText(selectionScreenUI.title.text, selectionScreenUI.title.x, selectionScreenUI.title.y);
    ctx.font = selectionScreenUI.tankTitle.font;
    ctx.fillText(selectionScreenUI.tankTitle.text, selectionScreenUI.tankTitle.x, selectionScreenUI.tankTitle.y);
    ctx.fillText(selectionScreenUI.moduleTitle.text, selectionScreenUI.moduleTitle.x, selectionScreenUI.moduleTitle.y);
    ctx.fillText(selectionScreenUI.skillTitle.text, selectionScreenUI.skillTitle.x, selectionScreenUI.skillTitle.y);

    selectionScreenUI.tankButtons.forEach(button => {
        const isLocked = button.type === 'FLAMETHROWER' && !flamethrowerUnlocked;
        ctx.fillStyle = isLocked ? '#555' : (button.type === selectedTankType ? '#16a085' : '#2c3e50');
        ctx.strokeStyle = isLocked ? '#888' : '#ecf0f1'; 
        ctx.lineWidth = 3;
        ctx.fillRect(button.x, button.y, button.width, button.height); 
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        ctx.fillStyle = isLocked ? '#888' : 'white';
        ctx.font = `${24 * UI_SCALE}px Arial`;
        ctx.fillText(TANK_TYPES[button.type].name, button.x + button.width / 2, button.y + (30 * UI_SCALE));
        ctx.font = `${14 * UI_SCALE}px Arial`;
        ctx.fillText(isLocked ? '???' : TANK_TYPES[button.type].description, button.x + button.width / 2, button.y + (65 * UI_SCALE));
        if (isLocked) {
            ctx.font = `${40 * UI_SCALE}px Arial`;
            ctx.fillText('🔒', button.x + button.width / 2, button.y + button.height/2 + 10*UI_SCALE);
        }
    });
    
    if (selectedTankType) {
        selectionScreenUI.moduleButtons.forEach(button => {
            const isSelected = selectedModule === button.type;
            ctx.fillStyle = isSelected ? '#d35400' : '#2c3e50';
            ctx.strokeStyle = '#ecf0f1';
            ctx.fillRect(button.x, button.y, button.width, button.height);
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            ctx.fillStyle = 'white';
            ctx.font = `${18 * UI_SCALE}px Arial`;
            const moduleConfig = MODULES[selectedTankType]?.[button.type];
            const buttonText = moduleConfig ? moduleConfig.name : '不启用模组';
            ctx.fillText(buttonText, button.x + button.width / 2, button.y + button.height / 2 + (5 * UI_SCALE));
        });
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(450 * UI_SCALE, 220 * UI_SCALE, 250 * UI_SCALE, 290 * UI_SCALE);
        ctx.fillStyle = 'white';
        ctx.font = `${18 * UI_SCALE}px Arial`;
        ctx.fillText('请先选择坦克', 575 * UI_SCALE, 350 * UI_SCALE);
    }
    
    ['q', 'e'].forEach(key => {
        selectionScreenUI.skillButtons[key].forEach(button => {
            const isSkillLocked = button.type === 'ARTILLERY_BARRAGE' && !artilleryUnlocked;
            const isSelected = selectedSkills[key] === button.type;
            const isOtherSelected = selectedSkills[key === 'q' ? 'e' : 'q'] === button.type;
            ctx.fillStyle = isSkillLocked ? '#555' : (isSelected ? '#8e44ad' : (isOtherSelected ? '#555' : '#2c3e50'));
            ctx.strokeStyle = isSkillLocked || isOtherSelected ? '#777' : '#ecf0f1';
            ctx.fillRect(button.x, button.y, button.width, button.height);
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            ctx.fillStyle = isSkillLocked || isOtherSelected ? '#777' : 'white';
            ctx.font = `${18 * UI_SCALE}px Arial`; 
            ctx.fillText(SKILLS[button.type].name, button.x + button.width/2, button.y + (25 * UI_SCALE));
            ctx.font = `${12 * UI_SCALE}px Arial`; 
            ctx.fillText(SKILLS[button.type].description, button.x + button.width/2, button.y + (45 * UI_SCALE));
            if (isSkillLocked) {
                ctx.font = `${30 * UI_SCALE}px Arial`;
                ctx.fillText('🔒', button.x + button.width/2, button.y + button.height/2 + 5*UI_SCALE);
            }
        });
    });

    const btn = selectionScreenUI.nextButton;
    const isReady = !!selectedTankType;
    ctx.globalAlpha = isReady ? 1.0 : 0.5;
    ctx.fillStyle = isReady ? '#27ae60' : '#7f8c8d';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.fillStyle = 'white'; ctx.font = `${30 * UI_SCALE}px Arial`; ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + (35 * UI_SCALE));
    ctx.globalAlpha = 1.0;

    if (hoveredTank) drawTankTooltip(hoveredTank);
    if (hoveredModule) drawModuleTooltip(hoveredModule);
}

function drawDifficultyScreen() {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ecf0f1';

    ctx.font = difficultyScreenUI.title.font;
    ctx.fillText(difficultyScreenUI.title.text, difficultyScreenUI.title.x, difficultyScreenUI.title.y);

    difficultyScreenUI.buttons.forEach(button => {
        ctx.fillStyle = button.type === selectedDifficulty ? '#c0392b' : '#2c3e50';
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 3;
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        ctx.fillStyle = 'white';
        ctx.font = `${24 * UI_SCALE}px Arial`;
        ctx.fillText(DIFFICULTIES[button.type].name, button.x + button.width / 2, button.y + button.height/2 + (8 * UI_SCALE));
    });

    const startBtn = difficultyScreenUI.startButton;
    ctx.fillStyle = '#27ae60'; ctx.fillRect(startBtn.x, startBtn.y, startBtn.width, startBtn.height);
    ctx.fillStyle = 'white'; ctx.font = `${30 * UI_SCALE}px Arial`; ctx.fillText(startBtn.text, startBtn.x + startBtn.width / 2, startBtn.y + (35 * UI_SCALE));

    const backBtn = difficultyScreenUI.backButton;
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.fillStyle = 'white'; ctx.font = `${24 * UI_SCALE}px Arial`; ctx.fillText(backBtn.text, backBtn.x + backBtn.width / 2, backBtn.y + (32 * UI_SCALE));
}

function drawEndScreen(message, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = `${80 * UI_SCALE}px Arial Black`;
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - (20 * UI_SCALE));
    const btn = endScreenUI.button;
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.fillStyle = 'black';
    ctx.font = `${30 * UI_SCALE}px Arial`;
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + (35 * UI_SCALE));
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (gameState === 'selectionScreen') {
        let tankChanged = false;
        // 【修改】增加了对解锁状态的判断
        selectionScreenUI.tankButtons.forEach(btn => {
            if (isPointInRect(clickX, clickY, btn)) {
                if (btn.type === 'FLAMETHROWER' && !flamethrowerUnlocked) return;
                if (selectedTankType !== btn.type) {
                    selectedTankType = btn.type;
                    selectedModule = null;
                    tankChanged = true;
                }
            }
        });
        if (tankChanged) setupModuleButtons();
        if(selectedTankType){
            selectionScreenUI.moduleButtons.forEach(btn => {
                if (isPointInRect(clickX, clickY, btn)) {
                    selectedModule = btn.type;
                }
            });
        }
        ['q', 'e'].forEach(key => {
            selectionScreenUI.skillButtons[key].forEach(btn => {
                if (isPointInRect(clickX, clickY, btn)) {
                    if (btn.type === 'ARTILLERY_BARRAGE' && !artilleryUnlocked) return;
                    const otherKey = key === 'q' ? 'e' : 'q';
                    if (selectedSkills[otherKey] !== btn.type) selectedSkills[key] = btn.type;
                }
            });
        });
        if (selectedTankType && isPointInRect(clickX, clickY, selectionScreenUI.nextButton)) {
            gameState = 'difficultyScreen';
            hideCodeInput(); // 【新增】隐藏输入框
        }
    } else if (gameState === 'difficultyScreen') {
        difficultyScreenUI.buttons.forEach(btn => {
            if (isPointInRect(clickX, clickY, btn)) {
                selectedDifficulty = btn.type;
            }
        });
        if (isPointInRect(clickX, clickY, difficultyScreenUI.startButton)) {
            startGame();
        }
        if (isPointInRect(clickX, clickY, difficultyScreenUI.backButton)) {
            gameState = 'selectionScreen';
            showCodeInput(); // 【新增】显示输入框
        }

    } else if (gameState === 'victory' || gameState === 'gameOver') {
        if (isPointInRect(clickX, clickY, endScreenUI.button)) {
            selectedTankType = null;
            selectedModule = null;
            gameState = 'selectionScreen';
            showCodeInput(); // 【新增】显示输入框
        }
    }
}


// =================================
//  5. 游戏核心逻辑
// =================================

function startGame() {
    const config = TANK_TYPES[selectedTankType];
    player = {
        type: selectedTankType, x: canvas.width / 2, y: canvas.height - 80, 
        width: 50 * UI_SCALE, height: 40 * UI_SCALE, // 【修复】交换宽高定义
        speed: 3 * UI_SCALE, color: config.color,
        hp: config.maxHp, maxHp: config.maxHp, turretAngle: -Math.PI / 2, bodyAngle: -Math.PI / 2,
        module: selectedModule,
        lastFireTime: 0,
        skills: {
            q: { config: SKILLS[selectedSkills.q], lastUsed: -Infinity, activeUntil: 0 },
            e: { config: SKILLS[selectedSkills.e], lastUsed: -Infinity, activeUntil: 0 }
        },
        statusEffects: [],
        gatlingSpoolUpTime: 0,
        mortarTargets: [],
        chargeStartTime: 0,
        lastActionTime: 0,
        isStealthed: false,
        lastReactiveArmorProc: 0,
        trackOffset: 0,
        gatlingBarrelAngle: 0
    };
    enemies = []; friendlies = []; projectiles = []; obstacles = [];
    spawnObstacles();
    const enemyCount = DIFFICULTIES[selectedDifficulty].enemyCount;
    for (let i = 0; i < enemyCount; i++) spawnEnemy();
    gameState = 'playing';
}

function spawnObstacles() {
    const obstacleCount = 12 + Math.floor(Math.random() * 8);
    const types = ['iron', 'iron', 'iron', 'river'];
    for (let i = 0; i < obstacleCount; i++) {
        let newObstacle, validPosition = false;
        while (!validPosition) {
            newObstacle = {
                type: types[Math.floor(Math.random() * types.length)],
                x: Math.random() * (canvas.width - 200 * UI_SCALE) + 100 * UI_SCALE,
                y: Math.random() * (canvas.height - 300 * UI_SCALE) + 100 * UI_SCALE,
                width: (60 + Math.random() * 120) * UI_SCALE,
                height: (60 + Math.random() * 120) * UI_SCALE
            };
            if (player && Math.hypot(newObstacle.x - player.x, newObstacle.y - player.y) < 250 * UI_SCALE) continue;
            validPosition = true;
            const margin = 20 * UI_SCALE;
            const expandedObstacle = { ...newObstacle, x: newObstacle.x - margin, y: newObstacle.y - margin, width: newObstacle.width + margin*2, height: newObstacle.height + margin*2 };
            for (const obs of obstacles) {
                if (doRectsOverlap(expandedObstacle, obs)) {
                    validPosition = false;
                    break;
                }
            }
        }
        obstacles.push(newObstacle);
    }
}

function spawnEnemy() {
    let x, y, validPosition = false;
    const enemyWidth = 50 * UI_SCALE; // 【修复】交换宽高定义
    const enemyHeight = 40 * UI_SCALE;
    while (!validPosition) {
        x = Math.random() * (canvas.width - enemyWidth) + enemyWidth / 2;
        y = Math.random() * (canvas.height / 2);
        validPosition = true;
        for (const obs of obstacles) { if (doRectsOverlap({x: x - enemyWidth/2, y: y - enemyHeight/2, width: enemyWidth, height: enemyHeight}, obs)) { validPosition = false; break; } }
    }
    enemies.push({ x, y, width: enemyWidth, height: enemyHeight, speed: 1.5 * UI_SCALE, color: '#bdc3c7', hp: ENEMY_HP, maxHp: ENEMY_HP,
        turretAngle: 0, bodyAngle: 0, state: 'WANDERING',
        wanderTarget: null, timeToNewWanderTarget: 0,
        statusEffects: [],
        moveCommand: { direction: null, timer: 0 },
        lastFireTime: Date.now() + Math.random() * 3000,
        fireCooldown: 2000,
        lastHitByWaveId: null
    });
}

function spawnSentryGun() {
    friendlies.push({
        isSentry: true,
        x: player.x,
        y: player.y,
        hp: SENTRY_GUN_CONFIG.hp,
        maxHp: SENTRY_GUN_CONFIG.hp,
        width: 40 * UI_SCALE,
        height: 40 * UI_SCALE,
        turretAngle: player.turretAngle,
        despawnTime: Date.now() + SKILLS.SENTRY_GUN.duration,
        lastFireTime: 0,
        ...SENTRY_GUN_CONFIG
    });
}

function updateSplashScreen() {
    const elapsedTime = Date.now() - splashScreenStartTime;
    if (elapsedTime > SPLASH_DURATION) {
        gameState = 'selectionScreen';
        setupModuleButtons();
        showCodeInput(); // 【新增】显示输入框
        if (!updateModalClosed) {
            document.getElementById('update-modal-backdrop').style.display = 'flex';
        }
    }
}

function drawSplashScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const elapsedTime = Date.now() - splashScreenStartTime;
    const fadeInDuration = SPLASH_DURATION * 0.4;
    const fadeOutDuration = SPLASH_DURATION * 0.6;
    let totalAlpha, textAlpha;

    if (elapsedTime < fadeInDuration) {
        totalAlpha = 1.0;
        textAlpha = elapsedTime / fadeInDuration;
    } else {
        const fadeOutProgress = (elapsedTime - fadeInDuration) / fadeOutDuration;
        totalAlpha = 1.0 - fadeOutProgress;
        textAlpha = totalAlpha;
    }
    
    ctx.globalAlpha = 1.0 - totalAlpha;
    drawSelectionScreen();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = `rgba(0, 0, 0, ${totalAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    ctx.font = `${60 * UI_SCALE}px 'Courier New', Courier, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("Ooxygen7", canvas.width / 2, canvas.height / 2);
}


function updateGame() {
    animationFrame++;
    if (player.hp <= 0) { gameState = 'gameOver';stopAllSounds();return; }
    if (enemies.length === 0) { gameState = 'victory';stopAllSounds(); return; }
    updatePlayer();
    updateEnemies();
    updateFriendlies();
    updateProjectiles();
    updateScoreFeed();  
    checkCollisions();
}
function updateScoreFeed() {
    const FADE_DURATION = 4000; // 每个条目的持续时间（4秒）
    const FADE_START_TIME = 3000; // 在3秒后开始淡出

    scoreFeed = scoreFeed.filter(item => Date.now() - item.creationTime < FADE_DURATION);

    scoreFeed.forEach(item => {
        const age = Date.now() - item.creationTime;
        if (age > FADE_START_TIME) {
            item.alpha = 1.0 - (age - FADE_START_TIME) / (FADE_DURATION - FADE_START_TIME);
        } else {
            item.alpha = 1.0;
        }
    });
}

function drawGame() {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    obstacles.forEach(drawObstacle);
    projectiles.forEach(p => drawProjectile(p));
    friendlies.forEach(f => {
        if (f.isSentry) {
            drawSentry(f);
        }
    });
    drawTank(player);
    enemies.forEach(e => drawTank(e));
    drawHUD();
}

function updatePlayer() {
    updateStatusEffects(player);
    let currentSpeed = player.speed;

    if (player.type === 'MACHINE_GUN' && player.module === 'MODULE_2' && (player.gatlingSpoolUpTime > 0 || mouse.clicked)) {
        currentSpeed *= 0.4;
    }
    if (player.type === 'SNIPER' && player.module === 'MODULE_1' && player.chargeStartTime > 0) {
        currentSpeed *= 0.3;
    }
    if (player.type === 'FLAMETHROWER' && player.module === 'MODULE_1') { // 反应装甲的回血效果
        const regenPerFrame = player.maxHp * 0.02 / 60; // 60fps
        player.hp = Math.min(player.maxHp, player.hp + regenPerFrame);
    }

    let moved = false;
    let intendedMove = { x: 0, y: 0 };
    if (keys.w || keys.ArrowUp) { intendedMove.y = -1; player.bodyAngle = -Math.PI / 2; }
    else if (keys.s || keys.ArrowDown) { intendedMove.y = 1; player.bodyAngle = Math.PI / 2; }
    else if (keys.a || keys.ArrowLeft) { intendedMove.x = -1; player.bodyAngle = Math.PI; }
    else if (keys.d || keys.ArrowRight) { intendedMove.x = 1; player.bodyAngle = 0; }
    if (intendedMove.x !== 0 || intendedMove.y !== 0) {
        moved = true;
        const nextPos = { ...player, x: player.x + intendedMove.x * currentSpeed, y: player.y + intendedMove.y * currentSpeed };
        if (!checkEntityObstacleCollision(nextPos)) { player.x = nextPos.x; player.y = nextPos.y; }
        const TREAD_SPACING = 10 * UI_SCALE;
        player.trackOffset = (player.trackOffset + currentSpeed) % TREAD_SPACING;
    }
    
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));
    player.turretAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    if (player.type === 'SNIPER' && player.module === 'MODULE_2') {
        if (moved && !player.isStealthed) {
            player.lastActionTime = Date.now();
        }
        if(Date.now() - player.lastActionTime > 1000) {
            player.isStealthed = true;
        }
    }
    
    handlePlayerFiring();
}

function handlePlayerFiring() {
    const now = Date.now();
    let fireRateMultiplier = 1;
    if (isEffectActive(player, 'BERSERK')) fireRateMultiplier = 0.7;

    const fireAction = () => {
        player.lastFireTime = now;
        if(player.type === 'SNIPER' && player.module === 'MODULE_2') {
             player.lastActionTime = now;
             player.isStealthed = false;
        
        }

        // 【新增】根据坦克类型和模组播放标准开火音效
        if (player.type === 'SNIPER' && player.module !== 'MODULE_1') {
            sniperSound.currentTime = 0;
            sniperSound.play();
        }
        
        fireWeapon(player);
    };

    if (player.type === 'MACHINE_GUN' && player.module === 'MODULE_2') {
        const maxSpoolTime = 4000;
        const minFireRate = 80;
        const maxFireRate = 500;
        if(mouse.clicked){
            player.gatlingSpoolUpTime = Math.min(maxSpoolTime, player.gatlingSpoolUpTime + (1000/60));
        } else {
            player.gatlingSpoolUpTime = Math.max(0, player.gatlingSpoolUpTime - (1000/30));
        }
        const spoolRatio = player.gatlingSpoolUpTime / maxSpoolTime;
        const currentFireRate = maxFireRate - (maxFireRate - minFireRate) * spoolRatio;
        if (mouse.clicked && (now - player.lastFireTime > currentFireRate)) {
            gatlingSound.currentTime = 0;
            gatlingSound.play();
            fireAction();
        }
    } 
    else if (player.type === 'SNIPER' && player.module === 'MODULE_1') {
        // 蓄能狙击的开火逻辑由 mouseup/mousedown 事件单独处理
    }
    else if (player.type === 'MORTAR' && player.module === 'MODULE_2') {
        // 连珠迫击炮的开火逻辑由 mousedown 事件单独处理
    }
    else { // 所有其他坦克的标准开火逻辑
        let finalFireRate = TANK_TYPES[player.type].fireRate;
        if (player.type === 'MORTAR' && player.module === 'MODULE_2') {
            finalFireRate = 5000;
        }
        
        if (mouse.clicked && (now - player.lastFireTime > finalFireRate * fireRateMultiplier)) {
            if (player.type === 'MACHINE_GUN') {
                machineGunSound.currentTime = 0;
                machineGunSound.play();
            } else if (player.type === 'SNIPER') { // 适用于标准和隐匿
                sniperSound.currentTime = 0;
                sniperSound.play();
            } else if (player.type === 'CANNON') { // 适用于所有炮弹坦克
                cannonSound.currentTime = 0;
                cannonSound.play();
            }
            fireAction();
        }
    }
}

function fireWeapon(tank) {
    let config = TANK_TYPES[tank.type];
    if (tank.isSentry) {
        config = SENTRY_GUN_CONFIG;
    }
    
    const angle = tank.turretAngle;
    const barrelLength = (tank.isSentry ? 20 : 40) * UI_SCALE;
    const startX = tank.x + barrelLength * Math.cos(angle);
    const startY = tank.y + barrelLength * Math.sin(angle);
    
    let damageMultiplier = 1;
    if (isEffectActive(tank, 'DAMAGE_BOOST')) damageMultiplier = 1.2;
    
    let finalDamage = config.bulletDamage;
    // 【修复】音速弹伤害调整
    if (tank.type === 'CANNON' && tank.module === 'MODULE_1') {
        finalDamage = 3;
    }

    const bullet = {
        owner: tank.isSentry ? 'friendly' : 'player',
        damage: finalDamage * damageMultiplier,
        x: startX,
        y: startY,
    };
    
    if (tank.isSentry) {
        projectiles.push({ ...bullet, type: 'sentry_bullet', radius: 4 * UI_SCALE, dx: Math.cos(angle) * 12 * UI_SCALE, dy: Math.sin(angle) * 12 * UI_SCALE, ignoresObstacles: true });
        return;
    }

    switch (tank.type) {
        case 'CANNON': 
        projectiles.push({ ...bullet, type: 'cannon', radius: 7 * UI_SCALE, dx: Math.cos(angle) * 8 * UI_SCALE * (tank.module === 'MODULE_1' ? 2.5 : 1), dy: Math.sin(angle) * 8 * UI_SCALE * (tank.module === 'MODULE_1' ? 2.5 : 1) });
            break;
        case 'MACHINE_GUN':
            if (tank.module === 'MODULE_2') {
                const offsetDistance = 5 * UI_SCALE; // 子弹之间的间距
                const perpAngle = angle + Math.PI / 2; // 计算垂直于发射方向的角度

                // 计算第一颗子弹的偏移位置
                const x1 = startX + offsetDistance * Math.cos(perpAngle);
                const y1 = startY + offsetDistance * Math.sin(perpAngle);

                // 计算第二颗子弹的偏移位置
                const x2 = startX - offsetDistance * Math.cos(perpAngle);
                const y2 = startY - offsetDistance * Math.sin(perpAngle);

                // 两颗子弹方向相同
                const dx = Math.cos(angle) * 10 * UI_SCALE;
                const dy = Math.sin(angle) * 10 * UI_SCALE;

                projectiles.push({ ...bullet, x: x1, y: y1, type: 'machinegun', radius: 4 * UI_SCALE, dx, dy });
                projectiles.push({ ...bullet, x: x2, y: y2, type: 'machinegun', radius: 4 * UI_SCALE, dx, dy });

            } else { 
                const bulletCount = (tank.module === 'MODULE_1') ? 5 : ((tank.module === 'MODULE_2') ? 1 : 3);
                const spread = (bulletCount === 5) ? (Math.PI / 40) : (Math.PI / 70);
                for (let i = -Math.floor(bulletCount/2); i <= Math.floor(bulletCount/2); i++) {
                    if(bulletCount === 1 && i !== 0) continue;
                    const a = angle + i * spread * (bulletCount > 1 ? 1 : 0);
                    projectiles.push({ ...bullet, type: 'machinegun', radius: 4 * UI_SCALE, dx: Math.cos(a) * 10 * UI_SCALE, dy: Math.sin(a) * 10 * UI_SCALE });
                }
            }
            break;
        case 'MORTAR':
            mortarFireSound.currentTime = 0;
            mortarFireSound.play();
             if (tank.module === 'MODULE_2') {
                tank.mortarTargets.forEach(target => {
                    projectiles.push({ ...bullet, type: 'mortar_shell', startX, startY, targetX: target.x, targetY: target.y, radius: 10 * UI_SCALE, travelTime: 1500, startTime: Date.now() });
                });
                tank.mortarTargets = [];
             } else {
                const distance = Math.hypot(mouse.x - startX, mouse.y - startY);
                const maxRange = 1000 * UI_SCALE;
                const minTime = 500; const maxTime = 2000;
                const travelTimeRatio = Math.min(1, distance / maxRange);
                const travelTime = minTime + (maxTime - minTime) * travelTimeRatio;
                projectiles.push({ ...bullet, type: 'mortar_shell', startX, startY, targetX: mouse.x, targetY: mouse.y, radius: 10 * UI_SCALE, travelTime, startTime: Date.now() });
             }
            break;
        case 'SNIPER':
            projectiles.push({ ...bullet, type: 'sniper', chargeRatio: (tank.module === 'MODULE_1' && tank.chargeStartTime > 0) ? (Date.now() - tank.chargeStartTime) / 1000 : null, startX: tank.x, startY: tank.y, dx: Math.cos(angle) * 20 * UI_SCALE, dy: Math.sin(angle) * 20 * UI_SCALE });
            break;
        case 'FLAMETHROWER':
            const waveId = Date.now() + Math.random();
            for (let i = 0; i < 10; i++) {
                const particleAngle = angle + (Math.random() - 0.5) * (Math.PI / 6);
                const particleSpeed = (6 + Math.random() * 2) * UI_SCALE;
                projectiles.push({ ...bullet, type: 'flame_particle', waveId, dx: Math.cos(particleAngle) * particleSpeed, dy: Math.sin(particleAngle) * particleSpeed, life: 0, maxLife: 15 + Math.random() * 10, size: (10 + Math.random() * 5) * UI_SCALE});
            }
            break;
    }
}

function fireEnemyBullet(enemy) {
    enemyShootSound.currentTime = 0;
    enemyShootSound.play();
    const angle = enemy.turretAngle;
    const barrelLength = enemy.width;
    const startX = enemy.x + barrelLength * Math.cos(angle);
    const startY = enemy.y + barrelLength * Math.sin(angle);
    
    let baseDamage = 2;
    if(isEffectActive(enemy, 'WEAKNESS')) {
        baseDamage = Math.max(0, baseDamage - 1);
    }

    projectiles.push({
        owner: 'enemy',
        type: 'enemy_bullet',
        x: startX,
        y: startY,
        radius: 5 * UI_SCALE,
        damage: baseDamage,
        dx: Math.cos(angle) * 7 * UI_SCALE,
        dy: Math.sin(angle) * 7 * UI_SCALE
    });
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        updateStatusEffects(enemy);
        if(isEffectActive(enemy, 'STUN')) return;

        const hasLineOfSight = !player.isStealthed && !isLineIntersectingObstacle(enemy.x, enemy.y, player.x, player.y);

        if (hasLineOfSight) {
            enemy.turretAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        } else {
            enemy.turretAngle = enemy.bodyAngle;
        }
        
        if(hasLineOfSight && Date.now() - enemy.lastFireTime > enemy.fireCooldown) {
            enemy.lastFireTime = Date.now();
            enemy.fireCooldown = 2000;
            fireEnemyBullet(enemy);
        }
        
        // 【修复】在这里应用虚弱的减速效果
        let currentSpeed = enemy.speed;
        if (isEffectActive(enemy, 'WEAKNESS')) {
            currentSpeed *= 0.5;
        }

        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (enemy.state === 'WANDERING' && distToPlayer < AI_AGGRO_RADIUS && hasLineOfSight) { enemy.state = 'ATTACKING'; }
        else if (enemy.state === 'ATTACKING' && (distToPlayer > AI_DEAGGRO_RADIUS || !hasLineOfSight)) { enemy.state = 'WANDERING'; enemy.wanderTarget = null; }
        
        let target = null;
        let isMoving = true;
        if (enemy.state === 'ATTACKING') {
            target = player;
            if (distToPlayer < AI_MIN_ATTACK_DISTANCE) isMoving = false;
        } else {
            enemy.timeToNewWanderTarget -= 1;
            if(!enemy.wanderTarget || enemy.timeToNewWanderTarget <= 0) {
                enemy.wanderTarget = {x: Math.random() * canvas.width, y: Math.random() * canvas.height};
                enemy.timeToNewWanderTarget = 200 + Math.random() * 300;
            }
            target = enemy.wanderTarget;
        }

        if (isMoving && target) {
            enemy.moveCommand.timer -= 1;
            if (!enemy.moveCommand.direction || enemy.moveCommand.timer <= 0) {
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                if (Math.abs(dx) > Math.abs(dy)) { enemy.moveCommand.direction = 'x'; } else { enemy.moveCommand.direction = 'y'; }
                enemy.moveCommand.timer = 30 + Math.floor(Math.random() * 60);
            }

            let moveX = 0, moveY = 0;
            if (enemy.moveCommand.direction === 'x') { moveX = Math.sign(target.x - enemy.x); } else { moveY = Math.sign(target.y - enemy.y); }
            
            if (moveX !== 0 || moveY !== 0) {
                let nextPos = { ...enemy, x: enemy.x + moveX * currentSpeed, y: enemy.y + moveY * currentSpeed };
                let isBlockedByTank = false;
                for(let i = 0; i < enemies.length; i++) {
                    if(index === i) continue;
                    if(areEntitiesColliding(nextPos, enemies[i])) { isBlockedByTank = true; break; }
                }
                for(let i = 0; i < friendlies.length; i++) {
                    if(areEntitiesColliding(nextPos, friendlies[i])) { isBlockedByTank = true; break; }
                }
                if (!checkEntityObstacleCollision(nextPos) && !isBlockedByTank) {
                    enemy.x = nextPos.x;
                    enemy.y = nextPos.y;
                } else {
                    enemy.moveCommand.timer = 0;
                }
                if (moveX > 0) enemy.bodyAngle = 0; else if (moveX < 0) enemy.bodyAngle = Math.PI;
                else if (moveY > 0) enemy.bodyAngle = Math.PI / 2; else if (moveY < 0) enemy.bodyAngle = -Math.PI / 2;
            }
        }
    });
}

function updateFriendlies() {
    for (let i = friendlies.length - 1; i >= 0; i--) {
        const friendly = friendlies[i];
        if (friendly.hp <= 0 || Date.now() > friendly.despawnTime) {
            friendlies.splice(i, 1);
            continue;
        }

        if(friendly.isSentry) {
            let closestEnemyInRange = null;
            let minDistance = friendly.range;
            enemies.forEach(enemy => {
                const dist = Math.hypot(friendly.x - enemy.x, friendly.y - enemy.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestEnemyInRange = enemy;
                }
            });

            if (closestEnemyInRange) {
                friendly.turretAngle = Math.atan2(closestEnemyInRange.y - friendly.y, closestEnemyInRange.x - friendly.x);
                if (Date.now() - friendly.lastFireTime > friendly.fireRate) {
                    friendly.lastFireTime = Date.now();
                    sentryShootSound.currentTime = 0;
                    sentryShootSound.play();
                    fireWeapon(friendly);
                }
            }
        }
    }
}


function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p) continue;

        let destroyed = false; // 用于标记子弹是否在本轮循环中被销毁

        switch(p.type) {
            case 'cannon': case 'machinegun': case 'sniper': case 'sentry_bullet': case 'enemy_bullet':
                p.x += p.dx; p.y += p.dy;
                if (!p.ignoresObstacles) {
                    for(const obs of obstacles){
                        if(obs.type !== 'river' && isPointInRect(p.x, p.y, obs)){
                            projectiles.splice(i,1);
                            destroyed = true;
                            break; 
                        }
                    }
                }
                break; // 【核心修复】加上了这行被意外删除的 break;

            case 'flame_particle':
                p.x += p.dx; p.y += p.dy;
                p.life++;
                for(const obs of obstacles){
                    if(obs.type === 'iron' && isPointInRect(p.x, p.y, obs)){
                        projectiles.splice(i,1);
                        destroyed = true;
                        break;
                    }
                }
                if (p.life >= p.maxLife) {
                    projectiles.splice(i, 1);
                    destroyed = true;
                }
                break;

                case 'vfx_core_flash':
                    p.life++;
                    if (p.life >= p.maxLife) {
                        projectiles.splice(i, 1);
                        destroyed = true;
                    }
                    break;
                case 'vfx_debris':
                    p.x += p.dx;
                    p.y += p.dy;
                    p.dy += p.gravity; // 模拟重力
                    p.life++;
                    if (p.life >= p.maxLife) {
                        projectiles.splice(i, 1);
                        destroyed = true;
                    }
                    break;

            case 'mortar_shell':
                const progress = (Date.now() - p.startTime) / p.travelTime;
                if(progress >= 1) {
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                    const explosion = { type: 'explosion', x: p.targetX, y: p.targetY, maxRadius: 80 * UI_SCALE, damage: p.damage, life: 0, maxLife: 60, owner: p.owner };
                    projectiles.push(explosion);
                    if(p.owner === 'player' && player.module === 'MODULE_1') {
                         projectiles.push({ type: 'scheduled_explosion', x: p.targetX, y: p.targetY, maxRadius: 80 * UI_SCALE, damage: p.damage, life: 0, maxLife: 60, owner: p.owner });
                    }
                    projectiles.splice(i, 1);
                    destroyed = true;
                } else {
                    p.x = p.startX + (p.targetX - p.startX) * progress;
                    p.y = p.startY + (p.targetY - p.startY) * progress;
                    p.z = Math.sin(progress * Math.PI) * 150 * UI_SCALE;
                }
                break;
                
            case 'scheduled_explosion':
            case 'artillery_strike':
            case 'vfx_heal':
            case 'vfx_fire_nova':
            case 'explosion':
            case 'vfx_fire_nova':
                p.life++;
                if (p.life >= p.maxLife) {
                    if(p.type === 'artillery_strike') {
                        projectiles.push({ type: 'explosion', owner: p.owner, x: p.targetX, y: p.targetY, maxRadius: 150 * UI_SCALE, damage: p.damage, life: 0, maxLife: 60 });
                    }
                    if(p.type === 'scheduled_explosion') {
                        explosionSound.currentTime = 0;
                        explosionSound.play();
                        projectiles.push({ type: 'explosion', owner: p.owner, x: p.x, y: p.y, maxRadius: p.maxRadius, damage: p.damage, life: 0, maxLife: 60 });
                    }
                    projectiles.splice(i, 1);
                    destroyed = true;
                }
                break;
        }

        if (destroyed) continue; // 如果子弹已被销毁，直接进入下一次循环

        if (p && p.dx && (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height)) {
            projectiles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p) continue;
        
        if (p.owner !== 'enemy') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (!e) continue;
                let finalDamage = p.damage;
                let hit = false;
                
                if (p.type === 'sniper') {
                     if (Math.hypot(p.x - e.x, p.y - e.y) < e.width / 2 + 5 * UI_SCALE) {
                        if (p.chargeRatio !== null) {
                            finalDamage = 3 + (10 - 3) * p.chargeRatio;
                        } else {
                            const distTraveled = Math.hypot(p.x - p.startX, p.y - p.startY);
                            const maxSniperRange = 1200 * UI_SCALE;
                            const ratio = Math.min(1, distTraveled / maxSniperRange);
                            finalDamage = 3 + (10 - 3) * ratio;
                        }
                        hit = true;
                    }
                } else if (p.type === 'flame_particle') {
                    if (Math.hypot(p.x - e.x, p.y - e.y) < e.width / 2 + p.size / 2 && e.lastHitByWaveId !== p.waveId) {
                        e.lastHitByWaveId = p.waveId;
                        hit = true;
                    }
                }
                else if (p.type === 'cannon' || p.type === 'machinegun' || p.type === 'sentry_bullet') {
                    if (Math.hypot(p.x - e.x, p.y - e.y) < e.width / 2 + p.radius) {
                        hit = true;
                    }
                }
                
                if (hit) {
                    if (!isEffectActive(e, 'SHIELD')) {
                        if (p.owner === 'player' && player.type === 'FLAMETHROWER' && player.module === 'MODULE_2') {
                            e.statusEffects.push({ type: 'WEAKNESS', activeUntil: Date.now() + 3000 });
                         }
                        if(p.owner === 'player' && player.type === 'CANNON' && player.module === 'MODULE_2' && p.type === 'cannon') {
                           e.statusEffects.push({ type: 'STUN', activeUntil: Date.now() + 350 });
                        }
                        e.hp -= finalDamage;
                        // 【修改】调用新的计分函数，不再需要位置参数
                        createScorePopup(`+${Math.round(finalDamage * 10)} 命中`, 'white');
                    }
                    if (p.owner === 'player' && isEffectActive(player, 'LIFE_STEAL')) {
                        const healthRestored = finalDamage * 0.33;
                        player.hp = Math.min(player.maxHp, player.hp + healthRestored);
                        projectiles.push({type: 'vfx_heal', x: player.x, y: player.y, life: 0, maxLife: 45});
                    }
                    
                    if (p.type !== 'flame_particle') {
                       projectiles.splice(i, 1);
                       break; 
                    }
                }
            }
        }
        else if (p.owner === 'enemy') {
            if(areEntitiesColliding({x: p.x, y: p.y, width: p.radius*2, height: p.radius*2}, player)) {
                if(!isEffectActive(player, 'SHIELD')) {
                    player.hp -= p.damage;
                    if(player.module === 'MODULE_1' && player.type === 'FLAMETHROWER') triggerReactiveArmor(player);
                }
                projectiles.splice(i,1);
                continue;
            }
            for (let j = friendlies.length - 1; j >= 0; j--) {
                const f = friendlies[j];
                if(areEntitiesColliding({x: p.x, y: p.y, width: p.radius*2, height: p.radius*2}, f)) {
                    f.hp -= p.damage;
                    projectiles.splice(i,1);
                    break;
                }
            }
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p) continue;
        if (p.type === 'explosion' && p.life === 1 && p.owner !== 'enemy') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (!e) continue;
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.maxRadius && !isLineIntersectingObstacle(p.x, p.y, e.x, e.y)){
                    const damageDealt = p.damage;
                    if (!isEffectActive(e, 'SHIELD')) {
                        e.hp -= damageDealt;
                        // 【修改】调用新的计分函数
                        createScorePopup(`+${Math.round(damageDealt * 10)} 命中`, 'white');
                    }
                    if (p.owner === 'player' && isEffectActive(player, 'LIFE_STEAL')) {
                        const healthRestored = damageDealt * 0.33;
                        player.hp = Math.min(player.maxHp, player.hp + healthRestored);
                        projectiles.push({type: 'vfx_heal', x: player.x, y: player.y, life: 0, maxLife: 45});
                    }
                }
            }
        }
    }

    enemies.forEach((e, i) => {
        if(areEntitiesColliding(player, e) && !isEffectActive(player, 'SHIELD')) {
            player.hp -= 0.02;
            if(player.module === 'MODULE_1' && player.type === 'FLAMETHROWER') triggerReactiveArmor(player);
        }
        if(e.hp <= 0) {
            // 【修改】调用新的计分函数
            explosionSound.currentTime = 0;
            explosionSound.play();
            createTankExplosion({x: e.x, y: e.y});
            createScorePopup('+100 击杀奖励', '#f39c12');
            enemies.splice(i, 1);
        }
    });
}


function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50 * UI_SCALE;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function drawObstacle(obs) {
    ctx.save();
    switch(obs.type) {
        case 'iron':
            ctx.fillStyle = '#607D8B'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#B0BEC5';
            const rivetSize = 5 * UI_SCALE;
            ctx.fillRect(obs.x + rivetSize, obs.y + rivetSize, rivetSize, rivetSize); ctx.fillRect(obs.x + obs.width - rivetSize*2, obs.y + rivetSize, rivetSize, rivetSize);
            ctx.fillRect(obs.x + rivetSize, obs.y + obs.height - rivetSize*2, rivetSize, rivetSize); ctx.fillRect(obs.x + obs.width - rivetSize*2, obs.y + obs.height - rivetSize*2, rivetSize, rivetSize);
            break;
        case 'river':
            ctx.fillStyle = 'rgba(66, 165, 245, 0.7)'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.strokeStyle = '#1E88E5'; ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = obs.x; x < obs.x + obs.width; x += 5) {
                const yOffset = Math.sin(x * 0.1 + animationFrame * 0.05) * 3 * UI_SCALE;
                if (x === obs.x) { ctx.moveTo(x, obs.y + obs.height / 2 + yOffset); } else { ctx.lineTo(x, obs.y + obs.height / 2 + yOffset); }
            }
            ctx.stroke();
            break;
    }
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 4 * UI_SCALE;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    ctx.restore();
}

function drawProjectile(p) {
    ctx.fillStyle = '#f1c40f';
    switch (p.type) {
        case 'cannon':
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            break;
        case 'machinegun':
        case 'sentry_bullet':
            ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            break;
        case 'enemy_bullet':
            ctx.fillStyle = '#ff7675'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            break;
        case 'sniper':
            ctx.fillStyle = '#f39c12';
            ctx.save();
            ctx.translate(p.x, p.y);
            const angle = Math.atan2(p.dy, p.dx);
            ctx.rotate(angle);
            ctx.fillRect(-10 * UI_SCALE, -2 * UI_SCALE, 20 * UI_SCALE, 4 * UI_SCALE);
            ctx.restore();
            break;
        case 'mortar_shell':
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(p.x, p.y - p.z, p.radius * (1 + p.z / (200 * UI_SCALE)), 0, Math.PI * 2); ctx.fill();
            break;
        case 'mortar_preview_target':
            ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.lineWidth = 2 * UI_SCALE;
            ctx.beginPath(); ctx.arc(p.x, p.y, 15 * UI_SCALE, 0, Math.PI * 2); ctx.stroke();
            ctx.textAlign = 'center'; ctx.font = `${20*UI_SCALE}px Arial`; ctx.fillStyle = 'white';
            ctx.fillText(p.number, p.x, p.y + 6*UI_SCALE);
            break;
        case 'explosion':
            const a_exp = 1 - (p.life / p.maxLife); ctx.strokeStyle = `rgba(231, 76, 60, ${a_exp})`; ctx.lineWidth = 5 * UI_SCALE;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.maxRadius, 0, Math.PI * 2); ctx.stroke();
            break;
        case 'artillery_strike':
            const progress = p.life / p.maxLife;
            const size = 60 * UI_SCALE;
            ctx.save();
            ctx.translate(p.targetX, p.targetY);
            ctx.globalAlpha = 1.0 - progress;
            ctx.fillStyle = `rgb(255, 220, 0)`;
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = `black`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${size * 0.8}px Arial`;
            ctx.fillText('!', 0, size * 0.05);
            ctx.restore();
            break;
        case 'flame_particle':
            const p_progress = p.life / p.maxLife;
            ctx.fillStyle = `rgba(255, ${150 - 150 * p_progress}, 0, ${1 - p_progress})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1-p_progress), 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'vfx_heal':
            const heal_alpha = 1 - (p.life / p.maxLife);
            p.y -= 0.5 * UI_SCALE;
            ctx.fillStyle = `rgba(46, 204, 113, ${heal_alpha})`;
            ctx.font = `bold ${20 * UI_SCALE}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('+', p.x, p.y);
            break;
        case 'vfx_fire_nova':
            const nova_progress = p.life / p.maxLife;
            ctx.save();
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.maxRadius * nova_progress);
            gradient.addColorStop(0, `rgba(255, 200, 0, ${0.6 * (1 - nova_progress)})`);
            gradient.addColorStop(1, `rgba(231, 76, 60, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.maxRadius * nova_progress, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
            case 'vfx_core_flash':
                const flash_progress = p.life / p.maxLife;
                const flash_radius = 60 * UI_SCALE * flash_progress;
                const flash_alpha = 1 - flash_progress;
                ctx.fillStyle = `rgba(255, 255, 150, ${flash_alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, flash_radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'vfx_debris':
                const debris_alpha = 1 - (p.life / p.maxLife);
                ctx.fillStyle = `rgba(128, 128, 128, ${debris_alpha})`;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                break;
    }
}
function drawTank(tank) {
    ctx.save();
    
    // 【修复】根据是否隐身，设置整个坦克（包括特效）的透明度
    if(tank === player && player.isStealthed) {
        ctx.globalAlpha = 0.5;
    }

    // 移动画布原点到坦克中心
    ctx.translate(tank.x, tank.y);

    // --- 绘制坦克主体 (底盘和履带) ---
    ctx.save();
    ctx.rotate(tank.bodyAngle);
    
    const bodyLength = tank.width;
    const bodyWidth = tank.height;
    
    const trackThicknessRatio = 0.25;
    const chassisThicknessRatio = 0.5;
    const trackThickness = bodyWidth * trackThicknessRatio;
    const chassisThickness = bodyWidth * chassisThicknessRatio;
    
    // 上方履带
    ctx.fillStyle = '#444';
    ctx.fillRect(-bodyLength / 2, -bodyWidth / 2, bodyLength, trackThickness);
    // 下方履带
    ctx.fillRect(-bodyLength / 2, bodyWidth / 2 - trackThickness, bodyLength, trackThickness);
    // 中间底盘
    ctx.fillStyle = darkenColor(tank.color, 20);
    ctx.fillRect(-bodyLength / 2, -chassisThickness / 2, bodyLength, chassisThickness);

    // 履带纹路 (仅玩家)
    if (tank === player && player.trackOffset !== undefined) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2 * UI_SCALE;
        const TREAD_SPACING = 10 * UI_SCALE;
        for (let x = -bodyLength / 2 + (player.trackOffset % TREAD_SPACING); x < bodyLength / 2; x += TREAD_SPACING) {
            ctx.beginPath();
            ctx.moveTo(x, -bodyWidth / 2);
            ctx.lineTo(x, -bodyWidth / 2 + trackThickness);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, bodyWidth / 2);
            ctx.lineTo(x, bodyWidth / 2 - trackThickness);
            ctx.stroke();
        }
    }
    ctx.restore(); // 恢复到仅平移的状态

    // --- 根据坦克类型绘制不同炮塔 ---
    ctx.save();
    ctx.rotate(tank.turretAngle);
    // 敌方坦克使用默认炮塔
    const typeToDraw = tank.isSentry ? 'SENTRY' : (tank.owner === 'enemy' ? 'CANNON' : tank.type);
    switch (typeToDraw) {
        case 'CANNON':      drawCannonTurret(tank); break;
        case 'MACHINE_GUN': drawMachineGunTurret(tank); break;
        case 'MORTAR':      drawMortarTurret(tank); break;
        case 'SNIPER':      drawSniperTurret(tank); break;
        case 'FLAMETHROWER':drawFlamethrowerTurret(tank); break;
        default:            drawDefaultTurret(tank); break;
    }
    ctx.restore(); // 恢复到仅平移的状态
    
    ctx.restore(); // 恢复到画布初始状态（移除了translate和globalAlpha）

    // --- 在坦克图层之上绘制UI元素（如血条、状态等），这样它们不会被旋转 ---
    if (tank.hp < tank.maxHp) {
        const barWidth = tank.width;
        const barHeight = 8 * UI_SCALE;
        const barY = tank.y - tank.height / 2 - (20 * UI_SCALE);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(tank.x - barWidth / 2, barY, barWidth, barHeight);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(tank.x - barWidth / 2, barY, barWidth * (tank.hp / tank.maxHp), barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(tank.x - barWidth / 2, barY, barWidth, barHeight);
    }
    
    if (isEffectActive(tank, 'STUN')) {
        ctx.fillStyle = 'yellow';
        ctx.font = `bold ${20 * UI_SCALE}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('★★★', tank.x, tank.y - tank.height / 2 - (35 * UI_SCALE));
    }
    if (isEffectActive(tank, 'WEAKNESS')) {
        ctx.fillStyle = 'black';
        ctx.font = `bold ${30 * UI_SCALE}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('↓', tank.x, tank.y - tank.height / 2 - (35 * UI_SCALE));
    }
    if (isEffectActive(tank, 'BURN')) {
        for(let i=0; i<3; i++) {
            ctx.fillStyle = `rgba(255, ${Math.random()*150 + 100}, 0, 0.7)`;
            ctx.beginPath();
            const flameX = tank.x + (Math.random()-0.5) * tank.width * 0.8;
            const flameY = tank.y + (Math.random()-0.5) * tank.height * 0.8;
            ctx.arc(flameX, flameY, (3 + Math.random() * 4) * UI_SCALE, 0, Math.PI*2);
            ctx.fill();
        }
    }
    drawActiveSkillEffects(tank); // 绘制玩家的技能光环
}

//【新增】将下面这些新的绘制函数，添加到 drawTank 函数的紧下方

function drawDefaultTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.4;
    const barrelLength = bodyWidth * 1.2;
    const barrelWidth = bodyWidth * 0.2;

    // 先画炮管
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
    
    // 再画炮塔底座，覆盖住炮管的重合部分
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCannonTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.45;
    const barrelLength = bodyWidth * 1.0; // 炮管更短
    const barrelWidth = bodyWidth * 0.3;  // 炮管更粗
    
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);

    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkenColor(tank.color, 40);
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawMachineGunTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.4;
    const barrelLength = bodyWidth * 0.6;
    const barrelThickness = bodyWidth * 0.08; // 单个炮管的厚度

    // 绘制弹药箱
    ctx.fillStyle = '#333';
    ctx.fillRect(-turretRadius * 0.8, -turretRadius * 1.5, turretRadius * 1.6, turretRadius * 0.8);
    
    // 先绘制炮塔底座
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkenColor(tank.color, 40);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制4根并列的炮管
    ctx.fillStyle = darkenColor(tank.color, 30);
    const totalBarrelHeight = (barrelThickness + 1) * 4; // 计算炮管总高度（含间隙）
    const startY = -totalBarrelHeight / 2;

    for (let i = 0; i < 4; i++) {
        const y = startY + (i * (barrelThickness + 1));
        ctx.fillRect(turretRadius * 0.5, y, barrelLength, barrelThickness);
    }
}

function drawMortarTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.45;
    const barrelLength = bodyWidth * 0.8;
    const barrelWidth = bodyWidth * 0.5;
    
    // 先画炮管
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);

    // 再画方形炮塔基座
    ctx.fillStyle = tank.color;
    ctx.fillRect(-turretRadius, -turretRadius, turretRadius*2, turretRadius*2);
}

function drawSniperTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.3;
    const barrelLength = bodyWidth * 1.1; // 【更新】缩短炮管
    const barrelWidth = bodyWidth * 0.1;
    
    // 先画炮管和制退器
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
    ctx.fillStyle = darkenColor(tank.color, 50);
    ctx.fillRect(barrelLength, -barrelWidth * 1.5, 10 * UI_SCALE, barrelWidth * 3);

    // 再画方形炮塔和狙击镜
    ctx.fillStyle = tank.color;
    ctx.fillRect(-turretRadius, -turretRadius, turretRadius*2, turretRadius*2);
    ctx.fillStyle = '#333';
    ctx.fillRect(turretRadius*0.2, -turretRadius*1.5, turretRadius, turretRadius*0.8);
}

function drawFlamethrowerTurret(tank) {
    const bodyWidth = tank.height;
    const turretRadius = bodyWidth * 0.4;
    
    // 先画油罐
    ctx.fillStyle = darkenColor(tank.color, 40);
    ctx.fillRect(-turretRadius * 1.5, -turretRadius * 0.6, turretRadius, turretRadius * 1.2);

    // 再画炮管和喷口
    const nozzleLength = bodyWidth * 0.8;
    const nozzleWidth = bodyWidth * 0.2;
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fillRect(0, -nozzleWidth/2, nozzleLength, nozzleWidth);
    ctx.fillStyle = '#333'; // 喷口
    ctx.fillRect(nozzleLength, -nozzleWidth * 0.8, 8 * UI_SCALE, nozzleWidth * 1.6);
    
    // 最后画炮塔底座
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
}

function drawSentry(sentry) {
    // 【新增】绘制射程范围
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(animationFrame * 0.05) * 0.05;
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(sentry.x, sentry.y, sentry.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 绘制基座和炮塔
    const sentrySize = 30 * UI_SCALE;
    ctx.save();
    ctx.translate(sentry.x, sentry.y);
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath(); ctx.arc(0, 0, sentrySize / 2, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(sentry.turretAngle);
    ctx.fillStyle = SENTRY_GUN_CONFIG.color;
    ctx.fillRect(0, -5 * UI_SCALE, 30 * UI_SCALE, 10 * UI_SCALE);
    ctx.restore();

    // 绘制生命条
     if (sentry.hp < sentry.maxHp) {
        const barWidth = sentrySize + 10*UI_SCALE;
        const barY = sentry.y - sentrySize / 2 - (15*UI_SCALE);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(sentry.x - barWidth / 2, barY, barWidth, 8*UI_SCALE);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(sentry.x - barWidth / 2, barY, barWidth * (sentry.hp / sentry.maxHp), 8*UI_SCALE);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(sentry.x - barWidth / 2, barY, barWidth, 8*UI_SCALE);
    }
}

function drawHUD() {
    const margin = 20 * UI_SCALE;
    ctx.textAlign = 'left'; ctx.font = `${20 * UI_SCALE}px Arial`; ctx.fillStyle = 'white';
    ctx.fillText(`Enemies Remaining: ${enemies.length}`, margin, margin + (10*UI_SCALE));
    
    let fireRate = TANK_TYPES[player.type].fireRate;
    if (player.type === 'MACHINE_GUN' && player.module === 'MODULE_2') {
        const maxSpoolTime = 4000;
        const minFireRate = 80;
        const maxFireRate = 500;
        const spoolRatio = player.gatlingSpoolUpTime / maxSpoolTime;
        fireRate = maxFireRate - (maxFireRate - minFireRate) * spoolRatio;
    } else if (player.type === 'MORTAR' && player.module === 'MODULE_2') {
        fireRate = 5000;
    } else if (player.type === 'SNIPER' && player.module === 'MODULE_1') {
        fireRate = TANK_TYPES.SNIPER.fireRate;
    }
    else if (isEffectActive(player, 'BERSERK')) {
        fireRate *= 0.7;
    }
    const reloadProgress = Math.min(1, (Date.now() - player.lastFireTime) / fireRate);
    
    const barY = margin + (20 * UI_SCALE);
    const barWidth = 200 * UI_SCALE;
    const barHeight = 20 * UI_SCALE;
    ctx.fillStyle = '#555'; ctx.fillRect(margin, barY, barWidth, barHeight);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(margin, barY, barWidth * reloadProgress, barHeight);
    ctx.strokeStyle = 'white'; ctx.strokeRect(margin, barY, barWidth, barHeight);

    drawSkillUI(ctx, player.skills.q, 'Q', margin, barY + barHeight + (10 * UI_SCALE));
    drawSkillUI(ctx, player.skills.e, 'E', margin, barY + barHeight + (80 * UI_SCALE));

    if (player.type === 'SNIPER' && player.module === 'MODULE_1' && player.chargeStartTime > 0) {
        drawChargeBar();
    }
    if (player.type === 'SNIPER' && player.module === 'MODULE_2') {
        drawStealthBar();
    }
    drawScoreFeed();
}
function drawScoreFeed() {
    const feedX = canvas.width - (30 * UI_SCALE);
    const feedY = canvas.height - (40 * UI_SCALE);
    const lineHeight = 25 * UI_SCALE;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = `bold ${18 * UI_SCALE}px Arial`;

    scoreFeed.forEach((item, index) => {
        const [r, g, b] = ctx.fillStyle = item.color === 'white' ? [255, 255, 255] : [243, 156, 18];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${item.alpha})`;
        ctx.fillText(item.text, feedX, feedY - (index * lineHeight));
    });

    ctx.restore();
}
function showCodeInput() {
    document.getElementById('code-entry-container').style.display = 'flex';
}
function hideCodeInput() {
    document.getElementById('code-entry-container').style.display = 'none';
}
function createTankExplosion(position) {
    // 1. 核心的明亮闪光
    projectiles.push({ type: 'vfx_core_flash', x: position.x, y: position.y, life: 0, maxLife: 20 });

    // 2. 扩散的冲击波
    projectiles.push({type: 'vfx_shockwave', x: position.x, y: position.y, life: 0, maxLife: 30, maxRadius: 120 * UI_SCALE});

    // 3. 四散的碎片
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        projectiles.push({
            type: 'vfx_debris',
            x: position.x,
            y: position.y,
            dx: Math.cos(angle) * speed * UI_SCALE,
            dy: Math.sin(angle) * speed * UI_SCALE,
            life: 0,
            maxLife: 60 + Math.random() * 60, // 碎片持续1-2秒
            size: (2 + Math.random() * 3) * UI_SCALE,
            gravity: 0.1 * UI_SCALE
        });
    }
}
function createScorePopup(text, color) {
    if (color === 'white') {
        hitSound.currentTime = 0; // 重置音效，确保每次都能从头播放
        hitSound.play();
    } else if (color === '#f39c12') { // 如果是黄色文字，判定为“击杀”
        killSound.currentTime = 0;
        killSound.play();
    }
    const newScoreItem = {
        text: text,
        color: color,
        creationTime: Date.now(),
        alpha: 0.5 // 初始完全不透明
    };
    
    // 将新条目添加到数组的开头，这样新分数会显示在最下方
    scoreFeed.unshift(newScoreItem);
    
    // 为了防止信息流过长，我们只保留最新的10条信息
    if (scoreFeed.length > 50) {
        scoreFeed.pop();
    }
}
// =================================
//  6. 辅助函数与事件监听
// =================================
function darkenColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function triggerReactiveArmor(tank) {
    if (Date.now() - tank.lastReactiveArmorProc < REACTIVE_ARMOR_CONFIG.cooldown) return;
    tank.lastReactiveArmorProc = Date.now();
    projectiles.push({type: 'vfx_fire_nova', x: tank.x, y: tank.y, life: 0, maxLife: 30, maxRadius: REACTIVE_ARMOR_CONFIG.range});
    enemies.forEach(e => {
        if (Math.hypot(tank.x - e.x, tank.y - e.y) < REACTIVE_ARMOR_CONFIG.range) {
            if (!isEffectActive(e, 'SHIELD')) e.hp -= REACTIVE_ARMOR_CONFIG.damage;
        }
    });
}
function stopAllSounds() {
    allSounds.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
}
function activateSkill(key) {
    const skill = player.skills[key];
    if (!skill.config) return;
    if (Date.now() - skill.lastUsed > skill.config.cooldown) {
        skill.lastUsed = Date.now();
        if (selectedSkills[key] === 'SENTRY_GUN') {
            sentryDeploySound.currentTime = 0;
            sentryDeploySound.play();
            spawnSentryGun();
        // ... 在 activateSkill 函数内部
        } else if (selectedSkills[key] === 'ARTILLERY_BARRAGE') {
            artillerySound.currentTime = 0;
            artillerySound.play();

            // 【更新】让炮击优先锁定敌人
            const targets = [...enemies]; // 创建一个敌人数组的副本
            for (let i = 0; i < 5; i++) {
                let targetX, targetY;
                if (targets.length > 0) {
                    // 如果还有敌人，随机选择一个作为目标，并从列表中移除以避免重复轰炸
                    const targetIndex = Math.floor(Math.random() * targets.length);
                    const targetEnemy = targets.splice(targetIndex, 1)[0];
                    targetX = targetEnemy.x;
                    targetY = targetEnemy.y;
                } else {
                    // 如果敌人数量少于5个，或者已经全部被选为目标，则剩余的炮弹随机轰炸
                    targetX = Math.random() * canvas.width;
                    targetY = Math.random() * canvas.height;
                }

                projectiles.push({
                    type: 'artillery_strike',
                    owner: 'player',
                    targetX: targetX,
                    targetY: targetY,
                    damage: 8,
                    life: 0,
                    maxLife: 360
                });
            }
        }
        else {
            // 【新增】在激活buff类技能时播放对应音效
            if (selectedSkills[key] === 'BERSERK') {
                berserkSound.currentTime = 0;
                berserkSound.play();
            } else if (selectedSkills[key] === 'DAMAGE_BOOST') { // 【新增】为攻击加强播放音效
                damageBoostSound.currentTime = 0;
                damageBoostSound.play();
            } else if (selectedSkills[key] === 'SHIELD') { // 【新增】为护盾播放音效
                shieldSound.currentTime = 0;
                shieldSound.play();
            } else if (selectedSkills[key] === 'LIFE_STEAL') { // 【新增】为血量汲取播放音效
                lifeStealSound.currentTime = 0;
                lifeStealSound.play();
            }
            // 可以为其他技能在这里添加 'else if' 来播放不同音效

            skill.activeUntil = Date.now() + skill.config.duration;
            player.statusEffects.push({ type: selectedSkills[key], activeUntil: skill.activeUntil });
        }
    }
}
function isEffectActive(entity, effectType) {
    if(!entity || !entity.statusEffects) return false;
    return entity.statusEffects.some(effect => effect.type === effectType);
}
function updateStatusEffects(entity) {
    if(!entity || !entity.statusEffects) return;
    entity.statusEffects = entity.statusEffects.filter(effect => {
        if (Date.now() > effect.activeUntil) return false;
        if(effect.type === 'BURN') {
            if (Date.now() - effect.lastTickTime > effect.tickInterval) {
                if (!isEffectActive(entity, 'SHIELD')) entity.hp -= effect.damagePerTick;
                effect.lastTickTime = Date.now();
            }
        }
        return true;
    });
}
function triggerReactiveArmor(tank) {
    if (Date.now() - tank.lastReactiveArmorProc < REACTIVE_ARMOR_CONFIG.cooldown) return;
    tank.lastReactiveArmorProc = Date.now();
    projectiles.push({type: 'vfx_fire_nova', x: tank.x, y: tank.y, life: 0, maxLife: 30, maxRadius: REACTIVE_ARMOR_CONFIG.range});
    enemies.forEach(e => {
        if (Math.hypot(tank.x - e.x, tank.y - e.y) < REACTIVE_ARMOR_CONFIG.range) {
            e.hp -= REACTIVE_ARMOR_CONFIG.damage;
        }
    });
}
function drawActiveSkillEffects(tank) {
    if(!tank.statusEffects || !tank.statusEffects.length) return;

    ctx.save();
    if(isEffectActive(tank, 'LIFE_STEAL')) {
        ctx.strokeStyle = `rgba(231, 76, 60, ${1 - (animationFrame % 45) / 45})`;
        ctx.lineWidth = 2 * UI_SCALE;
        const radius = (tank.width / 2) + (animationFrame % 45) * (UI_SCALE * 1.5);
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    if(isEffectActive(tank, 'SHIELD')) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.strokeStyle = 'rgba(129, 207, 224, 0.8)';
        ctx.lineWidth = 3 * UI_SCALE;
        const radius = tank.width/2 + 10*UI_SCALE + Math.sin(animationFrame * 0.1) * 3 * UI_SCALE;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    if(isEffectActive(tank, 'DAMAGE_BOOST')) {
        const barrelTipX = tank.x + Math.cos(tank.turretAngle) * 40 * UI_SCALE;
        const barrelTipY = tank.y + Math.sin(tank.turretAngle) * 40 * UI_SCALE;
        ctx.fillStyle = `rgba(255, ${Math.random()*150 + 100}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(barrelTipX, barrelTipY, (5 + Math.random() * 5) * UI_SCALE, 0, Math.PI*2);
        ctx.fill();
    }
    if(isEffectActive(tank, 'BERSERK')) {
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.8)';
        ctx.lineWidth = 2 * UI_SCALE;
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            const startX = tank.x + (Math.random() - 0.5) * tank.width;
            const startY = tank.y + (Math.random() - 0.5) * tank.height;
            ctx.moveTo(startX, startY);
            for(let j=0; j<3; j++) {
                ctx.lineTo(startX + (Math.random()-0.5)*20*UI_SCALE, startY + (Math.random()-0.5)*20*UI_SCALE);
            }
            ctx.stroke();
        }
    }
    ctx.restore();
}
function drawSkillUI(ctx, skill, key, x, y) {
    if(!skill.config) return;
    const now = Date.now();
    const cooldownRemaining = Math.max(0, skill.config.cooldown - (now - skill.lastUsed));
    const activeRemaining = Math.max(0, skill.activeUntil - now);
    const width = 200 * UI_SCALE;
    const height = 60 * UI_SCALE;

    ctx.save();
    ctx.font = `${16 * UI_SCALE}px Arial`; ctx.textAlign = 'center'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
    ctx.fillStyle = '#333'; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'white'; ctx.fillText(`(${key}) ${skill.config.name}`, x + width/2, y + 25*UI_SCALE);
    
    if (cooldownRemaining > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = 'white'; ctx.font = `${24*UI_SCALE}px Arial`;
        ctx.fillText(`${(cooldownRemaining / 1000).toFixed(1)}s`, x + width/2, y + 40*UI_SCALE);
    }
    if (activeRemaining > 0 && skill.config.duration) {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.fillRect(x, y + 45*UI_SCALE, width * (activeRemaining / skill.config.duration), 15*UI_SCALE);
        ctx.fillStyle = 'black'; ctx.font = `${14 * UI_SCALE}px Arial`;
        ctx.fillText(`${(activeRemaining / 1000).toFixed(1)}s`, x + width/2, y + 58*UI_SCALE);
    }
    
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
}
function drawTankTooltip(button) {
    const type = button.type;
    const tankConfig = TANK_TYPES[type];
    if (!button) return;

    const x = button.x + button.width + 10 * UI_SCALE;
    const y = button.y;
    const width = 250 * UI_SCALE;
    const height = 120 * UI_SCALE;
    let lineY = y + 25 * UI_SCALE;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.font = `${16 * UI_SCALE}px Arial`;
    
    ctx.fillText(`血量: ${tankConfig.maxHp}`, x + 15 * UI_SCALE, lineY); lineY += 22 * UI_SCALE;
    if(type === 'SNIPER') {
        ctx.fillText(`伤害: 3 - 10 (随距离变化)`, x + 15 * UI_SCALE, lineY); lineY += 22 * UI_SCALE;
    } else {
        ctx.fillText(`伤害: ${tankConfig.bulletDamage}`, x + 15 * UI_SCALE, lineY); lineY += 22 * UI_SCALE;
    }
    ctx.fillText(`射速: ${tankConfig.fireRate / 1000}秒/发`, x + 15 * UI_SCALE, lineY);
}
function drawModuleTooltip(module) {
    const moduleConfig = MODULES[selectedTankType]?.[module.type];
    if (!moduleConfig || !module.button) return;

    const x = module.button.x + module.button.width + 10 * UI_SCALE;
    const y = module.button.y;
    const width = 280 * UI_SCALE;
    const height = 100 * UI_SCALE;
    let lineY = y + 25 * UI_SCALE;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height); ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = 'white'; ctx.textAlign = 'left';
    ctx.font = `bold ${16 * UI_SCALE}px Arial`;
    ctx.fillText(moduleConfig.name, x + 15 * UI_SCALE, lineY);
    lineY += 25 * UI_SCALE;

    ctx.font = `${14 * UI_SCALE}px Arial`;
    switch(selectedTankType) {
        case 'CANNON':
            if (module.type === 'MODULE_1') {
                 ctx.fillText('飞行速度: x1 -> x2.5', x + 15*UI_SCALE, lineY); lineY += 20 * UI_SCALE;
                 ctx.fillText('基础伤害: 4 -> 3', x + 15*UI_SCALE, lineY);
            }
            if (module.type === 'MODULE_2') ctx.fillText('附加效果: 命中造成0.35秒眩晕', x + 15*UI_SCALE, lineY);
            break;
        // ... 其他坦克的介绍保持不变 ...
        case 'MACHINE_GUN':
            if (module.type === 'MODULE_1') ctx.fillText('齐射数量: 3 -> 5', x + 15*UI_SCALE, lineY);
            if (module.type === 'MODULE_2') {
                 ctx.fillText('射速: 0.25 -> 0.5~0.08秒 (动态)', x + 15*UI_SCALE, lineY); lineY += 20 * UI_SCALE;
                 ctx.fillText('代价: 移动速度降低60%', x + 15*UI_SCALE, lineY);
            }
            break;
        case 'MORTAR':
             if (module.type === 'MODULE_1') ctx.fillText('效果: 爆炸产生1秒延迟的二次爆炸', x + 15*UI_SCALE, lineY);
             if (module.type === 'MODULE_2') {
                 ctx.fillText('开火方式: 点按三次进行齐射', x + 15*UI_SCALE, lineY); lineY += 20 * UI_SCALE;
                 ctx.fillText('冷却时间: 3秒 -> 5秒', x + 15*UI_SCALE, lineY);
             }
            break;
        case 'SNIPER':
            if (module.type === 'MODULE_1') ctx.fillText('开火方式: 长按蓄力 (最低3, 最高10)', x + 15*UI_SCALE, lineY);
            if (module.type === 'MODULE_2') ctx.fillText('效果: 静止1秒后隐身，移动不破隐', x + 15*UI_SCALE, lineY);
            break;
        case 'FLAMETHROWER':
            if (module.type === 'MODULE_1') {
                ctx.fillText('效果: 被攻击时对周围造成2点伤害', x + 15*UI_SCALE, lineY); lineY += 20 * UI_SCALE;
                ctx.fillText('附加效果: 每秒恢复2%最大生命值', x + 15*UI_SCALE, lineY);
            }
            if (module.type === 'MODULE_2') {
                ctx.fillText('效果: 火焰附加3秒虚弱', x + 15*UI_SCALE, lineY); lineY += 20 * UI_SCALE;
                ctx.fillText('虚弱: 敌人伤害-1, 移速-50%', x + 15*UI_SCALE, lineY);
            }
            break;
    }
}
function drawChargeBar() {
    const barWidth = 100 * UI_SCALE;
    const barHeight = 15 * UI_SCALE;
    const x = player.x - player.width / 2 - barWidth - 10 * UI_SCALE;
    const y = player.y - barHeight / 2;

    const maxChargeTime = 1000;
    const chargeDuration = Date.now() - player.chargeStartTime;
    const chargeRatio = Math.min(1, chargeDuration / maxChargeTime);

    ctx.fillStyle = '#555';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x, y, barWidth * chargeRatio, barHeight);
    const currentDamage = 3 + (10 - 3) * chargeRatio;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${14 * UI_SCALE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentDamage.toFixed(1), x + barWidth / 2, y + barHeight/2);
}
function drawStealthBar() {
    if (player.isStealthed) return;
    const timeIdle = Date.now() - player.lastActionTime;
    if (timeIdle < 1000) {
        const barWidth = player.width;
        const barHeight = 5 * UI_SCALE;
        const x = player.x - barWidth / 2;
        const y = player.y + player.height / 2 + 5 * UI_SCALE;
        const progress = timeIdle / 1000;

        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(x, y, barWidth * progress, barHeight);
    }
}


function getLineIntersection(p1, p2, p3, p4) {
    const { x: x1, y: y1 } = p1; const { x: x2, y: y2 } = p2;
    const { x: x3, y: y3 } = p3; const { x: x4, y: y4 } = p4;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0 && u < 1) { return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }; }
    return null;
}
function isPointInRect(px, py, rect) { return px > rect.x && px < rect.x + rect.width && py > rect.y && py < rect.y + rect.height; }
function doRectsOverlap(r1, r2) {
    return !(r1.x + r1.width < r2.x || r2.x + r2.width < r1.x ||
             r1.y + r1.height < r2.y || r2.y + r2.height < r1.y);
}
function areEntitiesColliding(e1, e2) {
    const r1 = { x: e1.x - e1.width/2, y: e1.y - e1.height/2, width: e1.width, height: e1.height };
    const r2 = { x: e2.x - e2.width/2, y: e2.y - e2.height/2, width: e2.width, height: e2.height };
    return doRectsOverlap(r1, r2);
}
function checkEntityObstacleCollision(entity) {
    const entityRect = { x: entity.x - entity.width/2, y: entity.y - entity.height/2, width: entity.width, height: entity.height };
    for (const obs of obstacles) { if (doRectsOverlap(entityRect, obs)) return true; }
    return false;
}
function isLineIntersectingRect(x1, y1, x2, y2, rect) {
    const p1 = {x:x1, y:y1}, p2 = {x:x2, y:y2};
    const s1 = {p1: {x:rect.x, y:rect.y}, p2:{x:rect.x+rect.width, y:rect.y}};
    const s2 = {p1: {x:rect.x, y:rect.y}, p2:{x:rect.x, y:rect.y+rect.height}};
    const s3 = {p1: {x:rect.x+rect.width, y:rect.y+rect.height}, p2:{x:rect.x, y:rect.y+rect.height}};
    const s4 = {p1: {x:rect.x+rect.width, y:rect.y+rect.height}, p2:{x:rect.x+rect.width, y:rect.y}};
    return getLineIntersection(p1,p2,s1.p1,s1.p2) || getLineIntersection(p1,p2,s2.p1,s2.p2) ||
           getLineIntersection(p1,p2,s3.p1,s3.p2) || getLineIntersection(p1,p2,s4.p1,s4.p2);
}
function isLineIntersectingObstacle(x1, y1, x2, y2) {
    for (const obs of obstacles) { if (obs.type !== 'river' && isLineIntersectingRect(x1, y1, x2, y2, obs)) return true; }
    return false;
}

document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase(); keys[key] = true;
    if (gameState === 'playing') { if (key === 'q') activateSkill('q'); if (key === 'e') activateSkill('e'); }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;

    if (gameState === 'selectionScreen') {
        hoveredTank = null;
        hoveredModule = null;
        for (const btn of selectionScreenUI.tankButtons) {
            if (isPointInRect(mouse.x, mouse.y, btn)) {
                hoveredTank = btn;
                break;
            }
        }
        if(selectedTankType) {
            for (const btn of selectionScreenUI.moduleButtons) {
                if (isPointInRect(mouse.x, mouse.y, btn)) {
                    hoveredModule = { type: btn.type, button: btn };
                    break;
                }
            }
        }
    }
});
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
        mouse.clicked = true;
        if (gameState === 'playing' && player.type === 'MORTAR' && player.module === 'MODULE_2') {
            if (player.mortarTargets.length === 0 && Date.now() - player.lastFireTime < 5000) return;
            if (player.mortarTargets.length < 3) {
                player.mortarTargets.push({x: mouse.x, y: mouse.y});
                projectiles.push({type: 'mortar_preview_target', x: mouse.x, y: mouse.y, life: 0, maxLife: 10000, number: player.mortarTargets.length});
                if (player.mortarTargets.length >= 3) {
                    player.lastFireTime = Date.now();
                    fireWeapon(player);
                    projectiles = projectiles.filter(p => p.type !== 'mortar_preview_target');
                }
            }
        }
        if (gameState === 'playing' && player.type === 'SNIPER' && player.module === 'MODULE_1') {
            if (Date.now() - player.lastFireTime > TANK_TYPES.SNIPER.fireRate) {
                player.chargeStartTime = Date.now();
            }
        }
        if (gameState === 'playing' && player.type === 'FLAMETHROWER') {
            flamethrowerSound.play();
        }
    }
});
canvas.addEventListener('mouseup', e => {
    if (e.button === 0) {
        mouse.clicked = false;
        if (gameState === 'playing' && player.type === 'SNIPER' && player.module === 'MODULE_1' && player.chargeStartTime > 0) {
            chargeShotSound.currentTime = 0;
            chargeShotSound.play();
            player.lastFireTime = Date.now();
            player.lastActionTime = Date.now();
            player.isStealthed = false;
            fireWeapon(player);
            player.chargeStartTime = 0;
        }
        if (gameState === 'playing' && player.type === 'FLAMETHROWER') {
            flamethrowerSound.pause();
            flamethrowerSound.currentTime = 0;
        }
    }
});
canvas.addEventListener('click', handleCanvasClick);

// =================================
//  7. 主游戏循环
// =================================
function mainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (gameState) {
        case 'splashScreen':
            updateSplashScreen();
            drawSplashScreen();
            break;
        case 'selectionScreen': 
            drawSelectionScreen(); 
            break;
        case 'difficultyScreen':
            drawDifficultyScreen();
            break;
        case 'playing': 
            updateGame(); 
            drawGame(); 
            break;
        case 'victory': 
            drawGame(); 
            drawEndScreen('胜利!', '#2ecc71'); 
            break;
        case 'gameOver': 
            drawGame(); 
            drawEndScreen('失败...', '#e74c3c'); 
            break;
    }
    requestAnimationFrame(mainLoop);
}

// 启动
function init() {
    setupUI();
    splashScreenStartTime = Date.now();
    
    // 为关闭按钮添加点击事件
    document.getElementById('modal-close-button').addEventListener('click', () => {
        document.getElementById('update-modal-backdrop').style.display = 'none';
        updateModalClosed = true; // 记录已关闭，本次游戏不再显示
    });

    // 【修复】将礼品码按钮的事件监听移动到init函数内部，确保元素已加载
    document.getElementById('giftCodeButton').addEventListener('click', () => {
        const input = document.getElementById('giftCodeInput');
        if (input.value.toLowerCase() === 'fjxyes') {
            flamethrowerUnlocked = true;
            artilleryUnlocked = true;
            alert('隐藏内容已解锁！');
            input.value = '';
        } else {
            alert('礼品码错误！');
        }
    });

    mainLoop();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});