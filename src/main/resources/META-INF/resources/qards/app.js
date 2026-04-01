const API_BASE_URL = '/api';

// State-Management
let currentActiveDeck = null;
let currentMode = null; // 'random' oder 'strict'
let strictDeckQueue = [];
let totalCardsInStrict = 0;

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('qards_theme');
    if (!savedTheme) {
        document.getElementById('view-onboarding').classList.remove('hidden');
        document.getElementById('app-wrapper').classList.add('hidden');
    } else {
        applyTheme(savedTheme);
        document.getElementById('view-onboarding').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
        loadDashboard();
    }
}

function applyTheme(theme) {
    if (theme === 'enterprise') {
        document.body.classList.add('theme-enterprise');
        document.getElementById('theme-toggle-text').innerText = 'Playful Edition';
    } else {
        document.body.classList.remove('theme-enterprise');
        document.getElementById('theme-toggle-text').innerText = 'Enterprise Edition';
    }
    localStorage.setItem('qards_theme', theme);
}

function setTheme(theme) {
    applyTheme(theme);
    document.getElementById('view-onboarding').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('hidden');
    loadDashboard();
}

function toggleTheme() {
    const current = localStorage.getItem('qards_theme') || 'playful';
    applyTheme(current === 'playful' ? 'enterprise' : 'playful');
}

// --- Hilfsfunktionen ---
function triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(50);
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-haptic')) triggerHaptic();
});

function showView(viewId) {
    ['view-start', 'view-deck-dashboard', 'view-quiz', 'view-create'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');

    if(viewId === 'view-start') loadDashboard();
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    document.getElementById('error-text').innerText = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 4000);
}

// --- Dashboard (Startbildschirm) ---
async function loadDashboard() {
    const container = document.getElementById('decks-container');
    try {
        const response = await fetch(`${API_BASE_URL}/decks`);
        if (!response.ok) throw new Error();
        const decks = await response.json();

        container.innerHTML = '';
        if(decks.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Keine aktiven Decks gefunden.</div>';
            return;
        }

        decks.forEach(name => {
            const card = document.createElement('button');
            card.className = 'btn-haptic w-full text-left bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-soft hover:border-indigo-300 group flex justify-between items-center transition-all border-b-8';
            card.innerHTML = `
                <div>
                    <h3 class="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">${name}</h3>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bereit fürs Training</span>
                </div>
                <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-12 group-hover:scale-110 shadow-sm">
                    <span class="emoji text-2xl">📝</span>
                    <span class="enterprise-icon">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </span>
                </div>
            `;
            card.onclick = () => openDeckDashboard(name);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<div class="col-span-full p-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">Verbindung zum Backend fehlgeschlagen.</div>';
    }
}

// --- NEU: Deck-spezifisches Dashboard ---
async function openDeckDashboard(deckName) {
    currentActiveDeck = deckName;
    document.getElementById('dashboard-deck-title').innerText = deckName;

    try {
        const res = await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(deckName)}/stats`);
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('deck-stat-learned').innerText = stats.totalLearned;
            const rate = stats.totalLearned > 0 ? Math.round((stats.totalCorrect / stats.totalLearned) * 100) : 0;
            document.getElementById('deck-stat-rate').innerText = `${rate}%`;
        } else {
            // Falls keine Stats da sind (z.B. neues Deck)
            document.getElementById('deck-stat-learned').innerText = "0";
            document.getElementById('deck-stat-rate').innerText = "0%";
        }
    } catch (e) {
        console.error("Stats konnten nicht geladen werden.", e);
        document.getElementById('deck-stat-learned').innerText = "0";
        document.getElementById('deck-stat-rate').innerText = "0%";
    }

    showView('view-deck-dashboard');
}

// --- Training (Quiz) Logik ---
async function startTraining(mode) {
    currentMode = mode;
    document.getElementById('quiz-deck-title').innerText = currentActiveDeck;
    showView('view-quiz');

    if (mode === 'strict') {
        try {
            const res = await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(currentActiveDeck)}/all`);
            strictDeckQueue = await res.json();
            totalCardsInStrict = strictDeckQueue.length;
            loadNextCard();
        } catch (e) { showError("Konnte Deck nicht laden."); }
    } else {
        document.getElementById('quiz-progress').innerText = "Zufalls-Modus";
        loadNextCard();
    }
}

async function loadNextCard() {
    const flashcard = document.getElementById('flashcard');
    const q = document.getElementById('card-question');
    const a = document.getElementById('card-answer');
    const btnContainer = document.getElementById('assessment-buttons');

    flashcard.classList.remove('flipped');
    btnContainer.classList.remove('opacity-100');
    btnContainer.classList.add('opacity-0');
    q.classList.add('opacity-0');

    setTimeout(async () => {
        try {
            if (currentMode === 'strict') {
                if (strictDeckQueue.length === 0) {
                    // Deck ist durchgespielt -> Zurück zum Deck-Dashboard, damit er die neuen Stats sieht
                    openDeckDashboard(currentActiveDeck);
                    return;
                }
                document.getElementById('quiz-progress').innerText = `Karte ${totalCardsInStrict - strictDeckQueue.length + 1} von ${totalCardsInStrict}`;
                const card = strictDeckQueue.shift();
                q.innerText = card.question;
                a.innerText = card.answer;
            } else {
                const res = await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(currentActiveDeck)}/random`);
                const card = await res.json();
                q.innerText = card.question;
                a.innerText = card.answer;
            }
            q.classList.remove('opacity-0');
        } catch (e) {
            showError("Fehler beim Laden der Karte.");
        }
    }, 200);
}

function flipCard() {
    const flashcard = document.getElementById('flashcard');
    triggerHaptic();
    flashcard.classList.toggle('flipped');

    const btnContainer = document.getElementById('assessment-buttons');
    if (flashcard.classList.contains('flipped')) {
        btnContainer.classList.remove('opacity-0');
        btnContainer.classList.add('opacity-100');
    } else {
        btnContainer.classList.add('opacity-0');
        btnContainer.classList.remove('opacity-100');
    }
}

async function submitAssessment(knewIt) {
    try {
        // Stats an den NEUEN Endpunkt für dieses spezifische Deck senden
        await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(currentActiveDeck)}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wussteIch: knewIt })
        });
        loadNextCard();
    } catch (e) {
        showError("Ergebnis konnte nicht gespeichert werden.");
    }
}

// --- Erstellen (Create) Logik ---
function addQaField() {
    const container = document.getElementById('qa-container');
    const row = document.createElement('div');
    // Verbessertes UI für Editor (Grid, um Felder nebeneinander zu haben)
    row.className = 'qa-pair grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center group bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm focus-within:border-indigo-200 transition-colors';
    row.innerHTML = `
        <input type="text" class="input-q w-full bg-slate-50 px-5 py-4 rounded-xl border-2 border-transparent text-base font-bold focus:bg-white focus:border-indigo-300 outline-none transition-colors text-slate-700 placeholder-slate-300" placeholder="Frage eingeben...">
        <input type="text" class="input-a w-full bg-slate-50 px-5 py-4 rounded-xl border-2 border-transparent text-base font-bold focus:bg-white focus:border-indigo-300 outline-none transition-colors text-slate-700 placeholder-slate-300" placeholder="Antwort eingeben...">
        <button onclick="this.parentElement.remove()" class="btn-haptic w-full md:w-auto p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-300 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center">
            <span class="emoji text-lg">🗑️</span>
            <span class="enterprise-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </span>
        </button>
    `;
    container.appendChild(row);
}

async function saveDeck() {
    const name = document.getElementById('input-deck-name').value.trim();
    if (!name) return showError("Set-Bezeichnung erforderlich.");

    const cards = [];
    document.querySelectorAll('.qa-pair').forEach(pair => {
        const q = pair.querySelector('.input-q').value.trim();
        const a = pair.querySelector('.input-a').value.trim();
        if (q && a) cards.push({ deckName: name, question: q, answer: a });
    });

    if (cards.length === 0) return showError("Keine gültigen Inhalte definiert.");

    try {
        const res = await fetch(`${API_BASE_URL}/decks/${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cards)
        });
        if (res.ok) {
            document.getElementById('input-deck-name').value = '';
            document.getElementById('qa-container').innerHTML = '';
            addQaField();
            showView('view-start');
        } else {
            showError("Speichern fehlgeschlagen.");
        }
    } catch (e) {
        showError("Netzwerkfehler beim Speichern.");
    }
}

// Init
initTheme();
addQaField();