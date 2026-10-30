import Quiz from "./quiz.js";
import Question from "./question.js";

// ===== عناصر الصفحة =====
let playerNameInput = document.getElementById("playerName");
let categoryInput = document.getElementById("categoryMenu");
let difficultyOptions = document.getElementById("difficultyOptions");
let questionsNumber = document.getElementById("questionsNumber");
let startQuizBtn = document.getElementById("startQuiz");
let quizOptionsForm = document.getElementById("quizOptions");
let questionsContainer = document.querySelector(".questions-container");

// الكويز الحالي
let currentQuiz = null;

// أرقام الكاتيجوري في الـ API
let categoryIds = {
  "General Knowledge": "9",
  Computers: "18",
  Sports: "21",
  History: "23",
  Science: "17",
};

// ===== Loading =====
let showLoading = () => {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
};

let hideLoading = () => {
  let overlay = document.querySelector(".loading-overlay");
  if (overlay) {
    overlay.remove();
  }
};

// ===== Error =====
let showError = (message) => {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  document.querySelector(".retry-btn").addEventListener("click", () => {
    resetToStart();
  });
};

// ===== Validation =====
let validateForm = () => {
  let number = questionsNumber.value;

  if (number === "") {
    return { isValid: false, error: "Please enter the number of questions." };
  }
  if (Number(number) < 1) {
    return { isValid: false, error: "Minimum number of questions is 1." };
  }
  if (Number(number) > 50) {
    return { isValid: false, error: "Maximum number of questions is 50." };
  }
  return { isValid: true, error: null };
};

let showFormError = (message) => {
  let errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.style.transition = "opacity 0.5s";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;

  startQuizBtn.before(errorDiv);

  setTimeout(() => {
    errorDiv.style.opacity = "0";
    setTimeout(() => {
      errorDiv.remove();
    }, 500);
  }, 3000);
};

// ===== Reset =====
let resetToStart = () => {
  questionsContainer.innerHTML = "";
  playerNameInput.value = "";
  questionsNumber.value = 10;
  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
};

// ===== Start =====
let startQuiz = async () => {
  let validation = validateForm();
  if (validation.isValid === false) {
    showFormError(validation.error);
    return;
  }

  let playerName = playerNameInput.value.trim();
  if (playerName === "") {
    playerName = "Player";
  }

  // لو Random مش هنبعت category
  let category = categoryIds[categoryInput.value] || "";
  let difficulty = difficultyOptions.value;
  let numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    let firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
};

// ===== Events =====
startQuizBtn.addEventListener("click", () => {
  startQuiz();
});

questionsNumber.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    startQuiz();
  }
});