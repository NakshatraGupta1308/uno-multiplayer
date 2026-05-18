# KARD

A real-time multiplayer card game built from scratch as a full-stack software project.

🎮 **Live Demo:** https://uno-multiplayer-frontend.vercel.app

## Tech Stack
- **Backend:** Java, Spring Boot, WebSocket (STOMP)
- **Frontend:** React, Vite
- **Deployment:** Render (backend), Vercel (frontend)

## Features
- Create and join game rooms via a live lobby
- Real-time game state sync across all players via WebSocket
- Full card ruleset -- number cards, Skip, Reverse, Draw Two, Wild, Wild Draw Four
- Color picker for wild cards
- UNO-style button with announcement overlay
- Game log showing real-time move history
- Invalid card flash feedback
- Sound effects for card play, draw, and win
- Card animations
- Mobile responsive with dynamic card sizing
- Win/lose screen with match summary

## Project Structure
\`\`\`
kard/
├── Backend/     # Spring Boot server -- game logic, room manager, WebSocket handlers
└── Frontend/    # React app -- lobby, room, and game UI
\`\`\`

## Running Locally
\`\`\`bash
# Backend
cd Backend
mvn spring-boot:run

# Frontend
cd Frontend
npm install
npm run dev
\`\`\`