export default function PoweredByTailor({
    variant = "dark",
    size = "default",
    className = "",
}: {
    variant?: "dark" | "light";
    size?: "default" | "compact";
    className?: string;
}) {
    const styles =
        variant === "dark"
            ? "text-slate-500 hover:text-slate-300 border-slate-700/60 hover:border-slate-600"
            : "text-stone-400 hover:text-stone-600 border-stone-300 hover:border-stone-400";

    if (size === "compact") {
        const compactStyles =
            variant === "dark"
                ? "text-slate-500 hover:text-slate-400"
                : "text-stone-400 hover:text-stone-500";
        return (
            <a
                href="https://tailor.au"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-[8px] tracking-wide ${compactStyles} transition-all duration-200 group ${className}`}
            >
                <TailorMark className="w-2 h-2.5 opacity-50 group-hover:opacity-80 transition-opacity" />
                <span>
                    powered by{" "}
                    <span className={`font-bold ${variant === "dark" ? "text-slate-400 group-hover:text-slate-300" : "text-stone-500 group-hover:text-stone-600"}`}>
                        tailor
                    </span>
                </span>
            </a>
        );
    }

    return (
        <a
            href="https://tailor.au"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-[11px] tracking-wide ${styles} border rounded-full pl-2.5 pr-3 py-1 transition-all duration-200 group ${className}`}
        >
            <TailorMark className="w-3 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>
                Powered by{" "}
                <span className={`font-bold ${variant === "dark" ? "text-slate-400 group-hover:text-white" : "text-stone-500 group-hover:text-stone-700"}`}>
                    Tailor
                </span>
            </span>
            <ArrowIcon className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </a>
    );
}

function TailorMark({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.883 15.246C14.505 16.1107 13.7978 16.7902 12.917 17.1351L6.65442 19.5876C5.76761 19.9349 5.05704 20.6213 4.68105 21.4938L3.60113 23.9999L1.27385 24L2.7061 20.7249C3.08274 19.8636 3.10204 18.8888 2.75977 18.0134L0.243458 11.5777C-0.0987525 10.7024 -0.079535 9.72777 0.296916 8.86661L1.98354 5.0083C2.36151 4.14366 3.06869 3.46411 3.94946 3.11918L11.9142 0L20 3.54025L14.883 15.246ZM3.6555 6.16876L1.86991 10.2537L4.42628 16.792L8.20185 8.15934L3.6555 6.16876ZM8.43625 14.1169C7.9929 14.2905 7.63764 14.6337 7.44964 15.0699L6.3812 17.549L12.1069 15.3066C12.5473 15.1341 12.9009 14.7943 13.0899 14.362L14.1803 11.8674L8.43625 14.1169ZM10.9335 8.32175C10.4902 8.49538 10.1349 8.83857 9.94688 9.27482L8.85582 11.8067L14.6242 9.5477C15.0647 9.37523 15.4183 9.03543 15.6073 8.60307L16.7208 6.05541L10.9335 8.32175ZM5.33414 4.72252L9.00221 6.32872L10.6082 2.65714L5.33414 4.72252ZM12.8311 2.58249L11.3533 6.01184L16.2678 4.08728L12.8311 2.58249Z"
            />
        </svg>
    );
}

function ArrowIcon({ className = "w-3 h-3" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" />
        </svg>
    );
}
