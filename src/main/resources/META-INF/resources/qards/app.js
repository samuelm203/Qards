// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('qards_theme');
    if (!savedTheme) {
        // Kein Theme gewählt -> Zeige Onboarding, verstecke App
        document.getElementById('view-onboarding').classList.remove('hidden');
        document.getElementById('app-wrapper').classList.add('hidden');
    } else {
        // Theme anwenden und App anzeigen
        applyTheme(savedTheme);
        document.getElementById('view-onboarding').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
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
    // Startet die Standard-Initialisierung der App (Statistiken laden etc.)
}

function toggleTheme() {
    const current = localStorage.getItem('qards_theme') || 'playful';
    applyTheme(current === 'playful' ? 'enterprise' : 'playful');
}

// Starte das Theme Management sofort
initTheme();

// ==========================================
const API_BASE_URL = '/api';

// State-Management
let currentActiveDeck = null;
let currentMode = null; // 'random' oder 'strict'
let strictDeckQueue = [];
let totalCardsInStrict = 0;

// --- Hilfsfunktionen ---

// Löst eine physische Vibration am Smartphone aus
function triggerHaptic() {
    if (navigator.vibrate) {
        navigator.vibrate(50); // 50ms Vibration
    }
}

// Globaler Event-Listener für alle Buttons mit der Klasse .btn-haptic
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-haptic')) {
        triggerHaptic();
    }
});

function showView(viewId) {
    ['view-start', 'view-quiz', 'view-create'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');

    if(viewId === 'view-start') {
        loadDashboard();
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    document.getElementById('error-text').innerText = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 4000);
}

// --- Dashboard & Modal ---

async function loadDashboard() {
    // 1. Stats laden
    try {
        const statsRes = await fetch(`${API_BASE_URL}/stats`);
        const stats = await statsRes.json();

        document.getElementById('stat-learned').innerText = stats.totalLearned;

        const rate = stats.totalLearned > 0
            ? Math.round((stats.totalCorrect / stats.totalLearned) * 100)
            : 0;
        document.getElementById('stat-rate').innerText = `${rate}%`;
    } catch (e) { console.error("Stats konnten nicht geladen werden.", e); }

    // 2. Decks laden
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
            card.className = 'btn-haptic w-full text-left bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md group flex justify-between items-center';
            card.innerHTML = `
                <div>
                    <h3 class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">${name}</h3>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Ready for Training</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </div>
            `;
            card.onclick = () => openModeModal(name);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<div class="col-span-full p-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">Verbindung zum Backend fehlgeschlagen.</div>';
    }
}

function openModeModal(deckName) {
    currentActiveDeck = deckName;
    document.getElementById('modal-deck-title').innerText = deckName;
    document.getElementById('modal-mode').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-mode').classList.add('hidden');
}

// --- Training (Quiz) Logik ---

async function startTraining(mode) {
    currentMode = mode;
    closeModal();
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

    // UI zurücksetzen
    flashcard.classList.remove('flipped');
    btnContainer.classList.remove('opacity-100');
    btnContainer.classList.add('opacity-0');
    q.classList.add('opacity-0');

    setTimeout(async () => {
        try {
            if (currentMode === 'strict') {
                if (strictDeckQueue.length === 0) {
                    showError("Du hast alle Karten in diesem Deck gelernt!");
                    showView('view-start');
                    return;
                }
                document.getElementById('quiz-progress').innerText = `Karte ${totalCardsInStrict - strictDeckQueue.length + 1} von ${totalCardsInStrict}`;
                const card = strictDeckQueue.shift(); // Erste Karte aus dem Array nehmen
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
    }, 200); // Kurz warten, damit sich die Karte erst umdreht
}

function flipCard() {
    const flashcard = document.getElementById('flashcard');
    triggerHaptic(); // Haptik beim Karte umdrehen

    // Toggle Drehung
    flashcard.classList.toggle('flipped');

    // Blende die Assessment-Buttons ein, wenn die Karte umgedreht (Rückseite sichtbar) ist
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
        // Stats ans Backend senden
        await fetch(`${API_BASE_URL}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wussteIch: knewIt })
        });

        // Direkt die nächste Karte laden
        loadNextCard();
    } catch (e) {
        showError("Ergebnis konnte nicht gespeichert werden.");
    }
}

// --- Erstellen (Create) Logik ---

function addQaField() {
    const container = document.getElementById('qa-container');
    const row = document.createElement('div');
    row.className = 'qa-pair flex gap-3 items-end group';
    row.innerHTML = `
        <div class="flex-1">
            <input type="text" class="input-q w-full bg-white px-3 py-2 rounded border border-slate-200 text-sm focus:border-indigo-500 outline-none" placeholder="Frage">
        </div>
        <div class="flex-1">
            <input type="text" class="input-a w-full bg-white px-3 py-2 rounded border border-slate-200 text-sm focus:border-indigo-500 outline-none" placeholder="Antwort">
        </div>
        <button onclick="this.parentElement.remove()" class="btn-haptic p-2 text-slate-300 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
            showView('view-start'); // Führt automatisch loadDashboard() aus
        } else {
            showError("Speichern fehlgeschlagen.");
        }
    } catch (e) {
        showError("Netzwerkfehler beim Speichern.");
    }
}

// Init
addQaField();
loadDashboard();