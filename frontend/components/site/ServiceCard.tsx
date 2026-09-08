import Link from "next/link";

interface ServiceCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  description: string;
  features?: string[];
  href?: string;
  variant?: "default" | "featured";
}

export default function ServiceCard({
  id,
  icon,
  title,
  titleEn,
  description,
  features = [],
  href = `/services#${id}`,
  variant = "default",
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl p-7 transition-all duration-300 ${
        variant === "featured"
          ? "bg-[#1877f2] text-white hover:bg-[#166fe5] shadow-lg shadow-blue-200"
          : "bg-white border border-[#dde0e4] hover:border-[#1877f2]/30 hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-0.5"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${
          variant === "featured"
            ? "bg-white/20 text-white group-hover:bg-white/30"
            : "bg-[#e7f3ff] text-[#1877f2] group-hover:bg-[#d0e8ff]"
        }`}
      >
        {icon}
      </div>

      {/* Titles */}
      <div className="mb-3">
        <h3
          className={`font-semibold text-lg leading-tight mb-0.5 ${
            variant === "featured" ? "text-white" : "text-[#1c1e21]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-xs font-medium tracking-wide uppercase ${
            variant === "featured" ? "text-white/60" : "text-[#65676b]"
          }`}
        >
          {titleEn}
        </p>
      </div>

      {/* Description */}
      <p
        className={`text-sm leading-relaxed mb-5 ${
          variant === "featured" ? "text-white/80" : "text-[#65676b]"
        }`}
      >
        {description}
      </p>

      {/* Features */}
      {features.length > 0 && (
        <ul className="flex flex-col gap-2 mb-5">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  variant === "featured" ? "bg-white/50" : "bg-[#1877f2]"
                }`}
              />
              <span
                className={`text-xs ${
                  variant === "featured" ? "text-white/70" : "text-[#65676b]"
                }`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Read more */}
      <div
        className={`flex items-center gap-1 text-sm font-medium transition-all duration-200 ${
          variant === "featured"
            ? "text-white/80 group-hover:text-white"
            : "text-[#1877f2] group-hover:gap-2"
        }`}
      >
        <span>ดูรายละเอียด</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
