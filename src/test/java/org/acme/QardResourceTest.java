package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
class QardResourceTest {

    @Test
    void testDeckCreationAndRetrieval() {
        String deckName = "APITestDeck";
        List<Qard> qards = List.of(new Qard(null, deckName, "Q1", "A1"));

        // Create Deck
        given()
                .contentType(ContentType.JSON)
                .body(qards)
                .when()
                .post("/api/decks/" + deckName)
                .then()
                .statusCode(201)
                .body("deckName", hasItems(deckName))
                .body("question", hasItems("Q1"));

        // Get all Decks
        given()
                .when()
                .get("/api/decks")
                .then()
                .statusCode(200)
                .body("$", hasItem(deckName));
    }

    @Test
    void testStatsEndpoints() {
        String deckName = "StatTestDeck";
        List<Qard> qards = List.of(new Qard("card1", deckName, "Q1", "A1"));

        // Create Deck
        given()
                .contentType(ContentType.JSON)
                .body(qards)
                .when()
                .post("/api/decks/" + deckName)
                .then()
                .statusCode(201);

        // Update Stats
        given()
                .contentType(ContentType.JSON)
                .body("{\"cardId\": \"card1\", \"wussteIch\": true}")
                .when()
                .post("/api/decks/" + deckName + "/stats")
                .then()
                .statusCode(200);

        // Get Stats
        given()
                .when()
                .get("/api/decks/" + deckName + "/stats")
                .then()
                .statusCode(200)
                .body("totalLearned", is(1))
                .body("totalCorrect", is(1))
                .body("totalAnswers", is(1))
                .body("totalCorrectAnswers", is(1));
    }

    @Test
    void testGetRandomQard() {
        // "Webentwicklung" is created in @PostConstruct of QardService
        given()
                .when()
                .get("/api/decks/Webentwicklung/random")
                .then()
                .statusCode(200)
                .body("deckName", is("Webentwicklung"))
                .body("question", notNullValue());
    }

    @Test
    void testNonExistentDeck() {
        given()
                .when()
                .get("/api/decks/GhostDeck/random")
                .then()
                .statusCode(404);
    }
}
