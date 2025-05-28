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

// משתנה לבדיקה אם Firebase עובד
let firebaseWorking = false;
let db;

// אתחול Firebase (בלי להתלות בזה)
async function initializeFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // הגדרת offline persistence
        await db.enablePersistence({ synchronizeTabs: true });
        
        console.log('✅ Firebase מותקן (מנסה להתחבר...)');
        
        // בדיקה אסינכרונית בלי לחכות
        setTimeout(() => {
            testFirestoreConnection();
        }, 1000);
        
    } catch (error) {
        console.warn('⚠️ שגיאה בהתקנת Firebase:', error);
        console.log('🔄 עובד במצב מקומי בלבד...');
        updateConnectionStatus(false);
    }
}

// התחלה מקומית תמיד
console.log('🚀 מתחיל במצב מקומי...');
updateConnectionStatus(false);
initializeFirebase();

async function testFirestoreConnection() {
    if (!db) {
        console.log('❌ Firebase לא מותקן');
        firebaseWorking = false;
        updateConnectionStatus(false);
        return;
    }
    
    try {
        console.log('🔄 בודק חיבור Firebase...');
        
        // בדיקה פשוטה - רק קריאה
        const testQuery = await Promise.race([
            db.collection('test').limit(1).get(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 5000)
            )
        ]);
        
        // אם הגענו עד כאן, הכל עובד
        firebaseWorking = true;
        console.log('✅ Firebase חובר בהצלחה!');
        updateConnectionStatus(true);
        
        // רענון טבלאות המובילים
        await displayAllWelcomeLeaderboards();
        
    } catch (error) {
        console.warn('⚠️ Firebase לא זמין:', error.message);
        console.log('💾 ממשיך במצב מקומי...');
        firebaseWorking = false;
        updateConnectionStatus(false);
        
        // רענון טבלאות מקומיות
        await displayAllWelcomeLeaderboards();
    }
}

function updateConnectionStatus(isOnline) {
    const statusEl = document.getElementById('connection-status');
    const iconEl = document.getElementById('status-icon');
    const textEl = document.getElementById('status-text');
    
    if (!statusEl) return; // אם האלמנטים עוד לא נטענו
    
    if (isOnline) {
        statusEl.className = 'connection-status online';
        iconEl.textContent = '☁️';
        textEl.textContent = 'מחובר לשרת';
        statusEl.title = 'התוצאות נשמרות בשרת';
    } else {
        statusEl.className = 'connection-status offline';
        iconEl.textContent = '💾';
        textEl.textContent = 'מצב מקומי';
        statusEl.title = 'התוצאות נשמרות מקומית במחשב';
    }
}

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
let currentCategory = 0; // הקטגוריה שנבחרה
let currentAnswer = 0;
let startTime = 0;
let timerInterval;
let gameState = 'welcome'; // welcome, playing, final
let finalGameTime = 0;

const categories = ['ראשי הממשלה', 'נשיאי ישראל', 'רמטכ"לי צה"ל'];
const categoryCollections = ['prime-ministers', 'presidents', 'chiefs-of-staff'];
const categoryIcons = ['🏛️', '🏢', '⚔️'];

// אלמנטים
const screens = {
    welcome: document.getElementById('welcome-screen'),
    game: document.getElementById('game-screen'),
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
    finalTime: document.getElementById('final-time'),
    finalCategoryTitle: document.getElementById('final-category-title'),
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
    const currentStageData = gameData[categories[currentCategory]];
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
    const currentStageData = gameData[categories[currentCategory]];
    const progress = ((currentAnswer + 1) / currentStageData.length) * 100;
    elements.progress.style.width = `${progress}%`;
    
    elements.currentAnswerEl.textContent = currentAnswer + 1;
    elements.totalAnswers.textContent = currentStageData.length;
}

function nextQuestion() {
    const currentStageData = gameData[categories[currentCategory]];
    
    if (currentAnswer >= currentStageData.length - 1) {
        // סיום השלב
        finishGame();
        return;
    }
    
    currentAnswer++;
    elements.answerNumber.textContent = `${currentAnswer + 1}.`;
    createLetterBoxes(currentStageData[currentAnswer]);
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    updateProgress();
}

async function finishGame() {
    gameState = 'final';
    stopTimer();
    
    finalGameTime = Math.floor((Date.now() - startTime) / 1000);
    elements.finalTime.textContent = formatTime(finalGameTime);
    elements.finalCategoryTitle.textContent = `${categoryIcons[currentCategory]} טבלת המובילים - ${categories[currentCategory]}`;
    
    await displayLeaderboard(categoryCollections[currentCategory]);
    showScreen('final');
}

async function nextCategory() {
    currentCategory++;
    
    if (currentCategory >= categories.length) {
        // סיום המשחק
        await finishGame();
        return;
    }
    
    // התחלת שלב חדש
    currentAnswer = 0;
    startTime = Date.now();
    gameState = 'playing';
    
    const currentStageData = gameData[categories[currentCategory]];
    elements.stageTitle.textContent = categories[currentCategory];
    elements.answerNumber.textContent = '1.';
    createLetterBoxes(currentStageData[0]);
    elements.answerInput.value = '';
    elements.hintText.classList.remove('show');
    updateProgress();
    
    showScreen('game');
}

async function saveScore() {
    const playerName = elements.playerName.value.trim();
    if (!playerName) {
        alert('אנא הכנס שם שחקן');
        return;
    }
    
    const gameData = {
        name: playerName,
        time: finalGameTime,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    let savedToFirebase = false;
    
    // ננסה לשמור ב-Firebase ברקע (silent)
    if (firebaseWorking && db) {
        try {
            console.log('🔄 מנסה לשמור ב-Firebase (ברקע)...');
            await Promise.race([
                db.collection(categoryCollections[currentCategory]).add(gameData),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 3000)
                )
            ]);
            console.log('✅ נשמר ב-Firebase!');
            savedToFirebase = true;
        } catch (error) {
            console.warn('⚠️ Firebase לא זמין, שומר מקומית:', error.message);
            firebaseWorking = false;
            updateConnectionStatus(false);
        }
    }
    
    // שמירה מקומית (תמיד)
    try {
        saveScoreLocally(gameData);
        console.log('✅ נשמר מקומית!');
        
        elements.playerName.value = '';
        
        // הודעה למשתמש
        if (savedToFirebase) {
            alert('התוצאה נשמרה בהצלחה! ☁️🎉');
        } else {
            alert('התוצאה נשמרה! 💾\n(עובד במצב מקומי)');
        }
        
        await displayLeaderboard(categoryCollections[currentCategory]);
        await displayAllWelcomeLeaderboards();
    } catch (error) {
        console.error('❌ שגיאה בשמירה מקומית:', error);
        alert('שגיאה בשמירת התוצאה 😞\nנסה שוב או רענן את הדף');
    }
}

function saveScoreLocally(gameData) {
    const key = `leaderboard-${categoryCollections[currentCategory]}`;
    let scores = JSON.parse(localStorage.getItem(key) || '[]');
    scores.push(gameData);
    scores.sort((a, b) => a.time - b.time); // מיון לפי זמן
    scores = scores.slice(0, 10); // שמירת 10 הטובים ביותר
    localStorage.setItem(key, JSON.stringify(scores));
}

async function getLeaderboard(category) {
    // טעינה מקומית תמיד (מהירה)
    const localScores = await getLocalLeaderboard(category);
    
    // אם Firebase עובד, ננסה לטעון גם משם
    if (firebaseWorking && db) {
        try {
            console.log(`🔄 מנסה לטעון מ-Firebase: ${category}`);
            const querySnapshot = await Promise.race([
                db.collection(category).orderBy('time', 'asc').limit(10).get(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 3000)
                )
            ]);
            
            const firebaseScores = [];
            querySnapshot.forEach((doc) => {
                firebaseScores.push(doc.data());
            });
            
            console.log(`✅ נטען מ-Firebase: ${firebaseScores.length} תוצאות`);
            
            // מיזוג תוצאות מקומיות ו-Firebase
            const mergedScores = mergeLeaderboards(localScores, firebaseScores);
            return mergedScores.slice(0, 10);
            
        } catch (error) {
            console.warn(`⚠️ Firebase לא זמין עבור ${category}:`, error.message);
            firebaseWorking = false;
            updateConnectionStatus(false);
        }
    }
    
    // החזרת תוצאות מקומיות
    console.log(`💾 טוען מקומית: ${localScores.length} תוצאות`);
    return localScores;
}

function getLocalLeaderboard(category) {
    try {
        const key = `leaderboard-${category}`;
        const scores = JSON.parse(localStorage.getItem(key) || '[]');
        return scores.slice(0, 10);
    } catch (error) {
        console.error('❌ שגיאה בטעינה מקומית:', error);
        return [];
    }
}

function mergeLeaderboards(localScores, firebaseScores) {
    // מיזוג התוצאות ומיון לפי זמן
    const allScores = [...localScores, ...firebaseScores];
    
    // הסרת כפילויות לפי שם ושזמן
    const uniqueScores = allScores.filter((score, index, arr) => 
        index === arr.findIndex(s => s.name === score.name && s.time === score.time)
    );
    
    // מיון לפי זמן
    return uniqueScores.sort((a, b) => a.time - b.time);
}

async function displayAllWelcomeLeaderboards() {
    const leaderboardIds = ['welcome-leaderboard-pm', 'welcome-leaderboard-presidents', 'welcome-leaderboard-chiefs'];
    
    for (let i = 0; i < categoryCollections.length; i++) {
        const leaderboardEl = document.getElementById(leaderboardIds[i]);
        leaderboardEl.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.8rem;">🔄 טוען...</p>';
        
        const scores = await getLeaderboard(categoryCollections[i]);
        leaderboardEl.innerHTML = '';
        
        if (scores.length === 0) {
            leaderboardEl.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.8rem;">אין תוצאות עדיין</p>';
            continue;
        }
        
        // הצגת רק 3 הראשונים
        const topScores = scores.slice(0, 3);
        
        topScores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            
            entry.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="name">${score.name}</span>
                <span class="time">${formatTime(score.time)}</span>
            `;
            leaderboardEl.appendChild(entry);
        });
    }
}

function startGame(categoryIndex) {
    currentCategory = categoryIndex;
    currentAnswer = 0;
    gameState = 'playing';
    
    const currentCategoryData = gameData[categories[currentCategory]];
    elements.stageTitle.textContent = categories[currentCategory];
    elements.answerNumber.textContent = '1.';
    createLetterBoxes(currentCategoryData[0]);
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
    
    // רענון טבלאות המובילים במסך הפתיחה
    displayAllWelcomeLeaderboards().catch(console.error);
}

function submitAnswer() {
    const userAnswer = elements.answerInput.value.trim();
    if (!userAnswer) return;
    
    const currentStageData = gameData[categories[currentCategory]];
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

async function displayLeaderboard(category) {
    // הצגת הודעת טעינה
    elements.leaderboard.innerHTML = '<p style="text-align: center; color: #666;">🔄 טוען טבלת מובילים...</p>';
    
    const scores = await getLeaderboard(category);
    elements.leaderboard.innerHTML = '';
    
    if (scores.length === 0) {
        elements.leaderboard.innerHTML = '<p style="text-align: center; color: #666;">אין תוצאות עדיין</p>';
        return;
    }
    
    scores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        
        entry.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${score.name}</span>
            <span class="time">${formatTime(score.time)}</span>
        `;
        elements.leaderboard.appendChild(entry);
    });
}

// אירועי דף
document.addEventListener('DOMContentLoaded', function() {
    // עדכון סטטוס החיבור
    updateConnectionStatus(firebaseWorking);
    
    // כפתור בדיקת חיבור
    document.getElementById('test-connection').addEventListener('click', async () => {
        const btn = document.getElementById('test-connection');
        const originalText = btn.textContent;
        
        btn.textContent = '⏳';
        btn.disabled = true;
        
        console.log('🔄 בודק חיבור ידנית...');
        
        try {
            await testFirestoreConnection();
            console.log('✅ בדיקת חיבור הושלמה');
        } catch (error) {
            console.error('❌ בדיקת חיבור נכשלה:', error);
        }
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1000);
    });
    
    // כפתורי בחירת משחק
    document.querySelectorAll('.select-game-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryIndex = parseInt(btn.closest('.game-option').dataset.category);
            startGame(categoryIndex);
        });
    });
    
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
    
    // כפתור שמירת תוצאה
    document.getElementById('save-score').addEventListener('click', async () => {
        await saveScore();
    });
    
    // כפתור משחק חדש
    document.getElementById('restart-game').addEventListener('click', restartGame);
    
    // העלאת טבלאות המובילים בטעינת הדף
    displayAllWelcomeLeaderboards().catch(console.error);
});

// העלאת טיימר אוטומטית
setInterval(() => {
    if (gameState === 'playing') {
        updateTimer();
    }
}, 1000); 
