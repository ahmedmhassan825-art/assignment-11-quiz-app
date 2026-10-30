// ===== الصوت =====
const WARNING_FROM_SECOND = 5;
const WARNING_BEEP = { frequency: 700, duration: 0.1, volume: 0.05 };
const END_BEEP = { frequency: 196, duration: 0.6, volume: 0.3 };
const CORRECT_BEEP = { frequency: 880, duration: 0.2, volume: 0.1 };
const WRONG_BEEP = { frequency: 250, duration: 0.4, volume: 0.15 };
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let beep = (sound) => {
  // لازم نستنى الصوت يشتغل الأول وبعدين نطلع الـ beep
  audioCtx.resume().then(() => {
    let oscillator = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = sound.frequency;
    gain.gain.value = sound.volume;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + sound.duration);
  });
};

// عشان لو في < في السؤال متبوظش الصفحة
let safe = (text) => {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
};

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((answer) =>
      this.decodeHtml(answer),
    );

    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;
    this.keyHandler = null;
  }

  decodeHtml(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    let array = [...this.wrongAnswers, this.correctAnswer];

    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    let total = this.quiz.numberOfQuestions;
    let difficulty = this.quiz.difficulty;

    // الأيقونة حسب الصعوبة
    let difficultyIcon = "fa-face-smile";
    if (difficulty === "medium") {
      difficultyIcon = "fa-face-meh";
    } else if (difficulty === "hard") {
      difficultyIcon = "fa-skull";
    }

    let answersHtml = "";
    for (let i = 0; i < this.allAnswers.length; i++) {
      answersHtml += `
        <button class="answer-btn" data-index="${i}">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${safe(this.allAnswers[i])}</span>
        </button>
      `;
    }

    this.container.innerHTML = `
      <div class="game-card question-card">
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${total}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${safe(this.category)}</span>
          </div>
          <div class="stat-badge difficulty ${difficulty}">
            <i class="fa-solid ${difficultyIcon}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${total}</span>
          </div>
        </div>

        <h2 class="question-text">${safe(this.question)}</h2>

        <div class="answers-grid">${answersHtml}</div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    let buttons = document.querySelectorAll(".answer-btn");

    // الضغط بالماوس
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        this.checkAnswer(button);
      });
    });

    // الضغط بالكيبورد 1-4
    let validKeys = ["1", "2", "3", "4"];
    this.keyHandler = (event) => {
      let position = validKeys.indexOf(event.key);
      if (position !== -1) {
        this.checkAnswer(buttons[position]);
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.keyHandler);
  }

  startTimer() {
    let timerValue = document.querySelector(".timer-value");
    let timerBadge = document.querySelector(".timer");

    this.timerInterval = setInterval(() => {
      this.timeRemaining = this.timeRemaining - 1;
      timerValue.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5) {
        timerBadge.classList.add("warning");
      }

      if (this.timeRemaining === 0) {
        beep(END_BEEP);
        this.stopTimer();
        this.handleTimeUp();
      } else if (this.timeRemaining <= WARNING_FROM_SECOND) {
        beep(WARNING_BEEP);
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    this.highlightCorrectAnswer();

    document.querySelector(".question-card").innerHTML += `
      <div class="time-up-message">
        <i class="fa-solid fa-clock"></i> TIME'S UP!
      </div>
    `;

    this.animateQuestion(500);
  }

  checkAnswer(choiceElement) {
    if (this.answered) {
      return;
    }
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    let selected = this.allAnswers[choiceElement.dataset.index];

    if (selected.toLowerCase() === this.correctAnswer.toLowerCase()) {
      beep(CORRECT_BEEP);
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      document.querySelector(".score-item-value").textContent = this.quiz.score;
    } else {
      beep(WRONG_BEEP);
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
    }

    // باقي الأزرار disabled
    document.querySelectorAll(".answer-btn").forEach((button) => {
      if (
        button !== choiceElement &&
        button.classList.contains("correct-reveal") === false
      ) {
        button.classList.add("disabled");
      }
    });

    this.animateQuestion(500);
  }

  highlightCorrectAnswer() {
    let buttons = document.querySelectorAll(".answer-btn");

    for (let i = 0; i < buttons.length; i++) {
      if (this.allAnswers[i] === this.correctAnswer) {
        buttons[i].classList.add("correct-reveal");
      }
    }
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      let next = new Question(this.quiz, this.container, this.onQuizEnd);
      next.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();

      document.querySelector(".btn-restart").addEventListener("click", () => {
        this.onQuizEnd();
      });
    }
  }

  animateQuestion(duration) {
    setTimeout(() => {
      document.querySelector(".question-card").classList.add("exit");

      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }
}