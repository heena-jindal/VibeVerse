// games.js — All game logic

// ── TAB SWITCHING ──────────────────────────────────────

function showGame(name) {
    // Hide all panels
    document.querySelectorAll('.game-panel').forEach(p =>
        p.classList.add('hidden'));
    document.querySelectorAll('.game-tab').forEach(t =>
        t.classList.remove('active'));

    // Show selected
    document.getElementById('game-' + name).classList.remove('hidden');
    event.target.classList.add('active');

    // Stop breathing if switching away
    if (name !== 'breathing' && breathingActive) {
        toggleBreathing();
    }

    // Init memory on first open
    if (name === 'memory' && !memoryInitialised) {
        initMemory();
        memoryInitialised = true;
    }

    // Spawn bubbles on first open
    if (name === 'bubbles' && !bubblesInitialised) {
        spawnBubbles();
        bubblesInitialised = true;
    }
}


// ══════════════════════════════════════════════════════
// GAME 1: BOX BREATHING
// ══════════════════════════════════════════════════════

let breathingActive   = false;
let breathingInterval = null;
let breathPhaseIndex  = 0;

// Box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold
const breathPhases = [
    { text: 'Breathe In',  duration: 4000, scale: 1.4 },
    { text: 'Hold',        duration: 4000, scale: 1.4 },
    { text: 'Breathe Out', duration: 4000, scale: 1.0 },
    { text: 'Hold',        duration: 4000, scale: 1.0 },
];

function toggleBreathing() {
    breathingActive = !breathingActive;
    const btn = document.getElementById('breathBtn');

    if (breathingActive) {
        btn.textContent = 'Stop';
        runBreathPhase();
    } else {
        btn.textContent = 'Start';
        clearTimeout(breathingInterval);
        document.getElementById('breathText').textContent  = 'Ready';
        document.getElementById('breathPhase').textContent = 'Press Start to begin';
        document.getElementById('breathCircle').style.transform = 'scale(1)';
        document.getElementById('breathCircle').style.background = '#EEEDFE';
        breathPhaseIndex = 0;
    }
}

function runBreathPhase() {
    if (!breathingActive) return;

    const phase  = breathPhases[breathPhaseIndex];
    const circle = document.getElementById('breathCircle');
    const text   = document.getElementById('breathText');
    const label  = document.getElementById('breathPhase');

    // Update circle
    circle.style.transform  = `scale(${phase.scale})`;
    circle.style.background = phase.text === 'Breathe In'
        ? '#EEEDFE' : phase.text === 'Breathe Out'
        ? '#E1F5EE' : '#FAEEDA';

    // Update text
    text.textContent  = phase.text;
    label.textContent = phase.text + ' — ' + (phase.duration / 1000) + ' seconds';

    // Schedule next phase
    breathingInterval = setTimeout(function() {
        breathPhaseIndex = (breathPhaseIndex + 1) % breathPhases.length;
        runBreathPhase();
    }, phase.duration);
}


// ══════════════════════════════════════════════════════
// GAME 2: BUBBLE POP
// ══════════════════════════════════════════════════════

let popCount          = 0;
let bubblesInitialised = false;

const worries = [
    'fear of judgment', 'what if I fail', 'they don\'t like me',
    'I said something wrong', 'social anxiety', 'overthinking',
    'fear of rejection', 'not fitting in', 'being laughed at',
    'saying the wrong thing', 'awkward silence', 'blushing'
];

function spawnBubbles() {
    const arena = document.getElementById('bubbleArena');
    arena.innerHTML = '';

    // Pick 8 random worries
    const shuffled = [...worries].sort(() => Math.random() - 0.5).slice(0, 8);

    shuffled.forEach(function(worry, i) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble-item');
        bubble.textContent = worry;

        // Random position
        bubble.style.left = (10 + Math.random() * 70) + '%';
        bubble.style.top  = (10 + Math.random() * 70) + '%';

        // Random size
        const size = 80 + Math.floor(Math.random() * 50);
        bubble.style.width  = size + 'px';
        bubble.style.height = size + 'px';

        // Random float animation delay
        bubble.style.animationDelay = (Math.random() * 2) + 's';

        // Pop on click
        bubble.addEventListener('click', function() {
            popBubble(bubble, worry);
        });

        arena.appendChild(bubble);
    });
}

function popBubble(bubble, worry) {
    // Pop animation
    bubble.style.transform  = 'scale(1.3)';
    bubble.style.opacity    = '0';
    bubble.style.transition = 'all 0.3s';

    setTimeout(() => bubble.remove(), 300);

    popCount++;
    document.getElementById('popCount').textContent = popCount;

    // Add to released list
    const list = document.getElementById('poppedList');
    const item = document.createElement('span');
    item.style.cssText = `
        display:inline-block;background:#EEEDFE;color:#534AB7;
        font-size:11px;padding:2px 8px;border-radius:10px;margin:2px
    `;
    item.textContent = '✓ ' + worry;
    list.appendChild(item);
}


// ══════════════════════════════════════════════════════
// GAME 3: MEMORY MATCH
// ══════════════════════════════════════════════════════

let memoryInitialised = false;
let flippedCards      = [];
let matchedPairs      = 0;
let moves             = 0;
let lockBoard         = false;

const emojis = ['🌸','🌟','🦋','🌈','🍀','☀️','🌙','🎵'];

function initMemory() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    document.getElementById('memoryWin').classList.add('hidden');
    flippedCards = [];
    matchedPairs = 0;
    moves        = 0;
    lockBoard    = false;
    document.getElementById('moveCount').textContent  = '0';
    document.getElementById('matchCount').textContent = '0';

    // Create pairs and shuffle
    const cards = [...emojis, ...emojis]
        .sort(() => Math.random() - 0.5);

    cards.forEach(function(emoji, index) {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.emoji = emoji;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${emoji}</div>
            </div>
        `;

        card.addEventListener('click', function() {
            flipCard(card);
        });

        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (lockBoard) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('moveCount').textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [a, b] = flippedCards;
    const isMatch = a.dataset.emoji === b.dataset.emoji;

    if (isMatch) {
        // Mark matched
        a.classList.add('matched');
        b.classList.add('matched');
        flippedCards = [];
        matchedPairs++;
        document.getElementById('matchCount').textContent = matchedPairs;

        if (matchedPairs === 8) {
            // All pairs found
            setTimeout(() => {
                document.getElementById('memoryWin')
                        .classList.remove('hidden');
            }, 500);
        }
    } else {
        // Flip back after delay
        lockBoard = true;
        setTimeout(function() {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            flippedCards = [];
            lockBoard    = false;
        }, 1000);
    }
}