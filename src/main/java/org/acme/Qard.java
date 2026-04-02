package org.acme;

import java.util.UUID;

/**
 * Repräsentiert das Datenmodell einer Lernkarte (Qard).
 * Die Nutzung eines Java 'record' macht die Klasse automatisch unveränderlich (immutable)
 * und generiert Getter, equals(), hashCode() und toString() für uns.
 */

public record Qard(String id, String deckName, String question, String answer) {
    public Qard {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}