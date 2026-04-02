# Qards - Smart Flashcard Trainer

Qards is a modern, lightweight flashcard application built with Quarkus and Java 25. It provides a simple yet effective way to manage and study flashcards through a clean REST API and an interactive web interface.

## Overview

Qards allows users to create decks of flashcards and practice them using a web-based interface. The backend is built with Quarkus, providing a robust and fast API, while the frontend offers a responsive design with interactive elements.

### Key Features
- **Interactive UI**: Sleek interface with Tailwind CSS, 3D flip animations, and haptic-like feedback.
- **Dynamic Deck Management**: Create and manage multiple flashcard decks via REST API.
- **In-Memory Storage**: Fast access to data (reset on application restart).
- **Randomized Learning**: Study flashcards in a randomized order.
- **Progress Tracking**: Session-based statistics per deck to monitor learning progress.
- **Pre-loaded Content**: Includes a default "Webentwicklung" (Web Development) deck.
- **Native Support**: Ready for GraalVM native executable compilation.

## Tech Stack

- **Language**: Java 25
- **Framework**: [Quarkus](https://quarkus.io/) 3.34.1
- **API**: Jakarta REST (JAX-RS) with Jackson for JSON processing
- **Frontend**: HTML5, JavaScript (ES6+), Tailwind CSS (via CDN)
- **Package Manager**: Maven (using `./mvnw` wrapper)

## Requirements

- **Java**: JDK 25 or higher
- **Maven**: 3.9+ (optional, as `./mvnw` is included)
- **GraalVM**: (Optional) For building native executables
- **Docker**: (Optional) For containerized deployment

## Setup and Run

### Development Mode
Run the application in development mode with live coding enabled:
```powershell
./mvnw quarkus:dev
```
- **API Base**: [http://localhost:8080](http://localhost:8080)
- **Web UI**: [http://localhost:8080/](http://localhost:8080/) (serves `index.html` from `META-INF/resources`)
- **Dev UI**: [http://localhost:8080/q/dev](http://localhost:8080/q/dev)

### Production Mode
1. **Package the application**:
   ```powershell
   ./mvnw package
   ```
2. **Run the packaged application**:
   ```powershell
   java -jar target/quarkus-app/quarkus-run.jar
   ```

### Native Executable
Build a native executable using GraalVM:
```powershell
./mvnw package -Dnative
```
Run the resulting binary:
```powershell
./target/code-with-quarkus-1.0.0-SNAPSHOT-runner
```

### Docker
Dockerfiles are located in `src/main/docker/`:
- `Dockerfile.jvm`: Standard JVM-based image.
- `Dockerfile.legacy-jar`: Legacy JAR packaging support.
- `Dockerfile.native`: Native executable image (requires native build).
- `Dockerfile.native-micro`: Minimal native image using a micro base.

## Scripts

- `./mvnw quarkus:dev`: Starts the app in development mode with hot-reload.
- `./mvnw package`: Compiles and packages the JAR file.
- `./mvnw package -Dnative`: Compiles a native binary.
- `./mvnw test`: Runs unit tests.
- `./mvnw verify`: Runs integration tests (including native ones if profile is active).

## API Endpoints

The REST API is available under the `/api` path.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/decks` | Lists all available deck names. |
| `GET` | `/api/decks/{name}/random` | Returns a random flashcard from the specified deck. |
| `GET` | `/api/decks/{name}/all` | Returns all flashcards from the specified deck. |
| `POST` | `/api/decks/{name}` | Adds a list of flashcards to the specified deck. |
| `GET` | `/api/decks/{name}/stats` | Retrieves learning statistics for a specific deck. |
| `POST` | `/api/decks/{name}/stats` | Updates stats for a card. Payload: `{"cardId": "...", "wussteIch": true}`. |

### Sample Flashcard JSON
```json
{
  "id": "optional-uuid",
  "deckName": "Webentwicklung",
  "question": "Wofür steht HTML?",
  "answer": "HyperText Markup Language"
}
```

## Environment Variables

- `QUARKUS_HTTP_PORT`: Port on which the application listens (default: `8080`).
- `QUARKUS_HTTP_CORS`: Enable/disable CORS (currently `true` in `application.properties`).
- `TODO`: Document additional environment variables if persistent storage (e.g., PostgreSQL, Redis) is integrated.

## Tests

The project uses JUnit 5 and REST Assured for testing.
```powershell
./mvnw test
```
- **Unit/Resource Tests**: `QardServiceTest`, `QardResourceTest`.
- **Integration Tests**: `QardResourceIT` (if generated during native build).

## Project Structure

- `src/main/java/org/acme/`
  - `Qard.java`: Data model (Java Record).
  - `QardService.java`: Business logic and in-memory storage.
  - `QardResource.java`: REST API implementation (Entry Point).
- `src/main/resources/`
  - `META-INF/resources/`: Frontend assets (HTML, JS, CSS).
  - `application.properties`: Quarkus configuration.
- `src/test/java/org/acme/`: Test suites.
- `src/main/docker/`: Docker configurations.
