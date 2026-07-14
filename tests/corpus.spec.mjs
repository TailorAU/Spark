/*
 * Learning corpus integrity (app/content.json). Pure file checks - no browser,
 * no password. The corpus is keyed by stage ids only and must stay PII-free,
 * curriculum-coded, and playable (every question winnable by the player).
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const corpus = JSON.parse(
  readFileSync(fileURLToPath(new URL("../app/content.json", import.meta.url)), "utf8")
);

const KINDS = new Set(["choice", "tapall", "build", "sort"]);
const CODE = /^(AC9|QKLG|EYLF)/i;

test("corpus is keyed by stage ids only", () => {
  expect(Object.keys(corpus.children).sort()).toEqual(["eldest", "middle", "youngest"]);
});

test("every skill is complete: lesson, curriculum code, questions", () => {
  const problems = [];
  const seenSkillIds = new Set();
  for (const [childId, block] of Object.entries(corpus.children)) {
    for (const area of block.areas) {
      if (!area.areaId || !area.areaLabel) problems.push(`${childId}: area missing id/label`);
      for (const s of area.skills || []) {
        const at = `${childId}/${area.areaId}/${s.skillId}`;
        if (seenSkillIds.has(s.skillId)) problems.push(`${at}: duplicate skillId`);
        seenSkillIds.add(s.skillId);
        for (const field of ["skillId", "title", "curriculumCode", "milestone", "lessonIntro", "workedExample", "parentNote"]) {
          if (!s[field]) problems.push(`${at}: missing ${field}`);
        }
        if (s.curriculumCode && !CODE.test(s.curriculumCode))
          problems.push(`${at}: curriculumCode '${s.curriculumCode}' not AC9/QKLG/EYLF`);
        if (!Array.isArray(s.questions) || s.questions.length < 2)
          problems.push(`${at}: needs at least 2 questions`);
      }
    }
  }
  expect(problems).toEqual([]);
});

test("every question is well-formed, hinted, explained, and winnable", () => {
  const problems = [];
  let total = 0;
  for (const [childId, block] of Object.entries(corpus.children)) {
    for (const area of block.areas) {
      for (const s of area.skills || []) {
        for (const q of s.questions || []) {
          total++;
          const at = `${childId}/${s.skillId}/${q.id || "?"}`;
          if (!KINDS.has(q.kind)) problems.push(`${at}: unknown kind ${q.kind}`);
          if (!q.prompt) problems.push(`${at}: missing prompt`);
          if (!q.hint) problems.push(`${at}: missing hint`);
          if (!q.explanation) problems.push(`${at}: missing explanation`);
          if (!(q.difficulty >= 1 && q.difficulty <= 3)) problems.push(`${at}: difficulty out of range`);
          if (q.kind === "choice") {
            const right = (q.options || []).filter((o) => o.correct).length;
            if (right !== 1) problems.push(`${at}: choice has ${right} correct options`);
            if ((q.options || []).length < 2) problems.push(`${at}: choice needs 2+ options`);
          }
          if (q.kind === "tapall" && !(q.items || []).some((i) => i.match))
            problems.push(`${at}: tapall has no matching items`);
          if (q.kind === "build" && !/^[A-Z]{2,}$/.test(q.word || ""))
            problems.push(`${at}: build word must be 2+ uppercase letters`);
          if (q.kind === "sort") {
            if ((q.buckets || []).length < 2) problems.push(`${at}: sort needs 2 buckets`);
            for (const it of q.sortItems || []) {
              if (!(it.bucket >= 0 && it.bucket < q.buckets.length))
                problems.push(`${at}: sort item bucket out of range`);
            }
            if (!(q.sortItems || []).length) problems.push(`${at}: sort has no items`);
          }
        }
      }
    }
  }
  expect(problems).toEqual([]);
  expect(total).toBeGreaterThanOrEqual(100);
});
