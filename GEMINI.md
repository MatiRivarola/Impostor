# Impostor (Cordobés Edition)

## Project Overview

"Impostor" is a web-based social deduction game built with **React**, **Vite**, and **TypeScript**. It features a "Cordobés" (Argentina) theme and utilizes **Google's Gemini API** to generate context-aware secret words for gameplay. The application is designed as a Single Page Application (SPA) where the game state transitions through various phases (Setup, Assignment, Debate, Voting, etc.).

### Tech Stack

*   **Frontend Framework:** React 19
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (inferred from utility classes)
*   **AI Integration:** Google Gemini API (`@google/genai`)
*   **Icons:** Lucide React

## Getting Started

### Prerequisites

*   Node.js (v18+ recommended)
*   npm
*   A Google Gemini API Key

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Setup

Create a `.env.local` file in the root directory and add your Gemini API Key:

```env
GEMINI_API_KEY=your_api_key_here
```

### Running the Application

*   **Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000` (or the port shown in the terminal).

*   **Build for Production:**
    ```bash
    npm run build
    ```

*   **Preview Production Build:**
    ```bash
    npm run preview
    ```

## Project Structure

```
/
├── components/       # UI Components representing game phases and widgets
│   ├── SetupPhase.tsx      # Game configuration screen
│   ├── AssignmentPhase.tsx # Role assignment screen
│   ├── DebatePhase.tsx     # Timer and discussion screen
│   ├── VotingPhase.tsx     # Voting mechanism
│   ├── ResultPhase.tsx     # Game outcome display
│   └── ...
├── services/         # Business logic and external integrations
│   ├── geminiService.ts    # Google Gemini API integration
│   └── wordService.ts      # Word management logic
├── App.tsx           # Main application entry point and State Manager
├── types.ts          # TypeScript interfaces and type definitions
├── constants.ts      # Game constants (themes, rules)
└── vite.config.ts    # Vite configuration
```

## Architecture & Game Logic

### State Management
The application uses a centralized state in `App.tsx` managed via `useState`. The `GameState` object controls the current `GamePhase`, player data, and game rules.

**Game Phases:**
1.  **SETUP:** Player entry and rule configuration.
2.  **ASSIGNMENT_WAIT / ASSIGNMENT_REVEAL:** Pass-and-play mechanic to show roles.
3.  **DEBATE:** Timer-based discussion phase.
4.  **VOTING:** Players vote to eliminate a suspect.
5.  **LAST_BULLET:** (Hardcore Mode) If the Impostor is caught, they get a final guess.
6.  **GAME_OVER:** Results and scoring.

### AI Integration
The `geminiService.ts` utilizes the Gemini API to generate secret words based on selected themes. It requests a JSON schema response to ensure reliable data for the game logic.

## Game Modes

*   **Classic:** Standard Impostor vs. Citizens.
*   **Chaos:** Introduces the "Undercover" role (has a similar but different word).
*   **Hardcore:** Adds "Last Bullet" mechanic and Undercover role.

## Development Conventions

*   **Components:** Use React Functional Components with typed props.
*   **Styling:** Use Tailwind CSS utility classes directly in JSX.
*   **Types:** Define shared interfaces in `types.ts` to ensure type safety across the app.
*   **Persistence:** `localStorage` is used to persist game state and scores to handle page refreshes.
