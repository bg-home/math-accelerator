alert("Math Accelerator JavaScript loaded");

const SKILLS = {
  addition: { name: "Addition & Subtraction", grade: 3 },
  multiplication: { name: "Multiplication", grade: 3 },
  division: { name: "Division", grade: 3 },
  placeValue: { name: "Place Value", grade: 3 },
  fractions: { name: "Fractions", grade: 3 },
  measurement: { name: "Measurement", grade: 3 },
  time: { name: "Time", grade: 3 },
  geometry: { name: "Geometry", grade: 3 },
  multiStep: { name: "Multi-Step Problems", grade: 3 },
  largeNumbers: { name: "Larger Numbers", grade: 4 },
  fractionCompare: { name: "Fraction Comparison", grade: 4 },
  patterns: { name: "Patterns & Reasoning", grade: 4 }
};

const STORAGE_KEY = "mathAcceleratorStateV3";

function defaultState() {
  return {
    settings: {
      studentName: "Student",
      autoEmail: true
    },

    mastery: Object.fromEntries(
      Object.keys(SKILLS).map(key => [key, 50])
    ),

    history: [],
    currentMode: "practice"
  };
}

function loadState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    const base = defaultState();

    if (!saved) {
      return base;
    }

    return {
      ...base,
      ...saved,

      settings: {
        ...base.settings,
        ...(saved.settings || {})
      },

      mastery: {
        ...base.mastery,
        ...(saved.mastery || {})
      },

      history: Array.isArray(saved.history)
        ? saved.history
        : []
    };

  } catch {
    return defaultState();
  }
}

let state = loadState();
let session = null;
let timerId = null;

const $ = id => document.getElementById(id);

const clamp = (number, min, max) =>
  Math.max(min, Math.min(max, number));

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = array =>
  array[rand(0, array.length - 1)];

const shuffle = array =>
  [...array].sort(() => Math.random() - 0.5);

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function showView(id) {
  document
    .querySelectorAll(".view")
    .forEach(view => {
      view.classList.remove("active");
    });

  const target = $(id);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function overallReadiness() {
  const values = Object.values(state.mastery);

  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function masteryScore(skill) {
  return Math.round(
    state.mastery[skill] ?? 50
  );
}

function updateMastery(skill, correct, difficulty) {
  const oldScore =
    state.mastery[skill] ?? 50;

  const weight =
    difficulty >= 4
      ? 7
      : difficulty === 3
        ? 6
        : 5;

  state.mastery[skill] = clamp(
    oldScore + (correct ? weight : -weight),
    0,
    100
  );
}

function makeChoiceOptions(answer, spread = 5) {
  const values = new Set([answer]);

  while (values.size < 4) {
    const offset =
      rand(1, spread) *
      pick([-1, 1]);

    values.add(
      Math.max(0, answer + offset)
    );
  }

  return shuffle([...values]);
}

function numericQuestion(
  skill,
  prompt,
  answer,
  difficulty,
  explanation,
  type = "number"
) {
  return {
    skill,
    prompt,
    answer: String(answer),
    difficulty,
    explanation,
    type
  };
}

function multipleChoice(
  skill,
  prompt,
  answer,
  options,
  difficulty,
  explanation
) {
  return {
    skill,
    prompt,
    answer: String(answer),

    options: shuffle(
      options.map(String)
    ),

    difficulty,
    explanation,
    type: "choice"
  };
}

function generateQuestion(difficulty) {
  const d = clamp(
    Math.round(difficulty),
    1,
    5
  );

  let skillPool;

  if (d <= 2) {
    skillPool = [
      "addition",
      "multiplication",
      "division",
      "placeValue",
      "time",
      "measurement"
    ];

  } else if (d === 3) {
    skillPool = [
      "addition",
      "multiplication",
      "division",
      "fractions",
      "placeValue",
      "geometry",
      "multiStep",
      "time"
    ];

  } else {
    skillPool = [
      "largeNumbers",
      "fractionCompare",
      "patterns",
      "multiStep",
      "fractions",
      "multiplication",
      "division"
    ];
  }

  const skill = pick(skillPool);

  /*
  ADDITION / SUBTRACTION
  */

  if (skill === "addition") {
    const max =
      d <= 2
        ? 200
        : d === 3
          ? 1000
          : 5000;

    const a = rand(20, max);
    const b = rand(10, max);

    const subtract =
      Math.random() < 0.45;

    if (subtract) {
      const high = Math.max(a, b);
      const low = Math.min(a, b);

      return numericQuestion(
        skill,
        `${high} − ${low} = ?`,
        high - low,
        d,
        `Subtract ${low} from ${high}.`
      );
    }

    return numericQuestion(
      skill,
      `${a} + ${b} = ?`,
      a + b,
      d,
      "Add the place values carefully."
    );
  }

  /*
  MULTIPLICATION
  */

  if (skill === "multiplication") {
    const a = rand(
      2,
      d >= 4 ? 12 : 10
    );

    const b = rand(
      2,
      d >= 3 ? 12 : 10
    );

    const answer = a * b;

    if (Math.random() < 0.45) {
      return multipleChoice(
        skill,
        `${a} × ${b} = ?`,
        answer,
        makeChoiceOptions(
          answer,
          12
        ),
        d,
        `${a} groups of ${b} equals ${answer}.`
      );
    }

    return numericQuestion(
      skill,
      `${a} × ${b} = ?`,
      answer,
      d,
      `${a} groups of ${b} equals ${answer}.`
    );
  }

  /*
  DIVISION
  */

  if (skill === "division") {
    const divisor = rand(
      2,
      d >= 4 ? 12 : 10
    );

    const quotient = rand(
      2,
      d >= 3 ? 12 : 10
    );

    const dividend =
      divisor * quotient;

    return multipleChoice(
      skill,
      `${dividend} ÷ ${divisor} = ?`,
      quotient,
      makeChoiceOptions(
        quotient,
        5
      ),
      d,
      `Think: ${divisor} × ? = ${dividend}.`
    );
  }

  /*
  PLACE VALUE
  */

  if (skill === "placeValue") {
    const number =
      d >= 4
        ? rand(10000, 999999)
        : rand(1000, 9999);

    const digits =
      String(number).split("");

    const index =
      rand(0, digits.length - 1);

    const digit =
      Number(digits[index]);

    const place =
      10 ** (
        digits.length -
        index -
        1
      );

    const answer =
      digit * place;

    return multipleChoice(
      skill,

      `In ${number.toLocaleString()}, what is the value of the digit ${digit}?`,

      answer,

      makeChoiceOptions(
        answer,
        Math.max(
          10,
          place * 2
        )
      ),

      d,

      `The digit ${digit} is in the ${place.toLocaleString()}s place.`
    );
  }

  /*
  FRACTIONS
  */

  if (skill === "fractions") {
    const denominator =
      pick([2, 3, 4, 6, 8]);

    const numerator =
      rand(
        1,
        denominator - 1
      );

    if (d <= 3) {
      return multipleChoice(
        skill,

        `Which fraction means ${numerator} out of ${denominator} equal parts?`,

        `${numerator}/${denominator}`,

        [
          `${numerator}/${denominator}`,
          `${denominator}/${numerator}`,
          `${numerator}/${denominator + 1}`,
          `${Math.max(1, numerator - 1)}/${denominator}`
        ],

        d,

        "The numerator counts selected parts and the denominator counts all equal parts."
      );
    }

    const whole =
      rand(2, 6) *
      denominator;

    const answer =
      (whole / denominator) *
      numerator;

    return numericQuestion(
      skill,

      `What is ${numerator}/${denominator} of ${whole}?`,

      answer,

      d,

      `Divide ${whole} by ${denominator}, then multiply by ${numerator}.`
    );
  }

  /*
  FRACTION COMPARISON
  */

  if (skill === "fractionCompare") {
    const denominator =
      pick([4, 6, 8, 10, 12]);

    let a =
      rand(
        1,
        denominator - 1
      );

    let b =
      rand(
        1,
        denominator - 1
      );

    while (a === b) {
      b =
        rand(
          1,
          denominator - 1
        );
    }

    const answer =
      a > b ? ">" : "<";

    return multipleChoice(
      skill,

      `Choose the symbol that makes this true: ${a}/${denominator} ___ ${b}/${denominator}`,

      answer,

      [
        ">",
        "<",
        "="
      ],

      d,

      "With equal denominators, compare the numerators."
    );
  }

  /*
  MEASUREMENT
  */

  if (skill === "measurement") {
    const feet =
      rand(2, 12);

    const inches =
      feet * 12;

    return multipleChoice(
      skill,

      `${feet} feet equals how many inches?`,

      inches,

      makeChoiceOptions(
        inches,
        24
      ),

      d,

      `Each foot has 12 inches, so ${feet} × 12 = ${inches}.`
    );
  }

  /*
  TIME
  */

  if (skill === "time") {
    const startHour =
      rand(1, 10);

    const startMinute =
      pick([
        0,
        15,
        30,
        45
      ]);

    const minutesToAdd =
      pick([
        15,
        30,
        45,
        60,
        75,
        90
      ]);

    const startTotal =
      startHour * 60 +
      startMinute;

    const endTotal =
      startTotal +
      minutesToAdd;

    const endHourRaw =
      Math.floor(
        endTotal / 60
      );

    const endHour =
      ((endHourRaw - 1) % 12) + 1;

    const endMinute =
      endTotal % 60;

    const answer =
      `${endHour}:${String(endMinute).padStart(2, "0")}`;

    const wrongHour =
      (endHour % 12) + 1;

    const wrongMinute =
      (endMinute + 15) % 60;

    return multipleChoice(
      skill,

      `A movie starts at ${startHour}:${String(startMinute).padStart(2, "0")} and lasts ${minutesToAdd} minutes. When does it end?`,

      answer,

      [
        answer,

        `${wrongHour}:${String(endMinute).padStart(2, "0")}`,

        `${endHour}:${String(wrongMinute).padStart(2, "0")}`,

        `${startHour}:${String(startMinute).padStart(2, "0")}`
      ],

      d,

      `Add ${minutesToAdd} minutes to the starting time.`
    );
  }

  /*
  GEOMETRY
  */

  if (skill === "geometry") {
    const length =
      rand(3, 12);

    const width =
      rand(2, 10);

    if (Math.random() < 0.5) {
      const answer =
        length * width;

      return multipleChoice(
        skill,

        `A rectangle is ${length} units long and ${width} units wide. What is its area?`,

        answer,

        makeChoiceOptions(
          answer,
          15
        ),

        d,

        "Area = length × width."
      );
    }

    const answer =
      2 * (
        length +
        width
      );

    return numericQuestion(
      skill,

      `A rectangle is ${length} units long and ${width} units wide. What is its perimeter?`,

      answer,

      d,

      "Perimeter = 2 × (length + width)."
    );
  }

  /*
  LARGE NUMBERS
  */

  if (skill === "largeNumbers") {
    const a =
      rand(1000, 9999);

    const b =
      rand(1000, 9999);

    const answer =
      a > b
        ? ">"
        : a < b
          ? "<"
          : "=";

    return multipleChoice(
      skill,

      `Choose the correct symbol: ${a.toLocaleString()} ___ ${b.toLocaleString()}`,

      answer,

      [
        ">",
        "<",
        "="
      ],

      d,

      "Compare digits from the greatest place value first."
    );
  }

  /*
  PATTERNS
  */

  if (skill === "patterns") {
    const start =
      rand(1, 20);

    const step =
      rand(2, 12);

    const sequence =
      [0, 1, 2, 3].map(
        i =>
          start +
          i * step
      );

    const answer =
      start +
      4 * step;

    return multipleChoice(
      skill,

      `What comes next? ${sequence.join(", ")}, ___`,

      answer,

      makeChoiceOptions(
        answer,
        step * 2
      ),

      d,

      `The pattern increases by ${step} each time.`
    );
  }

  /*
  MULTI-STEP WORD PROBLEM
  */

  const boxes =
    rand(2, 8);

  const perBox =
    rand(3, 12);

  const used =
    rand(
      1,
      Math.max(
        1,
        boxes - 1
      )
    );

  const answer =
    boxes *
    perBox -
    used;

  return numericQuestion(
    "multiStep",

    `There are ${boxes} boxes with ${perBox} pencils in each box. Then ${used} pencils are used. How many pencils remain?`,

    answer,

    d,

    `First multiply ${boxes} × ${perBox}, then subtract ${used}.`
  );
}

/*
HOME SCREEN MODE BUTTONS
*/

function buildModeButtons() {
  const startButton =
    $("startBtn");

  if (
    !startButton ||
    $("mapBtn")
  ) {
    return;
  }

  startButton.textContent =
    "Practice Mode — 25 Questions";

  const mapButton =
    document.createElement(
      "button"
    );

  mapButton.id =
    "mapBtn";

  mapButton.className =
    "secondary large";

  mapButton.style.marginTop =
    "12px";

  mapButton.style.width =
    "100%";

  mapButton.textContent =
    "MAP-Style Simulation — 43 Questions";

  startButton.insertAdjacentElement(
    "afterend",
    mapButton
  );

  const note =
    document.createElement(
      "p"
    );

  note.className =
    "muted";

  note.style.marginTop =
    "12px";

  note.textContent =
    "Practice gives immediate feedback. MAP-style simulation is adaptive and saves all feedback until the end.";

  mapButton.insertAdjacentElement(
    "afterend",
    note
  );

  mapButton.addEventListener(
    "click",
    () => {
      startSession("map");
    }
  );
}

/*
HOME
*/

function renderHome() {
  $("homeReadiness").textContent =
    `${overallReadiness()}%`;

  const recent =
    state.history[0];

  if (recent) {
    const percentage =
      Math.round(
        recent.correct /
        recent.total *
        100
      );

    $("recentSummary").innerHTML =
      `<strong>${recent.mode === "map" ? "MAP-style" : "Practice"}</strong>
      — ${recent.correct}/${recent.total}
      (${percentage}%)
      · ${formatTime(recent.seconds || 0)}`;

  } else {
    $("recentSummary").innerHTML =
      `<div class="muted">
        No sessions completed yet.
      </div>`;
  }

  $("homeSkills").innerHTML =
    Object
      .entries(SKILLS)
      .map(
        ([key, skill]) => {

          const score =
            masteryScore(key);

          return `
            <div style="margin:10px 0">

              <div style="
                display:flex;
                justify-content:space-between;
                gap:12px;
              ">

                <span>
                  ${skill.name}
                </span>

                <strong>
                  ${score}%
                </strong>

              </div>

              <div class="progress">
                <div
                  style="width:${score}%"
                ></div>
              </div>

            </div>
          `;
        }
      )
      .join("");
}

/*
START SESSION
*/

function startSession(
  mode = "practice"
) {
  clearInterval(timerId);

  const total =
    mode === "map"
      ? 43
      : 25;

  const startDifficulty =
    clamp(
      Math.round(
        overallReadiness() /
        25
      ) + 1,
      2,
      4
    );

  session = {
    mode,
    total,
    index: 0,
    correct: 0,
    firstAttempt: 0,
    answers: [],
    seconds: 0,
    difficulty:
      startDifficulty,
    currentQuestion:
      null,
    attemptsOnQuestion:
      0
  };

  state.currentMode =
    mode;

  showView(
    "quizView"
  );

  timerId =
    setInterval(
      () => {

        if (!session) {
          return;
        }

        session.seconds++;

        $("sessionTimer")
          .textContent =
          formatTime(
            session.seconds
          );

      },
      1000
    );

  nextQuestion();
}

/*
NEXT QUESTION
*/

function nextQuestion() {
  if (!session) {
    return;
  }

  if (
    session.index >=
    session.total
  ) {
    finishSession();
    return;
  }

  session.currentQuestion =
    generateQuestion(
      session.difficulty
    );

  session.attemptsOnQuestion =
    0;

  const question =
    session.currentQuestion;

  $("questionCount")
    .textContent =
    `Question ${session.index + 1} of ${session.total}`;

  $("skillTag")
    .textContent =
    `${SKILLS[question.skill].name} · Level ${question.difficulty}`;

  $("questionText")
    .textContent =
    question.prompt;

  $("feedback")
    .innerHTML =
    "";

  $("nextBtn")
    .classList
    .add("hidden");

  $("checkBtn")
    .classList
    .remove("hidden");

  $("progressBar")
    .style
    .width =
    `${
      (
        session.index /
        session.total
      ) * 100
    }%`;

  renderAnswerArea(
    question
  );
}

/*
ANSWER AREA
*/

function renderAnswerArea(
  question
) {
  const area =
    $("answerArea");

  area.innerHTML =
    "";

  if (
    question.type ===
    "choice"
  ) {
    question.options
      .forEach(
        option => {

          const label =
            document
              .createElement(
                "label"
              );

          label.style.display =
            "block";

          label.style.padding =
            "12px";

          label.style.margin =
            "8px 0";

          label.style.border =
            "1px solid #d7dce3";

          label.style.borderRadius =
            "10px";

          label.innerHTML =
            `
            <input
              type="radio"
              name="answerChoice"
              value="${escapeHtml(option)}"
              style="margin-right:10px"
            >

            ${escapeHtml(option)}
            `;

          area.appendChild(
            label
          );
        }
      );

  } else {
    const input =
      document
        .createElement(
          "input"
        );

    input.id =
      "numericAnswer";

    input.type =
      question.type ===
      "number"
        ? "number"
        : "text";

    input.inputMode =
      question.type ===
      "number"
        ? "decimal"
        : "text";

    input.placeholder =
      "Enter your answer";

    input.autocomplete =
      "off";

    area.appendChild(
      input
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function getStudentAnswer() {
  const question =
    session.currentQuestion;

  if (
    question.type ===
    "choice"
  ) {
    const selected =
      document.querySelector(
        'input[name="answerChoice"]:checked'
      );

    return selected
      ? selected.value.trim()
      : "";
  }

  const input =
    $("numericAnswer");

  return input
    ? input.value.trim()
    : "";
}

function normalizeAnswer(
  value
) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, "");
}

/*
CHECK ANSWER
*/

function checkAnswer() {
  if (
    !session ||
    !session.currentQuestion
  ) {
    return;
  }

  const studentAnswer =
    getStudentAnswer();

  if (!studentAnswer) {
    $("feedback")
      .textContent =
      "Choose or enter an answer first.";

    return;
  }

  const question =
    session.currentQuestion;

  session
    .attemptsOnQuestion++;

  const correct =
    normalizeAnswer(
      studentAnswer
    ) ===
    normalizeAnswer(
      question.answer
    );

  session.answers.push({
    number:
      session.index + 1,

    skill:
      question.skill,

    question:
      question.prompt,

    studentAnswer,

    answer:
      question.answer,

    correct,

    difficulty:
      question.difficulty
  });

  if (correct) {
    session.correct++;

    if (
      session
        .attemptsOnQuestion ===
      1
    ) {
      session
        .firstAttempt++;
    }
  }

  updateMastery(
    question.skill,
    correct,
    question.difficulty
  );

  /*
  MAP-STYLE MODE
  */

  if (
    session.mode ===
    "map"
  ) {
    session.difficulty =
      clamp(
        session.difficulty +
        (
          correct
            ? 0.45
            : -0.55
        ),
        1,
        5
      );

    session.index++;

    setTimeout(
      nextQuestion,
      100
    );

    return;
  }

  /*
  PRACTICE MODE
  */

  if (correct) {
    $("feedback")
      .innerHTML =
      `<strong>Correct!</strong>
      ${escapeHtml(
        question.explanation
      )}`;

  } else {
    $("feedback")
      .innerHTML =
      `<strong>Not quite.</strong>
      The correct answer is
      <strong>
        ${escapeHtml(
          question.answer
        )}
      </strong>.
      ${escapeHtml(
        question.explanation
      )}`;
  }

  $("checkBtn")
    .classList
    .add("hidden");

  $("nextBtn")
    .classList
    .remove("hidden");
}

function finishPracticeQuestion() {
  if (!session) {
    return;
  }

  session.index++;
  nextQuestion();
}

/*
FINISH SESSION
*/

function finishSession() {
  clearInterval(
    timerId
  );

  if (!session) {
    return;
  }

  const record = {
    date:
      new Date()
        .toISOString(),

    mode:
      session.mode,

    total:
      session.total,

    correct:
      session.correct,

    firstAttempt:
      session.firstAttempt,

    seconds:
      session.seconds,

    answers:
      session.answers,

    readiness:
      overallReadiness()
  };

  state.history.unshift(
    record
  );

  state.history =
    state.history.slice(
      0,
      50
    );

  saveState();

  renderResults(
    record
  );

  showView(
    "resultsView"
  );

  if (
    state.settings.autoEmail
  ) {
    sendReport(
      record,
      false
    );
  }

  session = null;
}

/*
RESULTS
*/

function renderResults(record) {
  const percentage =
    Math.round(
      record.correct /
      record.total *
      100
    );

  const firstPercentage =
    Math.round(
      record.firstAttempt /
      record.total *
      100
    );

  $("resultHeadline")
    .textContent =
    record.mode === "map"
      ? "MAP-style simulation complete."
      : "Practice complete.";

  $("resultScore")
    .textContent =
    `${percentage}%`;

  $("resultFirst")
    .textContent =
    `${firstPercentage}%`;

  $("resultTime")
    .textContent =
    formatTime(
      record.seconds
    );

  $("resultReadiness")
    .textContent =
    `${overallReadiness()}%`;

  const bySkill = {};

  record.answers
    .forEach(
      answer => {

        if (
          !bySkill[
            answer.skill
          ]
        ) {
          bySkill[
            answer.skill
          ] = {
            attempted: 0,
            correct: 0
          };
        }

        bySkill[
          answer.skill
        ].attempted++;

        if (
          answer.correct
        ) {
          bySkill[
            answer.skill
          ].correct++;
        }
      }
    );

  const ranked =
    Object
      .entries(bySkill)
      .map(
        ([skill, values]) => ({
          skill,

          name:
            SKILLS[skill].name,

          pct:
            Math.round(
              values.correct /
              values.attempted *
              100
            ),

          ...values
        })
      )
      .sort(
        (a, b) =>
          b.pct -
          a.pct
      );

  const strengths =
    ranked
      .filter(
        item =>
          item.pct >= 75
      )
      .slice(
        0,
        5
      );

  const needsPractice =
    ranked
      .filter(
        item =>
          item.pct < 75
      )
      .sort(
        (a, b) =>
          a.pct -
          b.pct
      )
      .slice(
        0,
        5
      );

  $("strengths")
    .innerHTML =
    strengths.length
      ? strengths
          .map(
            item =>
              `<div>
                ${escapeHtml(item.name)}
                —
                <strong>
                  ${item.pct}%
                </strong>
              </div>`
          )
          .join("")
      : `<div class="muted">
          Keep practicing to establish clear strengths.
        </div>`;

  $("needsPractice")
    .innerHTML =
    needsPractice.length
      ? needsPractice
          .map(
            item =>
              `<div>
                ${escapeHtml(item.name)}
                —
                <strong>
                  ${item.pct}%
                </strong>
              </div>`
          )
          .join("")
      : `<div class="muted">
          No major weak areas in this session.
        </div>`;

  const missed =
    record.answers
      .filter(
        answer =>
          !answer.correct
      );

  $("missedQuestions")
    .innerHTML =
    missed.length
      ? missed
          .slice(
            0,
            15
          )
          .map(
            answer =>
              `
              <div style="margin-bottom:14px">

                <strong>
                  ${escapeHtml(
                    answer.question
                  )}
                </strong>

                <br>

                <span class="muted">
                  Answered:
                  ${escapeHtml(
                    answer.studentAnswer ||
                    "—"
                  )}

                  · Correct:

                  ${escapeHtml(
                    answer.answer
                  )}
                </span>

              </div>
              `
          )
          .join("")
      : `<div>
          Perfect session — no missed questions.
        </div>`;

  $("emailStatus")
    .textContent =
    state.settings.autoEmail
      ? "Parent email report is being sent automatically."
      : "Automatic parent email is turned off.";
}

/*
PARENT DASHBOARD
*/

function renderDashboard() {
  $("dashReadiness")
    .textContent =
    `${overallReadiness()}%`;

  $("dashSessions")
    .textContent =
    state.history.length;

  const totalQuestions =
    state.history.reduce(
      (sum, item) =>
        sum +
        (item.total || 0),
      0
    );

  const totalCorrect =
    state.history.reduce(
      (sum, item) =>
        sum +
        (item.correct || 0),
      0
    );

  $("dashQuestions")
    .textContent =
    totalQuestions;

  $("dashAverage")
    .textContent =
    totalQuestions
      ? `${Math.round(
          totalCorrect /
          totalQuestions *
          100
        )}%`
      : "0%";

  $("studentName")
    .value =
    state.settings
      .studentName ||
    "Student";

  $("autoEmail")
    .checked =
    !!state.settings
      .autoEmail;

  $("dashSkills")
    .innerHTML =
    Object
      .entries(SKILLS)
      .map(
        ([key, skill]) => {

          const score =
            masteryScore(key);

          return `
          <div style="margin:10px 0">

            <div style="
              display:flex;
              justify-content:space-between;
            ">

              <span>
                ${escapeHtml(
                  skill.name
                )}
              </span>

              <strong>
                ${score}%
              </strong>

            </div>

            <div class="progress">
              <div
                style="width:${score}%"
              ></div>
            </div>

          </div>
          `;
        }
      )
      .join("");

  if (
    state.history.length
  ) {
    $("sessionHistory")
      .innerHTML =
      state.history
        .map(
          item => {

            const percentage =
              Math.round(
                item.correct /
                item.total *
                100
              );

            const date =
              new Date(
                item.date
              )
              .toLocaleDateString();

            return `
            <div style="
              padding:10px 0;
              border-bottom:1px solid #eee;
            ">

              <strong>
                ${date}
              </strong>

              —

              ${
                item.mode === "map"
                  ? "MAP-style"
                  : "Practice"
              }

              —

              ${item.correct}/${item.total}

              (${percentage}%)

            </div>
            `;
          }
        )
        .join("");

  } else {
    $("sessionHistory")
      .innerHTML =
      `<div class="muted">
        No practice history yet.
      </div>`;
  }
}

/*
SETTINGS
*/

function saveSettings() {
  state.settings.studentName =
    $("studentName")
      .value
      .trim() ||
    "Student";

  state.settings.autoEmail =
    $("autoEmail")
      .checked;

  saveState();

  $("settingsStatus")
    .textContent =
    "Settings saved.";
}

/*
EMAIL
*/

async function sendReport(
  record = null,
  isTest = false
) {
  const statusElement =
    isTest
      ? $("settingsStatus")
      : $("emailStatus");

  if (statusElement) {
    statusElement.textContent =
      isTest
        ? "Sending test email…"
        : "Sending parent report…";
  }

  const payload = {
    test:
      isTest,

    studentName:
      state.settings.studentName ||
      "Student",

    session:
      record || null,

    readiness:
      overallReadiness(),

    mastery:
      Object.fromEntries(
        Object
          .entries(SKILLS)
          .map(
            ([key, value]) => [
              value.name,
              masteryScore(key)
            ]
          )
      )
  };

  try {
    const response =
      await fetch(
        "/api/send-report",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (
      !response.ok ||
      data.success === false
    ) {
      throw new Error(
        data.error ||
        "Unable to send email"
      );
    }

    if (statusElement) {
      statusElement.textContent =
        isTest
          ? "Test email sent. Check both parent inboxes."
          : "Parent report sent.";
    }

  } catch (error) {
    console.error(
      error
    );

    if (statusElement) {
      statusElement.textContent =
        `Email error: ${error.message}`;
    }
  }
}

/*
RESET
*/

function resetProgress() {
  const confirmed =
    confirm(
      "Delete all practice history and skill mastery on this device?"
    );

  if (!confirmed) {
    return;
  }

  const settings = {
    ...state.settings
  };

  state =
    defaultState();

  state.settings =
    settings;

  saveState();
  renderDashboard();
  renderHome();
}

/*
BUTTONS
*/

function wireEvents() {
  $("startBtn")
    ?.addEventListener(
      "click",
      () => {
        startSession(
          "practice"
        );
      }
    );

  $("parentBtn")
    ?.addEventListener(
      "click",
      () => {
        renderDashboard();
        showView(
          "parentView"
        );
      }
    );

  $("parentBackBtn")
    ?.addEventListener(
      "click",
      () => {
        renderHome();
        showView(
          "homeView"
        );
      }
    );

  $("checkBtn")
    ?.addEventListener(
      "click",
      checkAnswer
    );

  $("nextBtn")
    ?.addEventListener(
      "click",
      finishPracticeQuestion
    );

  $("quitBtn")
    ?.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            "Exit this session? Current answers will not be saved."
          );

        if (
          confirmed
        ) {
          clearInterval(
            timerId
          );

          session =
            null;

          renderHome();

          showView(
            "homeView"
          );
        }
      }
    );

  $("doneBtn")
    ?.addEventListener(
      "click",
      () => {
        renderHome();
        showView(
          "homeView"
        );
      }
    );

  $("saveSettingsBtn")
    ?.addEventListener(
      "click",
      saveSettings
    );

  $("testEmailBtn")
    ?.addEventListener(
      "click",
      () => {
        saveSettings();

        sendReport(
          null,
          true
        );
      }
    );

  $("resetBtn")
    ?.addEventListener(
      "click",
      resetProgress
    );
}

/*
START APP
*/

buildModeButtons();
wireEvents();
renderHome();
showView("homeView");
