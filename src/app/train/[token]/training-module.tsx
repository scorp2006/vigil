"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckIcon, XIcon, SparklesIcon, ArrowRightIcon } from "lucide-react";
import { completeTraining } from "@/app/actions/training";

type Quiz = { q: string; options: string[]; correctIndex: number; explain: string };

export function TrainingModule({
  token,
  module,
}: {
  token: string;
  module: {
    title: string;
    summary: string;
    lesson: string;
    quiz: Quiz[];
    redFlags?: string[];
  };
}) {
  const [step, setStep] = useState<"lesson" | "quiz" | "done">("lesson");
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [pending, start] = useTransition();

  const totalQ = module.quiz.length;
  const quiz = module.quiz[quizIdx];
  const progress =
    step === "lesson" ? 10 : step === "quiz" ? 20 + (quizIdx / Math.max(1, totalQ)) * 70 : 100;

  const startQuiz = () => setStep("quiz");

  const submitAnswer = () => {
    if (selected === null || !quiz) return;
    const correct = selected === quiz.correctIndex;
    if (correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (quizIdx + 1 < totalQ) {
      setQuizIdx((i) => i + 1);
      setSelected(null);
    } else {
      start(async () => {
        const passed = score / Math.max(1, totalQ) >= 0.6;
        await completeTraining(token, { score, total: totalQ, passed });
        setStep("done");
      });
    }
  };

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && selected === quiz?.correctIndex;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <SparklesIcon className="h-3 w-3 text-blue-500" />
              Vigil micro-training
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-400">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-slate-100" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {step === "lesson" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lesson</p>
            </div>
            <div className="p-8 space-y-5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{module.title}</h1>
              <p className="text-slate-500 leading-relaxed">{module.summary}</p>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-sm leading-loose text-slate-700">
                {module.lesson}
              </div>
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={startQuiz}
                  className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Test what you learned <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : step === "quiz" && quiz ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Question {quizIdx + 1} of {totalQ}
              </p>
            </div>
            <div className="p-8 space-y-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{quiz.q}</h2>

              <div className="space-y-2.5">
                {quiz.options.map((o, i) => {
                  const picked = selected === i;
                  const showState = isAnswered;
                  const right = showState && i === quiz.correctIndex;
                  const wrong = showState && picked && i !== quiz.correctIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all",
                        right && "border-emerald-400 bg-emerald-50 text-emerald-900",
                        wrong && "border-rose-400 bg-rose-50 text-rose-900",
                        !showState && picked && "border-blue-400 bg-blue-50 text-blue-900",
                        !showState && !picked && "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                          right && "border-emerald-500 bg-emerald-500 text-white",
                          wrong && "border-rose-500 bg-rose-500 text-white",
                          !showState && picked && "border-blue-500 bg-blue-500 text-white",
                          !showState && !picked && "border-slate-300 bg-white text-slate-500",
                        )}
                      >
                        {right ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : wrong ? (
                          <XIcon className="h-3.5 w-3.5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered ? (
                <div
                  className={cn(
                    "rounded-xl border p-4 text-sm",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800",
                  )}
                >
                  <strong>{isCorrect ? "Correct. " : "Not quite. "}</strong>
                  {quiz.explain}
                </div>
              ) : null}

              <div className="flex justify-end pt-1">
                {!isAnswered ? (
                  <Button
                    onClick={submitAnswer}
                    disabled={selected === null}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Check answer
                  </Button>
                ) : (
                  <Button
                    onClick={next}
                    disabled={pending}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {quizIdx + 1 < totalQ ? "Next question" : pending ? "Saving…" : "Finish"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm text-center">
            <div className="p-10 space-y-5">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  You&apos;re sharper than you were 90 seconds ago.
                </h1>
                <p className="mt-3 text-slate-500 leading-relaxed">
                  You scored <strong className="text-slate-900">{score}</strong> out of {totalQ}.
                  Your risk score just improved — training completion and correct answers feed directly
                  into your personalized score.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => window.close()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Close window
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
