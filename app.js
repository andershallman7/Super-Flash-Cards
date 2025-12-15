// Application State
let currentStudySet = null;
let currentCardIndex = 0;
let currentQuestionIndex = 0;
let studyMode = null;
let correctAnswers = 0;
let totalQuestions = 0;
let learnAttempts = {};
let multipleChoiceAnswers = [];

// Understand Mode State
let understandCards = [];
let understandCurrentIndex = 0;
let understandUseFlashcards = true;
let understandUseMultipleChoice = true;
let understandUseTyping = true;
let understandRetryQueue = [];
let understandCorrectAnswers = 0;
let understandTotalQuestions = 0;

// Subject Information
const subjectInfo = {
    english: "Focus on reading comprehension, grammar, and essay writing. Questions will emphasize analysis and interpretation.",
    math: "Practice problem-solving with step-by-step questions. Problems will build on previously learned concepts.",
    science: "Study through explanatory questions and practical applications. Questions will connect theory to real-world scenarios.",
    'social-studies': "Learn through contextual questions and timeline-based studies. Questions will emphasize cause and effect relationships.",
    'world-language': "Master vocabulary and translation. You'll be asked to type translations and practice pronunciation patterns."
};

// Sample Study Set Data
const sampleSet = {
    name: "Spanish Vocabulary - Food",
    subject: "world-language",
    subjectLang: "Spanish",
    cards: [
        {
            question: "Apple (English to Spanish)",
            answer: "Manzana",
            type: "vocab",
            hint: "Starts with 'M'"
        },
        {
            question: "Water (English to Spanish)",
            answer: "Agua",
            type: "vocab",
            hint: "Starts with 'A'"
        },
        {
            question: "Bread (English to Spanish)",
            answer: "Pan",
            type: "vocab",
            hint: "Short word"
        },
        {
            question: "Cheese (English to Spanish)",
            answer: "Queso",
            type: "vocab",
            hint: "Starts with 'Q'"
        },
        {
            question: "Chicken (English to Spanish)",
            answer: "Pollo",
            type: "vocab",
            hint: "Double 'L'"
        },
        {
            question: "to dance (English to Spanish)",
            answer: "bailar",
            type: "vocab",
            hint: "Starts with 'b'"
        },
        {
            question: "to walk (English to Spanish)",
            answer: "caminar",
            type: "vocab",
            hint: "Starts with 'c'"
        },
        {
            question: "to sing (English to Spanish)",
            answer: "cantar",
            type: "vocab",
            hint: "Starts with 'c'"
        },
        {
            question: "to buy (English to Spanish)",
            answer: "comprar",
            type: "vocab",
            hint: "Starts with 'c'"
        },
        {
            question: "to converse (English to Spanish)",
            answer: "conversar",
            type: "vocab",
            hint: "Starts with 'c'"
        },
    ]
};

// UI Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showHome() {
    currentStudySet = null;
    currentCardIndex = 0;
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    learnAttempts = {};
    multipleChoiceAnswers = [];

    showScreen('homeScreen');
}

function showCreateSet() {
    document.getElementById('cardsContainer').innerHTML = '';
    addCardInput();
    showScreen('createSetScreen');
}

function onSubjectChange() {
    const subject = document.getElementById('subject').value;
    const infoBox = document.getElementById('subjectInfo');
    if (subject && subjectInfo[subject]) {
        infoBox.textContent = subjectInfo[subject];
        infoBox.style.display = 'block';
    } else {
        infoBox.style.display = 'none';
    }
}

function addCardInput() {
    const container = document.getElementById('cardsContainer');
    const cardCount = container.children.length + 1;
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-input-group';
    cardDiv.id = `card-${cardCount}`;
    cardDiv.innerHTML = `
        <input type="text" placeholder="Question (front of card)" class="card-question">
        <input type="text" placeholder="Answer (back of card)" class="card-answer">
        <button type="button" onclick="removeCard('card-${cardCount}')" class="remove-btn">Remove Card</button>
    `;
    container.appendChild(cardDiv);
}

function removeCard(cardId) {
    document.getElementById(cardId).remove();
}

function importQuestions() {
    const importText = document.getElementById('importTextarea').value.trim();

    if (!importText) {
        alert('Please paste questions to import');
        return;
    }

    const lines = importText.split('\n');
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    let cardCount = 0;
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length === 2) {
            const question = parts[0].trim();
            const answer = parts[1].trim();

            if (question && answer) {
                cardCount++;
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-input-group';
                cardDiv.id = `card-${cardCount}`;
                cardDiv.innerHTML = `
                    <input type="text" placeholder="Question (front of card)" class="card-question" value="${escapeHtml(question)}">
                    <input type="text" placeholder="Answer (back of card)" class="card-answer" value="${escapeHtml(answer)}">
                    <button type="button" onclick="removeCard('card-${cardCount}')" class="remove-btn">Remove Card</button>
                `;
                container.appendChild(cardDiv);
            }
        }
    });

    if (cardCount === 0) {
        alert('No valid questions found. Make sure each line has: Term\\tDefinition');
        return;
    }

    document.getElementById('importTextarea').value = '';
    document.getElementById('importSection').style.display = 'none';
    alert(`Successfully imported ${cardCount} questions!`);
}

function toggleImportSection() {
    const importSection = document.getElementById('importSection');
    importSection.style.display = importSection.style.display === 'none' ? 'block' : 'none';
}

function handleTabInTextarea(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Insert tab character at cursor position
        textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);

        // Move cursor after the inserted tab
        textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function saveStudySet() {
    const setName = document.getElementById('setName').value.trim();
    const subject = document.getElementById('subject').value;

    if (!setName) {
        alert('Please enter a study set name');
        return;
    }

    if (!subject) {
        alert('Please select a subject');
        return;
    }

    const cards = [];
    document.querySelectorAll('.card-input-group').forEach(group => {
        const question = group.querySelector('.card-question').value.trim();
        const answer = group.querySelector('.card-answer').value.trim();

        if (question && answer) {
            cards.push({
                question: question,
                answer: answer,
                type: 'general'
            });
        }
    });

    if (cards.length === 0) {
        alert('Please add at least one card');
        return;
    }

    currentStudySet = {
        name: setName,
        subject: subject,
        subjectLang: subject === 'world-language' ? 'Language' : subject.charAt(0).toUpperCase() + subject.slice(1),
        cards: cards
    };

    showStudySet();
}

function loadSampleSet() {
    currentStudySet = sampleSet;
    showStudySet();
}

function showStudySet() {
    document.getElementById('setTitle').textContent = currentStudySet.name;
    document.getElementById('setSubject').textContent = `Subject: ${currentStudySet.subject}`;

    const preview = document.getElementById('cardsPreview');
    preview.innerHTML = '';

    currentStudySet.cards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-item';
        cardDiv.innerHTML = `
            <strong>Card ${index + 1}:</strong><br>
            ${card.question}<br>
            <small>→ ${card.answer}</small>
        `;
        preview.appendChild(cardDiv);
    });

    currentCardIndex = 0;
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    learnAttempts = {};

    showScreen('studySetScreen');
}

// Flashcard Study Mode
let flashcardWrongCount = 0;
let flashcardAnsweredCount = 0;

function startFlashcards() {
    studyMode = 'flashcards';
    currentCardIndex = 0;
    flashcardWrongCount = 0;
    flashcardAnsweredCount = 0;
    showScreen('flashcardScreen');
    displayFlashcard();
    setTimeout(() => addSwipeListeners('flashcard'), 100);
    // Reset flashcard color/opacity
    const flashcard = document.getElementById('flashcard');
    flashcard.style.background = '';
    flashcard.style.opacity = 1;
    // Show the know/don't know buttons
    const knowBtn = document.getElementById('knowBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (knowBtn) knowBtn.style.display = '';
    if (dontKnowBtn) dontKnowBtn.style.display = '';
}

function displayFlashcard() {
    const card = currentStudySet.cards[currentCardIndex];
    document.getElementById('cardQuestion').textContent = card.question;
    document.getElementById('cardAnswer').textContent = card.answer;

    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    flashcard.style.background = '';
    flashcard.style.opacity = 1;

    updateProgress(currentCardIndex + 1, currentStudySet.cards.length, 'progress', 'progressText');
    // Enable buttons
    document.getElementById('knowBtn').disabled = false;
    document.getElementById('dontKnowBtn').disabled = false;
}

function flipCardRegular() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function nextCard() {
    if (currentCardIndex < currentStudySet.cards.length - 1) {
        currentCardIndex++;
        displayFlashcard();
    } else {
        showFlashcardScore();
    }
}

function markKnow() {
    animateFlashcard('know');
}

function markDontKnow() {
    flashcardWrongCount++;
    animateFlashcard('dontknow');
}

function animateFlashcard(type) {
    const flashcard = document.getElementById('flashcard');
    // Disable buttons to prevent double click
    document.getElementById('knowBtn').disabled = true;
    document.getElementById('dontKnowBtn').disabled = true;
    if (type === 'know') {
        flashcard.style.background = 'var(--success-color)';
    } else {
        flashcard.style.background = 'var(--danger-color)';
    }
    flashcard.style.transition = 'background 0.3s, opacity 0.5s';
    setTimeout(() => {
        flashcard.style.opacity = 0;
        setTimeout(() => {
            flashcard.style.background = '';
            flashcard.style.opacity = 1;
            nextCard();
        }, 400);
    }, 300);
}

function showFlashcardScore() {
    // Hide flashcard, show score
    const flashcardContainer = document.querySelector('.flashcard-container');
    flashcardContainer.innerHTML = `<div class="results-box"><div class="results-message">You finished all flashcards!</div><div class="score">Score: ${Math.round(((currentStudySet.cards.length-flashcardWrongCount)/currentStudySet.cards.length)*100)}%</div><div style='margin-top:20px;'><button onclick='exitStudy()' class='btn btn-primary'>Exit</button></div></div>`;
    document.getElementById('progress').style.width = '100%';
    document.getElementById('progressText').textContent = `Completed!`;
    // Hide the know/don't know buttons
    const knowBtn = document.getElementById('knowBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (knowBtn) knowBtn.style.display = 'none';
    if (dontKnowBtn) dontKnowBtn.style.display = 'none';
}

function previousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        displayFlashcard();
    }
}

function nextMCQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayMCQuestion();
    } else {
        showResults();
    }
}

function generateWrongAnswers(correct, count) {
    const allCards = currentStudySet.cards;
    const wrongAnswers = allCards
        .filter(card => card.answer !== correct)
        .map(card => card.answer)
        .slice(0, count);

    // If not enough wrong answers, generate random ones
    while (wrongAnswers.length < count) {
        wrongAnswers.push(`Option ${wrongAnswers.length + 1}`);
    }

    return wrongAnswers.slice(0, count);
}

// Learn Mode
function startLearn() {
    studyMode = 'learn';
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = currentStudySet.cards.length;
    learnAttempts = {};
    currentStudySet.cards.forEach((card, index) => {
        learnAttempts[index] = 0;
    });
    showScreen('learnScreen');
    displayLearnQuestion();
}

function displayLearnQuestion() {
    const card = currentStudySet.cards[currentQuestionIndex];
    document.getElementById('learnQuestion').textContent = card.question;
    document.getElementById('learnInput').value = '';
    document.getElementById('learnFeedback').textContent = '';
    document.getElementById('learnFeedback').className = 'feedback-message';

    updateProgress(currentQuestionIndex + 1, totalQuestions, 'learnProgress', 'learnProgressText');
}

function submitLearnAnswer() {
    const card = currentStudySet.cards[currentQuestionIndex];
    const userAnswer = document.getElementById('learnInput').value.trim().toLowerCase();
    const correctAnswer = card.answer.toLowerCase();
    const feedback = document.getElementById('learnFeedback');
    learnAttempts[currentQuestionIndex]++;

    if (userAnswer === correctAnswer) {
        feedback.textContent = '✓ Correct! Great job!';
        feedback.className = 'feedback-message correct';
        correctAnswers++;

        setTimeout(() => {
            if (currentQuestionIndex < totalQuestions - 1) {
                currentQuestionIndex++;
                displayLearnQuestion();
            } else {
                showResults();
            }
        }, 1500);
    } else {
        if (learnAttempts[currentQuestionIndex] >= 3) {
            feedback.textContent = `✗ Incorrect. The correct answer is: ${card.answer}. Moving to next...`;
            feedback.className = 'feedback-message incorrect';
            setTimeout(() => {
                if (currentQuestionIndex < totalQuestions - 1) {
                    currentQuestionIndex++;
                    displayLearnQuestion();
                } else {
                    showResults();
                }
            }, 2000);
        } else {
            feedback.textContent = `✗ Incorrect. Try again! (${learnAttempts[currentQuestionIndex]}/3 attempts)`;
            feedback.className = 'feedback-message incorrect';
            document.getElementById('learnInput').focus();
        }
    }
}

function skipQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayLearnQuestion();
    } else {
        showResults();
    }
}

// Text Questions Mode
function startTextQuestions() {
    studyMode = 'textQuestions';
    currentQuestionIndex = 0;
    correctAnswers = 0;
    totalQuestions = currentStudySet.cards.length;
    showScreen('textQuestionsScreen');
    displayTextQuestion();
}

function displayTextQuestion() {
    const card = currentStudySet.cards[currentQuestionIndex];
    document.getElementById('textQuestion').textContent = card.question;
    document.getElementById('textAnswer').value = '';
    document.getElementById('textFeedback').textContent = '';
    document.getElementById('textFeedback').className = 'feedback-message';

    updateProgress(currentQuestionIndex + 1, totalQuestions, 'textProgress', 'textProgressText');
}

function submitTextAnswer() {
    const card = currentStudySet.cards[currentQuestionIndex];
    const userAnswer = document.getElementById('textAnswer').value.trim();
    const feedback = document.getElementById('textFeedback');

    if (userAnswer.toLowerCase() === card.answer.toLowerCase()) {
        feedback.textContent = '✓ Correct! Your answer matches the expected answer.';
        feedback.className = 'feedback-message correct';
        correctAnswers++;
    } else {
        feedback.textContent = `✗ Expected answer: ${card.answer}`;
        feedback.className = 'feedback-message incorrect';
    }
}

function nextTextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayTextQuestion();
    } else {
        showResults();
    }
}

// Results and Exit
function exitStudy() {
    if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
        showStudySet();
    }
}

function showResults() {
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const resultElement = document.getElementById('resultsMessage');
    const scoreElement = document.getElementById('resultsScore');

    resultElement.textContent = `Study session complete! You got ${correctAnswers} out of ${totalQuestions} correct.`;
    scoreElement.textContent = `${percentage}%`;

    showScreen('resultsScreen');
}

// Utility Functions
function updateProgress(current, total, progressBarId, textId) {
    const percentage = (current / total) * 100;
    document.getElementById(progressBarId).style.width = percentage + '%';
    document.getElementById(textId).textContent = `${current} of ${total}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Understand Mode Functions
function startUnderstand() {
    studyMode = 'understand';
    understandCards = JSON.parse(JSON.stringify(currentStudySet.cards));
    understandCurrentIndex = 0;
    understandRetryQueue = [];
    understandCorrectAnswers = 0;
    understandTotalQuestions = understandCards.length;
    
    understandUseFlashcards = document.getElementById('useFlashcards').checked;
    understandUseMultipleChoice = document.getElementById('useMultipleChoice').checked;
    understandUseTyping = document.getElementById('useTyping').checked;

    showScreen('understandScreen');
    displayUnderstandCard();
    setTimeout(() => addSwipeListeners('understandFlashcard'), 100);
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function updateStudyModes() {
    // Settings are updated automatically via the checkboxes
}

function randomizeCards() {
    shuffleArray(understandCards);
    understandCurrentIndex = 0;
    displayUnderstandCard();
}

function displayUnderstandCard() {
    const card = understandCards[understandCurrentIndex];

    // Show/hide views based on settings
    document.getElementById('flashcardView').classList.toggle('active', understandUseFlashcards);
    document.getElementById('multipleChoiceView').classList.toggle('active', understandUseMultipleChoice);
    document.getElementById('typingView').classList.toggle('active', understandUseTyping);

    // Display flashcard
    if (understandUseFlashcards) {
        document.getElementById('understandCardQuestion').textContent = card.question;
        document.getElementById('understandCardAnswer').textContent = card.answer;
        document.getElementById('understandFlashcard').classList.remove('flipped');
    }

    // Display multiple choice
    if (understandUseMultipleChoice) {
        displayUnderstandMCQuestion();
    }

    // Display typing
    if (understandUseTyping) {
        document.getElementById('understandTypingQuestion').textContent = card.question;
        document.getElementById('understandTypingInput').value = '';
        document.getElementById('understandTypingFeedback').textContent = '';
    }

    updateProgress(understandCurrentIndex + 1, understandTotalQuestions, 'understandProgress', 'understandProgressText');
}

function displayUnderstandMCQuestion() {
    const card = understandCards[understandCurrentIndex];
    document.getElementById('understandMcQuestion').textContent = card.question;
    document.getElementById('understandMcResult').textContent = '';

    const optionsContainer = document.getElementById('understandMcOptions');
    optionsContainer.innerHTML = '';

    const correctAnswer = card.answer;
    const allOptions = [correctAnswer];
    const wrongOptions = generateWrongAnswers(correctAnswer, 3);
    allOptions.push(...wrongOptions);

    shuffleArray(allOptions);

    allOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
        button.onclick = () => selectUnderstandMCOption(option, correctAnswer, button);
        optionsContainer.appendChild(button);
    });
}

function selectUnderstandMCOption(selected, correct, button) {
    const resultElement = document.getElementById('understandMcResult');
    const optionsContainer = document.getElementById('understandMcOptions');
    const allButtons = optionsContainer.querySelectorAll('.option-button');

    allButtons.forEach(btn => btn.disabled = true);

    if (selected === correct) {
        button.classList.add('correct');
        resultElement.textContent = '✓ Correct!';
        resultElement.className = 'result-message correct';
        understandCorrectAnswers++;
    } else {
        button.classList.add('incorrect');
        resultElement.textContent = `✗ Incorrect. The correct answer is: ${correct}`;
        resultElement.className = 'result-message incorrect';

        allButtons.forEach(btn => {
            if (btn.textContent.includes(correct)) {
                btn.classList.add('correct');
            }
        });

        // Add to retry queue if wrong
        if (!understandRetryQueue.includes(understandCurrentIndex)) {
            understandRetryQueue.push(understandCurrentIndex);
        }
    }
}

function submitUnderstandTyping() {
    const card = understandCards[understandCurrentIndex];
    const userAnswer = document.getElementById('understandTypingInput').value.trim().toLowerCase();
    const correctAnswer = card.answer.toLowerCase();
    const feedback = document.getElementById('understandTypingFeedback');

    if (userAnswer === correctAnswer) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'feedback-message correct';
        understandCorrectAnswers++;
    } else {
        feedback.textContent = `✗ Expected: ${card.answer}`;
        feedback.className = 'feedback-message incorrect';

        if (!understandRetryQueue.includes(understandCurrentIndex)) {
            understandRetryQueue.push(understandCurrentIndex);
        }
    }
}

function nextUnderstandCard() {
    // Submit typing answer if typing mode is active
    if (understandUseTyping && document.getElementById('typingView').classList.contains('active')) {
        submitUnderstandTyping();
    }

    if (understandCurrentIndex < understandCards.length - 1) {
        understandCurrentIndex++;
        displayUnderstandCard();
    } else if (understandRetryQueue.length > 0) {
        // Review missed questions
        understandCurrentIndex = understandRetryQueue.shift();
        displayUnderstandCard();
    } else {
        showResults();
    }
}

function previousUnderstandCard() {
    if (understandCurrentIndex > 0) {
        understandCurrentIndex--;
        displayUnderstandCard();
    }
}

function flipCard() {
    const flashcard = document.getElementById('understandFlashcard');
    if (flashcard) {
        flashcard.classList.toggle('flipped');
    }
}

// Swipe Detection
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function addSwipeListeners(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, false);
    element.addEventListener('touchend', handleTouchEnd, false);
}

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - touchEndY);

    // Only consider horizontal swipes (vertical difference should be small)
    if (diffY < 100 && Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
            // Swiped left - incorrect
            handleSwipeLeft();
        } else {
            // Swiped right - correct
            handleSwipeRight();
        }
    }
}

function handleSwipeRight() {
    // Correct answer
    if (studyMode === 'flashcards') {
        correctAnswers++;
        showSwipeMessage('✓ Correct!', 'correct');
        nextCard();
    } else if (studyMode === 'understand') {
        understandCorrectAnswers++;
        showSwipeMessage('✓ Correct!', 'correct');
        nextUnderstandCard();
    }
}

function handleSwipeLeft() {
    // Incorrect answer
    if (studyMode === 'flashcards') {
        showSwipeMessage('✗ Incorrect', 'incorrect');
        // Don't increment, just move to next
        nextCard();
    } else if (studyMode === 'understand') {
        const currentIndex = understandCurrentIndex;
        if (!understandRetryQueue.includes(currentIndex)) {
            understandRetryQueue.push(currentIndex);
        }
        showSwipeMessage('✗ Incorrect', 'incorrect');
        nextUnderstandCard();
    }
}

function showSwipeMessage(text, type) {
    const message = document.createElement('div');
    message.className = `swipe-message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 1500);
}

// Initialize app
showScreen('homeScreen');
