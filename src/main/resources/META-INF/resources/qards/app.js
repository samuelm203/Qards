// ============================================
// APPLICATION STATE MANAGEMENT
// ============================================

const appState = {
    sets: [],
    currentSet: null,
    cards: [],
    currentCardIndex: 0,
    originalCardOrder: [],
    learnedCards: new Set(),
    cardFlipped: false,
    loading: false,
    apiBaseUrl: '/api' // Change this to your API base URL if needed
};

// ============================================
// API COMMUNICATION
// ============================================

/**
 * Fetch vocabulary sets from the API
 */
async function fetchSets() {
    try {
        showLoading(true);
        const response = await fetch(`${appState.apiBaseUrl}/sets`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        appState.sets = await response.json();
        renderSetsList();
        hideError();
    } catch (error) {
        showError('Failed to Load Sets', `Could not fetch vocabulary sets: ${error.message}`);
        console.error('Error fetching sets:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Fetch cards for a specific set
 */
async function fetchCards(setId) {
    try {
        showLoading(true);
        const response = await fetch(`${appState.apiBaseUrl}/sets/${setId}/cards`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        appState.cards = await response.json();
        appState.originalCardOrder = [...appState.cards];
        appState.currentCardIndex = 0;
        appState.cardFlipped = false;
        appState.learnedCards.clear();

        renderCard();
        hideError();
    } catch (error) {
        showError('Failed to Load Cards', `Could not fetch cards for this set: ${error.message}`);
        console.error('Error fetching cards:', error);
        backToSets();
    } finally {
        showLoading(false);
    }
}

// ============================================
// VIEW MANAGEMENT
// ============================================

/**
 * Show the sets list view
 */
function showSetsView() {
    document.getElementById('setsView').style.display = 'block';
    document.getElementById('cardsView').classList.remove('active');
    resetFlashcard();
}

/**
 * Show the cards view
 */
function showCardsView() {
    document.getElementById('setsView').style.display = 'none';
    document.getElementById('cardsView').classList.add('active');
    updateStatusBar();
}

/**
 * Show loading state
 */
function showLoading(show) {
    appState.loading = show;
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
}

/**
 * Show error message
 */
function showError(title, message) {
    const errorMsg = document.getElementById('errorMessage');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorText').textContent = message;
    errorMsg.classList.add('active');
}

/**
 * Hide error message
 */
function hideError() {
    document.getElementById('errorMessage').classList.remove('active');
}

// ============================================
// SET MANAGEMENT
// ============================================

/**
 * Render the list of available sets
 */
function renderSetsList() {
    const setsList = document.getElementById('setsList');

    if (appState.sets.length === 0) {
        setsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.9375rem; padding: 32px 0;">Keine Sets verfügbar.</div>';
        return;
    }

    setsList.innerHTML = appState.sets.map(set => `
        <div class="set-card" onclick="selectSet(${set.id || set.setId})">
            <div class="set-title">${escapeHtml(set.name || set.title || 'Unbenannt')}</div>
            <div class="set-meta">${set.cardCount || 0} Karten</div>
            ${set.description ? `<div class="set-meta">${escapeHtml(set.description)}</div>` : ''}
            <span class="set-arrow">&#8250;</span>
        </div>
    `).join('');
}

/**
 * Select a set and load its cards
 */
function selectSet(setId) {
    const set = appState.sets.find(s => (s.id || s.setId) === setId);
    if (!set) return;

    appState.currentSet = set;
    document.getElementById('setNameDisplay').textContent = `[ ${escapeHtml(set.name || set.title || 'Untitled')} ]`;

    showCardsView();
    fetchCards(setId);
}

/**
 * Go back to sets list
 */
function backToSets() {
    showSetsView();
    hideError();
}

// ============================================
// CARD MANAGEMENT
// ============================================

/**
 * Get the current card
 */
function getCurrentCard() {
    return appState.cards[appState.currentCardIndex] || null;
}

/**
 * Render the current card
 */
function renderCard() {
    const card = getCurrentCard();
    if (!card) return;

    const front = card.front || card.question || 'Unknown';
    const back = card.back || card.answer || 'Unknown';

    document.getElementById('cardFront').textContent = escapeHtml(front);
    document.getElementById('cardBack').textContent = escapeHtml(back);
    document.getElementById('currentCardNum').textContent = appState.currentCardIndex + 1;
    document.getElementById('totalCardNum').textContent = appState.cards.length;

    resetFlashcard();
    updateStatusBar();
}

/**
 * Reset flashcard to front side
 */
function resetFlashcard() {
    appState.cardFlipped = false;
    document.getElementById('flashcardInner').classList.remove('flipped');
}

/**
 * Toggle card flip state
 */
function toggleCardFlip() {
    appState.cardFlipped = !appState.cardFlipped;
    document.getElementById('flashcardInner').classList.toggle('flipped');
    playSound('flip');
}

/**
 * Move to next card
 */
function nextCard() {
    if (appState.currentCardIndex < appState.cards.length - 1) {
        appState.currentCardIndex++;
        renderCard();
        playSound('next');
    }
}

/**
 * Move to previous card
 */
function previousCard() {
    if (appState.currentCardIndex > 0) {
        appState.currentCardIndex--;
        renderCard();
        playSound('prev');
    }
}

/**
 * Shuffle the cards
 */
function shuffleCards() {
    // Fisher-Yates shuffle algorithm
    for (let i = appState.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [appState.cards[i], appState.cards[j]] = [appState.cards[j], appState.cards[i]];
    }

    appState.currentCardIndex = 0;
    renderCard();
    playSound('shuffle');
}

/**
 * Toggle learned status for current card
 */
function toggleLearned() {
    const card = getCurrentCard();
    if (!card) return;

    const cardId = getCardId(card);

    if (appState.learnedCards.has(cardId)) {
        appState.learnedCards.delete(cardId);
    } else {
        appState.learnedCards.add(cardId);
    }

    updateStatusBar();
    playSound('learned');
}

/**
 * Get a unique identifier for a card
 */
function getCardId(card) {
    return card.id || card.cardId || `${card.front}_${card.back}`;
}

/**
 * Update the status bar display
 */
function updateStatusBar() {
    const statusBar = document.getElementById('statusBar');
    const learnedIndicator = document.getElementById('learnedIndicator');

    const isCurrentCardLearned = appState.learnedCards.has(getCardId(getCurrentCard()));

    statusBar.classList.add('active');
    document.getElementById('statusText').textContent = isCurrentCardLearned
        ? 'Gelernt'
        : 'Bereit';

    if (isCurrentCardLearned) {
        learnedIndicator.classList.remove('hidden');
    } else {
        learnedIndicator.classList.add('hidden');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS attacks
 */
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

/**
 * Play retro sound effects
 */
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different sounds
        const frequencies = {
            flip: 400,
            next: 600,
            prev: 300,
            learned: 800,
            shuffle: 500
        };

        oscillator.frequency.value = frequencies[type] || 400;
        oscillator.type = 'square'; // Retro square wave

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if Web Audio API is not available
        console.debug('Sound effect skipped:', e);
    }
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', toggleCardFlip);
    }

    // Load sets on page load
    fetchSets();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('cardsView').classList.contains('active')) {
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') previousCard();
            if (e.key === ' ') {
                e.preventDefault();
                toggleCardFlip();
            }
        }
    });
});

console.log('Retro Vocabulary Flashcard App v1.0 - Ready');
console.log('API Base URL:', appState.apiBaseUrl);
