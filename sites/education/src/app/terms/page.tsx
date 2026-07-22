import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms of service for Tailor Education.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-ivory text-stone-700 px-6 py-16">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
                    Tailor Education Terms of Service
                </h1>
                <p className="text-stone-500 text-sm mb-8">
                    Interim terms pending legal finalisation. Signed customer
                    agreements remain the governing documents where they
                    exist.
                </p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            The service
                        </h2>
                        <p className="text-stone-600">
                            Tailor Education, operated by Tailor (tailor.au), drafts
                            early-learning observations and learning stories
                            from classroom audio and shares approved updates
                            with parents. AI-drafted content can be wrong —
                            educators review and approve records before they
                            become part of a child&apos;s documentation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Acceptable use
                        </h2>
                        <p className="text-stone-600">
                            You must not use Tailor Education to break the law, to
                            record without the consents your centre is
                            required to hold, to access another centre&apos;s
                            or family&apos;s data, or to probe or disrupt
                            the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            No warranty and liability
                        </h2>
                        <p className="text-stone-600">
                            Pending finalised terms, the service is provided
                            on an &ldquo;as is&rdquo; basis and, to the
                            extent permitted by law, Tailor&apos;s liability
                            is limited to re-supplying the service. Nothing
                            here excludes rights that cannot be excluded
                            under Australian law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Governing law
                        </h2>
                        <p className="text-stone-600">
                            These terms are governed by the laws of
                            Queensland, Australia, and the courts of
                            Queensland have jurisdiction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Changes
                        </h2>
                        <p className="text-stone-600">
                            We may update this interim page; material changes
                            will be dated here. Questions:{" "}
                            <a
                                href="mailto:spark@tailor.au"
                                className="text-spark-600 hover:underline"
                            >
                                spark@tailor.au
                            </a>
                            .
                        </p>
                    </section>
                </div>

                <p className="mt-10 text-xs text-stone-400">
                    <a href="/" className="hover:text-spark-600 transition-colors">
                        &larr; Back to Tailor Education
                    </a>{" "}
                    &middot;{" "}
                    <a href="/privacy" className="hover:text-spark-600 transition-colors">
                        Privacy
                    </a>
                </p>
            </div>
        </div>
    );
}
