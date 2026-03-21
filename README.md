# Wellby

Work well. Rest well. Be well.

Wellby is a friendly AI-powered wellbeing companion for tech industry workers. It tracks how you work, learns your baseline pace, estimates burnout risk, and nudges you toward restorative breaks with a breathing exercise and a built-in game lounge.

## Stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Local AI services:
  - Burnout prediction proxy for `usmanbvp/Employees-Burnout-Analysis-and-Prediction`
  - Facial fatigue proxy for `IgorMoriera/Fatigue_Detection_with_Python`

## Included features

- Personalized onboarding with name, work setup, seniority, work hours, and favorite break game
- Friendly dashboard with live task tracking and actions-per-minute monitoring
- Adaptive flow engine that builds a baseline over the first 3 sessions
- Burnout risk meter with warm status copy and weekly trend chart
- Three-tier burnout alert system with toast, banner, modal-style escalation, and snoozes
- Opt-in fatigue detection polling with a local-only privacy notice
- Break Mode with a 60-second mindful breathing moment
- Built-in Snake, Chess, Tic Tac Toe, and simplified UNO mini-games
- Local persistence for onboarding, burnout history, sessions, and game scores

## Local development

1. Clone this repo.
2. Clone the burnout prediction service:
   - Repository: [usmanbvp/Employees-Burnout-Analysis-and-Prediction](https://github.com/usmanbvp/Employees-Burnout-Analysis-and-Prediction)
   - `pip install -r requirements.txt`
   - `python app.py --port 5001`
3. Clone the fatigue detection service:
   - Repository: [IgorMoriera/Fatigue_Detection_with_Python](https://github.com/IgorMoriera/Fatigue_Detection_with_Python)
   - `pip install -r requirements.txt`
   - `python fatigue_service.py --port 5002`
4. In this repo:
   - `npm install`
   - `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)
6. Complete onboarding and start your first Wellby session.

## Scripts

- `npm run dev` starts the Express server on port `3000` and mounts the Vite React frontend in middleware mode.
- `npm run build` builds the React client into `dist/`.
- `npm start` serves the production build from Express.

## API surface

- `GET /api/health`
- `POST /api/burnout/predict`
- `GET /api/fatigue/status`

The backend proxies the two Python microservices and falls back gracefully if either service is unavailable during local setup.

## NPM packages used

- `chess.js`
- `chessboard.js` package included in `package.json`
- `chart.js`
- `react-hot-toast`
- `framer-motion`

## Notes

- Weekly burnout history, session summaries, break logs, and game scores are stored in `localStorage`.
- The fatigue detection toggle only polls the local service when the user opts in.
- After each completed break, Wellby applies a `-0.1` reducing factor to the next burnout score, with a floor of `0.0`.
