# 🎯 Naive Bayes Visualizer

[NAIVE BAYES VISUALISER](https://hammadshakeelai.github.io/Visualizers/)

[CLOCK WEBSITE](https://hammadshakeelai.github.io/Visualizers/timezone-clock.html0)


An interactive web-based visualizer for the **Gaussian Naive Bayes** classifier. Explore how the algorithm learns decision boundaries from data, view probability distributions in real time, and build intuition for Bayesian classification — all in your browser.

![Naive Bayes Visualizer](https://img.shields.io/badge/ML-Naive%20Bayes-6366f1?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Live-34d399?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-f472b6?style=for-the-badge)

---

## ✨ Features

### 🖱️ Interactive Data Canvas
- Click anywhere on the canvas to place data points
- Choose from **3 classes** (A, B, C) with distinct color coding
- Points are mapped to a normalized `[0, 1] × [0, 1]` feature space

### 📦 Quick Datasets
Load pre-built datasets to quickly explore different scenarios:

| Dataset | Description |
|---------|-------------|
| **Linear** | Two linearly separable classes |
| **Clusters** | Three well-separated Gaussian clusters |
| **Overlap** | Two overlapping classes to test boundary behavior |
| **Spiral** | Interleaved spiral pattern (a challenge for Naive Bayes!) |

### ⚙️ Real-Time Training
- Train the Gaussian Naive Bayes model with a single click
- Watch the **decision boundary** and **probability heatmap** render instantly
- Adjustable heatmap resolution (Low / Medium / High)

### 📊 Model Statistics Panel
- **Prior probabilities** for each class
- **Gaussian parameters** (μ, σ²) per feature per class
- **Distribution curves** — overlay of Gaussian PDFs for Feature X or Y
- **Training accuracy** displayed as an animated ring chart
- **Bayes' Theorem** formula reference card

### 🔍 Hover Inspection
- Hover over the canvas to see **posterior probabilities** for any point in the feature space
- Real-time probability bars and predicted class update as you move

### 🎨 Visualization Toggles
- **Decision Boundary** — shows where the classifier switches predictions
- **Probability Heatmap** — color-coded confidence regions
- **Gaussian Curves** — distribution plots in the stats panel

---

## 🚀 Getting Started

### Prerequisites
None! This is a pure **HTML + CSS + JavaScript** project with zero dependencies.

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Visualizers.git
   cd Visualizers/naive-bayes-visualizer
   ```

2. **Open directly in a browser**
   ```
   Just open index.html in your browser
   ```

   **Or** use a local server for best results:
   ```bash
   # Python
   python -m http.server 8765

   # Node.js
   npx serve .
   ```

3. **Visit** `http://localhost:8765` in your browser

---

## 📁 Project Structure

```
naive-bayes-visualizer/
├── index.html        # Main page — layout, controls, canvas, stats panel
├── style.css         # Dark glassmorphism theme with animations
├── naive-bayes.js    # Gaussian Naive Bayes classifier engine
├── app.js            # Canvas rendering, events, UI logic
└── README.md         # This file
```

---

## 🧠 How It Works

### Gaussian Naive Bayes Algorithm

1. **Training** — For each class $C_k$, the model computes:
   - **Prior** $P(C_k)$ — proportion of training points in each class
   - **Mean** $\mu$ and **Variance** $\sigma^2$ — per feature, per class

2. **Prediction** — For a new point $\mathbf{x} = (x_1, x_2)$, apply Bayes' theorem:

$$P(C_k \mid \mathbf{x}) = \frac{P(\mathbf{x} \mid C_k) \cdot P(C_k)}{P(\mathbf{x})}$$

3. **Naive Assumption** — Features are conditionally independent given the class:

$$P(\mathbf{x} \mid C_k) = P(x_1 \mid C_k) \cdot P(x_2 \mid C_k)$$

4. Each likelihood term uses the **Gaussian PDF**:

$$P(x_i \mid C_k) = \frac{1}{\sqrt{2\pi\sigma^2_k}} \exp\left(-\frac{(x_i - \mu_k)^2}{2\sigma^2_k}\right)$$

### Implementation Details

- Uses the **log-sum-exp trick** for numerically stable posterior computation
- Adds a small epsilon ($10^{-6}$) to variances to prevent division by zero
- Decision boundaries are detected by checking prediction changes across neighboring grid cells

---

## 🎨 Design

- **Dark theme** with glassmorphism panels and backdrop blur
- **Ambient orb animations** for a dynamic, living background
- **Google Fonts** — Inter for UI text, JetBrains Mono for numerical values
- Fully **responsive** layout that adapts to smaller screens

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
