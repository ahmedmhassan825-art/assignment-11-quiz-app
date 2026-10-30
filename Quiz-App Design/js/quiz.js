export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }


  buildApiUrl() {
    let params = new URLSearchParams();
    params.append("amount", this.numberOfQuestions);
    if (this.category !== "") {
      params.append("category", this.category);
    }
    params.append("difficulty", this.difficulty);
    params.append("type", "multiple"); 
    return "https://opentdb.com/api.php?" + params.toString();
  }

  // بنجيب الأسئلة
  async getQuestions() {
    let response = await fetch(this.buildApiUrl());

    if (response.ok === false) {
      throw new Error("Failed to load questions. Please try again.");
    }

    let data = await response.json();

    if (data.response_code !== 0) {
      throw new Error("Not enough questions for these options. Try fewer questions or another category.");
    }

    this.questions = data.results;
    return this.questions;
  }

  incrementScore() {
    this.score = this.score + 1;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion() {
    this.currentQuestionIndex = this.currentQuestionIndex + 1;
    return this.currentQuestionIndex < this.questions.length;
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      let saved = localStorage.getItem("quizHighScores");
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  saveHighScore() {
    let scores = this.getHighScores();

    scores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString(),
    });

    // الأعلى الأول
    scores.sort((a, b) => b.percentage - a.percentage);

    // أول 10 بس
    scores = scores.slice(0, 10);

    localStorage.setItem("quizHighScores", JSON.stringify(scores));
  }

  isHighScore() {
    let scores = this.getHighScores();
    if (scores.length < 10) {
      return true;
    }
    return this.getScorePercentage() > scores[scores.length - 1].percentage;
  }

  endQuiz() {
    let percentage = this.getScorePercentage();
    let isNewHigh = this.isHighScore();

    if (isNewHigh) {
      this.saveHighScore();
    }

    let scores = this.getHighScores();
    let medals = ["gold", "silver", "bronze"];

    let cartona = "";
    for (let i = 0; i < scores.length; i++) {
      let medal = "";
      if (i < 3) {
        medal = medals[i];
      }
      let name = scores[i].name.replace(/</g, "&lt;");

      cartona += `
        <li class="leaderboard-item ${medal}">
          <span class="leaderboard-rank">#${i + 1}</span>
          <span class="leaderboard-name">${name}</span>
          <span class="leaderboard-score">${scores[i].percentage}%</span>
        </li>
      `;
    }

    let badge = "";
    if (isNewHigh) {
      badge = `
        <div class="new-record-badge">
          <i class="fa-solid fa-star"></i> New High Score!
        </div>
      `;
    }

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${badge}
        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">${cartona}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}