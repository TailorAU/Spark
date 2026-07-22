import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: {
        template: "%s | Tailor Education",
        default: "Tailor Education | Education shaped around the individual.",
    },
    description:
        "Education shaped around the individual. Classroom insight for schools and centres, with curriculum-shaped learning for families.",
    metadataBase: new URL("https://education.tailor.au"),
    openGraph: {
        title: "Tailor Education | Education shaped around the individual.",
        description:
            "Classroom insight for schools and centres, with curriculum-shaped learning for families.",
        url: "https://education.tailor.au",
        siteName: "Tailor Education",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Tailor Education",
        description: "Education shaped around the individual.",
    },
    icons: {
        icon: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
            <body className="font-sans antialiased bg-ivory">{children}</body>
        </html>
    );
}
