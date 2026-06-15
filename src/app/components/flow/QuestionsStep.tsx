import { motion } from "motion/react";
import { useStore } from "../../lib/store";
import { C, MONO, TXT, hair, stroke } from "../../lib/tokens";
import { StageHeader } from "./FlowShell";
import { ThinkingPanel } from "./ThinkingPanel";

export function QuestionsStep() {
  const { state, answerQuestion, finishQuestions } = useStore();
  const { project, stage } = state;
  const allAnswered = project.questions.every((q) => (q.answer ?? "").trim().length > 0);
  const planning = stage === "planning";

  return (
    <div>
      <StageHeader
        num="02"
        kicker="CLARIFICATION"
        title="a few questions before we plan the deck."
        body="mun shot only asks where the brief is missing pieces that would change the story."
      />

      {project.analysis && (
        <div
          className="mb-10 p-5 grid md:grid-cols-4 gap-4"
          style={{ background: C.cream, border: stroke, borderRadius: 14 }}
        >
          {[
            ["GOAL", project.analysis.goal],
            ["AUDIENCE", project.analysis.audience],
            ["TYPE", project.analysis.presentationType],
            ["TONE", project.analysis.tone],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ ...MONO, color: C.clay }}>{k}</div>
              <div className="mt-2" style={{ ...TXT, fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {project.questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="p-5"
            style={{ background: C.paper, border: stroke, borderRadius: 14 }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: C.ink, color: C.cream, ...MONO, fontSize: 11 }}
              >
                Q{i + 1}
              </div>
              <div className="flex-1">
                <div style={{ ...TXT, fontSize: 18 }}>{q.question}</div>
                <div className="mt-1" style={{ ...MONO, color: C.clay }}>
                  WHY · {q.reason.toUpperCase()}
                </div>
                <textarea
                  value={q.answer ?? ""}
                  onChange={(e) => answerQuestion(q.id, e.target.value)}
                  placeholder="answer in one or two sentences…"
                  rows={2}
                  className="w-full mt-4 p-3 outline-none resize-none"
                  style={{ background: C.bg, border: hair, borderRadius: 8, ...TXT, fontSize: 15 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {planning && (
        <div className="mt-8">
          <ThinkingPanel phases={["plan"]} active />
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <span style={{ ...MONO, color: C.clay }}>
          {project.questions.filter((q) => (q.answer ?? "").trim()).length} / {project.questions.length} ANSWERED
        </span>
        <motion.button
          whileHover={{ scale: allAnswered && !planning ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          disabled={!allAnswered || planning}
          onClick={finishQuestions}
          className="px-6 py-3"
          style={{
            background: allAnswered && !planning ? C.ink : C.border,
            color: C.cream,
            ...MONO,
            borderRadius: 999,
            cursor: allAnswered && !planning ? "pointer" : "not-allowed",
          }}
        >
          {planning ? "PLANNING DECK…" : "PLAN SLIDE LOGIC →"}
        </motion.button>
      </div>
    </div>
  );
}
