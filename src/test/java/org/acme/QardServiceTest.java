package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
class QardServiceTest {

    @Inject
    QardService qardService;

    @Test
    void testStatAccumulation() {
        String deck = "TestDeck";
        Qard q1 = new Qard("1", deck, "Q1", "A1");
        Qard q2 = new Qard("2", deck, "Q2", "A2");
        qardService.addQards(deck, List.of(q1, q2));

        // Erste Runde: 2 Karten, beide richtig
        qardService.updateStats(deck, "1", true);
        qardService.updateStats(deck, "2", true);

        QardService.StatResult stats = qardService.getStats(deck);
        assertNotNull(stats);
        assertEquals(2, stats.totalLearned());
        assertEquals(2, stats.totalCorrect());
        assertEquals(2, stats.totalAnswers());
        assertEquals(2, stats.totalCorrectAnswers());

        // Zweite Runde: 1 Karte nochmal (falsch), 1 Karte nochmal (richtig)
        qardService.updateStats(deck, "1", false);
        qardService.updateStats(deck, "2", true);

        stats = qardService.getStats(deck);
        assertEquals(2, stats.totalLearned(), "Eindeutige Karten sollten 2 bleiben");
        assertEquals(1, stats.totalCorrect(), "Letzte Ergebnisse: Karte 1 ist falsch, Karte 2 ist richtig -> 1 richtig");
        assertEquals(50, Math.round((double)stats.totalCorrect() / stats.totalLearned() * 100), "Die Quote sollte nun 50% sein (1 von 2)");
        assertEquals(4, stats.totalAnswers(), "Gesamt-Antworten sollten 4 sein");
        assertEquals(3, stats.totalCorrectAnswers(), "Gesamt-Richtig-Antworten sollten 3 sein (True, True, False, True)");
    }
}
