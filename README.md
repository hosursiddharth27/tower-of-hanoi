# 🗼 Tower of Hanoi - Modern 2D Puzzle Game

[![Release](https://img.shields.io/github/v/release/hosursiddharth27/tower-of-hanoi?color=brightgreen&label=Android%20APK)](https://github.com/hosursiddharth27/tower-of-hanoi/releases/tag/v1.0.0)
[![Live Demo](https://img.shields.io/badge/Live-Web%20Demo-blue)](https://tower-of-hanoi-nine-zeta.vercel.app)

A sleek, responsive, modern 2D Tower of Hanoi game built with Vanilla JavaScript, HTML5, CSS3, and Web Audio API — available as both a **Web App** and **Native Android App (.apk)**!

Features multi-puzzle disc challenges (3 to 15 discs), target customization (Tower B & C), optimal Auto-Solve demo mode with playback controls (1x to 10x speed), smooth disc movement transitions, star scoring system, and local storage persistence.

---

## 📱 Android App Download

Download and install the official Android app directly on your phone:

📥 **[Download Latest Android APK (v1.0.0)](https://github.com/hosursiddharth27/tower-of-hanoi/releases/download/v1.0.0/app-debug.apk)**

Or visit the **[GitHub Releases Page](https://github.com/hosursiddharth27/tower-of-hanoi/releases/tag/v1.0.0)**.

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
- **Capacitor 7**: Cross-platform runtime powering the native Android app package.

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

No complex setup required!

1. Clone this repository:
   ```bash
   git clone https://github.com/hosursiddharth27/tower-of-hanoi.git
   ```
2. Open `index.html` directly in any web browser!

---

## 🌐 Live Demo

Play the live web game online:
- **Primary Link**: [https://tower-of-hanoi-nine-zeta.vercel.app](https://tower-of-hanoi-nine-zeta.vercel.app)
- **Secondary Link**: [https://tower-of-hanoi-topaz.vercel.app](https://tower-of-hanoi-topaz.vercel.app)

