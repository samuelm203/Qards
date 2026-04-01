package org.acme; // <-- Wichtig: Hier org.acme eintragen!

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

// WICHTIG: Die Zeile "import org.qards.model.Qard;" muss GELÖSCHT werden!

@ApplicationScoped
public class QardService {

    // Thread-sicherer In-Memory Cache: Der Key ist der deckName, der Value die Liste der Karten.
    private final Map<String, List<Qard>> cache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * @PostConstruct signalisiert, dass diese Methode ausgeführt werden soll,
     * sobald Quarkus den Service erfolgreich instanziiert hat.
     */
    @PostConstruct
    void init() {
        String deckName = "Webentwicklung";
        List<Qard> initialQards = List.of(
                new Qard(null, deckName, "Wofür steht HTML?", "HyperText Markup Language"),
                new Qard(null, deckName, "Wofür wird CSS verwendet?", "Für das Styling und Layout einer Webseite (Cascading Style Sheets)."),
                new Qard(null, deckName, "Was ist das DOM?", "Document Object Model – eine Schnittstelle, um HTML-Strukturen mit Programmiersprachen wie JavaScript zu verändern.")
        );

        // Da List.of() eine unveränderliche Liste zurückgibt, wrappen wir sie in eine ArrayList,
        // damit später im POST-Request weitere Karten hinzugefügt werden können.
        cache.put(deckName, new ArrayList<>(initialQards));
    }

    /**
     * Speichert eine neue Liste von Karten in einem Deck ab.
     * Existiert das Deck noch nicht, wird es automatisch angelegt.
     */
    public void addQards(String deckName, List<Qard> newQards) {
        // computeIfAbsent prüft, ob der deckName schon existiert. Wenn nicht, wird eine neue ArrayList erstellt.
        // Anschließend werden die neuen Karten (newQards) dieser Liste hinzugefügt.
        cache.computeIfAbsent(deckName, k -> new ArrayList<>()).addAll(newQards);
    }

    /**
     * Gibt eine Liste aller aktuell im Cache befindlichen Deck-Namen zurück.
     */
    public List<String> getAllDeckNames() {
        return new ArrayList<>(cache.keySet());
    }

    /**
     * Wählt eine zufällige Karte aus dem spezifizierten Deck aus.
     */
    public Qard getRandomQard(String deckName) {
        List<Qard> qardsInDeck = cache.get(deckName);

        // Sicherheits-Check: Gibt es das Deck überhaupt und enthält es Karten?
        if (qardsInDeck == null || qardsInDeck.isEmpty()) {
            return null;
        }

        int randomIndex = random.nextInt(qardsInDeck.size());
        return qardsInDeck.get(randomIndex);
    }
}