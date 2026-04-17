document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const btnStart = document.getElementById('btn-start');
    const btnExit = document.getElementById('btn-exit');
    
    const gridContainer = document.getElementById('grid-container');
    const numpadDisplay = document.getElementById('numpad-display');
    const numKeys = document.querySelectorAll('.num-key');
    const btnDel = document.getElementById('btn-del');
    const btnCheck = document.getElementById('btn-check');

    // 15x15 Grid gives 225 cells - more than enough for a try-out station
    const GRID_SIZE = 15;
    let grid = [];
    let cells = [];
    let spiralSequence = [];
    
    let currentStep = 1;
    let inputValue = '';
    let isTransitioning = false;

    // --- Init ---
    function setupGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
        cells = [];
        grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
        
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            const inner = document.createElement('div');
            inner.classList.add('cell-inner');
            
            const front = document.createElement('div');
            front.classList.add('cell-front');
            
            const back = document.createElement('div');
            back.classList.add('cell-back');
            
            inner.appendChild(front);
            inner.appendChild(back);
            cell.appendChild(inner);
            
            gridContainer.appendChild(cell);
            cells.push(cell);
        }
    }

    // --- Spiral Logic ---
    function getCount(arr, value) {
        return arr.reduce((count, current) => (current === value ? count + 1 : count), 0);
    }

    function findNumberForCell(r, c) {
        const row = grid[r];
        const col = grid.map(row => row[c]);
        let n = 1;
        while (true) {
            const rowCount = getCount(row, n);
            const colCount = getCount(col, n);
            if (rowCount < n && colCount < n) {
                return n;
            }
            n++;
        }
    }

    function precomputeSpiral() {
        spiralSequence = [];
        let r = Math.floor(GRID_SIZE / 2);
        let c = Math.floor(GRID_SIZE / 2);

        const value = 1; 
        grid[r][c] = value;
        spiralSequence.push({ r, c, value });

        let direction = 0; 
        let stepCount = 0;
        let turnAfter = 1;

        for (let i = 1; i < GRID_SIZE * GRID_SIZE; i++) {
            switch (direction) {
                case 0: c++; break; // Right
                case 1: r--; break; // Up
                case 2: c--; break; // Left
                case 3: r++; break; // Down
            }

            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                const newValue = findNumberForCell(r, c);
                grid[r][c] = newValue;
                spiralSequence.push({ r, c, value: newValue });
            }

            stepCount++;
            if (stepCount === turnAfter) {
                stepCount = 0;
                direction = (direction + 1) % 4;
                if (direction % 2 === 0) {
                    turnAfter++;
                }
            }
        }
    }

    // --- Game Logic ---
    function startNewGame() {
        setupGrid();
        precomputeSpiral();
        
        currentStep = 1; // 0 (Zahl 1) ist direkt gegeben
        inputValue = '';
        updateDisplay();
        
        // Vorbereiten: Aufdecken von Schritt 0 (erste Zahl in der Mitte)
        const first = spiralSequence[0];
        const indexFirst = first.r * GRID_SIZE + first.c;
        const firstCell = cells[indexFirst];
        const firstBack = firstCell.querySelector('.cell-back');
        firstBack.textContent = first.value;
        firstBack.className = `cell-back zahl-${first.value}`;
        firstCell.classList.add('flipped');
        
        // Ziel festlegen
        setTarget(currentStep);
    }

    function setTarget(stepIndex) {
        if(stepIndex >= spiralSequence.length) return; 
        const seq = spiralSequence[stepIndex];
        const idx = seq.r * GRID_SIZE + seq.c;
        const cell = cells[idx];
        cell.classList.add('target');
        cell.querySelector('.cell-front').innerHTML = '<span class="highlight-q">?</span>';
    }

    function updateDisplay() {
        numpadDisplay.textContent = inputValue;
    }

    // --- Events ---
    btnStart.addEventListener('click', () => {
        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        startNewGame();
    });

    btnExit.addEventListener('click', () => {
        gameScreen.classList.remove('active');
        startScreen.classList.add('active');
    });

    numKeys.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isTransitioning) return;
            if (inputValue.length < 3) {
                inputValue += btn.textContent;
                updateDisplay();
            }
        });
    });

    btnDel.addEventListener('click', () => {
        if (isTransitioning) return;
        inputValue = inputValue.slice(0, -1);
        updateDisplay();
    });

    btnCheck.addEventListener('click', () => {
        // Leereingabe abfangen
        if (isTransitioning || inputValue === '') return;
        if (currentStep >= spiralSequence.length) return;
        
        isTransitioning = true;
        
        const expected = spiralSequence[currentStep].value;
        const actual = parseInt(inputValue, 10);
        const isCorrect = (actual === expected);
        
        // Visuelles Feedback Numpad
        if (isCorrect) {
            numpadDisplay.classList.add('correct');
        } else {
            numpadDisplay.classList.add('wrong');
        }
        
        const seq = spiralSequence[currentStep];
        const idx = seq.r * GRID_SIZE + seq.c;
        const cell = cells[idx];
        
        // Animation Start
        setTimeout(() => {
            cell.classList.remove('target');
            cell.querySelector('.cell-front').innerHTML = '';
            
            const back = cell.querySelector('.cell-back');
            back.textContent = expected;
            back.className = `cell-back zahl-${expected}`;
            cell.classList.add('flipped');
        }, 400); // Kleine Verzögerung für Dramaturgie
        
        // Nächster Schritt vorbereiten
        setTimeout(() => {
            numpadDisplay.classList.remove('correct', 'wrong');
            inputValue = '';
            updateDisplay();
            
            currentStep++;
            setTarget(currentStep);
            isTransitioning = false;
        }, 1800); // Ausreichend Zeit um Feedback aufzunehmen
    });
});
