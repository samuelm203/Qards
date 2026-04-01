# Qards - Smart Flashcard Trainer

Qards is a modern, lightweight flashcard application built with Quarkus and Java 25. It provides a simple yet effective way to manage and study flashcards through a clean REST API and an interactive web interface.

## Overview

Qards allows users to create decks of flashcards and practice them using a web-based interface. The backend is built with Quarkus, providing a robust and fast API, while the frontend offers a responsive design with interactive elements.

### Cool Features
- Sleek interactive UI with Tailwind CSS and 3D flip animations
- Dynamic deck management via REST API
- In-memory storage for fast access (reset on restart)
- Randomized learning mode
- Progress tracking with session statistics
- Pre-loaded "Webentwicklung" (Web Development) deck

## Tech Stack

- **Language**: Java 25
- **Framework**: [Quarkus](https://quarkus.io/) 3.34.1
- **API**: JAX-RS (Quarkus REST) with Jackson for JSON processing
- **Frontend**: HTML5, JavaScript (ES6+), Tailwind CSS (via CDN)
- **Package Manager**: Maven

## Requirements

- Java 25 or higher
- Maven 3.9+ (or use the included `./mvnw`)

## Setup and Run

### Development Mode
Run the application in development mode with live coding enabled:
```shell
./mvnw quarkus:dev
```
The application will be available at [http://localhost:8080](http://localhost:8080).
The interactive trainer is located at [http://localhost:8080/qards/index.html](http://localhost:8080/qards/index.html).

### Production Mode
1. Package the application:
   ```shell
   ./mvnw package
   ```
2. Run the packaged application:
   ```shell
   java -jar target/quarkus-app/quarkus-run.jar
   ```

### Docker
Multiple Dockerfiles are provided in `src/main/docker/` for different packaging options:
- `Dockerfile.jvm`: Standard JVM-based image
- `Dockerfile.native`: Native executable image
- `Dockerfile.native-micro`: Minimal native image

## Scripts

- `./mvnw quarkus:dev`: Starts the app in development mode.
- `./mvnw package`: Packages the application.
- `./mvnw test`: Runs unit tests.
- `./mvnw verify`: Runs integration tests.

## API Endpoints

The REST API is available under `/api`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/decks` | Lists all available deck names. |
| `GET` | `/api/decks/{name}/random` | Returns a random flashcard from the specified deck. |
| `GET` | `/api/decks/{name}/all` | Returns all flashcards from the specified deck. |
| `POST` | `/api/decks/{name}` | Adds a list of flashcards to the specified deck. |
| `GET` | `/api/stats` | Retrieves learning statistics (total learned, total correct). |
| `POST` | `/api/stats` | Updates statistics. Expects `{"wussteIch": true/false}`. |
| `GET` | `/hello` | Basic health check/greeting endpoint. |

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

- `TODO`: Document any specific environment variables if added (e.g., for persistent storage in future). Currently, the app uses in-memory storage.

## Tests

Run the test suite using Maven:
```shell
./mvnw test
```
- `GreetingResourceTest`: Unit tests for the greeting endpoint.
- `GreetingResourceIT`: Integration tests (runs against the packaged application).

## Project Structure

- `src/main/java/org/acme/Qard.java`: Data model (Java Record).
- `src/main/java/org/acme/QardService.java`: Service layer handling in-memory storage and statistics.
- `src/main/java/org/acme/QardResource.java`: REST API endpoints.
- `src/main/resources/META-INF/resources/qards/`: Frontend assets (HTML, CSS, JS).
- `src/main/resources/application.properties`: Application configuration (e.g., CORS).
- `src/main/docker/`: Dockerfiles for various deployment targets.

## License

- `TODO`: Add license information.

