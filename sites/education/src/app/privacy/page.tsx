import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How Tailor Education handles personal information.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-ivory text-stone-700 px-6 py-16">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
                    Tailor Education Privacy Policy
                </h1>
                <p className="text-stone-500 text-sm mb-8">
                    Tailor Education is an AI classroom intelligence service for early
                    learning, operated by Tailor (tailor.au). This is an
                    interim policy pending legal finalisation.
                </p>

                <div className="space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            What we collect
                        </h2>
                        <p className="text-stone-600">
                            Tailor Education processes classroom audio to draft
                            observations and learning stories for educators,
                            and produces daily updates for parents. That
                            means the service handles data about children —
                            a category we treat with heightened care.
                            Classroom audio is processed to generate drafts
                            and then deleted; the retained records are the
                            educator-approved observations, learning
                            stories, and the account details of educators
                            and parents using the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Children&apos;s data
                        </h2>
                        <p className="text-stone-600">
                            Records about children are created for the
                            centre, under the centre&apos;s enrolment
                            consents, and are only shared with the
                            child&apos;s own parents or guardians and the
                            centre&apos;s educators. Tailor Education does not use
                            children&apos;s data for advertising or model
                            training.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Cookies and analytics
                        </h2>
                        <p className="text-stone-600">
                            The Tailor Education website uses only what it needs to run
                            — session state and server-side logs for
                            reliability. We do not run third-party
                            advertising trackers on this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Where data is stored
                        </h2>
                        <p className="text-stone-600">
                            Tailor Education data is stored on Microsoft Azure
                            infrastructure in Australia. Australian data
                            residency is a design principle of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Your rights
                        </h2>
                        <p className="text-stone-600">
                            We handle personal information in accordance
                            with the Privacy Act 1988 (Cth) and the
                            Australian Privacy Principles. You can request
                            access to, correction of, or deletion of
                            personal information we hold about you or your
                            child, and you may complain to the OAIC if you
                            are unsatisfied with our response.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-stone-900 font-semibold mb-2">
                            Retention and contact
                        </h2>
                        <p className="text-stone-600">
                            Learning records are retained per the
                            centre&apos;s regulatory record-keeping
                            obligations. For access, correction, or deletion
                            requests, or any privacy question, email{" "}
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
                    <a href="/terms" className="hover:text-spark-600 transition-colors">
                        Terms
                    </a>
                </p>
            </div>
        </div>
    );
}
