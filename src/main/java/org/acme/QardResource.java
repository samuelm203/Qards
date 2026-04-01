package org.acme;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api") // Basis-Pfad auf /api gekürzt, damit wir /decks und /stats bündeln können
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

    // --- NEUER ENDPUNKT: Alle Karten ---
    @GET
    @Path("/decks/{deckName}/all")
    public Response getAllQardsFromDeck(@PathParam("deckName") String deckName) {
        List<Qard> allQards = qardService.getAllQards(deckName);

        if (allQards.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Deck '" + deckName + "' wurde nicht gefunden oder ist leer.\"}")
                    .build();
        }
        // Gibt das komplette JSON-Array zurück
        return Response.ok(allQards).build();
    }

    // ==========================================
    // STATISTIK ENDPUNKTE (/api/stats)
    // ==========================================

    // --- NEUER ENDPUNKT: Statistik aktualisieren ---
    @POST
    @Path("/stats")
    public Response updateStats(StatRequest request) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        qardService.updateStats(request.wussteIch());

        // HTTP 200 OK (Wir müssen keinen Body zurückgeben, Erfolg reicht)
        return Response.ok().build();
    }

    // --- NEUER ENDPUNKT: Statistik abrufen ---
    @GET
    @Path("/stats")
    public Response getStats() {
        return Response.ok(qardService.getStats()).build();
    }

    // Ein Record, das genau der erwarteten JSON-Struktur des Frontends entspricht: {"wussteIch": true/false}
    public record StatRequest(boolean wussteIch) {}
}