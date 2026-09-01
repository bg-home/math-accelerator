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

      `The
