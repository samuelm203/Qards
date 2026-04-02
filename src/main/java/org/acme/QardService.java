package org.acme;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.*;
import java.util.Collections.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class QardService {

    // Thread-sicherer In-Memory Cache für die Karten
    private final Map<String, List<Qard>> cache = new ConcurrentHashMap<>();

    // Explizite Deck-Reihenfolge, damit neue Decks immer vorne erscheinen
    private final Set<String> deckOrder = Collections.synchronizedSet(new LinkedHashSet<>());

    // Separater Thread-sicherer Cache für die Statistiken jedes Decks
    private final Map<String, DeckStats> statsCache = new ConcurrentHashMap<>();

    private final Random random = new Random();

    @PostConstruct
    void init() {
        String deckName = "Webentwicklung";
        List<Qard> initialQards = List.of(
                new Qard(null, deckName, "Wofür steht HTML?", "HyperText Markup Language"),
                new Qard(null, deckName, "Wofür wird CSS verwendet?", "Für das Styling und Layout einer Webseite (Cascading Style Sheets)."),
                new Qard(null, deckName, "Was ist das DOM?", "Document Object Model – eine Schnittstelle, um HTML-Strukturen mit Programmiersprachen wie JavaScript zu verändern.")
        );
        cache.put(deckName, new ArrayList<>(initialQards));
        deckOrder.add(deckName);
        statsCache.put(deckName, new DeckStats()); // Initialisiere leere Stats für das Standard-Deck
    }

    public void addQards(String deckName, List<Qard> newQards) {
        cache.computeIfAbsent(deckName, k -> new ArrayList<>()).addAll(newQards);
        synchronized (deckOrder) {
            deckOrder.remove(deckName); // Falls vorhanden, entfernen...
            deckOrder.add(deckName);    // ...und neu hinzufügen, damit es ans Ende des LinkedHashSet rückt
        }
        // Stelle sicher, dass beim Anlegen eines neuen Decks auch die Statistik initialisiert wird
        statsCache.putIfAbsent(deckName, new DeckStats());
    }

    public List<String> getAllDeckNames() {
        synchronized (deckOrder) {
            List<String> names = new ArrayList<>(deckOrder);
            Collections.reverse(names); // Neueste zuerst
            return names;
        }
    }

    public Qard getRandomQard(String deckName) {
        List<Qard> qardsInDeck = cache.get(deckName);
        if (qardsInDeck == null || qardsInDeck.isEmpty()) {
            return null;
        }
        int randomIndex = random.nextInt(qardsInDeck.size());
        return qardsInDeck.get(randomIndex);
    }

    public List<Qard> getAllQards(String deckName) {
        return cache.getOrDefault(deckName, new ArrayList<>());
    }

    // --- Statistiken pro Deck ---

    /**
     * Aktualisiert die Lern-Statistiken für ein spezifisches Deck.
     */
    public void updateStats(String deckName, String cardId, boolean wussteIch) {
        DeckStats stats = statsCache.get(deckName);
        if (stats != null) {
            stats.recordAnswer(cardId, wussteIch);
        }
    }

    /**
     * Gibt die aktuellen Statistiken eines spezifischen Decks zurück.
     * @return StatResult oder null, falls das Deck nicht existiert.
     */
    public StatResult getStats(String deckName) {
        DeckStats stats = statsCache.get(deckName);
        if (stats == null) {
            return null;
        }
        return stats.toResult();
    }

    // Ein Record, das von Quarkus/Jackson in JSON umgewandelt wird
    public record StatResult(int totalLearned, int totalCorrect, int totalAnswers, int totalCorrectAnswers) {}

    /**
     * Interne Hilfsklasse, um die Zähler für ein Deck Thread-sicher zu verwalten.
     */
    private static class DeckStats {
        private final Map<String, Boolean> cardResults = new ConcurrentHashMap<>();
        private final AtomicInteger totalAnswers = new AtomicInteger(0);
        private final AtomicInteger totalCorrectAnswers = new AtomicInteger(0);

        public void recordAnswer(String cardId, boolean correct) {
            cardResults.put(cardId, correct);
            totalAnswers.incrementAndGet();
            if (correct) {
                totalCorrectAnswers.incrementAndGet();
            }
        }

        public StatResult toResult() {
            int totalLearned = cardResults.size();
            int totalCorrect = (int) cardResults.values().stream().filter(Boolean::booleanValue).count();
            return new StatResult(totalLearned, totalCorrect, totalAnswers.get(), totalCorrectAnswers.get());
        }
    }
}