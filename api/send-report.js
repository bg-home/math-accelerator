const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      test,
      studentName = "Student",
      session,
      readiness,
      mastery = {}
    } = req.body || {};

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const recipients = [
      process.env.PARENT_EMAIL_1,
      process.env.PARENT_EMAIL_2
    ].filter(Boolean);

    if (!recipients.length) {
      return res.status(500).json({
        success: false,
        error: "No parent email addresses configured."
      });
    }

    let subject;
    let text;

    if (test) {
      subject = `Math Accelerator — Test Email`;

      text = `
Math Accelerator Email Test

The Gmail email connection is working correctly.

Student: ${studentName}
Current readiness: ${readiness ?? 0}%

This is a test message from Math Accelerator.
      `.trim();

    } else if (session) {
      const score = session.correct || 0;
      const total = session.total || 25;
      const percentage = Math.round((score / total) * 100);

      const skillResults = {};

      (session.answers || []).forEach(answer => {
        if (!skillResults[answer.skill]) {
          skillResults[answer.skill] = {
            attempted: 0,
            correct: 0
          };
        }

        skillResults[answer.skill].attempted++;

        if (answer.correct) {
          skillResults[answer.skill].correct++;
        }
      });

      const skillLines = Object.entries(skillResults)
        .map(([skill, data]) => {
          const percent = Math.round(
            (data.correct / data.attempted) * 100
          );

          return `${skill}: ${data.correct}/${data.attempted} (${percent}%)`;
        })
        .join("\n");

      const missed = (session.answers || [])
        .filter(answer => !answer.correct)
        .map(answer =>
          `• ${answer.question}\n  Student answer: ${answer.studentAnswer || "—"}\n  Correct answer: ${answer.answer}`
        )
        .join("\n\n");

      const masteryLines = Object.entries(mastery)
        .map(([name, score]) => `${name}: ${score}%`)
        .join("\n");

      const minutes = Math.floor((session.seconds || 0) / 60);
      const seconds = (session.seconds || 0) % 60;

      subject = `${studentName} — Math Practice Report — ${percentage}%`;

      text = `
MATH PRACTICE REPORT

Student: ${studentName}

SESSION RESULTS
Score: ${score}/${total}
Percentage: ${percentage}%
First-attempt correct: ${session.firstAttempt || 0}/${total}
Practice time: ${minutes}:${String(seconds).padStart(2, "0")}
Accelerated Math Readiness: ${readiness ?? session.readiness ?? 0}%

SKILL PERFORMANCE
${skillLines || "No skill data available."}

QUESTIONS MISSED
${missed || "None — perfect session."}

OVERALL SKILL MASTERY
${masteryLines || "No mastery data available."}

Math Accelerator automatically adjusts future practice based on performance.
      `.trim();

    } else {
      subject = `Math Accelerator Report`;

      text = `
Math Accelerator

Student: ${studentName}
Current readiness: ${readiness ?? 0}%

No completed practice session is available yet.
      `.trim();
    }

    await transporter.sendMail({
      from: `"Math Accelerator" <${process.env.GMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      text
    });

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("Email error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to send email."
    });
  }
};
