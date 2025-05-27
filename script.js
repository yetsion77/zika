// קונפיגורציה של Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCN8x-RVhYKC7cv5krCcI7pEMmDlZF4Pc4",
    authDomain: "zika-5a7bb.firebaseapp.com",
    projectId: "zika-5a7bb",
    storageBucket: "zika-5a7bb.firebasestorage.app",
    messagingSenderId: "367877344191",
    appId: "1:367877344191:web:b04f4391987ee3598c6f0a",
    measurementId: "G-SN0GMT8P8Y"
};

// אתחול Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// נתוני המשחק
const gameData = {
    'ראשי הממשלה': [
        'דוד בן גוריון',
        'משה שרת',
        'לוי אשכול',
        'גולדה מאיר',
        'יצחק רבין',
        'מנחם בגין',
        'יצחק שמיר',
        'שמעון פרס',
        'בנימין נתניהו',
        'אהוד ברק',
        'אריאל שרון',
        'אהוד אולמרט',
        'נפתלי בנט',
        'יאיר לפיד'
    ],
    'נשיאי ישראל': [
        'חיים ויצמן',
        'יצחק בן צבי',
        'זלמן שזר',
        'אפרים קציר',
        'יצחק נבון',
        'חיים הרצוג',
        'עזר ויצמן',
        'משה קצב',
        'שמעון פרס',
        'ראובן ריבלין',
        'יצחק הרצוג'
    ],
    'רמטכ"לי צה"ל': [
        'יעקב דורי',
        'יגאל ידין',
        'מרדכי מקלף',
        'משה דיין',
        'חיים לסקוב',
        'צבי צור',
        'יצחק רבין',
        'חיים בר לב',
        'דוד אלעזר',
        'מרדכי גור',
        'רפאל איתן',
        'משה לוי',
        'דן שומרון',
        'אהוד ברק',
        'אמנון ליפקין שחק',
        'שאול מופז',
        'משה יעלון',
        'דן חלוץ',
        'גבי אשכנזי',
        'בני גנץ',
        'גדי איזנקוט',
        'אביב כוכבי',
        'הרצי הלוי',
        'אייל זמיר'
    ]
};

// משתני המשחק
let currentStage = 0;
let currentAnswer = 0;
let startTime = 0;
let stageStartTime = 0;
let timerInterval;
let gameState = 'welcome'; // welcome, playing, success, final
let finalGameTime = 0; // זמן סיום המשחק הסופי

const stages = ['ראשי הממשלה', 'נשיאי ישראל', 'רמטכ"לי צה"ל'];

// אלמנטים
const screens = {
    welcome: document.getElementById('welcome-screen'),
    game: document.getElementById('game-screen'),
    success: document.getElementById('success-screen'),
    final: document.getElementById('final-screen')
};

const elements = {
    timer: document.getElementById('timer'),
    stageTitle: document.getElementById('stage-title'),
    progress: document.getElementById('progress'),
    currentAnswerEl: document.getElementById('current-answer'),
    totalAnswers: document.getElementById('total-answers'),
    answerNumber: document.getElementById('answer-number'),
    answerBoxes: document.getElementById('answer-boxes'),
    answerInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-answer'),
    hintBtn: document.getElementById('hint-btn'),
    hintText: document.getElementById('hint-text'),
    stageTime: document.getElementById('stage-time'),
    finalTime: document.getElementById('final-time'),
    playerName: document.getElementById('player-name'),
    leaderboard: document.getElementById('leaderboard')
};

// פונקציות עזר
function normalizeText(text) {
    return text.replace(/[״"'`]/g, '').replace(/\s+/g, ' ').trim();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function updateTimer() {
    if (gameState === 'playing') {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        elements.timer.textContent = formatTime(elapsed);
    }
}

function startTimer() {
    startTime = Date.now();
    stageStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function createLetterBoxes(name) {
    elements.answerBoxes.innerHTML = '';
    
    // פיצול לפי מילים לצורך יצירת מעברי שורה טובים יותר
    const words = name.split(' ');
    
    words.forEach((word, wordIndex) => {
        // יצירת קבוצת מילה
        const wordGroup = document.createElement('div');
        wordGroup.className = 'word-group';
        wordGroup.style.display = 'flex';
        wordGroup.style.gap = '8px';
        wordGroup.style.flexWrap = 'nowrap'; // מילה אחת לא נחתכת
        
        // הוספת תיבות לכל אות במילה
        for (let char of word) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.setAttribute('data-letter', char);
            wordGroup.appendChild(box);
        }
        
        elements.answerBoxes.appendChild(wordGroup);
        
        // הוספת רווח בין מילים (אם זאת לא המילה האחרונה)
        if (wordIndex < words.length - 1) {
            const spaceDiv = document.createElement('div');
            spaceDiv.className = 'word-space';
            spaceDiv.style.width = '15px';
            spaceDiv.style.height = '45px';
            spaceDiv.style.display = 'flex';
            spaceDiv.style.alignItems = 'center';
            spaceDiv.style.justifyContent = 'center';
            spaceDiv.style.fontSize = '1rem';
            spaceDiv.style.color = '#ccc';
            spaceDiv.textContent = '|';
            elements.answerBoxes.appendChild(spaceDiv);
        }
    });
}

function fillAnswer(userAnswer, correctAnswer) {
    const boxes = elements.answerBoxes.querySelectorAll('.letter-box');
    const normalizedUser = normalizeText(userAnswer).toLowerCase();
    const normalizedCorrect = normalizeText(correctAnswer).toLowerCase();
    
    if (normalizedUser === normalizedCorrect) {
        // תשובה נכונה - מלא את כל התיבות
        const lettersOnly = correctAnswer.replace(/\s/g, ''); // הסרת רווחים לקבלת האותיות בלבד
        boxes.forEach((box, index) => {
            if (index < lettersOnly.length) {
                const letter = lettersOnly[index];
                box.textContent = letter;
                box.classList.remove('hint'); // הסרת קלאס הרמז אם היה
                box.classList.add('filled');
            }
        });
        return true;
    }
    return false;
}

function showHint() {
    const currentStageData = gameData[stages[currentStage]];
    const correctAnswer = currentStageData[currentAnswer];
    
    // מציאת המשבצת הראשונה ומילוי האות הראשונה
    const firstLetterBox = elements.answerBoxes.querySelector('.letter-box');
    if (firstLetterBox && !firstLetterBox.classList.contains('filled')) {
        firstLetterBox.textContent = correctAnswer[0];
        firstLetterBox.classList.add('hint');
    }
    
    // הסתרת הטקסט רמז (לא נצטרך אותו יותר)
    elements.hintText.classList.remove('show');
}

function updateProgress() {
    const currentStageData = gameData[stages[currentStage]];
    const progress = ((currentAnswer + 1) / currentStageData.length) * 100;
    elements.progress.style.width = `${progress}%`;
    
    elements.currentAnswerEl.textContent = currentAnswer + 1;
    elements.totalAnswers.textContent = currentStageData.length;
}

function nextQuestion() {
    const currentStageData = gameData[stages[currentStage]];
    
    if (currentAnswer >= currentStageData.length - 1) {
        // סיום השלב
        finishStage();
        return;
    }
    
    currentAnswer++;
    elements.answerNumber.textContent = `${currentAnswer + 1}.`;
    createLetterBoxes(currentStageData[currentAnswer]);
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    updateProgress();
}

function finishStage() {
    gameState = 'success';
    const stageTime = Math.floor((Date.now() - stageStartTime) / 1000);
    elements.stageTime.textContent = formatTime(stageTime);
    showScreen('success');
}

async function nextStage() {
    currentStage++;
    
    if (currentStage >= stages.length) {
        // סיום המשחק
        await finishGame();
        return;
    }
    
    // התחלת שלב חדש
    currentAnswer = 0;
    stageStartTime = Date.now();
    gameState = 'playing';
    
    const currentStageData = gameData[stages[currentStage]];
    elements.stageTitle.textContent = stages[currentStage];
    elements.answerNumber.textContent = '1.';
    createLetterBoxes(currentStageData[0]);
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    updateProgress();
    
    showScreen('game');
}

async function finishGame() {
    gameState = 'final';
    stopTimer();
    
    finalGameTime = Math.floor((Date.now() - startTime) / 1000);
    elements.finalTime.textContent = formatTime(finalGameTime);
    
    await displayLeaderboard();
    showScreen('final');
}

async function saveScore() {
    const playerName = elements.playerName.value.trim();
    if (!playerName) {
        alert('אנא הכנס שם שחקן');
        return;
    }
    
    try {
        // שמירה לפיירבייס
        await db.collection('leaderboard').add({
            name: playerName,
            time: finalGameTime,
            date: new Date().toISOString(),
            timestamp: Date.now()
        });
        
        elements.playerName.value = '';
        alert('התוצאה נשמרה בהצלחה! 🎉');
        
        // רענון טבלת המובילים
        await displayLeaderboard();
        await displayWelcomeLeaderboard();
    } catch (error) {
        console.error('שגיאה בשמירת התוצאה:', error);
        alert('שגיאה בשמירת התוצאה. אנא נסה שוב.');
    }
}

async function getLeaderboard() {
    try {
        const querySnapshot = await db.collection('leaderboard')
            .orderBy('time', 'asc')
            .limit(10)
            .get();
        
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });
        
        return scores;
    } catch (error) {
        console.error('שגיאה בטעינת טבלת המובילים:', error);
        return [];
    }
}

async function displayWelcomeLeaderboard() {
    const welcomeLeaderboard = document.getElementById('welcome-leaderboard');
    
    // הצגת הודעת טעינה
    welcomeLeaderboard.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">🔄 טוען...</p>';
    
    const scores = await getLeaderboard();
    welcomeLeaderboard.innerHTML = '';
    
    if (scores.length === 0) {
        welcomeLeaderboard.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">אין תוצאות עדיין<br>היה הראשון! 🥇</p>';
        return;
    }
    
    // הצגת רק 5 הראשונים במסך הפתיחה
    const topScores = scores.slice(0, 5);
    
    topScores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        
        entry.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${score.name}</span>
            <span class="time">${formatTime(score.time)}</span>
        `;
        welcomeLeaderboard.appendChild(entry);
    });
}

async function displayLeaderboard() {
    // הצגת הודעת טעינה
    elements.leaderboard.innerHTML = '<p style="text-align: center; color: #666;">🔄 טוען טבלת מובילים...</p>';
    
    const scores = await getLeaderboard();
    elements.leaderboard.innerHTML = '';
    
    if (scores.length === 0) {
        elements.leaderboard.innerHTML = '<p style="text-align: center; color: #666;">אין תוצאות עדיין</p>';
        return;
    }
    
    scores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        
        // עיצוב התאריך
        const date = new Date(score.date).toLocaleDateString('he-IL');
        
        entry.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${score.name}</span>
            <span class="time">${formatTime(score.time)}</span>
        `;
        elements.leaderboard.appendChild(entry);
    });
}

function startGame() {
    currentStage = 0;
    currentAnswer = 0;
    gameState = 'playing';
    
    const currentStageData = gameData[stages[currentStage]];
    elements.stageTitle.textContent = stages[currentStage];
    elements.answerNumber.textContent = '1.';
    createLetterBoxes(currentStageData[0]);
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    updateProgress();
    
    startTimer();
    showScreen('game');
}

function restartGame() {
    stopTimer();
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    showScreen('welcome');
    
    // רענון טבלת המובילים במסך הפתיחה
    displayWelcomeLeaderboard().catch(console.error);
}

function submitAnswer() {
    const userAnswer = elements.answerInput.value.trim();
    if (!userAnswer) return;
    
    const currentStageData = gameData[stages[currentStage]];
    const correctAnswer = currentStageData[currentAnswer];
    
    if (fillAnswer(userAnswer, correctAnswer)) {
        // תשובה נכונה
        elements.answerInput.style.borderColor = '#00b894';
        setTimeout(() => {
            elements.answerInput.style.borderColor = '';
            nextQuestion();
        }, 500);
    } else {
        // תשובה שגויה
        elements.answerInput.style.borderColor = '#e74c3c';
        elements.answerInput.classList.add('bounce');
        setTimeout(() => {
            elements.answerInput.style.borderColor = '';
            elements.answerInput.classList.remove('bounce');
        }, 1000);
    }
}

// אירועי דף
document.addEventListener('DOMContentLoaded', function() {
    // כפתור התחלת משחק
    document.getElementById('start-game').addEventListener('click', startGame);
    
    // כפתור שליחת תשובה
    elements.submitBtn.addEventListener('click', submitAnswer);
    
    // Enter במקלדת
    elements.answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    // כפתור רמז
    elements.hintBtn.addEventListener('click', showHint);
    
    // כפתור המשך לשלב הבא
    document.getElementById('next-stage').addEventListener('click', async () => {
        await nextStage();
    });
    
    // כפתור שמירת תוצאה
    document.getElementById('save-score').addEventListener('click', async () => {
        await saveScore();
    });
    
    // כפתור משחק חדש
    document.getElementById('restart-game').addEventListener('click', restartGame);
    
    // העלאת טבלת המובילים בטעינת הדף
    displayLeaderboard().catch(console.error);
    displayWelcomeLeaderboard().catch(console.error);
});

// העלאת טיימר אוטומטית
setInterval(() => {
    if (gameState === 'playing') {
        updateTimer();
    }
}, 1000); 