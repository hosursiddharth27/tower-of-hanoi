# 🗼 Tower of Hanoi - Modern 2D Puzzle Game

A sleek, responsive, modern 2D Tower of Hanoi web game built with Vanilla JavaScript, HTML5, CSS3, and Web Audio API. 

Features multi-puzzle disc challenges (3 to 15 discs), target customization (Tower B & C), optimal Auto-Solve demo mode with playback controls (1x to 10x speed), smooth disc movement transitions, star scoring system, and local storage persistence.

---

## 🎮 Features

- **Disc Count Challenges (3 to 15 Discs)**: Organized into disc challenges rather than rigid linear levels.
- **Multiple Sub-Puzzles**: 4 distinct, deterministic sub-puzzles per disc count (52 total puzzles).
- **Dual Target Pole Support**: Solvable by moving all discs in order to **Tower B or Tower C**.
- **⚡ Auto-Solve Demo Mode**: Step-by-step optimal Hanoi solver with **Play**, **Pause**, **Restart**, and speed toggles (**1x**, **2x**, **5x**, **10x**). Uses an $O(1)$ iterative step generator for smooth 15-disc performance without thread locking.
- **⭐ Performance Star System**: Earn 1 to 3 stars per puzzle based on optimal move efficiency.
- **🎲 Random Challenge Mode**: Quick random challenge mode awarding bonus stars.
- **🎬 Smooth Disc Movement Animations**: Fluid 2D lift-slide-drop movement transitions with an Animation toggle (ON/OFF) in Settings.
- **🔊 Web Audio API Synth Effects**: Pure synthesized audio feedback for disc moves, invalid move errors, button clicks, and victory fanfare.
- **🎨 Visual Themes**: Cyber Dark, Neon Glow, and Classic Wood themes.
- **💾 LocalStorage Progress**: Automatically saves completed puzzles, unlocked challenges, best moves, best times, and star totals.
- **📱 Mobile-First Responsive UI**: Scaled disc dimensions & pole heights optimized for screen widths from 320px to desktop.
- **♿ Accessibility**: Full keyboard controls (`Tab` navigation, `Enter`/`Space` selection) and high contrast focus indicators.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic layout & Web Audio API integration.
- **CSS3**: CSS Custom Properties (Themes), Glassmorphism styling, flexbox/grid layout, and smooth 2D transform transitions.
- **JavaScript (ES6+)**: Module-free vanilla JS, drag-and-drop & touch pointer events, dynamic disc stack state engine, and non-blocking iterative Hanoi solver.

---

## 📖 How to Play

1. **Objective**: Move the entire stack of discs from the starting tower to **Tower B or Tower C**.
2. **Rules**:
   - Move only **one top disc** at a time.
   - **Never** place a larger disc on top of a smaller disc.
3. **Controls**:
   - **Desktop**: Click a tower or drag-and-drop the top disc.
   - **Mobile**: Tap a tower or drag with touch pointer events.
   - **Keyboard**: Navigate using `Tab` and select towers with `Enter` or `Space`.

---

## 🚀 Running Locally

No installation or build steps required!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/ASHRAF-ASH/tower-of-hanoi.git
   ```
2. Open `index.html` directly in any web browser!

---

## 🌐 Live Demo

Play the live version online: [https://tower-of-hanoi-nine-zeta.vercel.app](https://tower-of-hanoi-nine-zeta.vercel.app)
