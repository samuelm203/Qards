package org.acme; // <-- Wichtig: Hier org.acme eintragen!

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

// WICHTIG: Die folgenden zwei Zeilen müssen GELÖSCHT werden!
// import org.qards.model.Qard;
// import org.qards.service.QardService;

@Path("/api/decks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QardResource {
// ... restlicher Code bleibt gleich ...

    // Dependency Injection: Quarkus injiziert unseren Service hier automatisch.
    @Inject
    QardService qardService;

    /**
     * POST /api/decks/{deckName}
     * Nimmt eine JSON-Liste von Qards entgegen und speichert sie.
     */
    @POST
    @Path("/{deckName}")
    public Response createQards(@PathParam("deckName") String deckName, List<Qard> qards) {
        if (qards == null || qards.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Die übergebene Karten-Liste darf nicht leer sein.\"}")
                    .build();
        }

        qardService.addQards(deckName, qards);

        // Gibt HTTP-Status 201 (Created) zurück, um die erfolgreiche Erstellung zu signalisieren
        return Response.status(Response.Status.CREATED).entity(qards).build();
    }

    /**
     * GET /api/decks
     * Liefert ein Array/Liste aller verfügbaren Deck-Namen als JSON.
     */
    @GET
    public List<String> getDecks() {
        return qardService.getAllDeckNames();
    }

    /**
     * GET /api/decks/{deckName}/random
     * Liefert genau eine zufällige Karte aus dem angegebenen Deck zurück.
     */
    @GET
    @Path("/{deckName}/random")
    public Response getRandomQardFromDeck(@PathParam("deckName") String deckName) {
        Qard randomQard = qardService.getRandomQard(deckName);

        if (randomQard == null) {
            // Gibt HTTP-Status 404 (Not Found) zurück, wenn das Deck nicht existiert oder leer ist
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Deck '" + deckName + "' wurde nicht gefunden oder ist leer.\"}")
                    .build();
        }

        // HTTP-Status 200 (OK) mit der zufälligen Karte als JSON-Body
        return Response.ok(randomQard).build();
    }
}