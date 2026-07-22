"use client";

export default function PhoneMockup() {
    return (
        <div className="relative w-[280px] sm:w-[300px] mx-auto">
            {/* Phone frame */}
            <div className="relative rounded-[2.5rem] border-[3px] border-stone-700 bg-stone-900 p-3 shadow-2xl shadow-spark-900/40">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-stone-900 rounded-b-2xl z-10" />

                {/* Screen */}
                <div className="rounded-[2rem] bg-gradient-to-b from-stone-50 to-stone-100 overflow-hidden">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[10px] font-semibold text-stone-500">
                        <span>9:41</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-4 h-2 border border-stone-400 rounded-sm relative">
                                <div className="absolute inset-[1px] right-[2px] bg-green-500 rounded-[1px]" />
                            </div>
                        </div>
                    </div>

                    {/* Chat header */}
                    <div className="px-4 py-2 border-b border-stone-200 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spark-500 to-amber-400 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-800">Daily Spark</p>
                            <p className="text-[9px] text-stone-400">Your School AI</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="px-3 py-3 space-y-2 min-h-[320px]">
                        <SmsTimestamp text="Today 3:15 PM" />

                        <SmsBubble delay={0.4}>
                            <p className="text-[12px] text-stone-800 leading-relaxed">
                                Hey! <span className="text-base">😊</span><br />
                                Here are 3 amazing things <strong>Mia</strong> learned today:
                            </p>
                        </SmsBubble>

                        <SmsBubble delay={0.9}>
                            <p className="text-[12px] text-stone-800 leading-relaxed">
                                <span className="text-base">✏️</span> <strong>Maths:</strong><br />
                                Used cubes to build towers and counted to 12!
                            </p>
                        </SmsBubble>

                        <SmsBubble delay={1.4}>
                            <p className="text-[12px] text-stone-800 leading-relaxed">
                                <span className="text-base">🎨</span> <strong>Creative Arts:</strong><br />
                                Mixed blue + yellow to make green — so proud!
                            </p>
                        </SmsBubble>

                        <SmsBubble delay={1.9}>
                            <p className="text-[12px] text-stone-800 leading-relaxed">
                                <span className="text-base">💡</span> <strong>Ask her:</strong><br />
                                &quot;What shapes did you use for the towers?&quot;
                            </p>
                        </SmsBubble>

                        <div className="bubble-anim pt-1" style={{ animationDelay: "2.4s" }}>
                            <div className="bg-spark-600 text-white text-center text-[11px] font-bold py-2.5 rounded-xl">
                                Keep the conversation going ✨
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glow behind phone */}
            <div className="absolute -inset-8 -z-10 bg-spark-500/10 rounded-full blur-[60px]" />
        </div>
    );
}

function SmsTimestamp({ text }: { text: string }) {
    return (
        <p className="text-center text-[9px] text-stone-400 font-medium py-1">{text}</p>
    );
}

function SmsBubble({ children, delay }: { children: React.ReactNode; delay: number }) {
    return (
        <div
            className="bubble-anim bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-stone-100 max-w-[90%]"
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
}
