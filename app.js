alert("Math Accelerator JavaScript loaded");
const SKILLS = {
  addsub: {name:"Addition & Subtraction", grade:3},
  multiplication: {name:"Multiplication", grade:3},
  division: {name:"Division", grade:3},
  placevalue: {name:"Place Value", grade:3},
  fractions: {name:"Fractions", grade:3},
  measurement: {name:"Measurement", grade:3},
  geometry: {name:"Geometry", grade:3},
  wordproblems: {name:"Word Problems", grade:3},
  mult4: {name:"Multi-digit Multiplication", grade:4},
  div4: {name:"Division with Remainders", grade:4},
  frac4: {name:"4th Grade Fractions", grade:4},
  angles4: {name:"Angles", grade:4}
};

const STORAGE_KEY = "mathAcceleratorV1";
const state = loadState();
let session = null;
let timerHandle = null;

function defaultState(){
  const mastery = {};

  Object.keys(SKILLS).forEach(k => {
    mastery[k] = {
      seen: 0,
      correct: 0,
      score: 0
    };
  });

  return {
    mastery,
    sessions: [],
    settings: {
      studentName: "Student",
      autoEmail: true
    }
  };
}

function loadState(){
  try{
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    const defaults = defaultState();

    return {
      ...defaults,
      ...saved,
      mastery: {
        ...defaults.mastery,
        ...(saved.mastery || {})
      },
      settings: {
        ...defaults.settings,
        ...(saved.settings || {})
      }
    };

  }catch(e){
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function clamp(n,a,b){
  return Math.max(a,Math.min(b,n));
}

function rand(a,b){
  return Math.floor(
    Math.random()*(b-a+1)
  )+a;
}

function choice(a){
  return a[
    Math.floor(Math.random()*a.length)
  ];
}

function fmtTime(sec){
  const m=Math.floor(sec/60);
  const s=sec%60;

  return `${m}:${String(s).padStart(2,"0")}`;
}

function pct(n,d){
  return d
    ? Math.round(n/d*100)
    : 0;
}

function showView(id){
  document
    .querySelectorAll(".view")
    .forEach(v=>v.classList.remove("active"));

  document
    .getElementById(id)
    .classList.add("active");

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

function masteryScore(k){
  return state.mastery[k]?.score || 0;
}

function overallReadiness(){
  const foundations=[
    "addsub",
    "multiplication",
    "division",
    "placevalue",
    "fractions",
    "measurement",
    "geometry",
    "wordproblems"
  ];

  const advanced=[
    "mult4",
    "div4",
    "frac4",
    "angles4"
  ];

  const f=
    foundations.reduce(
      (a,k)=>a+masteryScore(k),
      0
    ) / foundations.length;

  const a=
    advanced.reduce(
      (x,k)=>x+masteryScore(k),
      0
    ) / advanced.length;

  return Math.round(
    f*.7 + a*.3
  );
}

function updateMastery(skill,correct,attempts){

  const m=
    state.mastery[skill] ||
    (state.mastery[skill]={
      seen:0,
      correct:0,
      score:0
    });

  m.seen++;

  if(correct){
    m.correct++;
  }

  const performance =
    correct
      ? (
          attempts===1
            ? 100
            : attempts===2
              ? 82
              : 70
        )
      : 25;

  const weight =
    Math.min(
      .35,
      .16 + m.seen*.012
    );

  m.score =
    Math.round(
      m.score*(1-weight)
      + performance*weight
    );
}

function generateQuestion(skill){

  switch(skill){

    case "addsub":{
      const add=Math.random()<.55;
      const a=rand(120,999);
      const b=rand(60,499);

      if(add){
        return q(
          skill,
          `${a} + ${b} = ?`,
          a+b,
          "Start with the ones place, then tens, then hundreds.",
          `Add by place value: ${a} + ${b} = ${a+b}.`
        );
      }

      const hi=Math.max(a,b);
      const lo=Math.min(a,b);

      return q(
        skill,
        `${hi} − ${lo} = ?`,
        hi-lo,
        "Subtract the ones first. Regroup if the top digit is smaller.",
        `${hi} − ${lo} = ${hi-lo}.`
      );
    }

    case "multiplication":{
      const a=rand(2,12);
      const b=rand(2,12);

      return q(
        skill,
        `${a} × ${b} = ?`,
        a*b,
        `Think of ${a} groups of ${b}.`,
        `${a} × ${b} = ${a*b}.`
      );
    }

    case "division":{
      const b=rand(2,12);
      const ans=rand(2,12);
      const a=b*ans;

      return q(
        skill,
        `${a} ÷ ${b} = ?`,
        ans,
        `What number times ${b} equals ${a}?`,
        `${a} ÷ ${b} = ${ans} because ${ans} × ${b} = ${a}.`
      );
    }

    case "placevalue":{
      const n=rand(10000,999999);

      const places=[
        ["ones",1],
        ["tens",10],
        ["hundreds",100],
        ["thousands",1000],
        ["ten-thousands",10000]
      ];

      const [name,p]=choice(places);
      const digit=Math.floor(n/p)%10;

      return q(
        skill,
        `What digit is in the ${name} place in ${n.toLocaleString()}?`,
        digit,
        `Find the ${name} place by counting from the right.`,
        `The digit in the ${name} place is ${digit}.`
      );
    }

    case "fractions":{

      if(Math.random()<.5){

        const d=choice([4,6,8,10,12]);
        const n1=rand(1,d-1);
        const n2=rand(1,d-1);

        const ans=
          n1===n2
            ? "="
            : n1>n2
              ? ">"
              : "<";

        return q(
          skill,
          `Choose the correct sign: ${n1}/${d} __ ${n2}/${d}`,
          ans,
          "When denominators match, compare the numerators.",
          `${n1}/${d} ${ans} ${n2}/${d}.`,
          ["<",">","="]
        );

      }else{

        const pairs=[
          ["1/2","2/4"],
          ["1/2","3/6"],
          ["2/3","4/6"],
          ["1/4","2/8"],
          ["3/4","6/8"]
        ];

        const [a,b]=choice(pairs);

        return q(
          skill,
          `Are ${a} and ${b} equivalent?`,
          "Yes",
          "Imagine each fraction covering part of the same-size whole.",
          `${a} and ${b} name the same amount.`,
          ["Yes","No"]
        );
      }
    }

    case "measurement":{
      const type=
        choice([
          "minutes",
          "inches",
          "feet"
        ]);

      if(type==="minutes"){
        const h=rand(1,5);

        return q(
          skill,
          `How many minutes are in ${h} hour${h>1?"s":""}?`,
          h*60,
          "There are 60 minutes in 1 hour.",
          `${h} × 60 = ${h*60} minutes.`
        );
      }

      if(type==="inches"){
        const f=rand(1,8);

        return q(
          skill,
          `How many inches are in ${f} foot${f>1?"feet":""}?`,
          f*12,
          "There are 12 inches in 1 foot.",
          `${f} × 12 = ${f*12} inches.`
        );
      }

      const y=rand(1,6);

      return q(
        skill,
        `How many feet are in ${y} yard${y>1?"s":""}?`,
        y*3,
        "There are 3 feet in 1 yard.",
        `${y} × 3 = ${y*3} feet.`
      );
    }

    case "geometry":{
      const l=rand(3,14);
      const w=rand(2,10);

      if(Math.random()<.5){

        return q(
          skill,
          `A rectangle is ${l} units long and ${w} units wide. What is its area?`,
          l*w,
          "Area = length × width.",
          `${l} × ${w} = ${l*w} square units.`
        );
      }

      return q(
        skill,
        `A rectangle is ${l} units long and ${w} units wide. What is its perimeter?`,
        2*(l+w),
        "Perimeter is the distance around the outside: add all 4 sides.",
        `${l}+${w}+${l}+${w} = ${2*(l+w)} units.`
      );
    }

    case "wordproblems":{
      const a=rand(3,12);
      const b=rand(3,12);
      const c=rand(2,6);
      const ans=a*b-c;

      return q(
        skill,
        `There are ${a} boxes with ${b} pencils in each box. Then ${c} pencils are used. How many pencils remain?`,
        ans,
        "First find the total pencils. Then subtract the pencils used.",
        `${a} × ${b} = ${a*b}; ${a*b} − ${c} = ${ans}.`
      );
    }

    case "mult4":{
      const a=rand(12,49);
      const b=rand(3,9);

      return q(
        skill,
        `${a} × ${b} = ?`,
        a*b,
        `Break ${a} into tens and ones, multiply each part by ${b}, then add.`,
        `${Math.floor(a/10)*10}×${b} + ${a%10}×${b} = ${a*b}.`
      );
    }

    case "div4":{
      const b=rand(3,9);
      const quot=rand(10,30);
      const rem=rand(1,b-1);
      const a=b*quot+rem;

      return q(
        skill,
        `${a} ÷ ${b} = ? Write your answer like "23 R2".`,
        `${quot} R${rem}`,
        `Find the largest multiple of ${b} that does not pass ${a}.`,
        `${b} × ${quot} = ${b*quot}, with ${rem} left over, so the answer is ${quot} R${rem}.`
      );
    }

    case "frac4":{
      const items=[
        ["1/2","3/8",">"],
        ["2/3","3/4","<"],
        ["5/6","4/6",">"],
        ["3/8","1/2","<"],
        ["2/4","1/2","="]
      ];

      const [a,b,ans]=choice(items);

      return q(
        skill,
        `Choose the correct sign: ${a} __ ${b}`,
        ans,
        "Compare each fraction to a benchmark like 1/2, or make equivalent denominators.",
        `${a} ${ans} ${b}.`,
        ["<",">","="]
      );
    }

    case "angles4":{
      const angle=
        choice([
          30,
          45,
          60,
          90,
          110,
          135
        ]);

      const ans=
        angle<90
          ? "Acute"
          : angle===90
            ? "Right"
            : "Obtuse";

      return q(
        skill,
        `A ${angle}° angle is what type of angle?`,
        ans,
        "Acute is less than 90°, right is exactly 90°, obtuse is greater than 90°.",
        `${angle}° is ${ans.toLowerCase()}.`,
        ["Acute","Right","Obtuse"]
      );
    }
  }
}

function q(
  skill,
  text,
  answer,
  hint,
  explanation,
  choices=null
){
  return {
    skill,
    text,
    answer:String(answer),
    hint,
    explanation,
    choices
  };
}

function chooseSkill(){

  const basics=
    Object.keys(SKILLS)
      .filter(
        k=>SKILLS[k].grade===3
      );

  const advanced=
    Object.keys(SKILLS)
      .filter(
        k=>SKILLS[k].grade===4
      );

  const candidates=[];

  basics.forEach(k=>{

    const s=masteryScore(k);

    const weight=
      s<60
        ?5
        :s<80
          ?3
          :1;

    for(
      let i=0;
      i<weight;
      i++
    ){
      candidates.push(k);
    }
  });

  const foundationAvg=
    basics.reduce(
      (a,k)=>a+masteryScore(k),
      0
    ) / basics.length;

  if(foundationAvg>=55){

    advanced.forEach(k=>{

      const s=masteryScore(k);

      const weight=
        s<55
          ?2
          :1;

      for(
        let i=0;
        i<weight;
        i++
      ){
        candidates.push(k);
      }
    });

  }else{

    candidates.push(
      choice(basics)
    );
  }

  return choice(candidates);
}

function buildSessionQuestions(){

  const questions=[];

  const basics=
    Object.keys(SKILLS)
      .filter(
        k=>SKILLS[k].grade===3
      );

  basics.forEach(
    k=>questions.push(
      generateQuestion(k)
    )
  );

  while(
    questions.length<22
  ){
    questions.push(
      generateQuestion(
        chooseSkill()
      )
    );
  }

  const foundationAvg=
    basics.reduce(
      (a,k)=>a+masteryScore(k),
      0
    ) / basics.length;

  const challenges=
    foundationAvg>=45
      ? Object.keys(SKILLS)
          .filter(
            k=>SKILLS[k].grade===4
          )
      : [
          "wordproblems",
          "fractions",
          "division"
        ];

  while(
    questions.length<25
  ){
    questions.push(
      generateQuestion(
        choice(challenges)
      )
    );
  }

  return questions.sort(
    ()=>Math.random()-.5
  );
}

function startSession(){

  session={
    questions:buildSessionQuestions(),
    index:0,
    answers:[],
    started:Date.now(),
    seconds:0
  };

  clearInterval(
    timerHandle
  );

  timerHandle=
    setInterval(()=>{

      session.seconds=
        Math.floor(
          (
            Date.now()
            - session.started
          )/1000
        );

      document
        .getElementById(
          "sessionTimer"
        )
        .textContent=
          fmtTime(
            session.seconds
          );

    },1000);

  showView("quizView");

  renderQuestion();
}

function renderQuestion(){

  const item=
    session.questions[
      session.index
    ];

  item.attempts=0;
  item.solved=false;

  document
    .getElementById(
      "questionCount"
    )
    .textContent=
      `Question ${session.index+1} of 25`;

  document
    .getElementById(
      "progressBar"
    )
    .style.width=
      `${session.index/25*100}%`;

  document
    .getElementById(
      "skillTag"
    )
    .textContent=
      SKILLS[item.skill].name;

  document
    .getElementById(
      "questionText"
    )
    .textContent=
      item.text;

  document
    .getElementById(
      "feedback"
    )
    .className=
      "feedback";

  document
    .getElementById(
      "feedback"
    )
    .textContent=
      "";

  document
    .getElementById(
      "checkBtn"
    )
    .classList.remove(
      "hidden"
    );

  document
    .getElementById(
      "nextBtn"
    )
    .classList.add(
      "hidden"
    );

  const area=
    document.getElementById(
      "answerArea"
    );

  area.innerHTML="";

  if(item.choices){

    const grid=
      document.createElement(
        "div"
      );

    grid.className=
      "choice-grid";

    item.choices.forEach(c=>{

      const b=
        document.createElement(
          "button"
        );

      b.className=
        "choice";

      b.textContent=c;
      b.dataset.value=c;

      b.onclick=()=>{

        grid
          .querySelectorAll(
            ".choice"
          )
          .forEach(
            x=>x.classList.remove(
              "selected"
            )
          );

        b.classList.add(
          "selected"
        );
      };

      grid.appendChild(b);
    });

    area.appendChild(grid);

  }else{

    const input=
      document.createElement(
        "input"
      );

    input.className=
      "answer-input";

    input.id=
      "answerInput";

    input.inputMode=
      "decimal";

    input.autocomplete=
      "off";

    input.placeholder=
      "Your answer";

    input.addEventListener(
      "keydown",
      e=>{
        if(e.key==="Enter"){
          checkAnswer();
        }
      }
    );

    area.appendChild(input);

    setTimeout(
      ()=>input.focus(),
      80
    );
  }
}

function normalizeAnswer(s){

  return String(s)
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toLowerCase();
}

function selectedAnswer(){

  const item=
    session.questions[
      session.index
    ];

  if(item.choices){

    const el=
      document.querySelector(
        ".choice.selected"
      );

    return el
      ? el.dataset.value
      : "";
  }

  return document
    .getElementById(
      "answerInput"
    )?.value || "";
}

function checkAnswer(){

  const item=
    session.questions[
      session.index
    ];

  const ans=
    selectedAnswer();

  if(!ans){
    return;
  }

  item.attempts++;

  const correct=
    normalizeAnswer(ans)
    ===
    normalizeAnswer(
      item.answer
    );

  const fb=
    document.getElementById(
      "feedback"
    );

  if(correct){

    item.solved=true;
    item.studentAnswer=ans;

    fb.className=
      "feedback good";

    fb.innerHTML=
      `✓ Correct. ${item.explanation}`;

    document
      .getElementById(
        "checkBtn"
      )
      .classList.add(
        "hidden"
      );

    document
      .getElementById(
        "nextBtn"
      )
      .classList.remove(
        "hidden"
      );

  }else if(
    item.attempts===1
  ){

    fb.className=
      "feedback hint";

    fb.textContent=
      `Not quite. Try once more. Hint: ${item.hint}`;

  }else{

    item.solved=false;
    item.studentAnswer=ans;

    fb.className=
      "feedback bad";

    fb.innerHTML=
      `The answer is <strong>${item.answer}</strong>. ${item.explanation}`;

    document
      .getElementById(
        "checkBtn"
      )
      .classList.add(
        "hidden"
      );

    document
      .getElementById(
        "nextBtn"
      )
      .classList.remove(
        "hidden"
      );
  }
}

function nextQuestion(){

  const item=
    session.questions[
      session.index
    ];

  session.answers.push({
    skill:item.skill,
    question:item.text,
    correct:item.solved,
    attempts:item.attempts||2,
    answer:item.answer,
    studentAnswer:
      item.studentAnswer||""
  });

  updateMastery(
    item.skill,
    item.solved,
    item.attempts||2
  );

  if(session.index>=24){

    finishSession();

    return;
  }

  session.index++;

  renderQuestion();
}

async function finishSession(){

  clearInterval(
    timerHandle
  );

  const sec=
    Math.floor(
      (
        Date.now()
        - session.started
      )/1000
    );

  const correct=
    session.answers.filter(
      a=>a.correct
    ).length;

  const first=
    session.answers.filter(
      a=>
        a.correct
        &&
        a.attempts===1
    ).length;

  const record={
    id:Date.now(),
    date:new Date().toISOString(),
    seconds:sec,
    correct,
    total:25,
    firstAttempt:first,
    answers:session.answers,
    readiness:overallReadiness()
  };

  state.sessions.unshift(
    record
  );

  state.sessions=
    state.sessions.slice(
      0,
      100
    );

  saveState();

  renderResults(record);
  renderHome();
  renderDashboard();
  showView("resultsView");

  if(state.settings.autoEmail){

    const status=
      document.getElementById(
        "emailStatus"
      );

    status.textContent=
      "Sending parent report…";

    const ok=
      await sendReport(
        record,
        false
      );

    status.textContent=
      ok
        ? "Parent report sent."
        : "Practice saved. Email report could not be sent.";
  }
}

function aggregateSessionSkills(
  record
){

  const map={};

  record.answers.forEach(a=>{

    map[a.skill] ||= {
      n:0,
      c:0,
      first:0
    };

    map[a.skill].n++;

    if(a.correct){
      map[a.skill].c++;
    }

    if(
      a.correct
      &&
      a.attempts===1
    ){
      map[a.skill].first++;
    }
  });

  return Object
    .entries(map)
    .map(
      ([k,v])=>({
        key:k,
        name:SKILLS[k].name,
        p:pct(v.c,v.n),
        ...v
      })
    )
    .sort(
      (a,b)=>b.p-a.p
    );
}

function renderResults(r){

  document
    .getElementById(
      "resultScore"
    )
    .textContent=
      `${pct(r.correct,r.total)}%`;

  document
    .getElementById(
      "resultFirst"
    )
    .textContent=
      `${pct(r.firstAttempt,r.total)}%`;

  document
    .getElementById(
      "resultTime"
    )
    .textContent=
      fmtTime(r.seconds);

  document
    .getElementById(
      "resultReadiness"
    )
    .textContent=
      `${r.readiness}%`;

  document
    .getElementById(
      "resultHeadline"
    )
    .textContent=
      r.correct>=23
        ? "Excellent session."
        : r.correct>=20
          ? "Strong work."
          : r.correct>=16
            ? "Good progress."
            : "This session found useful practice areas.";

  const skills=
    aggregateSessionSkills(r);

  const strengths=
    skills
      .filter(
        s=>s.p>=80
      )
      .slice(0,4);

  const needs=
    skills
      .filter(
        s=>s.p<80
      )
      .sort(
        (a,b)=>a.p-b.p
      )
      .slice(0,4);

  document
    .getElementById(
      "strengths"
    )
    .innerHTML=
      strengths.length
        ? strengths.map(
            s=>`
              <div class="list-item">
                <strong>${s.name}</strong>
                <div class="muted">${s.p}% correct</div>
              </div>
            `
          ).join("")
        : `<div class="muted">Keep practicing to establish a pattern.</div>`;

  document
    .getElementById(
      "needsPractice"
    )
    .innerHTML=
      needs.length
        ? needs.map(
            s=>`
              <div class="list-item">
                <strong>${s.name}</strong>
                <div class="muted">${s.p}% correct — this skill will appear more often next time.</div>
              </div>
            `
          ).join("")
        : `<div class="muted">No major weak area in this session.</div>`;

  const missed=
    r.answers.filter(
      a=>!a.correct
    );

  document
    .getElementById(
      "missedQuestions"
    )
    .innerHTML=
      missed.length
        ? missed.map(
            a=>`
              <div class="list-item">
                <strong>${a.question}</strong>
                <div class="muted">
                  Student answer: ${esc(a.studentAnswer||"—")}
                  · Correct answer: ${esc(a.answer)}
                </div>
              </div>
            `
          ).join("")
        : `<div class="muted">No missed questions.</div>`;

  document
    .getElementById(
      "emailStatus"
    )
    .textContent="";
}

function esc(s){

  return String(s)
    .replace(
      /[&<>"']/g,
      m=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[m])
    );
}

function skillRows(target){

  const entries=
    Object.entries(SKILLS)
      .map(
        ([k,v])=>({
          k,
          name:v.name,
          score:masteryScore(k),
          seen:
            state.mastery[k]?.seen || 0
        })
      )
      .sort(
        (a,b)=>b.score-a.score
      );

  document
    .getElementById(target)
    .innerHTML=
      entries.map(
        s=>`
          <div class="skill-row">
            <div class="skill-name">${s.name}</div>
            <div class="bar">
              <span style="width:${s.score}%"></span>
            </div>
            <div>${s.seen?s.score+"%":"—"}</div>
          </div>
        `
      ).join("");
}

function renderHome(){

  document
    .getElementById(
      "homeReadiness"
    )
    .textContent=
      `${overallReadiness()}%`;

  skillRows(
    "homeSkills"
  );

  const recent=
    state.sessions[0];

  document
    .getElementById(
      "recentSummary"
    )
    .innerHTML=
      recent
        ? `
          <div>
            <strong>${pct(recent.correct,recent.total)}%</strong>
            last score
          </div>

          <div>
            <strong>${pct(recent.firstAttempt,recent.total)}%</strong>
            first-attempt accuracy
          </div>

          <div>
            <strong>${fmtTime(recent.seconds)}</strong>
            practice time
          </div>
        `
        : `<div class="muted">No sessions completed yet.</div>`;
}

function renderDashboard(){

  const n=
    state.sessions.length;

  const avg=
    n
      ? Math.round(
          state.sessions.reduce(
            (a,s)=>
              a+pct(
                s.correct,
                s.total
              ),
            0
          )/n
        )
      : 0;

  document
    .getElementById(
      "dashReadiness"
    )
    .textContent=
      `${overallReadiness()}%`;

  document
    .getElementById(
      "dashSessions"
    )
    .textContent=n;

  document
    .getElementById(
      "dashAverage"
    )
    .textContent=
      `${avg}%`;

  document
    .getElementById(
      "dashQuestions"
    )
    .textContent=
      n*25;

  skillRows(
    "dashSkills"
  );

  document
    .getElementById(
      "sessionHistory"
    )
    .innerHTML=
      n
        ? state.sessions
            .slice(0,12)
            .map(
              s=>`
                <div class="list-item">
                  <strong>${new Date(s.date).toLocaleDateString()}</strong>
                  — ${pct(s.correct,s.total)}%
                  <span class="muted">
                    · first attempt ${pct(s.firstAttempt,s.total)}%
                    · ${fmtTime(s.seconds)}
                    · readiness ${s.readiness}%
                  </span>
                </div>
              `
            )
            .join("")
        : `<div class="muted">No completed sessions yet.</div>`;

  document
    .getElementById(
      "studentName"
    )
    .value=
      state.settings.studentName
      || "Student";

  document
    .getElementById(
      "autoEmail"
    )
    .checked=
      !!state.settings.autoEmail;
}

function saveSettings(){

  state.settings.studentName=
    document
      .getElementById(
        "studentName"
      )
      .value
      .trim()
    || "Student";

  state.settings.autoEmail=
    document
      .getElementById(
        "autoEmail"
      )
      .checked;

  saveState();

  document
    .getElementById(
      "settingsStatus"
    )
    .textContent=
      "Settings saved.";
}

async function sendReport(
  record,
  isTest
){

  try{

    const payload={

      test:isTest,

      studentName:
        state.settings.studentName
        || "Student",

      session:
        record
        || null,

      readiness:
        overallReadiness(),

      mastery:
        Object.fromEntries(
          Object.entries(SKILLS)
            .map(
              ([k,v])=>[
                v.name,
                masteryScore(k)
              ]
            )
        )
    };

    const res=
      await fetch(
        "/api/send-report",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(
              payload
            )
        }
      );

    return res.ok;

  }catch(e){

    console.error(
      "Email request failed:",
      e
    );

    return false;
  }
}

document
  .getElementById(
    "startBtn"
  )
  .onclick=
    startSession;

document
  .getElementById(
    "checkBtn"
  )
  .onclick=
    checkAnswer;

document
  .getElementById(
    "nextBtn"
  )
  .onclick=
    nextQuestion;

document
  .getElementById(
    "quitBtn"
  )
  .onclick=()=>{

    if(
      confirm(
        "Exit this practice session? Current answers will not be saved."
      )
    ){

      clearInterval(
        timerHandle
      );

      showView(
        "homeView"
      );
    }
  };

document
  .getElementById(
    "doneBtn"
  )
  .onclick=()=>
    showView(
      "homeView"
    );

document
  .getElementById(
    "parentBtn"
  )
  .onclick=()=>{

    renderDashboard();

    showView(
      "parentView"
    );
  };

document
  .getElementById(
    "parentBackBtn"
  )
  .onclick=()=>
    showView(
      "homeView"
    );

document
  .getElementById(
    "saveSettingsBtn"
  )
  .onclick=
    saveSettings;

document
  .getElementById(
    "testEmailBtn"
  )
  .onclick=
    async()=>{

      saveSettings();

      const el=
        document.getElementById(
          "settingsStatus"
        );

      el.textContent=
        "Sending test…";

      const ok=
        await sendReport(
          state.sessions[0] || null,
          true
        );

      el.textContent=
        ok
          ? "Test email sent."
          : "Test email failed. Check the Verc
