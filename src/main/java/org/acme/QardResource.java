package org.acme;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QardResource {

    @Inject
    QardService qardService;

    // ==========================================
    // DECK ENDPUNKTE (/api/decks)
    // ==========================================

    @POST
    @Path("/decks/{deckName}")
    public Response createQards(@PathParam("deckName") String deckName, List<Qard> qards) {
        if (deckName == null || deckName.isBlank() || deckName.length() > 15) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Deck-Name muss zwischen 1 und 15 Zeichen lang sein.\"}")
                    .build();
        }
        if (qards == null || qards.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Die übergebene Karten-Liste darf nicht leer sein.\"}")
                    .build();
        }
        qardService.addQards(deckName, qards);
        return Response.status(Response.Status.CREATED).entity(qards).build();
    }

    @GET
    @Path("/decks")
    public List<String> getDecks() {
        return qardService.getAllDeckNames();
    }

    @GET
    @Path("/decks/{deckName}/random")
    public Response getRandomQardFromDeck(@PathParam("deckName") String deckName) {
        Qard randomQard = qardService.getRandomQard(deckName);

        if (randomQard == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Deck '" + deckName + "' wurde nicht gefunden oder ist leer.\"}")
                    .build();
        }
        return Response.ok(randomQard).build();
    }

    @GET
    @Path("/decks/{deckName}/all")
    public Response getAllQardsFromDeck(@PathParam("deckName") String deckName) {
        List<Qard> allQards = qardService.getAllQards(deckName);

        if (allQards.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Deck '" + deckName + "' wurde nicht gefunden oder ist leer.\"}")
                    .build();
        }
        return Response.ok(allQards).build();
    }

    // ==========================================
    // STATISTIK ENDPUNKTE PRO DECK
    // ==========================================

    @POST
    @Path("/decks/{deckName}/stats")
    public Response updateDeckStats(@PathParam("deckName") String deckName, StatRequest request) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        // Checken, ob das Deck existiert, bevor wir es updaten
        if (!qardService.getAllDeckNames().contains(deckName)) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Deck '" + deckName + "' wurde nicht gefunden.\"}")
                    .build();
        }
        qardService.updateStats(deckName, request.cardId(), request.wussteIch());

        // HTTP 200 OK (Erfolg reicht, wir senden keinen Body zurück)
        return Response.ok().build();
    }

    @GET
    @Path("/decks/{deckName}/stats")
    public Response getDeckStats(@PathParam("deckName") String deckName) {
        QardService.StatResult stats = qardService.getStats(deckName);

        if (stats == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Statistiken für Deck '" + deckName + "' wurden nicht gefunden.\"}")
                    .build();
        }

        return Response.ok(stats).build();
    }

    // Ein Record, das genau der erwarteten JSON-Struktur des Frontends entspricht: {"wussteIch": true/false}
    public record StatRequest(String cardId, boolean wussteIch) {}
}