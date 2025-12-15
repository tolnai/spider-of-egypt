# Spider of Egypt Solitaire

A modern web implementation of a variant of the **Thieves of Egypt** solitaire game, built during a practice "vibe coding" session.

**Play it here:** [https://tolnai.github.io/spider-of-egypt/](https://tolnai.github.io/spider-of-egypt/)

## 🎮 Game Rules

This game is a variant of the popular Thieves of Egypt solitaire, played with **2 decks** of cards (104 cards total).

### Objective

Build all 8 foundation piles up from **Ace to King** by suit.

### The Board

- **Tableau**: 9 columns arranged in a pyramid shape.
- **Foundations**: 8 piles at the top right.
- **Stock**: Remaining cards in the deck.

### How to Play

1. **Moving Cards**: You can move cards between tableau columns if they are in **descending order** and **alternating colors** (e.g., a Red 9 on a Black 10).
2. **Moving Sequences**: You can move entire valid sequences of cards (e.g., Red 9, Black 8, Red 7) as a single unit.
3. **Empty Columns**: Only a **King** (or a sequence starting with a King) can be placed in an empty column.
4. **The Stock**: Clicking the stock pile deals **one card to each tableau column**, provided the column is not already "complete" (a full King-to-Ace sequence).
5. **Winning**: The game is won when all cards are moved to the foundation piles.

## 🛠️ Tech Stack

This project was created to practice modern frontend development techniques using:

- **React 19**: For the UI component architecture.
- **TypeScript**: For type safety and robust game logic.
- **Vite**: For lightning-fast development and building.
- **HTML5 Drag & Drop API**: Implemented with a custom drag layer for smooth, ghost-free card movement.
- **GitHub Pages**: For static hosting.

## 🚀 Development

This project was built in a "vibe coding" session, focusing on flow, aesthetics, and rapid iteration.

### Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

The project is configured for easy deployment to GitHub Pages:

```bash
npm run deploy
```
