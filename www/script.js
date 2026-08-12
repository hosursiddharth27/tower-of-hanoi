// ==========================================
// TOWER OF HANOI - DISC COUNT CHALLENGE ENGINE
// ==========================================

const STORAGE_KEY = 'towerOfHanoiDiscChallengeProgress_v3';

// Global Progress Data Structure
let progressData = {
    soundEnabled: true,
    animationsEnabled: true,
    randomStars: 0,
    theme: 'dark',
    discCounts: {}
};

function getPuzzlesCountForDiscCount(nDiscs) {
    return 4; // 4 Puzzles per Disc Count Challenge
}

// Initialize progress structure for 3 to 15 Discs
for (let n = 3; n <= 15; n++) {
    const pCount = getPuzzlesCountForDiscCount(n);
    progressData.discCounts[n] = {
        unlockedPuzzle: 0,
        puzzles: {}
    };
    for (let p = 0; p < pCount; p++) {
        progressData.discCounts[n].puzzles[p] = {
            completed: false,
            stars: 0,
            bestMoves: null,
            bestTime: null
        };
    }
}

// Current Game Session State
let currentDiscCount = 3;
let currentPuzzleIndex = 0;
let discCount = 3;
let targetTower = 'B or C';
let towers = { A: [], B: [], C: [] };
let initialTowersState = { A: [], B: [], C: [] };
let selectedTower = null;
let moves = 0;
let history = [];
let seconds = 0;
let timerInterval = null;
let draggedDiscInfo = null;
let isAnimating = false;

// Demo Mode State
let isDemoMode = false;
let isDemoPaused = false;
let demoInterval = null;
let demoSpeedMultiplier = 1;
let isRandomChallenge = false;

// Audio Context
let audioCtx = null;

function getAudioContext() {
    try {
        if (!audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            audioCtx = new AudioCtx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    } catch (e) {
        return null;
    }
}

function playSound(type) {
    if (!progressData || !progressData.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'select') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(120, now + 0.15);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'win') {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                try {
                    const noteOsc = ctx.createOscillator();
                    const noteGain = ctx.createGain();
                    noteOsc.connect(noteGain);
                    noteGain.connect(ctx.destination);
                    noteOsc.type = 'sine';
                    noteOsc.frequency.setValueAtTime(freq, now + i * 0.1);
                    noteGain.gain.setValueAtTime(0.2, now + i * 0.1);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
                    noteOsc.start(now + i * 0.1);
                    noteOsc.stop(now + i * 0.1 + 0.25);
                } catch (err) {}
            });
        }
    } catch (e) {
        // Ignore audio error gracefully
    }
}

// ==========================================
// DETERMINISTIC PUZZLE CONFIGURATION ENGINE
// ==========================================
function getPuzzleConfig(nDiscs, puzzleIndex) {
    let t = { A: [], B: [], C: [] };
    let target = 'B or C';

    if (puzzleIndex === 0) {
        // Puzzle 1: Standard Tower A -> Tower B or C
        for (let i = nDiscs; i >= 1; i--) t.A.push(i);
        target = 'B or C';
    } else if (puzzleIndex === 1) {
        // Puzzle 2: Standard Tower A -> Tower B or C
        for (let i = nDiscs; i >= 1; i--) t.A.push(i);
        target = 'B or C';
    } else if (puzzleIndex === 2) {
        // Puzzle 3: Reverse Start (Tower C -> Tower A or B)
        for (let i = nDiscs; i >= 1; i--) t.C.push(i);
        target = 'A or B';
    } else if (puzzleIndex === 3) {
        // Puzzle 4: Solvable Split (Largest disc on A, rest on B -> Target B or C)
        t.A.push(nDiscs);
        for (let i = nDiscs - 1; i >= 1; i--) t.B.push(i);
        target = 'B or C';
    }

    return { towers: t, targetTower: target };
}

// ==========================================
// LOCAL STORAGE PROGRESS MANAGER
// ==========================================
function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            progressData = { ...progressData, ...parsed };
            for (let n = 3; n <= 15; n++) {
                const pCount = getPuzzlesCountForDiscCount(n);
                if (!progressData.discCounts[n]) {
                    progressData.discCounts[n] = { unlockedPuzzle: 0, puzzles: {} };
                }
                for (let p = 0; p < pCount; p++) {
                    if (!progressData.discCounts[n].puzzles[p]) {
                        progressData.discCounts[n].puzzles[p] = { completed: false, stars: 0, bestMoves: null, bestTime: null };
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to load progress:", e);
    }

    applyTheme(progressData.theme);
    updateSoundButtonUI();
    updateTotalStarsUI();
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    } catch (e) {
        console.error("Failed to save progress:", e);
    }
    updateTotalStarsUI();
}

function resetProgress() {
    if (confirm("Are you sure you want to reset all game progress? This cannot be undone.")) {
        localStorage.removeItem(STORAGE_KEY);
        progressData.randomStars = 0;
        for (let n = 3; n <= 15; n++) {
            const pCount = getPuzzlesCountForDiscCount(n);
            progressData.discCounts[n] = { unlockedPuzzle: 0, puzzles: {} };
            for (let p = 0; p < pCount; p++) {
                progressData.discCounts[n].puzzles[p] = { completed: false, stars: 0, bestMoves: null, bestTime: null };
            }
        }
        saveProgress();
        renderDiscChallengesGrid();
        showScreen('homeScreen');
        playSound('click');
    }
}

function getCompletedPuzzlesCount() {
    let completed = 0;
    for (let n = 3; n <= 15; n++) {
        const pCount = getPuzzlesCountForDiscCount(n);
        for (let p = 0; p < pCount; p++) {
            if (progressData.discCounts[n].puzzles[p].completed) completed++;
        }
    }
    return completed;
}

function getTotalStars() {
    let total = progressData.randomStars || 0;
    for (let n = 3; n <= 15; n++) {
        const pCount = getPuzzlesCountForDiscCount(n);
        for (let p = 0; p < pCount; p++) {
            total += progressData.discCounts[n].puzzles[p].stars || 0;
        }
    }
    return total;
}

function updateTotalStarsUI() {
    const total = getTotalStars();
    const completedPuzzles = getCompletedPuzzlesCount();

    const homeTotal = document.getElementById("homeTotalStars");
    const selectTotal = document.getElementById("puzzleSelectStars");
    const discSelectTotal = document.getElementById("discSelectTotalStars");
    const homePill = document.getElementById("homeProgressPill");

    if (homeTotal) homeTotal.textContent = `⭐ ${total} Stars Earned`;
    if (selectTotal) selectTotal.textContent = `⭐ ${total}`;
    if (discSelectTotal) discSelectTotal.textContent = `⭐ ${total}`;
    if (homePill) homePill.textContent = `Progress: ${completedPuzzles} / 52 Puzzles`;
}

function updateAnimButtonUI() {
    const btn = document.getElementById("settingsAnimBtn");
    if (btn) {
        btn.textContent = progressData.animationsEnabled ? "ON" : "OFF";
        btn.className = `toggle-btn ${progressData.animationsEnabled ? 'active' : ''}`;
    }
}

// ==========================================
// SCREEN ROUTER
// ==========================================
function showScreen(screenId) {
    stopDemoMode();
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active");
    }

    if (screenId === 'homeScreen') {
        renderDiscChallengesGrid();
    } else if (screenId === 'puzzleSelectScreen') {
        renderPuzzleGrid(currentDiscCount);
    }
}

// ==========================================
// DISC COUNT SELECTION GRID (HOME SCREEN)
// ==========================================
function renderDiscChallengesGrid() {
    const grid = document.getElementById("discChallengesGrid");
    if (!grid) return;
    grid.innerHTML = "";

    for (let n = 3; n <= 15; n++) {
        const discData = progressData.discCounts[n];
        const pCount = getPuzzlesCountForDiscCount(n);

        let earnedStars = 0;
        for (let p = 0; p < pCount; p++) {
            earnedStars += discData.puzzles[p].stars || 0;
        }

        const card = document.createElement("div");
        card.className = "disc-card";

        card.innerHTML = `
            <div class="disc-title">${n} Discs</div>
            <div class="disc-sub">${pCount} Puzzles</div>
            <div class="disc-stars">⭐ ${earnedStars} / ${pCount * 3}</div>
        `;

        card.addEventListener("click", () => {
            playSound('click');
            currentDiscCount = n;
            showScreen('puzzleSelectScreen');
        });

        grid.appendChild(card);
    }
}

// ==========================================
// PUZZLE SELECTION GRID
// ==========================================
function renderPuzzleGrid(nDiscs) {
    const grid = document.getElementById("puzzleGrid");
    const title = document.getElementById("puzzleSelectTitle");
    if (!grid || !title) return;

    title.textContent = `${nDiscs} DISCS`;
    grid.innerHTML = "";

    const discData = progressData.discCounts[nDiscs];
    const pCount = getPuzzlesCountForDiscCount(nDiscs);

    for (let p = 0; p < pCount; p++) {
        const pData = discData.puzzles[p];
        const isUnlocked = p <= discData.unlockedPuzzle;

        const card = document.createElement("div");
        card.className = `puzzle-card ${isUnlocked ? '' : 'locked'}`;

        let statusClass = 'locked';
        let statusText = '🔒 Locked';

        if (pData.completed) {
            statusClass = 'completed';
            statusText = '✓ Completed';
        } else if (isUnlocked) {
            statusClass = 'current';
            statusText = '▶ Play';
        }

        const starsHtml = Array.from({ length: 3 }, (_, i) =>
            `<span style="opacity: ${i < (pData.stars || 0) ? 1 : 0.25}">★</span>`
        ).join('');

        card.innerHTML = `
            <div class="puzzle-name">Puzzle ${p + 1}</div>
            <div class="puzzle-status ${statusClass}">${statusText}</div>
            <div class="puzzle-stars">${starsHtml}</div>
        `;

        if (isUnlocked) {
            card.addEventListener("click", () => {
                playSound('click');
                loadPuzzle(nDiscs, p);
                showScreen('gameScreen');
            });
        }

        grid.appendChild(card);
    }
}

// ==========================================
// LOAD PUZZLE & START GAME
// ==========================================
function loadPuzzle(nDiscs, puzzleIndex) {
    stopDemoMode();
    isRandomChallenge = false;
    currentDiscCount = nDiscs;
    discCount = nDiscs;
    currentPuzzleIndex = puzzleIndex;

    const pCount = getPuzzlesCountForDiscCount(discCount);
    const config = getPuzzleConfig(discCount, puzzleIndex);

    targetTower = config.targetTower;
    towers = JSON.parse(JSON.stringify(config.towers));
    initialTowersState = JSON.parse(JSON.stringify(config.towers));

    clearInterval(timerInterval);
    timerInterval = null;

    selectedTower = null;
    draggedDiscInfo = null;
    moves = 0;
    history = [];
    seconds = 0;

    const pData = progressData.discCounts[discCount].puzzles[puzzleIndex];

    const nextBtn = document.getElementById("nextPuzzleBtn");
    if (nextBtn) nextBtn.textContent = "▶ NEXT PUZZLE";

    document.getElementById("gameHeaderTitle").textContent = `${discCount} DISCS • Puzzle ${currentPuzzleIndex + 1} / ${pCount}`;
    document.getElementById("targetTowerBadge").textContent = `Tower ${targetTower}`;
    document.getElementById("discCount").textContent = discCount;
    document.getElementById("minimumMoves").textContent = calculateMinimumMoves();
    document.getElementById("bestMovesBadge").textContent = pData.bestMoves ? pData.bestMoves : '-';

    updateScreen();
    setMessage(`Move all discs to Tower ${targetTower}.`);
    stopConfetti();
}

function restartCurrentPuzzle() {
    stopDemoMode();
    towers = JSON.parse(JSON.stringify(initialTowersState));
    clearInterval(timerInterval);
    timerInterval = null;

    selectedTower = null;
    draggedDiscInfo = null;
    moves = 0;
    history = [];
    seconds = 0;

    updateScreen();
    setMessage(`Puzzle restarted. Move discs to Tower ${targetTower}.`);
}

// Random Challenge Mode Generator
function startRandomChallenge() {
    stopDemoMode();
    isRandomChallenge = true;
    currentDiscCount = 99;
    discCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 discs
    targetTower = 'B or C';

    towers = { A: [], B: [], C: [] };
    for (let i = discCount; i >= 1; i--) {
        towers.A.push(i);
    }
    initialTowersState = JSON.parse(JSON.stringify(towers));

    clearInterval(timerInterval);
    timerInterval = null;

    selectedTower = null;
    moves = 0;
    history = [];
    seconds = 0;

    document.getElementById("gameHeaderTitle").textContent = `🎲 Random Challenge (${discCount} Discs)`;
    document.getElementById("targetTowerBadge").textContent = `Tower ${targetTower}`;
    document.getElementById("discCount").textContent = discCount;
    document.getElementById("minimumMoves").textContent = calculateMinimumMoves();
    document.getElementById("bestMovesBadge").textContent = '-';

    updateScreen();
    setMessage(`Random Challenge! Move discs to Tower ${targetTower}.`);
    showScreen('gameScreen');
}

// ==========================================
// RENDER GAME BOARD & DISCS
// ==========================================
function drawGame() {
    const towerElements = document.querySelectorAll(".tower");

    towerElements.forEach(towerElement => {
        const towerName = towerElement.dataset.tower;
        const container = towerElement.querySelector(".discs-container");
        container.innerHTML = "";

        const stack = towers[towerName];

        const isMobile = window.innerWidth <= 700;
        const maxPoleHeight = isMobile ? 210 : 250;
        const calcHeight = Math.max(13, Math.min(28, Math.floor((maxPoleHeight - discCount * 2) / discCount)));

        stack.forEach((discSize, index) => {
            const discElement = document.createElement("div");
            discElement.className = "disc";
            discElement.dataset.disc = discSize;
            discElement.dataset.tower = towerName;

            if (calcHeight >= 16) {
                discElement.textContent = discSize;
            }

            discElement.style.height = `${calcHeight}px`;
            if (calcHeight < 20) {
                discElement.style.fontSize = `${Math.max(0.55, calcHeight * 0.045)}rem`;
            }

            const smallestWidth = isMobile ? 38 : 52;
            const largestWidth = isMobile ? 180 : 230;
            let width;
            if (discCount === 1) {
                width = largestWidth;
            } else {
                width = smallestWidth + ((discSize - 1) / (discCount - 1)) * (largestWidth - smallestWidth);
            }

            discElement.style.width = `${width}px`;

            const hue = (200 + ((discSize - 1) * (360 / discCount))) % 360;
            discElement.style.background = `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 25) % 360}, 80%, 45%))`;

            const isTopDisc = index === stack.length - 1;

            if (isTopDisc && !isDemoMode) {
                discElement.classList.add("draggable");
                discElement.setAttribute("draggable", "true");
                setupDragEvents(discElement, towerName, discSize);
                setupTouchEvents(discElement, towerName, discSize);
            }

            if (selectedTower === towerName && isTopDisc) {
                discElement.classList.add("selected-disc");
            }

            container.appendChild(discElement);
        });

        // Target Tower highlight
        let isTarget = false;
        if (targetTower === 'B or C') {
            isTarget = (towerName === 'B' || towerName === 'C');
        } else if (targetTower === 'A or B') {
            isTarget = (towerName === 'A' || towerName === 'B');
        } else {
            isTarget = (towerName === targetTower);
        }

        if (isTarget) {
            towerElement.classList.add("target-tower");
        } else {
            towerElement.classList.remove("target-tower");
        }

        if (selectedTower === towerName) {
            towerElement.classList.add("selected");
        } else {
            towerElement.classList.remove("selected");
        }
    });
}

// ==========================================
// DRAG AND DROP ENGINE
// ==========================================
function setupDragEvents(discElement, towerName, discSize) {
    discElement.addEventListener("dragstart", (e) => {
        if (isDemoMode) {
            e.preventDefault();
            return;
        }
        draggedDiscInfo = { fromTower: towerName, discSize: discSize };
        discElement.classList.add("dragging");
        e.dataTransfer.setData("text/plain", towerName);
        e.dataTransfer.effectAllowed = "move";
        playSound('select');
    });

    discElement.addEventListener("dragend", () => {
        discElement.classList.remove("dragging");
        draggedDiscInfo = null;
        clearDropHighlights();
    });
}

function setupBoardDropEvents() {
    const towersList = document.querySelectorAll(".tower");

    towersList.forEach(tower => {
        const towerName = tower.dataset.tower;

        tower.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (!draggedDiscInfo || isDemoMode) return;

            const targetTop = getTopDisc(towerName);
            if (targetTop === null || draggedDiscInfo.discSize < targetTop) {
                e.dataTransfer.dropEffect = "move";
                tower.classList.add("drag-over-valid");
                tower.classList.remove("drag-over-invalid");
            } else {
                e.dataTransfer.dropEffect = "none";
                tower.classList.add("drag-over-invalid");
                tower.classList.remove("drag-over-valid");
            }
        });

        tower.addEventListener("dragleave", () => {
            tower.classList.remove("drag-over-valid", "drag-over-invalid");
        });

        tower.addEventListener("drop", (e) => {
            e.preventDefault();
            tower.classList.remove("drag-over-valid", "drag-over-invalid");

            if (!draggedDiscInfo || isDemoMode) return;

            const fromTower = draggedDiscInfo.fromTower;
            const toTower = towerName;

            if (fromTower !== toTower) {
                moveDisc(fromTower, toTower);
            }
            draggedDiscInfo = null;
        });
    });
}

function clearDropHighlights() {
    document.querySelectorAll(".tower").forEach(t => {
        t.classList.remove("drag-over-valid", "drag-over-invalid");
    });
}

// Touch Event Fallback
let activeTouchDisc = null;

function setupTouchEvents(discElement, towerName, discSize) {
    discElement.addEventListener("touchstart", (e) => {
        if (isDemoMode) return;
        activeTouchDisc = { element: discElement, fromTower: towerName, discSize: discSize };
        draggedDiscInfo = { fromTower: towerName, discSize: discSize };
        discElement.classList.add("dragging");
        playSound('select');
    }, { passive: true });
}

document.addEventListener("touchmove", (e) => {
    if (!activeTouchDisc || isDemoMode) return;
    const touch = e.touches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const towerUnder = elementUnderTouch ? elementUnderTouch.closest(".tower") : null;

    clearDropHighlights();

    if (towerUnder) {
        const towerName = towerUnder.dataset.tower;
        const targetTop = getTopDisc(towerName);
        if (targetTop === null || activeTouchDisc.discSize < targetTop) {
            towerUnder.classList.add("drag-over-valid");
        } else {
            towerUnder.classList.add("drag-over-invalid");
        }
    }
}, { passive: true });

document.addEventListener("touchend", (e) => {
    if (!activeTouchDisc || isDemoMode) return;

    const changedTouch = e.changedTouches[0];
    const elementUnderTouch = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
    const towerUnder = elementUnderTouch ? elementUnderTouch.closest(".tower") : null;

    clearDropHighlights();

    if (towerUnder) {
        const toTower = towerUnder.dataset.tower;
        if (activeTouchDisc.fromTower !== toTower) {
            moveDisc(activeTouchDisc.fromTower, toTower);
        }
    }

    if (activeTouchDisc.element) {
        activeTouchDisc.element.classList.remove("dragging");
    }
    activeTouchDisc = null;
    draggedDiscInfo = null;
});

// ==========================================
// CLICK INTERACTION
// ==========================================
function handleTowerClick(towerName) {
    if (isDemoMode) return;

    if (selectedTower === null) {
        if (towers[towerName].length === 0) {
            setMessage("❌ This tower is empty.");
            playSound('error');
            return;
        }
        selectedTower = towerName;
        playSound('select');
        setMessage(`Tower ${towerName} selected. Click destination tower.`);
        startTimer();
        updateScreen();
        return;
    }

    if (selectedTower === towerName) {
        cancelSelection();
        setMessage("Selection cancelled.");
        return;
    }

    moveDisc(selectedTower, towerName);
    cancelSelection();
}

function cancelSelection() {
    selectedTower = null;
    updateScreen();
}

function getTopDisc(towerName) {
    const stack = towers[towerName];
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

// ==========================================
// MOVE DISC CORE LOGIC
// ==========================================
function moveDisc(from, to) {
    if (towers[from].length === 0) {
        if (!isDemoMode) {
            setMessage("❌ No disc on source tower.");
            playSound('error');
        }
        return false;
    }

    const disc = getTopDisc(from);
    const destTop = getTopDisc(to);

    if (destTop !== null && disc > destTop) {
        if (!isDemoMode) {
            setMessage("❌ Larger disc cannot go on a smaller disc!");
            playSound('error');
        }
        return false;
    }

    history.push({ from: from, to: to });

    towers[from].pop();
    towers[to].push(disc);
    moves++;

    if (!isDemoMode) playSound('move');
    startTimer();
    updateScreen();

    if (!isDemoMode) setMessage(`Moved Disc ${disc} from ${from} → ${to}`);
    checkWin();
    return true;
}

// ==========================================
// UNDO
// ==========================================
function undoMove() {
    if (isDemoMode) return;
    if (history.length === 0) {
        setMessage("Nothing to undo.");
        playSound('error');
        return;
    }

    const lastMove = history.pop();
    const disc = towers[lastMove.to].pop();
    towers[lastMove.from].push(disc);

    moves--;
    updateScreen();
    playSound('move');
    setMessage(`Undone move: Disc ${disc} returned to ${lastMove.from}`);
}

// ==========================================
// SMART NEXT-MOVE HINT & AUTO-SOLVE GENERATOR
// ==========================================
function showHint() {
    if (isDemoMode) return;
    const solutionMoves = generateHanoiSolution();
    if (!solutionMoves || solutionMoves.length === 0) {
        setMessage("🎉 You have already solved the puzzle!");
        return;
    }

    const nextMove = solutionMoves[0];
    setMessage(`💡 Recommended Move: Disc ${nextMove.disc} from ${nextMove.from} → ${nextMove.to}`);
    playSound('select');
}

function generateHanoiSolution() {
    let movesList = [];
    
    let initialSource = 'A';
    if (towers.A.length === discCount) initialSource = 'A';
    else if (towers.B.length === discCount) initialSource = 'B';
    else if (towers.C.length === discCount) initialSource = 'C';

    let actualTarget = targetTower;
    if (targetTower === 'B or C') {
        actualTarget = (initialSource === 'C') ? 'B' : 'C';
    } else if (targetTower === 'A or B') {
        actualTarget = (initialSource === 'A') ? 'B' : 'A';
    }

    if (towers[actualTarget].length === discCount) return [];

    function solve(n, from, to, aux) {
        if (n === 0) return;
        solve(n - 1, from, aux, to);
        movesList.push({ disc: n, from: from, to: to });
        solve(n - 1, aux, to, from);
    }

    let aux = ['A', 'B', 'C'].find(t => t !== initialSource && t !== actualTarget);

    if (towers[initialSource].length === discCount) {
        solve(discCount, initialSource, actualTarget, aux);
        return movesList;
    }

    let remainingMoves = [];
    solveState(discCount, actualTarget, remainingMoves);
    return remainingMoves;
}

function solveState(n, targetT, movesOut) {
    if (n === 0) return;

    let currentTower = null;
    ['A', 'B', 'C'].forEach(t => {
        if (towers[t].includes(n)) currentTower = t;
    });

    if (!currentTower) return;

    if (currentTower === targetT) {
        solveState(n - 1, targetT, movesOut);
    } else {
        let otherTower = ['A', 'B', 'C'].find(t => t !== currentTower && t !== targetT);
        solveState(n - 1, otherTower, movesOut);
        movesOut.push({ disc: n, from: currentTower, to: targetT });

        function subSolve(k, from, to, aux) {
            if (k === 0) return;
            subSolve(k - 1, from, aux, to);
            movesOut.push({ disc: k, from: from, to: to });
            subSolve(k - 1, aux, to, from);
        }
        subSolve(n - 1, otherTower, targetT, currentTower);
    }
}

// ==========================================
// AUTO SOLVE / DEMO MODE ENGINE
// ==========================================
let demoSolution = [];
let demoStepIndex = 0;

function confirmAutoSolve() {
    if (discCount > 9) {
        setMessage("ℹ️ Auto Solve is available for puzzles up to 9 discs.");
        playSound('error');
        return;
    }
    document.getElementById("autoSolveConfirmModal").classList.remove("hidden");
}

function startDemoMode() {
    document.getElementById("autoSolveConfirmModal").classList.add("hidden");
    
    demoSolution = generateHanoiSolution();
    if (!demoSolution || demoSolution.length === 0) {
        setMessage("Puzzle is already solved!");
        return;
    }

    isDemoMode = true;
    isDemoPaused = false;
    demoStepIndex = 0;

    document.getElementById("demoPlaybackBar").classList.remove("hidden");
    document.getElementById("demoPlayPauseBtn").textContent = "⏸ Pause";
    setMessage("🎬 Demo Mode Active — Demonstrating optimal solution...");

    runDemoStep();
}

function runDemoStep() {
    if (!isDemoMode || isDemoPaused) return;

    if (demoStepIndex >= demoSolution.length) {
        stopDemoMode();
        setMessage("🎬 Demo Completed.");
        return;
    }

    const move = demoSolution[demoStepIndex];
    const success = moveDisc(move.from, move.to);
    demoStepIndex++;

    if (!success) {
        stopDemoMode();
        return;
    }

    const baseInterval = 400;
    const currentDelay = Math.max(30, Math.floor(baseInterval / demoSpeedMultiplier));
    demoInterval = setTimeout(runDemoStep, currentDelay);
}

function toggleDemoPause() {
    if (!isDemoMode) return;
    isDemoPaused = !isDemoPaused;
    const btn = document.getElementById("demoPlayPauseBtn");
    if (isDemoPaused) {
        btn.textContent = "▶ Play";
        if (demoInterval) {
            clearTimeout(demoInterval);
            demoInterval = null;
        }
    } else {
        btn.textContent = "⏸ Pause";
        demoSolution = generateHanoiSolution();
        demoStepIndex = 0;
        runDemoStep();
    }
}

function setDemoSpeed(speed) {
    demoSpeedMultiplier = speed;
    document.querySelectorAll(".btn-speed").forEach(b => {
        if (Number(b.dataset.speed) === speed) b.classList.add("active");
        else b.classList.remove("active");
    });
}

function stopDemoMode() {
    isDemoMode = false;
    isDemoPaused = false;
    if (demoInterval) {
        clearTimeout(demoInterval);
        demoInterval = null;
    }
    const bar = document.getElementById("demoPlaybackBar");
    if (bar) bar.classList.add("hidden");
}

// ==========================================
// TIMER & SCREEN UPDATES
// ==========================================
function startTimer() {
    if (timerInterval !== null || isDemoMode) return;
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById("timer").textContent = formatTime(seconds);
    }, 1000);
}

function formatTime(totalSec) {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function calculateMinimumMoves() {
    return Math.pow(2, discCount) - 1;
}

function updateScreen() {
    document.getElementById("moveCount").textContent = moves;
    document.getElementById("timer").textContent = formatTime(seconds);
    drawGame();
}

function setMessage(text) {
    document.getElementById("message").textContent = text;
}

// ==========================================
// WIN DETECTION & STAR SCORING SYSTEM
// ==========================================
function checkWin() {
    let isWon = false;
    if (targetTower === 'B or C') {
        isWon = (towers.B.length === discCount || towers.C.length === discCount);
    } else if (targetTower === 'A or B') {
        isWon = (towers.A.length === discCount || towers.B.length === discCount);
    } else {
        isWon = (towers[targetTower].length === discCount);
    }

    if (isWon) {
        clearInterval(timerInterval);
        timerInterval = null;

        if (isDemoMode) {
            stopDemoMode();
            setMessage("🎬 Demo Mode Completed!");
            return;
        }

        playSound('win');
        startConfetti();

        const minMoves = calculateMinimumMoves();
        let stars = 1;
        if (moves <= minMoves + Math.max(2, Math.floor(minMoves * 0.15))) {
            stars = 3;
        } else if (moves <= Math.floor(minMoves * 1.6)) {
            stars = 2;
        }

        if (isRandomChallenge) {
            progressData.randomStars = (progressData.randomStars || 0) + stars;
            saveProgress();

            document.getElementById("puzzleWinSubtitle").textContent = `🎲 Random Challenge (${discCount} Discs) Complete!`;
            const starsContainer = document.getElementById("puzzleStarsRating");
            if (starsContainer) {
                starsContainer.innerHTML = Array.from({ length: 3 }, (_, i) => 
                    `<span class="star ${i < stars ? 'active' : ''}">★</span>`
                ).join('');
            }
            document.getElementById("puzzleFinalMoves").textContent = moves;
            document.getElementById("puzzleFinalMinimum").textContent = minMoves;
            document.getElementById("puzzleFinalBest").textContent = `+${stars} ⭐`;
            document.getElementById("puzzleFinalTime").textContent = formatTime(seconds);

            const nextBtn = document.getElementById("nextPuzzleBtn");
            if (nextBtn) nextBtn.textContent = "🎲 PLAY ANOTHER";

            document.getElementById("puzzleWinModal").classList.remove("hidden");
            setMessage(`🎉 Random Challenge Solved! Earned +${stars} ⭐!`);
            return;
        }

        const pCount = getPuzzlesCountForDiscCount(discCount);
        const discData = progressData.discCounts[discCount];
        const pData = discData.puzzles[currentPuzzleIndex];

        pData.completed = true;
        if (stars > pData.stars) pData.stars = stars;
        if (!pData.bestMoves || moves < pData.bestMoves) pData.bestMoves = moves;
        if (!pData.bestTime || seconds < pData.bestTime) pData.bestTime = seconds;

        // Unlock next puzzle
        if (currentPuzzleIndex === discData.unlockedPuzzle && currentPuzzleIndex < pCount - 1) {
            discData.unlockedPuzzle = currentPuzzleIndex + 1;
        }

        saveProgress();

        // SHOW PUZZLE COMPLETE MODAL
        document.getElementById("puzzleWinSubtitle").textContent = `${discCount} DISCS • Puzzle ${currentPuzzleIndex + 1} / ${pCount} Complete`;
        const starsContainer = document.getElementById("puzzleStarsRating");
        if (starsContainer) {
            starsContainer.innerHTML = Array.from({ length: 3 }, (_, i) => 
                `<span class="star ${i < stars ? 'active' : ''}">★</span>`
            ).join('');
        }
        document.getElementById("puzzleFinalMoves").textContent = moves;
        document.getElementById("puzzleFinalMinimum").textContent = minMoves;
        document.getElementById("puzzleFinalBest").textContent = pData.bestMoves;
        document.getElementById("puzzleFinalTime").textContent = formatTime(seconds);
        document.getElementById("puzzleWinModal").classList.remove("hidden");

        setMessage("🎉 Puzzle Complete!");
    }
}

// ==========================================
// SETTINGS & THEMES
// ==========================================
function applyTheme(themeName) {
    progressData.theme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    const select = document.getElementById("themeSelect");
    if (select) select.value = themeName;
}

function updateSoundButtonUI() {
    const btn = document.getElementById("settingsSoundBtn");
    if (btn) {
        btn.textContent = progressData.soundEnabled ? "ON" : "OFF";
        btn.className = `toggle-btn ${progressData.soundEnabled ? 'active' : ''}`;
    }
}

// ==========================================
// CONFETTI ANIMATION
// ==========================================
let confettiActive = false;
let confettiParticles = [];
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;

function resizeCanvas() {
    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function startConfetti() {
    confettiActive = true;
    confettiParticles = [];
    const colors = ["#60a5fa", "#a855f7", "#34d399", "#fbbf24", "#f472b6"];

    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotSpeed: Math.random() * 4 - 2
        });
    }
    requestAnimationFrame(renderConfetti);
}

function renderConfetti() {
    if (!confettiActive || !ctx) return;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
    });

    confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height);

    if (confettiParticles.length > 0 && confettiActive) {
        requestAnimationFrame(renderConfetti);
    }
}

function stopConfetti() {
    confettiActive = false;
    if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================
// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================
function setupEventListeners() {
    // HOME SCREEN
    document.getElementById("homePlayBtn").addEventListener("click", () => {
        playSound('click');
        // Play first uncompleted puzzle or 3 Discs Puzzle 1
        let targetDisc = 3;
        let targetPuzzle = 0;
        let found = false;

        for (let n = 3; n <= 15; n++) {
            const pCount = getPuzzlesCountForDiscCount(n);
            for (let p = 0; p < pCount; p++) {
                if (!progressData.discCounts[n].puzzles[p].completed) {
                    targetDisc = n;
                    targetPuzzle = p;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }

        loadPuzzle(targetDisc, targetPuzzle);
        showScreen('gameScreen');
    });

    document.getElementById("homePuzzlesBtn").addEventListener("click", () => {
        playSound('click');
        showScreen('discSelectScreen');
    });

    document.getElementById("homeRandomBtn").addEventListener("click", () => {
        playSound('click');
        startRandomChallenge();
    });

    document.getElementById("homeSettingsBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("settingsModal").classList.remove("hidden");
    });

    document.getElementById("homeRulesBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("rulesModal").classList.remove("hidden");
    });

    // DISC SELECT SCREEN
    document.getElementById("discSelectBackBtn").addEventListener("click", () => {
        playSound('click');
        showScreen('homeScreen');
    });

    // PUZZLE SELECT SCREEN
    document.getElementById("puzzleSelectBackBtn").addEventListener("click", () => {
        playSound('click');
        showScreen('discSelectScreen');
    });

    // GAME SCREEN
    document.getElementById("gameHomeBtn").addEventListener("click", () => {
        playSound('click');
        showScreen('homeScreen');
    });

    document.getElementById("gameSettingsBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("settingsModal").classList.remove("hidden");
    });

    document.getElementById("board").addEventListener("click", (event) => {
        const tower = event.target.closest(".tower");
        if (tower) {
            handleTowerClick(tower.dataset.tower);
        }
    });

    // KEYBOARD ACCESSIBILITY (ENTER / SPACE KEY)
    document.querySelectorAll(".tower").forEach(t => {
        t.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTowerClick(t.dataset.tower);
            }
        });
    });

    document.getElementById("restartButton").addEventListener("click", () => {
        playSound('click');
        restartCurrentPuzzle();
    });

    document.getElementById("undoButton").addEventListener("click", undoMove);
    document.getElementById("hintButton").addEventListener("click", showHint);

    // AUTO SOLVE DEMO TRIGGERS
    document.getElementById("autoSolveTriggerBtn").addEventListener("click", confirmAutoSolve);
    document.getElementById("cancelAutoSolveBtn").addEventListener("click", () => {
        document.getElementById("autoSolveConfirmModal").classList.add("hidden");
    });
    document.getElementById("confirmAutoSolveBtn").addEventListener("click", startDemoMode);

    // DEMO PLAYBACK BAR CONTROLS
    document.getElementById("demoPlayPauseBtn").addEventListener("click", toggleDemoPause);
    document.getElementById("demoRestartBtn").addEventListener("click", () => {
        restartCurrentPuzzle();
        startDemoMode();
    });
    document.getElementById("demoExitBtn").addEventListener("click", () => {
        stopDemoMode();
        restartCurrentPuzzle();
    });

    document.querySelectorAll(".btn-speed").forEach(b => {
        b.addEventListener("click", (e) => {
            setDemoSpeed(Number(e.target.dataset.speed));
        });
    });

    // PUZZLE WIN MODAL
    document.getElementById("nextPuzzleBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("puzzleWinModal").classList.add("hidden");
        if (isRandomChallenge) {
            startRandomChallenge();
            return;
        }
        const pCount = getPuzzlesCountForDiscCount(discCount);
        if (currentPuzzleIndex < pCount - 1) {
            loadPuzzle(discCount, currentPuzzleIndex + 1);
        } else {
            showScreen('puzzleSelectScreen');
        }
    });

    document.getElementById("playAgainBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("puzzleWinModal").classList.add("hidden");
        restartCurrentPuzzle();
    });

    document.getElementById("puzzleSelectBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("puzzleWinModal").classList.add("hidden");
        showScreen('puzzleSelectScreen');
    });

    document.getElementById("puzzleHomeBtn").addEventListener("click", () => {
        playSound('click');
        document.getElementById("puzzleWinModal").classList.add("hidden");
        showScreen('homeScreen');
    });

    // SETTINGS MODAL
    document.getElementById("closeSettingsBtn").addEventListener("click", () => {
        document.getElementById("settingsModal").classList.add("hidden");
    });

    document.getElementById("settingsSoundBtn").addEventListener("click", () => {
        progressData.soundEnabled = !progressData.soundEnabled;
        updateSoundButtonUI();
        saveProgress();
        playSound('click');
    });

    document.getElementById("settingsAnimBtn").addEventListener("click", () => {
        progressData.animationsEnabled = !progressData.animationsEnabled;
        updateAnimButtonUI();
        saveProgress();
        playSound('click');
    });

    document.getElementById("themeSelect").addEventListener("change", (e) => {
        applyTheme(e.target.value);
        saveProgress();
        playSound('click');
    });

    document.getElementById("resetProgressBtn").addEventListener("click", resetProgress);

    // RULES MODAL
    document.getElementById("closeRulesBtn").addEventListener("click", () => {
        document.getElementById("rulesModal").classList.add("hidden");
    });

    document.getElementById("gotItBtn").addEventListener("click", () => {
        document.getElementById("rulesModal").classList.add("hidden");
        playSound('click');
    });

    setupBoardDropEvents();
}

function hideSplashScreen() {
    const splash = document.getElementById("splashScreen");
    if (splash) {
        splash.classList.add("fade-out");
        setTimeout(() => {
            splash.style.display = "none";
        }, 400);
    }
}

// INITIALIZATION
loadProgress();
setupEventListeners();
showScreen('homeScreen');
setTimeout(hideSplashScreen, 350);