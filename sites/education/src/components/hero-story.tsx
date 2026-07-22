"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, ShieldCheck, UserCheck, BookOpen, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

type Stage = 0 | 1 | 2 | 3 | 4;

const STAGE_DURATIONS: Record<Stage, number> = {
    0: 4000,
    1: 4000,
    2: 4500,
    3: 3500,
    4: 4000,
};

/* ─── Year-level scenario data ─── */

type YearLevel = "kindy" | "prep" | "yr1" | "yr3" | "yr5" | "yr7" | "yr9";

interface Scenario {
    label: string;
    student: string;
    yearTag: string;
    teacher: string;
    teacherTitle: string;
    teacherInitials: string;
    parent: string;
    parentRelation: string;
    dialogue: { text: string; speaker: string; time: string }[];
    anonLine: { text: string; speaker: string; time: string };
    highlights: { before: string; word: string; after: string }[];
    code: string;
    codeDesc: string;
    frameworkLabel: string;
    observation: string;
    spark: { emoji: string; subject: string; detail: string }[];
    conversationStarter: string;
}

const SCENARIOS: Record<YearLevel, Scenario> = {
    kindy: {
        label: "Kindy",
        student: "Mia",
        yearTag: "Kindy",
        teacher: "Miss Taylor",
        teacherTitle: "Kindy Educator",
        teacherInitials: "MT",
        parent: "David K.",
        parentRelation: "Dad",
        dialogue: [
            { text: "I mixed the red and the yellow and it made orange!", speaker: "Speaker_0", time: "00:08" },
            { text: "That\u2019s wonderful! Can you tell me what other colours you could make?", speaker: "Speaker_1", time: "00:12" },
            { text: "Umm... blue and yellow makes green! I saw it!", speaker: "Speaker_0", time: "00:16" },
        ],
        anonLine: { text: "I want orange too!", speaker: "Speaker_2", time: "00:18" },
        highlights: [
            { before: "I mixed the ", word: "red", after: " and the " },
            { before: "", word: "yellow", after: " and it made " },
            { before: "", word: "orange", after: "!" },
        ],
        code: "EYLF 4.2",
        codeDesc: "Children develop a range of learning and thinking skills and processes such as problem-solving, inquiry, experimentation, hypothesising, researching and investigating",
        frameworkLabel: "EYLF v2.0",
        observation: "Mia explored colour mixing independently, predicting that red and yellow would make orange. She then recalled a previous observation about blue and yellow, showing emerging scientific reasoning.",
        spark: [
            { emoji: "\uD83C\uDFA8", subject: "Creative Arts", detail: "Mixed colours and predicted outcomes \u2014 red + yellow = orange!" },
            { emoji: "\uD83E\uDDEA", subject: "Science", detail: "Recalled that blue + yellow makes green from a previous session" },
            { emoji: "\uD83D\uDDE3\uFE0F", subject: "Language", detail: "Described her process using sequence words like \u201Cfirst\u201D and \u201Cthen\u201D" },
        ],
        conversationStarter: "Ask her what happens when you mix ALL the colours together!",
    },
    prep: {
        label: "Prep",
        student: "Liam",
        yearTag: "Prep",
        teacher: "Mrs Johnson",
        teacherTitle: "Prep Teacher",
        teacherInitials: "MJ",
        parent: "Rachel T.",
        parentRelation: "Mum",
        dialogue: [
            { text: "One, two, three... fifteen! I counted fifteen blocks!", speaker: "Speaker_0", time: "00:05" },
            { text: "Amazing counting, Liam! Can you show me what comes after fifteen?", speaker: "Speaker_1", time: "00:09" },
            { text: "Sixteen! And then seventeen, eighteen...", speaker: "Speaker_0", time: "00:13" },
        ],
        anonLine: { text: "I can count to a hundred!", speaker: "Speaker_2", time: "00:15" },
        highlights: [
            { before: "One, two, three... ", word: "fifteen", after: "! I " },
            { before: "", word: "counted", after: " fifteen blocks!" },
        ],
        code: "AC9MFN01",
        codeDesc: "Name, represent and order numbers including zero to at least 20, using physical and virtual materials and numerals",
        frameworkLabel: "ACARA v9.0",
        observation: "Liam confidently counted a collection of 15 objects with one-to-one correspondence, then continued the count sequence to 18 when prompted. Demonstrates strong number sense beyond expected range.",
        spark: [
            { emoji: "\uD83D\uDD22", subject: "Maths", detail: "Counted to 15 with perfect accuracy and kept going to 18!" },
            { emoji: "\uD83E\uDDE9", subject: "Problem Solving", detail: "Organised blocks into groups to make counting easier" },
            { emoji: "\uD83D\uDCAC", subject: "Communication", detail: "Explained his counting strategy to the class" },
        ],
        conversationStarter: "Ask him to count the steps from the car to the front door tonight!",
    },
    yr1: {
        label: "Yr 1",
        student: "Winston",
        yearTag: "Year 1",
        teacher: "Mrs Smith",
        teacherTitle: "Year 1 Teacher",
        teacherInitials: "MS",
        parent: "Sarah H.",
        parentRelation: "Mum",
        dialogue: [
            { text: "Look at my mega tall towers and a tunnel!", speaker: "Speaker_0", time: "00:12" },
            { text: "Brilliant. What shapes are those towers?", speaker: "Speaker_1", time: "00:16" },
            { text: "Cubes! And the tunnel is a cylinder!", speaker: "Speaker_0", time: "00:19" },
        ],
        anonLine: { text: "I made one too!", speaker: "Speaker_2", time: "00:22" },
        highlights: [
            { before: "Look at my mega tall ", word: "towers", after: " and a " },
            { before: "", word: "tunnel", after: "!" },
            { before: "", word: "Cubes", after: "! And the tunnel is a " },
            { before: "", word: "cylinder", after: "!" },
        ],
        code: "AC9M1SP01",
        codeDesc: "Make, compare and classify familiar shapes; recognise familiar shapes and objects in the environment",
        frameworkLabel: "ACARA v9.0",
        observation: "Winston identified and built with geometric objects (cubes/cylinders). When prompted, he correctly named the shapes and demonstrated understanding of 3D objects in a construction context.",
        spark: [
            { emoji: "\uD83D\uDD22", subject: "Maths", detail: "Built towers using cubes and correctly identified 3D shapes!" },
            { emoji: "\uD83D\uDCD6", subject: "English", detail: "Retold \u201CPossum Magic\u201D using sequence words like \u201Cfirst\u201D and \u201Cthen\u201D" },
            { emoji: "\uD83C\uDFA8", subject: "Creative Arts", detail: "Mixed blue + yellow to make green \u2014 so proud!" },
        ],
        conversationStarter: "Ask him what shapes he used for the towers!",
    },
    yr3: {
        label: "Yr 3",
        student: "Ava",
        yearTag: "Year 3",
        teacher: "Mr Chen",
        teacherTitle: "Year 3 Teacher",
        teacherInitials: "AC",
        parent: "Mark W.",
        parentRelation: "Dad",
        dialogue: [
            { text: "If I cut the pizza into four pieces and eat one, that\u2019s one quarter!", speaker: "Speaker_0", time: "00:07" },
            { text: "Great thinking, Ava. What if you ate two pieces?", speaker: "Speaker_1", time: "00:11" },
            { text: "Two quarters! That\u2019s the same as a half!", speaker: "Speaker_0", time: "00:14" },
        ],
        anonLine: { text: "I want the biggest piece!", speaker: "Speaker_2", time: "00:16" },
        highlights: [
            { before: "that\u2019s ", word: "one quarter", after: "!" },
            { before: "", word: "Two quarters", after: "! That\u2019s the same as a " },
            { before: "", word: "half", after: "!" },
        ],
        code: "AC9M3N02",
        codeDesc: "Recognise and represent unit fractions including 1/2, 1/3, 1/4, 1/5 and 1/10 and their multiples in different ways; combine fractions with the same denominator to complete the whole",
        frameworkLabel: "ACARA v9.0",
        observation: "Ava used a real-world context (pizza) to explain unit fractions. She independently identified that 2/4 is equivalent to 1/2, demonstrating early understanding of fraction equivalence.",
        spark: [
            { emoji: "\uD83D\uDD22", subject: "Maths", detail: "Explained fractions using pizza slices \u2014 figured out that 2/4 = 1/2!" },
            { emoji: "\uD83D\uDCD6", subject: "English", detail: "Used persuasive language in a debate about school uniforms" },
            { emoji: "\uD83C\uDF0F", subject: "HASS", detail: "Located Queensland on a map and described its climate" },
        ],
        conversationStarter: "Ask her to split dessert into fractions tonight \u2014 she\u2019ll love it!",
    },
    yr5: {
        label: "Yr 5",
        student: "Noah",
        yearTag: "Year 5",
        teacher: "Ms Rivera",
        teacherTitle: "Year 5 Teacher",
        teacherInitials: "SR",
        parent: "Jenny L.",
        parentRelation: "Mum",
        dialogue: [
            { text: "So if 3 out of 10 students chose soccer, that\u2019s 0.3 or 30 percent!", speaker: "Speaker_0", time: "00:10" },
            { text: "Excellent. Can you explain how you converted that?", speaker: "Speaker_1", time: "00:15" },
            { text: "I divided 3 by 10, then times by 100 for the percent.", speaker: "Speaker_0", time: "00:19" },
        ],
        anonLine: { text: "I got a different answer...", speaker: "Speaker_2", time: "00:21" },
        highlights: [
            { before: "that\u2019s ", word: "0.3", after: " or " },
            { before: "", word: "30 percent", after: "!" },
            { before: "I ", word: "divided", after: " 3 by 10, then " },
            { before: "", word: "times by 100", after: " for the percent." },
        ],
        code: "AC9M5N04",
        codeDesc: "Recognise that 100% represents the complete whole and use percentages to describe, represent and compare relative size; connect familiar percentages to their decimal and fraction equivalents",
        frameworkLabel: "ACARA v9.0",
        observation: "Noah converted a fraction (3/10) to both decimal (0.3) and percentage (30%) form, clearly articulating his method. Shows confident fluency across number representations.",
        spark: [
            { emoji: "\uD83D\uDD22", subject: "Maths", detail: "Converted fractions to decimals AND percentages \u2014 nailed the method!" },
            { emoji: "\uD83D\uDCDD", subject: "English", detail: "Wrote a compelling narrative with strong character development" },
            { emoji: "\uD83E\uDDEC", subject: "Science", detail: "Designed a fair test to compare paper plane designs" },
        ],
        conversationStarter: "Ask him what percentage of the family prefers pizza vs pasta!",
    },
    yr7: {
        label: "Yr 7",
        student: "Zoe",
        yearTag: "Year 7",
        teacher: "Dr Thompson",
        teacherTitle: "Year 7 Science",
        teacherInitials: "DT",
        parent: "Michael P.",
        parentRelation: "Dad",
        dialogue: [
            { text: "When we heated the ice, the particles started moving faster and it melted into water.", speaker: "Speaker_0", time: "00:09" },
            { text: "Excellent. So what\u2019s different about particles in a solid versus a liquid?", speaker: "Speaker_1", time: "00:14" },
            { text: "In a solid they vibrate in fixed positions, but in a liquid they slide over each other.", speaker: "Speaker_0", time: "00:19" },
        ],
        anonLine: { text: "Ours is starting to boil now!", speaker: "Speaker_2", time: "00:22" },
        highlights: [
            { before: "the ", word: "particles", after: " started moving faster" },
            { before: "it ", word: "melted", after: " into water." },
            { before: "In a ", word: "solid", after: " they vibrate in " },
            { before: "", word: "fixed positions", after: ", but in a " },
            { before: "", word: "liquid", after: " they slide over each other." },
        ],
        code: "AC9S7U05",
        codeDesc: "Use particle theory to describe the arrangement of particles in a substance, including the motion of and attraction between particles, and relate this to the properties of the substance",
        frameworkLabel: "ACARA v9.0",
        observation: "Zoe used particle theory to explain the transition from solid to liquid, correctly describing how particles in a solid vibrate in fixed positions while particles in a liquid move more freely. She linked heating to increased particle motion.",
        spark: [
            { emoji: "\uD83E\uDDEA", subject: "Science", detail: "Explained how heating changes particle motion \u2014 nailed the solid-to-liquid transition!" },
            { emoji: "\uD83D\uDCDD", subject: "English", detail: "Analysed symbolism in a short story with impressive depth" },
            { emoji: "\uD83D\uDD22", subject: "Maths", detail: "Solved algebraic equations with negative numbers confidently" },
        ],
        conversationStarter: "Ask her why ice floats in water if solids are usually denser!",
    },
    yr9: {
        label: "Yr 9",
        student: "Ethan",
        yearTag: "Year 9",
        teacher: "Mrs Patel",
        teacherTitle: "Year 9 Humanities",
        teacherInitials: "SP",
        parent: "Karen B.",
        parentRelation: "Mum",
        dialogue: [
            { text: "The source is biased because it was written by the colonial government \u2014 it only shows one perspective.", speaker: "Speaker_0", time: "00:11" },
            { text: "How could you corroborate that claim?", speaker: "Speaker_1", time: "00:16" },
            { text: "I\u2019d cross-reference it with First Nations oral histories from the same period.", speaker: "Speaker_0", time: "00:21" },
        ],
        anonLine: { text: "Wikipedia says something different though.", speaker: "Speaker_2", time: "00:24" },
        highlights: [
            { before: "The source is ", word: "biased", after: " because" },
            { before: "only shows one ", word: "perspective", after: "." },
            { before: "", word: "corroborate", after: " that claim" },
            { before: "", word: "cross-reference", after: " it with First Nations oral histories" },
        ],
        code: "AC9HH9K06",
        codeDesc: "Examine perspectives of colonisation and its effects on the lived experiences of First Nations Australians, including frontier conflicts and dispossession",
        frameworkLabel: "ACARA v9.0",
        observation: "Ethan demonstrated source analysis skills by identifying colonial bias and proposing corroboration through First Nations oral histories. Shows sophisticated historical thinking and cultural awareness.",
        spark: [
            { emoji: "\uD83C\uDF0F", subject: "Humanities", detail: "Analysed colonial bias in a primary source \u2014 and suggested cross-referencing with First Nations accounts!" },
            { emoji: "\uD83D\uDCDD", subject: "English", detail: "Constructed a nuanced argument essay with counter-claims" },
            { emoji: "\uD83E\uDDEC", subject: "Science", detail: "Explained how natural selection drives evolution with real examples" },
        ],
        conversationStarter: "Ask him whose perspective is missing from the news tonight!",
    },
};

function WaveformBars({ active }: { active: boolean }) {
    const bars = [3, 5, 2, 7, 4, 6, 3, 8, 5, 3, 6, 4, 7, 2, 5, 8, 3, 6, 4, 5, 7, 3, 6, 2];
    return (
        <div className={`flex items-center justify-center gap-[3px] h-16 transition-all duration-700 ${active ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
            {bars.map((h, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full bg-gradient-to-t from-spark-600 to-spark-500"
                    style={{
                        height: `${h * 6}px`,
                        animation: active ? `waveform-bar ${0.6 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite` : "none",
                    }}
                />
            ))}
        </div>
    );
}

function TranscriptLine({
    speaker,
    resolvedName,
    text,
    isAnonymised,
    show,
    delay,
}: {
    speaker: string;
    resolvedName: string;
    text: string;
    isAnonymised: boolean;
    show: boolean;
    delay: number;
}) {
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        if (!show) { setShowResolved(false); return; }
        const t = setTimeout(() => setShowResolved(true), delay);
        return () => clearTimeout(t);
    }, [show, delay]);

    return (
        <div className={`stage-fade ${show ? "stage-visible" : ""}`}>
            <div className="flex items-start gap-2">
                <div className={`shrink-0 mt-0.5 transition-all duration-500 ${showResolved ? (isAnonymised ? "text-stone-400" : "text-amber-600") : "text-stone-400"}`}>
                    {showResolved ? (
                        isAnonymised ? <MicOff className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                        <Mic className="w-3.5 h-3.5" />
                    )}
                </div>
                <div className="min-w-0">
                    <span className={`text-[11px] font-bold transition-all duration-500 inline-flex items-center gap-1.5 ${showResolved ? (isAnonymised ? "text-stone-400" : "text-amber-600") : "text-stone-400"}`}>
                        <span className={`transition-all duration-500 ${showResolved ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>{speaker}</span>
                        <span className={`transition-all duration-500 ${showResolved ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>{resolvedName}</span>
                        {showResolved && !isAnonymised && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 consent-pulse" />
                        )}
                        {showResolved && isAnonymised && (
                            <span className="text-[9px] font-normal text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">scrubbed</span>
                        )}
                    </span>
                    <p className={`text-[12px] leading-relaxed transition-colors duration-500 ${isAnonymised && showResolved ? "text-stone-400 line-through decoration-stone-300" : "text-stone-700"}`}>
                        {isAnonymised && showResolved ? "[Voice data scrubbed]" : `"${text}"`}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AcaraCard({ show, scenario }: { show: boolean; scenario: Scenario }) {
    return (
        <div className={`stage-fade ${show ? "stage-visible" : ""}`}>
            <div className="bg-amber-50/50 rounded-xl border border-amber-200/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                        {scenario.code.startsWith("EYLF") ? "EYLF" : "ACARA"} Mapping
                    </span>
                </div>

                <p className="text-[12px] text-stone-700 leading-relaxed">
                    {scenario.highlights.map((h, i) => (
                        <span key={i}>
                            {h.before}<span className="text-spark-600 font-bold acara-highlight">{h.word}</span>{h.after}{" "}
                        </span>
                    ))}
                </p>

                <div className="connector-draw">
                    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                </div>

                <div className="bg-white rounded-lg p-3 border border-amber-200/40">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[13px] font-extrabold text-amber-600 font-mono">{scenario.code}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed italic">
                        &ldquo;{scenario.codeDesc}&rdquo;
                    </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-stone-200">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">AI Draft Observation</p>
                    <p className="text-[12px] text-stone-600 leading-relaxed">{scenario.observation}</p>
                </div>
            </div>
        </div>
    );
}

function TeacherReview({ show, scenario }: { show: boolean; scenario: Scenario }) {
    const [approved, setApproved] = useState(false);

    useEffect(() => {
        if (!show) { setApproved(false); return; }
        const t = setTimeout(() => setApproved(true), 1800);
        return () => clearTimeout(t);
    }, [show]);

    return (
        <div className={`stage-fade ${show ? "stage-visible" : ""}`}>
            <div className="bg-amber-50/50 rounded-xl border border-amber-200/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Teacher Review</span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-400 to-stone-300 flex items-center justify-center text-[13px] font-bold text-white">
                        {scenario.teacherInitials}
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-stone-800">{scenario.teacher}</p>
                        <p className="text-[10px] text-stone-400">{scenario.teacherTitle}</p>
                    </div>
                </div>

                <div className={`bg-white rounded-lg p-3 border transition-all duration-500 ${approved ? "border-amber-300" : "border-stone-200"}`}>
                    <p className="text-[12px] text-stone-600 leading-relaxed">{scenario.observation}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[11px] font-mono text-amber-500/70">{scenario.code}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    {approved ? (
                        <div className="flex items-center gap-2 checkmark-stamp">
                            <CheckCircle2 className="w-5 h-5 text-amber-600" />
                            <span className="text-[13px] font-bold text-amber-600">Approved</span>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="px-4 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 text-[11px] font-bold approve-btn-pulse">
                                Approve
                            </div>
                            <div className="px-4 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-400 text-[11px] font-bold">
                                Edit
                            </div>
                            <div className="px-4 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-400 text-[11px] font-bold">
                                Reject
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ParentSpark({ show, scenario }: { show: boolean; scenario: Scenario }) {
    return (
        <div className={`stage-fade ${show ? "stage-visible" : ""}`}>
            <div className="bg-spark-50/50 rounded-xl border border-spark-200/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-spark-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Daily Spark</span>
                    <span className="ml-auto text-[10px] text-stone-400">3:15 PM</span>
                </div>

                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 space-y-2 border border-stone-200">
                    <p className="text-[12px] text-stone-700 leading-relaxed">
                        Hey! Here are 3 amazing things <strong className="text-stone-900">{scenario.student}</strong> learned today:
                    </p>
                    {scenario.spark.map((item, i) => (
                        <p key={i} className="text-[12px] text-stone-600 leading-relaxed">
                            <span className="text-base mr-1">{item.emoji}</span>{" "}
                            <strong className="text-stone-700">{item.subject}:</strong> {item.detail}
                        </p>
                    ))}
                </div>

                <div className="flex items-start gap-2 pt-1">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-700/80 italic leading-relaxed">
                        &ldquo;{scenario.conversationStarter}&rdquo;
                    </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                    <span className="text-[10px] text-stone-400">Sent to {scenario.parent} ({scenario.parentRelation})</span>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                </div>
            </div>
        </div>
    );
}

function StageIndicator({ current, total }: { current: number; total: number }) {
    const labels = ["Capture", "Identify", "Map", "Review", "Daily Spark"];
    return (
        <div className="flex items-center justify-center gap-1 pt-3">
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    className={`transition-all duration-300 rounded-full ${
                        i === current
                            ? "w-8 h-2 bg-spark-500"
                            : "w-2 h-2 bg-stone-300 hover:bg-stone-400"
                    }`}
                    aria-label={labels[i]}
                />
            ))}
        </div>
    );
}

const YEAR_LEVELS: YearLevel[] = ["kindy", "prep", "yr1", "yr3", "yr5", "yr7", "yr9"];

export default function HeroStoryAnimation() {
    const [stage, setStage] = useState<Stage>(0);
    const [yearLevel, setYearLevel] = useState<YearLevel>("yr1");
    const scenario = SCENARIOS[yearLevel];

    useEffect(() => {
        const timeout = setTimeout(() => {
            setStage((s) => ((s + 1) % 5) as Stage);
        }, STAGE_DURATIONS[stage]);
        return () => clearTimeout(timeout);
    }, [stage]);

    const handleYearChange = useCallback((yl: YearLevel) => {
        setYearLevel(yl);
        setStage(0);
    }, []);

    return (
        <div className="w-full max-w-[380px] sm:max-w-[420px] mx-auto">
            {/* Year-level picker */}
            <div className="flex items-center justify-center gap-1 mb-3">
                {YEAR_LEVELS.map((yl) => (
                    <button
                        key={yl}
                        onClick={() => handleYearChange(yl)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-300 whitespace-nowrap ${
                            yl === yearLevel
                                ? "bg-spark-600 text-white shadow-lg shadow-spark-600/25"
                                : "bg-white border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300"
                        }`}
                    >
                        {SCENARIOS[yl].label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xl shadow-stone-200/60">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-200">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${stage === 0 ? "bg-red-400 animate-pulse" : "bg-stone-300"}`} />
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
                        {stage === 0 && "Listening..."}
                        {stage === 1 && "Identifying speakers"}
                        {stage === 2 && `Mapping to ${scenario.frameworkLabel}`}
                        {stage === 3 && "Teacher review"}
                        {stage === 4 && "Sending Daily Spark"}
                    </span>
                    <span className="ml-auto text-[10px] text-stone-400 font-mono">
                        {stage === 0 && "audio only \u2014 no cameras"}
                        {stage === 1 && "consent-first"}
                        {stage === 2 && scenario.frameworkLabel}
                        {stage === 3 && "human-in-the-loop"}
                        {stage === 4 && "3:15 PM pickup time"}
                    </span>
                </div>

                {/* Stage content */}
                <div className="relative min-h-[380px] sm:min-h-[420px] p-4 overflow-hidden">
                    {/* Stage 0: Audio capture */}
                    <div className={`absolute inset-4 flex flex-col justify-center gap-4 stage-fade ${stage === 0 ? "stage-visible" : ""}`}>
                        <div className="flex items-center gap-2 text-spark-600 mb-2">
                            <Mic className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Classroom Audio</span>
                        </div>
                        <WaveformBars active={stage === 0} />
                        <div className="space-y-2 pt-2">
                            {scenario.dialogue.map((line, i) => (
                                <div key={i} className="speech-float" style={{ animationDelay: `${i * 0.6}s` }}>
                                    <p className="text-[13px] text-stone-700 italic">&ldquo;{line.text}&rdquo;</p>
                                    <span className="text-[10px] text-stone-400 font-mono">{line.speaker} &middot; {line.time}</span>
                                </div>
                            ))}
                            <div className="speech-float" style={{ animationDelay: `${scenario.dialogue.length * 0.6}s` }}>
                                <p className="text-[13px] text-stone-500 italic">&ldquo;{scenario.anonLine.text}&rdquo;</p>
                                <span className="text-[10px] text-stone-400 font-mono">{scenario.anonLine.speaker} &middot; {scenario.anonLine.time}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stage 1: Speaker identification */}
                    <div className={`absolute inset-4 flex flex-col justify-center gap-3 stage-fade ${stage === 1 ? "stage-visible" : ""}`}>
                        <div className="flex items-center gap-2 text-spark-600 mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Speaker Identification</span>
                        </div>
                        {scenario.dialogue.map((line, i) => (
                            <TranscriptLine
                                key={i}
                                speaker={line.speaker}
                                resolvedName={i % 2 === 0 ? `${scenario.student} (${scenario.yearTag})` : `${scenario.teacher} (Teacher)`}
                                text={line.text}
                                isAnonymised={false}
                                show={stage === 1}
                                delay={400 + i * 400}
                            />
                        ))}
                        <TranscriptLine
                            speaker={scenario.anonLine.speaker}
                            resolvedName="[Scrubbed]"
                            text={scenario.anonLine.text}
                            isAnonymised={true}
                            show={stage === 1}
                            delay={400 + scenario.dialogue.length * 400}
                        />
                    </div>

                    {/* Stage 2: ACARA mapping */}
                    <div className={`absolute inset-4 flex flex-col justify-center stage-fade ${stage === 2 ? "stage-visible" : ""}`}>
                        <AcaraCard show={stage === 2} scenario={scenario} />
                    </div>

                    {/* Stage 3: Teacher review */}
                    <div className={`absolute inset-4 flex flex-col justify-center stage-fade ${stage === 3 ? "stage-visible" : ""}`}>
                        <TeacherReview show={stage === 3} scenario={scenario} />
                    </div>

                    {/* Stage 4: Parent spark */}
                    <div className={`absolute inset-4 flex flex-col justify-center stage-fade ${stage === 4 ? "stage-visible" : ""}`}>
                        <ParentSpark show={stage === 4} scenario={scenario} />
                    </div>
                </div>

                {/* Stage indicator dots */}
                <div className="px-4 pb-3">
                    <StageIndicator current={stage} total={5} />
                </div>
            </div>

            {/* Glow behind component */}
            <div className="absolute -inset-8 -z-10 bg-spark-200/40 rounded-full blur-[80px]" />
        </div>
    );
}
