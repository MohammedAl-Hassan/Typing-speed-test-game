// ===========================================
// WORD ARRAYS FOR EACH LEVEL
// ===========================================
/**
 * Object containing arrays of words for each difficulty level.
 * Used to populate the game with random words based on the selected level.
 */
const wordsByLevel = {
    "Easy": [
        "Hello", "Code", "Town", "Test", "Work", "Play",
        "Run", "Jump", "Fast", "Slow", "Good", "Nice",
        "Cool", "Game", "Time", "Word", "Type", "Keys",
        "News", "Data", "File", "Save", "Open", "Exit",
        "Help", "Menu", "Start", "Stop", "Find", "Edit"
    ],
    "Normal": [
        "Programming", "Javascript", "Country", "Testing",
        "Youtube", "Linkedin", "Twitter", "Github",
        "Leetcode", "Internet", "Python", "Coding",
        "Funny", "Working", "Task", "Runner",
        "Roles", "Playing", "Document", "Function",
        "Variable", "Console", "Browser", "Website",
        "Database", "Network", "Server", "Client",
        "Framework", "Library", "Package", "Module"
    ],
    "Hard": [
        "Destructuring", "Paradigm", "Documentation",
        "Dependencies", "Asynchronous", "Synchronization",
        "Encapsulation", "Polymorphism", "Inheritance",
        "Abstraction", "Algorithm", "Optimization",
        "Authentication", "Authorization", "Implementation",
        "Configuration", "Initialization", "Serialization",
        "Deserialization", "Refactoring", "Architecture",
        "Infrastructure", "Methodology", "Cryptocurrency",
        "Decentralization", "Functionality", "Compatibility",
        "Accessibility", "Responsiveness", "Performance"
    ]
};

/**
 * Configuration object defining the time limit (in seconds) for each word per level.
 * Easy: 5s, Normal: 4s, Hard: 5s (due to longer words).
 */
const lvls = {
    "Easy": 5,
    "Normal": 4,
    "Hard": 5
};

// ===========================================
// GAME STATE
// ===========================================
/**
 * Array ensuring the order of level progression from Easy to Hard.
 * Used to determine the next level after completing the current one.
 */
const levelProgression = ["Easy", "Normal", "Hard"];
let defaultLevelName = "Easy";
let defaultLevelSeconds = lvls[defaultLevelName];
let currentWords = [];
let currentTimer = null;
let isFirstWord = true;

// ===========================================
// DOM ELEMENTS
// ===========================================
const elements = {
    startButton: document.querySelector(".start"),
    restartButton: document.querySelector(".restart"),
    levelSelect: document.querySelector(".level-select"),
    lvlNameSpan: document.querySelector(".message .lvl"),
    secondsSpan: document.querySelector(".message .seconds"),
    theWord: document.querySelector(".the-word"),
    upcomingWords: document.querySelector(".upcoming-words"),
    input: document.querySelector(".input"),
    timeLeftSpan: document.querySelector(".time span"),
    scoreGot: document.querySelector(".score .got"),
    scoreTotal: document.querySelector(".score .total"),
    finishMessage: document.querySelector(".finish")
};

// ===========================================
// INITIALIZATION
// ===========================================
/**
 * Sets up the initial game state.
 * Updates the UI for the default level and attaches necessary event listeners.
 */
function initializeGame() {
    updateUIForLevel(defaultLevelName, defaultLevelSeconds);
    attachEventListeners();
}

function updateUIForLevel(levelName, seconds, keepScore = false) {
    elements.lvlNameSpan.innerHTML = levelName;
    elements.secondsSpan.innerHTML = seconds;
    elements.timeLeftSpan.innerHTML = seconds;
    currentWords = [...wordsByLevel[levelName]];

    if (keepScore) {
        // Add to existing total when advancing levels
        const currentTotal = parseInt(elements.scoreTotal.innerHTML);
        elements.scoreTotal.innerHTML = currentTotal + currentWords.length;
    } else {
        // First level or manual level change - reset
        elements.scoreTotal.innerHTML = currentWords.length;
    }
}

function attachEventListeners() {
    elements.levelSelect.addEventListener('change', handleLevelChange);
    elements.input.onpaste = () => false;
    elements.input.addEventListener('input', handleInputValidation);
    elements.input.addEventListener('keydown', handleEnterKey);
    elements.startButton.onclick = handleStartGame;
    elements.restartButton.onclick = () => window.location.reload();
}

// ===========================================
// EVENT HANDLERS
// ===========================================
function handleLevelChange() {
    defaultLevelName = this.value;
    defaultLevelSeconds = lvls[defaultLevelName];
    updateUIForLevel(defaultLevelName, defaultLevelSeconds);
}

function handleStartGame() {
    this.remove();
    elements.input.focus();
    isFirstWord = true;
    generateNextWord();
}

/**
 * Validates user input in real-time.
 * Checks if the current input matches the start of the target word.
 * If the input is wrong, it triggers an error state (visual + audio).
 */
function handleInputValidation() {
    const currentWord = elements.theWord.innerHTML.toLowerCase();
    const userInput = elements.input.value.toLowerCase();

    // Check if the current input matches the start of the target word
    if (userInput && !currentWord.startsWith(userInput)) {
        // Wrong character typed - show error and remove it
        showInputError();
        elements.input.value = elements.input.value.slice(0, -1);
    } else {
        // Correct typing - reset any error styling
        resetInputError();
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const currentWord = elements.theWord.innerHTML.toLowerCase();
        const userInput = elements.input.value.toLowerCase();

        // Check if the answer is correct
        if (currentWord === userInput) {
            // Clear the timer
            clearInterval(currentTimer);
            // Process the correct answer
            handleCorrectAnswer();
        } else if (userInput.length > 0) {
            // Show error if they pressed Enter with incomplete/wrong word
            showInputError();
        }
    }
}

function showInputError() {
    elements.input.classList.add('error');
    playErrorSound();
    // Play a brief shake animation
    setTimeout(() => {
        elements.input.classList.remove('error');
    }, 500);
}

function resetInputError() {
    elements.input.classList.remove('error');
}

// ===========================================
// AUDIO FEEDBACK
// ===========================================
function playErrorSound() {
    try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configure the sound
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Error sound: higher frequency beep
        oscillator.frequency.value = 400; // Hz
        oscillator.type = 'sine';

        // Quick fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Silently fail if Web Audio API is not supported
        console.log('Audio not supported');
    }
}

// ===========================================
// WORD MANAGEMENT
// ===========================================
function generateNextWord() {
    const randomWord = getRandomWord();
    displayCurrentWord(randomWord);
    displayUpcomingWords();
    startTimer();
}

function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * currentWords.length);
    const randomWord = currentWords[randomIndex];
    currentWords.splice(randomIndex, 1);
    return randomWord;
}

function displayCurrentWord(word) {
    elements.theWord.innerHTML = word;
}

function displayUpcomingWords() {
    elements.upcomingWords.innerHTML = '';
    currentWords.forEach(word => {
        const div = document.createElement("div");
        div.textContent = word;
        elements.upcomingWords.appendChild(div);
    });
}

// ===========================================
// TIMER LOGIC
// ===========================================
/**
 * Starts the countdown timer for the current word.
 * Adds 3 seconds of bonus time for the very first word of a level.
 * Decrements the timer every second and checks for timeout.
 */
function startTimer() {
    // Add 3 bonus seconds for the first word
    const timeForThisWord = isFirstWord ? defaultLevelSeconds + 3 : defaultLevelSeconds;
    elements.timeLeftSpan.innerHTML = timeForThisWord;
    isFirstWord = false;

    currentTimer = setInterval(() => {
        elements.timeLeftSpan.innerHTML--;

        if (elements.timeLeftSpan.innerHTML === "0") {
            clearInterval(currentTimer);
            checkAnswer();
        }
    }, 1000);
}

// ===========================================
// ANSWER VALIDATION
// ===========================================
function checkAnswer() {
    const currentWord = elements.theWord.innerHTML.toLowerCase();
    const userInput = elements.input.value.toLowerCase();

    if (currentWord === userInput) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

function handleCorrectAnswer() {
    elements.input.value = '';
    resetInputError();
    incrementScore();

    if (currentWords.length > 0) {
        generateNextWord();
    } else {
        endGame('win');
    }
}

function handleWrongAnswer() {
    // Don't score a point, just move to next word
    elements.input.value = '';
    resetInputError();

    if (currentWords.length > 0) {
        generateNextWord();
    } else {
        endGame('win');
    }
}

function incrementScore() {
    elements.scoreGot.innerHTML = parseInt(elements.scoreGot.innerHTML) + 1;
}

// ===========================================
// GAME END
// ===========================================
function endGame(status) {
    if (status === 'win') {
        // Check if there's a next level
        const currentLevelIndex = levelProgression.indexOf(defaultLevelName);
        const hasNextLevel = currentLevelIndex < levelProgression.length - 1;

        if (hasNextLevel) {
            // Advance to next level
            advanceToNextLevel();
        } else {
            // Completed all levels
            displayEndMessage('🎉 All Levels Completed! 🎉', 'good');
            elements.upcomingWords.remove();
            saveGameScore(status);
        }
    } else {
        // Game over - loss
        displayEndMessage('Game Over', 'bad');
        saveGameScore(status);
    }
}

/**
 * Handles the transition to the next difficulty level.
 * Saves the current score, shows a completion message, and initializes the new level.
 */
function advanceToNextLevel() {
    const currentLevelIndex = levelProgression.indexOf(defaultLevelName);
    const nextLevel = levelProgression[currentLevelIndex + 1];

    // Save current level score
    saveGameScore('win');

    // Show level completion message
    displayLevelCompleteMessage(nextLevel);

    // Advance to next level after a short delay
    setTimeout(() => {
        defaultLevelName = nextLevel;
        defaultLevelSeconds = lvls[nextLevel];
        updateUIForLevel(nextLevel, defaultLevelSeconds, true);
        elements.levelSelect.value = nextLevel;

        // Clear the message and start next level
        elements.finishMessage.innerHTML = '';
        isFirstWord = true;
        generateNextWord();
    }, 2000);
}

function displayLevelCompleteMessage(nextLevel) {
    const span = document.createElement("span");
    span.className = 'good';
    span.textContent = `Level Complete! Moving to ${nextLevel}...`;
    elements.finishMessage.appendChild(span);
}

function displayEndMessage(message, className) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = message;
    elements.finishMessage.appendChild(span);
}

function saveGameScore(status) {
    const score = parseInt(elements.scoreGot.innerHTML);
    const total = parseInt(elements.scoreTotal.innerHTML);
    saveScore(score, total, defaultLevelName, status);
}

// ===========================================
// LOCAL STORAGE
// ===========================================
/**
 * Saves the game score to the browser's Local Storage.
 * Appends the new score entry to the existing history.
 * @param {number} score - words typed correctly
 * @param {number} total - total words available
 * @param {string} level - difficulty level
 * @param {string} status - 'win' or 'loss'
 */
function saveScore(score, total, level, status) {
    const scoreData = {
        score: score,
        total: total,
        level: level,
        status: status,
        date: new Date().toISOString()
    };

    const scoreHistory = getScoreHistory();
    scoreHistory.push(scoreData);
    localStorage.setItem('typingGameScores', JSON.stringify(scoreHistory));
}

function getScoreHistory() {
    const stored = localStorage.getItem('typingGameScores');
    return stored ? JSON.parse(stored) : [];
}

// ===========================================
// START THE GAME
// ===========================================
initializeGame();
