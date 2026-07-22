"use client";

import React, { useState, useEffect } from "react";
import PoweredByTailor from "@/components/powered-by-tailor";
import {
    ArrowRight,
    Shield,
    CheckCircle,
    Menu,
    X,
    Mic,
    FileCheck,
    MessageCircle,
    MicOff,
    Clock,
    ShieldCheck,
    UserCheck,
    Trash2,
    MapPin,
    ClipboardList,
    Ban,
    BookOpen,
    GraduationCap,
    BarChart3,
    Users,
    BrainCircuit,
    TrendingUp,
    Heart,
    AlertTriangle,
    Lightbulb,
    CalendarClock,
    Quote,
    Smartphone,
    LayoutDashboard,
    ExternalLink,
    Building2,
    User,
    Baby,
    Sun,
} from "lucide-react";

function SparkIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 27C8.5 27 10 20 14 15.5C18 11 23 9.5 23 9.5C23 9.5 17 9 13 6C9 3 8 0.5 8 0.5C8 0.5 7.5 5 5 9C2.5 13 0.5 14.5 0.5 14.5C0.5 14.5 4.5 14 7 17C9.5 20 8.5 27 8.5 27Z" fill="currentColor" />
            <path d="M11 24C11 24 11.5 20 14 17C16.5 14 19.5 13 19.5 13C19.5 13 16.5 12.5 14.5 10.5C12.5 8.5 12 6 12 6C12 6 11 9 9 11.5C7 14 5 15 5 15C5 15 7.5 15.5 9 17.5C10.5 19.5 11 24 11 24Z" fill="currentColor" opacity="0.5" />
        </svg>
    );
}

const PRIMARY_CTA = "Book a 15-min walkthrough";
const CONTACT_EMAIL = "spark@tailor.au";
const CONTACT_SUBJECT = "Tailor Education — centre walkthrough request";
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`;

function ScrollLink({
    to,
    children,
    className = "",
    onClick,
}: {
    to: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    return (
        <a
            href={to}
            className={`cursor-pointer hover:text-spark-600 transition-colors duration-300 font-medium ${className}`}
            onClick={(e) => {
                e.preventDefault();
                document.querySelector(to)?.scrollIntoView({ behavior: "smooth" });
                onClick?.();
            }}
        >
            {children}
        </a>
    );
}

export default function SparkLanding() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        );
        document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative z-10 min-h-screen text-stone-900 selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden bg-ivory">
            {/* ─── Nav ─── */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${
                    isScrolled
                        ? "glass-strong py-3 border-b border-stone-200"
                        : "bg-transparent py-5"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <a href="/" className="flex items-center gap-2 text-stone-900">
                            <SparkIcon className="w-6 h-7 text-spark-500" />
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-extrabold text-xl tracking-tight">Tailor Education</span>
                                <PoweredByTailor variant="light" size="compact" className="mt-0.5" />
                            </div>
                        </a>
                    </div>

                    <div className="hidden md:flex gap-8 text-sm text-stone-500">
                        <ScrollLink to="#for-educators">Schools &amp; Centres</ScrollLink>
                        <ScrollLink to="#for-leaders">For Leaders</ScrollLink>
                        <ScrollLink to="#how-it-works">How it Works</ScrollLink>
                        <ScrollLink to="#privacy">Trust &amp; Privacy</ScrollLink>
                        <a href="/families/" className="font-bold text-spark-600 hover:text-spark-500 transition-colors">
                            Families
                        </a>
                    </div>

                    <div className="hidden md:block">
                        <a
                            href={CONTACT_HREF}
                            className="inline-block bg-spark-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-spark-500 transition-all duration-300 shadow-lg shadow-spark-600/25"
                        >
                            {PRIMARY_CTA}
                        </a>
                    </div>

                    <button className="md:hidden text-stone-700" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full glass-strong border-b border-stone-200 p-6 flex flex-col gap-4">
                        <ScrollLink to="#for-educators" onClick={() => setIsMenuOpen(false)}>Schools &amp; Centres</ScrollLink>
                        <ScrollLink to="#for-leaders" onClick={() => setIsMenuOpen(false)}>For Leaders</ScrollLink>
                        <ScrollLink to="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</ScrollLink>
                        <ScrollLink to="#privacy" onClick={() => setIsMenuOpen(false)}>Trust &amp; Privacy</ScrollLink>
                        <a href="/families/" className="font-bold text-spark-600" onClick={() => setIsMenuOpen(false)}>
                            Families
                        </a>
                        <a href={CONTACT_HREF} className="bg-spark-600 text-white text-center w-full py-3 rounded-lg font-bold mt-2">
                            {PRIMARY_CTA}
                        </a>
                    </div>
                )}
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative pt-28 pb-12 md:pt-44 md:pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-bold text-stone-500 mb-8 uppercase tracking-wider shadow-sm">
                        <Baby className="w-3.5 h-3.5 text-spark-600" />
                        For Families, Schools &amp; Centres
                    </div>

                    <h1 className="reveal font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.08]">
                        Education shaped around{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-spark-600 to-amber-500">
                            the individual.
                        </span>
                    </h1>

                    <p className="reveal text-lg md:text-xl text-stone-500 mb-8 max-w-xl mx-auto leading-relaxed">
                        Tailor Education brings classroom insight and family learning
                        together, while keeping each learner&apos;s context at the centre.
                    </p>

                    <div className="reveal flex flex-col sm:flex-row gap-4 justify-center mb-10">
                        <a
                            href={CONTACT_HREF}
                            className="px-8 py-4 bg-spark-600 hover:bg-spark-500 text-white rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-xl shadow-spark-600/20 hover:-translate-y-0.5 justify-center"
                        >
                            {PRIMARY_CTA} <ArrowRight className="w-5 h-5" />
                        </a>
                        <a
                            href="/families/"
                            className="px-8 py-4 bg-white border border-stone-200 text-stone-600 rounded-xl font-semibold transition-all flex items-center gap-2 hover:border-stone-300 shadow-sm justify-center"
                        >
                            <Users className="w-5 h-5 text-spark-600" />
                            Explore family learning
                        </a>
                    </div>

                    <p className="reveal text-sm text-stone-400">
                        15-minute video call. No sales deck. Just the product.
                    </p>
                </div>
            </section>

            {/* ─── Social Proof ─── */}
            <section className="pb-16 px-6">
                <div className="reveal max-w-3xl mx-auto">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-stone-600 text-[15px] leading-relaxed italic mb-3">
                                    &ldquo;I spend more time writing about what children did than
                                    actually being with them. The documentation is endless — and
                                    it&apos;s the reason good educators leave.&rdquo;
                                </p>
                                <p className="text-sm font-bold text-stone-900">Early Childhood Educator, Brisbane</p>
                                <p className="text-xs text-stone-400">8 years experience, Long Day Care &amp; Kindy</p>
                            </div>
                            <div className="shrink-0 w-px h-16 bg-stone-200 hidden md:block" />
                            <div className="shrink-0 text-center">
                                <p className="font-display text-4xl font-extrabold text-spark-600 mb-1">6</p>
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Centres on the<br />founding waitlist</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── The Old Model vs Tailor Education ─── */}
            <section id="the-shift" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="reveal text-center mb-16">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            The Shift
                        </p>
                        <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                            Same room. Same children. Different century.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Old Model */}
                        <div className="reveal bg-stone-50 border border-stone-200 rounded-2xl p-8 md:p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-200/50 rounded-full blur-[40px]" />
                            <div className="relative">
                                <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mb-4">The old model</p>
                                <h3 className="font-display text-2xl font-extrabold text-stone-900 mb-6">
                                    Educator as admin worker
                                </h3>
                                <div className="space-y-4 text-[15px] text-stone-600 leading-relaxed">
                                    <p>
                                        Play-based learning is happening. Children are building, exploring,
                                        talking. The educator is on the floor with them — but half their
                                        mind is on the learning stories they still need to write after close.
                                    </p>
                                    <p>
                                        6pm. Children gone. Open the laptop. Try to remember what
                                        Mia said during block play. Write it up. Link it to EYLF outcomes.
                                        Add a photo. Repeat for 15 children. Upload to Storypark.
                                    </p>
                                    <p>
                                        22% of children start school developmentally vulnerable.
                                        Not because educators don&apos;t see it — but because the system
                                        that&apos;s supposed to catch it is buried under admin.
                                    </p>
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <OldModelStat icon={<Clock className="w-4 h-4" />} label="12+ hrs/week" detail="on documentation" />
                                    <OldModelStat icon={<AlertTriangle className="w-4 h-4" />} label="After hours" detail="unpaid writing" />
                                    <OldModelStat icon={<MessageCircle className="w-4 h-4" />} label="Generic" detail="learning stories" />
                                    <OldModelStat icon={<CalendarClock className="w-4 h-4" />} label="Weeks late" detail="for compliance" />
                                </div>
                            </div>
                        </div>

                        {/* Tailor Education Model */}
                        <div className="reveal bg-white border border-spark-200 rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-lg shadow-spark-100/50">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-spark-200/40 rounded-full blur-[50px]" />
                            <div className="relative">
                                <p className="text-spark-600 font-bold text-xs uppercase tracking-widest mb-4">The Tailor Education model</p>
                                <h3 className="font-display text-2xl font-extrabold text-stone-900 mb-6">
                                    Educator as educator again
                                </h3>
                                <div className="space-y-4 text-[15px] text-stone-600 leading-relaxed">
                                    <p>
                                        Play-based learning is happening. The educator is fully present.
                                        Kneeling beside Mia as she describes her tower. Listening to
                                        Noah sound out a word. Talking, reading, playing, singing —
                                        the interactions that shape brain development for life.
                                    </p>
                                    <p>
                                        Tailor Education is listening. After the session: learning stories auto-drafted
                                        from real moments. EYLF outcomes mapped automatically. The educator
                                        reviews and approves from their phone in 30 seconds.
                                    </p>
                                    <p>
                                        AI spots developmental patterns across weeks —{" "}
                                        <em>&ldquo;Mia&apos;s social language during group play
                                        has increased significantly over 4 weeks.&rdquo;</em>{" "}
                                        The children who would have started school vulnerable get
                                        flagged at 3, not at 6.
                                    </p>
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <SparkModelStat icon={<Clock className="w-4 h-4" />} label="10 hrs back" detail="per week" />
                                    <SparkModelStat icon={<TrendingUp className="w-4 h-4" />} label="Real-time" detail="developmental alerts" />
                                    <SparkModelStat icon={<FileCheck className="w-4 h-4" />} label="Auto-mapped" detail="EYLF outcomes" />
                                    <SparkModelStat icon={<BarChart3 className="w-4 h-4" />} label="Live data" detail="for directors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Punchline */}
                    <div className="reveal mt-12 text-center">
                        <div className="inline-block bg-white border border-stone-200 rounded-2xl px-8 py-6 shadow-sm max-w-2xl">
                            <p className="text-lg md:text-xl text-stone-700 leading-relaxed font-medium">
                                Educators don&apos;t leave because of the children. They leave because of
                                the 12 hours a week that keeps them from the children.
                                And the children who needed to be caught early get missed.{" "}
                                <span className="text-spark-600 font-bold">Tailor Education gives the educator back to the room — and catches the children who&apos;d otherwise fall through.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── For Educators ─── */}
            <section id="for-educators" className="py-24 bg-cream">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="reveal text-center mb-14">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            For Educators
                        </p>
                        <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                            Be present. That&apos;s it. We handle the rest.
                        </h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                            You didn&apos;t get into early childhood to spend your evenings
                            writing learning stories from memory. Here&apos;s what changes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
                        <TeacherCard
                            icon={<Mic className="w-5 h-5" />}
                            title="Auto-drafted learning stories"
                            description="AI turns real moments into rich, narrative learning stories. You review and approve — 30 seconds, not 30 minutes per child."
                        />
                        <TeacherCard
                            icon={<BookOpen className="w-5 h-5" />}
                            title="EYLF & MTOP auto-mapping"
                            description="Every observation is automatically linked to EYLF v2.0 outcomes or My Time, Our Place. No more flipping through frameworks at 6pm."
                        />
                        <TeacherCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Developmental patterns"
                            description={`"Mia's social language in group play has increased 40% since the room change." Insights you'd notice intuitively but never have time to document.`}
                        />
                        <TeacherCard
                            icon={<Clock className="w-5 h-5" />}
                            title="10 hours back"
                            description="Per week. That's your evenings. Your weekends. Your energy to actually be present with children during the day."
                        />
                    </div>

                    {/* Product mockup: Educator phone */}
                    <div className="reveal mt-14">
                        <div className="max-w-md mx-auto">
                            <PhoneMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── For Leaders ─── */}
            <section id="for-leaders" className="py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="reveal text-center mb-6">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            For Centre Directors &amp; Coordinators
                        </p>
                        <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                            You see compliance data weeks late.<br className="hidden sm:block" />
                            <span className="text-spark-600">Tailor Education makes it continuous.</span>
                        </h2>
                    </div>

                    {/* Dashboard mockup */}
                    <div className="reveal mb-14">
                        <DashboardMockup />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                        <CompactLeaderItem
                            icon={<Users className="w-5 h-5" />}
                            pain="Educator retention"
                            solution="10 hours of documentation returned per week. That's the difference between staying and leaving the sector."
                        />
                        <CompactLeaderItem
                            icon={<ClipboardList className="w-5 h-5" />}
                            pain="NQF compliance"
                            solution="Continuous evidence generation against EYLF v2.0 and My Time, Our Place. Always assessment-ready."
                        />
                        <CompactLeaderItem
                            icon={<MessageCircle className="w-5 h-5" />}
                            pain="Family engagement"
                            solution="Families stay connected to their child's learning without extra work from educators."
                        />
                        <CompactLeaderItem
                            icon={<AlertTriangle className="w-5 h-5" />}
                            pain="Early intervention"
                            solution="22% of children start school developmentally vulnerable. Tailor Education flags patterns weeks earlier — at 3, not 6."
                        />
                        <CompactLeaderItem
                            icon={<Lightbulb className="w-5 h-5" />}
                            pain="Programming cycle"
                            solution="Observation data feeds directly into your planning cycle. Reflect, plan, implement — with real evidence."
                        />
                        <CompactLeaderItem
                            icon={<BarChart3 className="w-5 h-5" />}
                            pain="A&R reporting"
                            solution="Assessment & Rating evidence generated continuously from real interactions. Not scrambled together the week before."
                        />
                    </div>
                </div>
            </section>

            {/* ─── Free Pilot ─── */}
            <section className="py-16 bg-cream">
                <div className="reveal max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-spark-50 border border-spark-200 text-xs font-bold text-spark-600 mb-5 uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Free for founding centres
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
                        Free pilot. No contracts. We handle everything.
                    </h2>
                    <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed mb-8">
                        We&apos;re partnering with a small number of early learning centres
                        in South-East Queensland to prove this works. No setup fees, no IT overhead.
                    </p>
                    <a
                        href={CONTACT_HREF}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-spark-600 hover:bg-spark-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-spark-600/20 hover:-translate-y-0.5"
                    >
                        {PRIMARY_CTA} <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </section>

            {/* ─── How it works ─── */}
            <section id="how-it-works" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="reveal text-center mb-14">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            How it Works
                        </p>
                        <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                            The room doesn&apos;t change. Everything else does.
                        </h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                            No screens in front of children. No apps for kids. No change to routines.
                            The educator just educates. Everything else happens after.
                        </p>
                    </div>

                    <div className="space-y-6 stagger">
                        <FlowStep
                            number="01"
                            icon={<Mic className="w-6 h-6" />}
                            title="Educator is present. Tailor Education listens."
                            description="Ambient audio captures natural interactions during play, group time, and transitions. No cameras, no video — just voices. Nothing changes about how the educator works."
                            detail="Speaker identification recognises consented children by voice. Non-consented children are automatically anonymised. Audio is processed and deleted — never stored."
                            accent="amber"
                        />
                        <FlowStep
                            number="02"
                            icon={<BrainCircuit className="w-6 h-6" />}
                            title="AI drafts learning stories. Maps outcomes."
                            description={`After the session, AI turns real moments into narrative learning stories: "During block play, Mia described her tower as 'taller than two blocks and wider than my hand' — demonstrating emerging spatial language and measurement concepts (EYLF Outcome 4)."`}
                            detail={`Across weeks, Tailor Education detects developmental patterns: "Noah's verbal participation in group activities has increased significantly since the room transition. Consider extending group-time activities to build on this momentum."`}
                            accent="orange"
                        />
                        <FlowStep
                            number="03"
                            icon={<FileCheck className="w-6 h-6" />}
                            title="Educator reviews. 30 seconds."
                            description="Every learning story goes through the educator before anything happens. Approve, edit, or reject from their phone. They're always in control."
                            detail="The story is already outcome-mapped, evidence-linked, and formatted for your documentation platform. The educator's job is professional judgement, not data entry."
                            accent="gold"
                        />
                        <FlowStep
                            number="04"
                            icon={<BarChart3 className="w-6 h-6" />}
                            title="Directors see everything. In real time."
                            description="EYLF outcome coverage by room. Observation frequency by educator. Developmental alerts by child. Programming cycle evidence. No waiting for end-of-term catch-ups."
                            detail="Data that used to take weeks to compile is now continuously generated from real interactions. Assessment & Rating evidence builds itself."
                            accent="amber"
                        />
                    </div>
                </div>
            </section>

            {/* ─── Integrations ─── */}
            <section className="py-20 bg-cream">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="reveal text-center mb-12">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            Fits Your Stack
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
                            Works with what you already use.
                        </h2>
                        <p className="text-stone-500 text-lg max-w-xl mx-auto">
                            Tailor Education doesn&apos;t replace your documentation platform — it feeds it.
                            Learning stories flow into the tools your centre already runs.
                        </p>
                    </div>

                    <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
                        <IntegrationCard name="Storypark" detail="Learning story sync" status="Building" />
                        <IntegrationCard name="Xplor" detail="Observation & attendance" status="Planned" />
                        <IntegrationCard name="OWNA" detail="Documentation feed" status="Planned" />
                        <IntegrationCard name="Kindyhub" detail="Learning story export" status="Planned" />
                    </div>

                    <div className="reveal mt-8 text-center">
                        <p className="text-sm text-stone-500">
                            Learning stories export as structured data (PDF, CSV, API). Compatible with
                            any documentation platform. We map to EYLF v2.0, My Time Our Place, and ACARA v9.0 natively.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── The Bigger Picture ─── */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="reveal text-center mb-8">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            The Bigger Picture
                        </p>
                        <h2 className="font-display text-2xl md:text-4xl font-extrabold">
                            Early learning is not child-minding. It&apos;s education.
                        </h2>
                    </div>
                    <div className="reveal max-w-3xl mx-auto text-center">
                        <Quote className="w-10 h-10 text-spark-300 mx-auto mb-6" />
                        <p className="font-display text-xl md:text-2xl font-extrabold leading-snug mb-6 text-stone-900">
                            90% of a child&apos;s brain develops before age five. The talking,
                            reading, playing and singing that happens in early learning centres
                            shapes thinking and emotional patterns for life. Yet we treat the
                            professionals who deliver it as admin workers — and wonder why
                            22% of children start school developmentally vulnerable.
                        </p>
                        <p className="text-lg text-stone-500 leading-relaxed mb-8">
                            The system needs reform — better pay, better access, better quality.
                            That work is happening. But there&apos;s a lever nobody is pulling:
                            giving educators back the 12 hours a week of documentation that keeps
                            them from the children whose brains are still forming.
                            That&apos;s what Tailor Education does. The technology is invisible.
                            The room doesn&apos;t change. The educator is just present.
                        </p>
                        <a
                            href="https://praxis.tailor.au"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-spark-600 transition-colors"
                        >
                            See what we&apos;re building for GPs <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── Privacy & Security ─── */}
            <section id="privacy" className="py-20 bg-cream">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <div className="reveal">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-spark-600" />
                            <p className="text-spark-600 font-bold text-sm uppercase tracking-widest">Trust &amp; Privacy</p>
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
                            Designed around children&apos;s safety.
                        </h2>
                        <p className="text-stone-500 mb-14 max-w-xl mx-auto">
                            We built every safeguard before writing a single line of product code.
                            For a product that listens in rooms with young children, nothing less is acceptable.
                        </p>
                    </div>

                    <div className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <PrivacyPillar icon={<MicOff className="w-7 h-7" />} title="Audio Only" description="Zero visual data. No cameras, no photos, no video — ever." />
                        <PrivacyPillar icon={<ShieldCheck className="w-7 h-7" />} title="Auto-Anonymise" description="Non-consented children are detected and their voice data is scrubbed instantly." border />
                        <PrivacyPillar icon={<UserCheck className="w-7 h-7" />} title="Educator QA" description="Human-in-the-loop always. Nothing leaves without educator approval." border />
                        <PrivacyPillar icon={<Trash2 className="w-7 h-7" />} title="Zero Retention" description="Audio is processed and deleted instantly. No recordings stored. No biometric data kept." />
                    </div>

                    <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 stagger">
                        <ComplianceCard
                            icon={<MapPin className="w-5 h-5" />}
                            title="Australian data sovereignty"
                            description="Built and hosted in Australia. All data processed within Australian jurisdiction, aligned with the Privacy Act 1988 and the APPs."
                            positive
                        />
                        <ComplianceCard
                            icon={<BookOpen className="w-5 h-5" />}
                            title="EYLF v2.0 & My Time, Our Place"
                            description="Learning stories automatically link to the correct framework. Long Day Care and Kindy use EYLF. OSHC uses My Time, Our Place. Prep uses ACARA."
                            positive
                        />
                        <ComplianceCard
                            icon={<ClipboardList className="w-5 h-5" />}
                            title="Consent-first design"
                            description="Only opted-in children are identified by voice. Every other child is automatically anonymised — their data is never processed."
                            positive
                        />
                        <ComplianceCard
                            icon={<Ban className="w-5 h-5" />}
                            title="What we DON'T do"
                            description="We don't use cameras, store audio recordings, train models on children's data, retain biometric information, or share data with third parties."
                            positive={false}
                        />
                    </div>
                </div>
            </section>

            {/* ─── Who Built This ─── */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="reveal text-center mb-12">
                        <p className="text-spark-600 font-bold text-sm uppercase tracking-widest mb-3">
                            Who Built This
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
                            Australian-built. Australian-hosted.
                        </h2>
                    </div>

                    <div className="reveal grid md:grid-cols-3 gap-6 stagger">
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-spark-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-spark-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h4 className="font-display font-bold text-stone-900 mb-2">Tailor</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                AI platform company based in Brisbane. We build domain-specific
                                AI tools for professionals — not generic chatbots.
                            </p>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-spark-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-spark-600">
                                <User className="w-6 h-6" />
                            </div>
                            <h4 className="font-display font-bold text-stone-900 mb-2">Knox Hart</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Founder. Building Tailor Education because the early childhood educators
                                in his life deserve better tools than laptops at 6pm.
                            </p>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-spark-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-spark-600">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h4 className="font-display font-bold text-stone-900 mb-2">100% Australian</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Australian-owned, Australian-built, Australian-hosted.
                                All data stays on Australian soil. No US cloud dependency.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Who it's for ─── */}
            <section className="py-16 bg-cream">
                <div className="reveal max-w-5xl mx-auto px-6">
                    <p className="text-center text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">
                        Built for early childhood
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
                        <AudiencePill icon={<Baby className="w-4 h-4" />} label="Long Day Care" detail="EYLF v2.0" />
                        <AudiencePill icon={<GraduationCap className="w-4 h-4" />} label="Kindergarten" detail="EYLF v2.0" />
                        <AudiencePill icon={<Sun className="w-4 h-4" />} label="OSHC" detail="My Time, Our Place" />
                        <AudiencePill icon={<Heart className="w-4 h-4" />} label="Prep — Year 1" detail="ACARA v9.0" />
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section id="contact" className="py-24 px-6">
                <div className="reveal max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 md:p-20 text-center relative overflow-hidden border border-stone-200 shadow-xl">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-spark-200/40 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-200/30 rounded-full blur-[60px]" />

                    <div className="relative z-10">
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5">
                            See Tailor Education in your centre.
                        </h2>
                        <p className="text-stone-500 text-lg mb-4 max-w-lg mx-auto">
                            15-minute video call. We&apos;ll walk you through the educator
                            experience, the director dashboard, and how it fits your centre.
                        </p>
                        <p className="text-stone-400 text-sm mb-10 max-w-md mx-auto">
                            No sales deck. No procurement hoops. Just the product.
                            You&apos;ll know in 15 minutes if this is worth a pilot.
                        </p>

                        <a
                            href={CONTACT_HREF}
                            className="inline-flex items-center gap-2 px-10 py-4 bg-spark-600 hover:bg-spark-500 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-spark-600/20 hover:-translate-y-0.5"
                        >
                            {PRIMARY_CTA} <ArrowRight className="w-5 h-5" />
                        </a>

                        <p className="mt-6 text-sm text-stone-400">
                            Currently accepting founding centres in South-East Queensland.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="py-16 bg-stone-50 border-t border-stone-200 text-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                        <div className="max-w-xs">
                            <a href="/" className="flex items-center gap-2 text-stone-900 mb-3">
                                <SparkIcon className="w-5 h-6 text-spark-500" />
                                <div className="flex flex-col leading-none">
                                    <span className="font-display font-extrabold text-xl">Tailor Education</span>
                                    <PoweredByTailor variant="light" size="compact" className="mt-0.5" />
                                </div>
                            </a>
                            <p className="text-stone-500 leading-relaxed mb-4">
                                Education shaped around the individual, across families,
                                schools and centres.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 md:gap-12">
                            <FooterColumn title="Product" links={[
                                { label: "Schools & Centres", href: "#for-educators" },
                                { label: "For Directors", href: "#for-leaders" },
                                { label: "Families", href: "/families/" },
                                { label: "How it Works", href: "#how-it-works" },
                                { label: "Trust & Privacy", href: "#privacy" },
                            ]} />
                            <FooterColumn title="Contact" links={[
                                { label: CONTACT_EMAIL, href: CONTACT_HREF },
                                { label: "tailor.au", href: "https://tailor.au" },
                            ]} />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-stone-200 text-stone-400 text-xs">
                        &copy; {new Date().getFullYear()} Tailor Education by{" "}
                        <a href="https://tailor.au" target="_blank" rel="noopener noreferrer" className="hover:text-spark-600 transition-colors">
                            Tailor
                        </a>
                        . All rights reserved. Australian-built. Australian-hosted. All audio processed &amp; deleted instantly.{" "}
                        <a href="/privacy" className="hover:text-spark-600 transition-colors">
                            Privacy
                        </a>{" "}
                        &middot;{" "}
                        <a href="/terms" className="hover:text-spark-600 transition-colors">
                            Terms
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ─── Sub-components ─── */

function OldModelStat({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
    return (
        <div className="flex items-center gap-2.5 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2.5">
            <span className="text-stone-400 shrink-0">{icon}</span>
            <div>
                <p className="text-sm font-bold text-stone-700 leading-tight">{label}</p>
                <p className="text-[11px] text-stone-400">{detail}</p>
            </div>
        </div>
    );
}

function SparkModelStat({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
    return (
        <div className="flex items-center gap-2.5 bg-spark-50 border border-spark-200 rounded-lg px-3 py-2.5">
            <span className="text-spark-600 shrink-0">{icon}</span>
            <div>
                <p className="text-sm font-bold text-stone-700 leading-tight">{label}</p>
                <p className="text-[11px] text-spark-500">{detail}</p>
            </div>
        </div>
    );
}

function TeacherCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="reveal bg-white p-6 rounded-2xl border border-stone-200 hover:border-spark-200 hover:shadow-lg hover:shadow-spark-100/30 transition-all duration-300 group">
            <div className="w-10 h-10 bg-spark-50 rounded-xl flex items-center justify-center mb-4 text-spark-600 group-hover:bg-spark-100 transition-colors">
                {icon}
            </div>
            <h4 className="font-display font-bold text-stone-900 mb-2">{title}</h4>
            <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
        </div>
    );
}

function CompactLeaderItem({ icon, pain, solution }: { icon: React.ReactNode; pain: string; solution: string }) {
    return (
        <div className="reveal flex items-start gap-4 bg-white p-5 rounded-xl border border-stone-200 hover:border-spark-200 transition-all">
            <div className="shrink-0 w-10 h-10 bg-spark-50 rounded-lg flex items-center justify-center text-spark-600">
                {icon}
            </div>
            <div className="min-w-0">
                <h4 className="font-bold text-stone-900 text-sm mb-1">{pain}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{solution}</p>
            </div>
        </div>
    );
}

function PhoneMockup() {
    return (
        <div className="bg-white border-2 border-stone-200 rounded-[2rem] p-3 shadow-2xl shadow-stone-200/50 max-w-[280px] mx-auto">
            <div className="bg-ivory rounded-[1.4rem] overflow-hidden">
                <div className="bg-spark-600 px-4 py-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-white/70" />
                    <span className="text-white text-xs font-bold">Tailor Education — Learning Stories</span>
                </div>
                <div className="p-4 space-y-3">
                    <div className="bg-white rounded-xl p-3 border border-stone-100">
                        <p className="text-[10px] text-stone-400 mb-1">Today, 10:15am — Block Play</p>
                        <p className="text-xs text-stone-700 leading-relaxed mb-2">
                            &ldquo;Mia described her tower as &apos;taller than two blocks and wider than my hand&apos; — demonstrating emerging spatial language and measurement concepts.&rdquo;
                        </p>
                        <div className="flex items-center gap-1.5 mb-3">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full border border-amber-200">EYLF 4.2</span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full border border-amber-200">Maths</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-spark-600 text-white text-[10px] font-bold py-1.5 rounded-lg">
                                Approve
                            </button>
                            <button className="flex-1 bg-stone-100 text-stone-500 text-[10px] font-bold py-1.5 rounded-lg">
                                Edit
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-stone-100 opacity-60">
                        <p className="text-[10px] text-stone-400 mb-1">Today, 10:08am — Reading Corner</p>
                        <p className="text-xs text-stone-700 leading-relaxed">
                            &ldquo;Noah pointed to the caterpillar and said &apos;he&apos;s hungry like me!&apos; — connecting narrative to...&rdquo;
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-stone-100 opacity-40">
                        <p className="text-[10px] text-stone-400 mb-1">Today, 9:52am — Outdoor Play</p>
                        <p className="text-xs text-stone-700 leading-relaxed">
                            &ldquo;Ava negotiated turn-taking on the...&rdquo;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardMockup() {
    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 md:p-6 shadow-lg shadow-stone-100/50 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
                <LayoutDashboard className="w-4 h-4 text-spark-600" />
                <span className="text-sm font-bold text-stone-700">Centre Director Dashboard — Little Learners ELC</span>
                <span className="ml-auto text-[10px] text-stone-400">Live · Week 8</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <DashStat label="Learning stories this week" value="84" trend="+18%" />
                <DashStat label="EYLF outcome coverage" value="78%" trend="+9%" />
                <DashStat label="Developmental alerts" value="2" trend="active" alert />
                <DashStat label="Avg. review time" value="24s" trend="-8s" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">EYLF Outcome Coverage — Kindy Room</p>
                    <div className="space-y-1.5">
                        <CoverageBar label="1. Identity" pct={88} />
                        <CoverageBar label="2. Community" pct={72} />
                        <CoverageBar label="3. Wellbeing" pct={91} />
                        <CoverageBar label="4. Learning" pct={65} low />
                        <CoverageBar label="5. Communication" pct={85} />
                    </div>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Developmental Alerts</p>
                    <div className="space-y-2">
                        <AlertRow text="Mia's social engagement in group play ↓ over 3 weeks" severity="high" />
                        <AlertRow text="Outcome 4 (Learning) coverage gap widening in Toddler room" severity="medium" />
                        <AlertRow text="2 children not observed in 10+ days" severity="low" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashStat({ label, value, trend, alert }: { label: string; value: string; trend: string; alert?: boolean }) {
    return (
        <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-[10px] text-stone-400 mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${alert ? "text-red-500" : "text-stone-900"}`}>{value}</p>
            <p className={`text-[10px] font-bold ${alert ? "text-red-400" : "text-emerald-500"}`}>{trend}</p>
        </div>
    );
}

function CoverageBar({ label, pct, low }: { label: string; pct: number; low?: boolean }) {
    return (
        <div>
            <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-stone-600">{label}</span>
                <span className={`font-bold ${low ? "text-amber-600" : "text-stone-700"}`}>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${low ? "bg-amber-400" : "bg-spark-500"}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function AlertRow({ text, severity }: { text: string; severity: "high" | "medium" | "low" }) {
    const colors = {
        high: "bg-red-50 border-red-200 text-red-700",
        medium: "bg-amber-50 border-amber-200 text-amber-700",
        low: "bg-stone-100 border-stone-200 text-stone-600",
    };
    return (
        <div className={`text-[11px] p-2 rounded-lg border ${colors[severity]}`}>
            {text}
        </div>
    );
}

function IntegrationCard({ name, detail, status }: { name: string; detail: string; status: string }) {
    return (
        <div className="reveal bg-white border border-stone-200 rounded-xl p-5 text-center hover:border-spark-200 transition-all">
            <h4 className="font-display font-bold text-stone-900 mb-1">{name}</h4>
            <p className="text-xs text-stone-500 mb-2">{detail}</p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                status === "Building" ? "bg-spark-50 text-spark-600 border border-spark-200" : "bg-stone-100 text-stone-500 border border-stone-200"
            }`}>
                {status}
            </span>
        </div>
    );
}

function FlowStep({
    number, icon, title, description, detail, accent,
}: {
    number: string; icon: React.ReactNode; title: string; description: string; detail: string; accent: "amber" | "orange" | "gold";
}) {
    const palette = {
        amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
        orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
        gold: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
    };
    const c = palette[accent];

    return (
        <div className="reveal bg-white border border-stone-200 rounded-2xl p-6 md:p-10 hover:border-stone-300 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className={`shrink-0 w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center ${c.text}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text} ${c.border} border`}>
                            Step {number}
                        </span>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900">{title}</h3>
                    </div>
                    <p className="text-[15px] text-stone-600 leading-relaxed mb-3">{description}</p>
                    <p className="text-sm text-stone-400 leading-relaxed">{detail}</p>
                </div>
            </div>
        </div>
    );
}

function AudiencePill({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
    return (
        <div className="reveal flex flex-col items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-4 py-4 hover:border-stone-300 transition-all shadow-sm">
            <span className="text-spark-600">{icon}</span>
            <span className="text-sm font-semibold text-stone-700">{label}</span>
            <span className="text-[11px] text-stone-400">{detail}</span>
        </div>
    );
}

function PrivacyPillar({ icon, title, description, border }: { icon: React.ReactNode; title: string; description: string; border?: boolean }) {
    return (
        <div className={`p-6 md:p-8 ${border ? "sm:border-x lg:border-x border-t sm:border-t-0 border-stone-200" : "border-t sm:border-t-0 border-stone-200 first:border-t-0"}`}>
            <div className="text-stone-400 mb-4 flex justify-center">{icon}</div>
            <h4 className="font-display font-bold text-stone-900 mb-2 text-center">{title}</h4>
            <p className="text-sm text-stone-500 leading-relaxed text-center">{description}</p>
        </div>
    );
}

function ComplianceCard({ icon, title, description, positive }: { icon: React.ReactNode; title: string; description: string; positive: boolean }) {
    return (
        <div className={`reveal bg-white p-6 rounded-2xl border shadow-sm ${positive ? "border-stone-200" : "border-red-200"}`}>
            <div className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${positive ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-display font-bold text-stone-900 mb-1.5">{title}</h4>
                    <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
    return (
        <div>
            <h5 className="text-stone-500 font-bold mb-4 uppercase text-xs tracking-widest">{title}</h5>
            <ul className="space-y-3">
                {links.map((l) => (
                    <li key={l.label}>
                        <a href={l.href} className="text-stone-400 hover:text-spark-600 transition-colors">{l.label}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
