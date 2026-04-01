# Qards - Smart Flashcard Trainer 🗃️

Qards is a modern, lightweight flashcard application built with **Quarkus** and **Java 25**. It provides a simple yet effective way to manage and study flashcards through a clean REST API and an interactive web interface.

## 🚀 Features

- **Interactive UI**: A sleek, Tailwind CSS-powered frontend with 3D flip animations for a better learning experience.
- **Dynamic Decks**: Create and manage multiple card decks.
- **RESTful API**: Fully-featured API for deck management and card retrieval.
- **Randomized Learning**: Test your knowledge with randomized card selection from any deck.
- **Pre-loaded Content**: Comes with an initial "Web Development" deck to get you started.

## 🛠️ Tech Stack

- **Backend**: [Quarkus](https://quarkus.io/) (Java 25)
- **Frontend**: HTML5, Tailwind CSS (via CDN)
- **API**: JAX-RS with Jackson for JSON processing
- **Build Tool**: Maven

## 📋 API Endpoints

The application exposes the following REST endpoints under `/api/decks`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/decks` | Lists all available deck names. |
| `GET` | `/api/decks/{name}/random` | Returns a random flashcard from the specified deck. |
| `POST` | `/api/decks/{name}` | Adds a list of flashcards to the specified deck. |

### Sample Qard Object
```json
{
  "id": "optional-uuid",
  "deckName": "Webentwicklung",
  "question": "Wofür steht HTML?",
  "answer": "HyperText Markup Language"
}
```

## 🏃 Getting Started

### Prerequisites
- Java 25 or higher
- Maven 3.9+

### Running in Development Mode
You can run your application in dev mode that enables live coding using:
```shell
./mvnw compile quarkus:dev
```

> **Note:** Quarkus now displays the Dev UI at http://localhost:8080/q/dev/.

### Accessing the Web Interface
Once the application is running, you can access the interactive trainer at:
[http://localhost:8080/qards/index.html](http://localhost:8080/qards/index.html)

### Packaging and Running
The application can be packaged using:
```shell
./mvnw package
```
It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory. Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

## 🏗️ Project Structure

- `src/main/java/org/acme/Qard.java`: The core data model (Java Record).
- `src/main/java/org/acme/QardService.java`: In-memory storage and logic.
- `src/main/java/org/acme/QardResource.java`: REST API implementation.
- `src/main/resources/META-INF/resources/qards/`: Frontend assets.

---
Built with ❤️ using Quarkus.

