package org.acme;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class QardService {

    // Thread-sicherer In-Memory Cache für die Karten
    private final Map<String, List<Qard>> cache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    // Thread-sichere Zähler für die Statistiken (da REST-Requests parallel ankommen können)
    private final AtomicInteger totalLearned = new AtomicInteger(0);
    private final AtomicInteger totalCorrect = new AtomicInteger(0);

    @PostConstruct
    void init() {
        String deckName = "Webentwicklung";
        List<Qard> initialQards = List.of(
                new Qard(null, deckName, "Wofür steht HTML?", "HyperText Markup Language"),
                new Qard(null, deckName, "Wofür wird CSS verwendet?", "Für das Styling und Layout einer Webseite (Cascading Style Sheets)."),
                new Qard(null, deckName, "Was ist das DOM?", "Document Object Model – eine Schnittstelle, um HTML-Strukturen mit Programmiersprachen wie JavaScript zu verändern.")
        );
        cache.put(deckName, new ArrayList<>(initialQards));
    }

    public void addQards(String deckName, List<Qard> newQards) {
        cache.computeIfAbsent(deckName, k -> new ArrayList<>()).addAll(newQards);
    }

    public List<String> getAllDeckNames() {
        return new ArrayList<>(cache.keySet());
    }

    public Qard getRandomQard(String deckName) {
        List<Qard> qardsInDeck = cache.get(deckName);
        if (qardsInDeck == null || qardsInDeck.isEmpty()) {
            return null;
        }
        int randomIndex = random.nextInt(qardsInDeck.size());
        return qardsInDeck.get(randomIndex);
    }

    // --- NEUE FUNKTIONEN ---

    /**
     * Gibt die komplette Liste aller Karten eines Decks zurück.
     */
    public List<Qard> getAllQards(String deckName) {
        // Gibt die Liste zurück oder eine leere Liste, falls das Deck nicht existiert
        return cache.getOrDefault(deckName, new ArrayList<>());
    }

    /**
     * Aktualisiert die Lern-Statistiken.
     */
    public void updateStats(boolean wussteIch) {
        totalLearned.incrementAndGet(); // Karte wurde gelernt (Zähler + 1)
        if (wussteIch) {
            totalCorrect.incrementAndGet(); // Karte war richtig (Zähler + 1)
        }
    }

    /**
     * Gibt die aktuellen Statistiken als praktisches Record zurück.
     */
    public StatResult getStats() {
        return new StatResult(totalLearned.get(), totalCorrect.get());
    }

    // Ein kleines Record, das von Quarkus/Jackson automatisch in JSON umgewandelt wird
    public record StatResult(int totalLearned, int totalCorrect) {}
}