import { prisma } from "@/lib/db/prisma";

export async function startAssessmentAttempt(params: {
  assessmentId: string;
  studentProfileId: string;
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.assessmentId },
    include: { questions: { where: { status: "ACTIVE" } } },
  });

  if (!assessment || assessment.status !== "ACTIVE") {
    throw new Error("Assessment not available");
  }

  // Check 24-hour retake cooldown rule (PRD 12.7)
  const lastAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      assessmentId: params.assessmentId,
      studentId: params.studentProfileId,
      status: "SUBMITTED",
    },
    orderBy: { submittedAt: "desc" },
  });

  if (lastAttempt && lastAttempt.submittedAt) {
    const hoursSince = (Date.now() - new Date(lastAttempt.submittedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      const waitHours = Math.ceil(24 - hoursSince);
      throw new Error(`Retake cooldown active. Please wait ${waitHours} hour(s) before attempting this assessment again.`);
    }
  }

  // Randomize subset of questions
  const shuffledQuestions = [...assessment.questions]
    .sort(() => 0.5 - Math.random())
    .slice(0, assessment.questionCount);

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      studentId: params.studentProfileId,
      status: "IN_PROGRESS",
    },
  });

  // Pre-create answer slots
  for (const q of shuffledQuestions) {
    await prisma.assessmentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: q.id,
      },
    });
  }

  // PRD 19.2: Question answer keys are never selected into student-facing query responses!
  const studentSafeQuestions = shuffledQuestions.map((q) => ({
    id: q.id,
    difficulty: q.difficulty,
    question: q.question,
    options: JSON.parse(q.options),
  }));

  return {
    attemptId: attempt.id,
    title: assessment.title,
    topic: assessment.topic,
    durationMinutes: assessment.durationMinutes,
    questionCount: studentSafeQuestions.length,
    startedAt: attempt.startedAt,
    questions: studentSafeQuestions,
  };
}

export async function saveAssessmentAnswer(params: {
  attemptId: string;
  questionId: string;
  selectedAnswer: number;
  studentProfileId: string;
}) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
  });

  if (!attempt || attempt.studentId !== params.studentProfileId) {
    throw new Error("Unauthorized attempt access");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("Attempt is no longer in progress");
  }

  return prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: params.attemptId,
        questionId: params.questionId,
      },
    },
    data: { selectedAnswer: params.selectedAnswer },
  });
}

export async function submitAssessmentAttempt(params: {
  attemptId: string;
  studentProfileId: string;
}) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      assessment: true,
      answers: {
        include: { question: true },
      },
    },
  });

  if (!attempt || attempt.studentId !== params.studentProfileId) {
    throw new Error("Unauthorized attempt access");
  }

  if (attempt.status === "SUBMITTED") {
    throw new Error("This assessment has already been submitted");
  }

  let correctCount = 0;
  const gradedQuestions: {
    questionId: string;
    question: string;
    selectedAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string | null;
  }[] = [];

  const skillScoreMap = new Map<string, { total: number; correct: number }>();

  for (const ans of attempt.answers) {
    const isCorrect = ans.selectedAnswer === ans.question.answerKey;
    if (isCorrect) correctCount++;

    await prisma.assessmentAnswer.update({
      where: { id: ans.id },
      data: { isCorrect },
    });

    // Group by skill
    const skillStats = skillScoreMap.get(ans.question.skillId) || { total: 0, correct: 0 };
    skillStats.total++;
    if (isCorrect) skillStats.correct++;
    skillScoreMap.set(ans.question.skillId, skillStats);

    gradedQuestions.push({
      questionId: ans.question.id,
      question: ans.question.question,
      selectedAnswer: ans.selectedAnswer,
      correctAnswer: ans.question.answerKey,
      isCorrect,
      explanation: ans.question.explanation,
    });
  }

  const totalQuestions = attempt.answers.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Update attempt status
  await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      score: scorePercentage,
    },
  });

  // Save skill-level results and promote verified levels if score >= 70%
  for (const [skillId, stats] of skillScoreMap.entries()) {
    const skillScore = Math.round((stats.correct / stats.total) * 100);
    const verifiedLevel = skillScore >= 85 ? 4 : skillScore >= 70 ? 3 : 2;

    await prisma.assessmentResult.create({
      data: {
        attemptId: attempt.id,
        skillId,
        score: skillScore,
        evidenceLevel: verifiedLevel,
      },
    });

    if (skillScore >= 70) {
      await prisma.studentSkill.upsert({
        where: {
          studentProfileId_skillId: {
            studentProfileId: params.studentProfileId,
            skillId,
          },
        },
        update: {
          verifiedLevel,
          evidenceMetadata: JSON.stringify({
            assessmentId: attempt.assessmentId,
            score: skillScore,
            verifiedAt: new Date().toISOString(),
          }),
        },
        create: {
          studentProfileId: params.studentProfileId,
          skillId,
          selfLevel: 3,
          verifiedLevel,
          evidenceMetadata: JSON.stringify({
            assessmentId: attempt.assessmentId,
            score: skillScore,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });
    }
  }

  return {
    attemptId: attempt.id,
    scorePercentage,
    correctCount,
    totalQuestions,
    passed: scorePercentage >= 70,
    review: gradedQuestions,
  };
}
