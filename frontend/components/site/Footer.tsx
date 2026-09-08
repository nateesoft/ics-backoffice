import Link from "next/link";

const services = [
  { label: "รับพัฒนาซอฟต์แวร์", href: "/services#software" },
  { label: "ซอฟต์แวร์ POS", href: "/services#pos" },
  { label: "Colo ให้เช่า", href: "/services#colo" },
  { label: "Server ให้บริการ", href: "/services#server" },
  { label: "Support ติดตั้งเครื่อง", href: "/services#support" },
  { label: "วางระบบ LAN/WiFi", href: "/services#network" },
];

const company = [
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "บริการ", href: "/services" },
  { label: "ติดต่อ", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1c1e21] border-t border-[#3e4042]">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-[#1877f2] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">
                  ICS
                </span>
              </div>
              <span className="text-white font-bold text-sm">In Concept Service</span>
            </div>
            <p className="text-[#b0b3b8] text-sm leading-relaxed mb-5">
              ผู้เชี่ยวชาญด้านเทคโนโลยีสารสนเทศครบวงจร
              <br />
              พร้อมดูแลธุรกิจของคุณทุกขั้นตอน
            </p>
            <Link
              href="/contact"
              className="inline-block text-sm font-medium text-[#1877f2] hover:text-[#4599ff] transition-colors duration-200"
            >
              ติดต่อเรา →
            </Link>
          </div>

          {/* Services */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-5">
              บริการของเรา
            </h4>
            <ul className="flex flex-col gap-3">
              {services.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-[#b0b3b8] text-sm hover:text-white transition-colors duration-200"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-5">
              บริษัท
            </h4>
            <ul className="flex flex-col gap-3">
              {company.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-[#b0b3b8] text-sm hover:text-white transition-colors duration-200"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-5">
              ข้อมูลติดต่อ
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-[#1877f2] mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-[#b0b3b8] text-sm leading-relaxed">
                  กรุงเทพมหานคร ประเทศไทย
                </span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#1877f2] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:sales.ics9.service@gmail.com"
                  className="text-[#b0b3b8] text-sm hover:text-[#1877f2] transition-colors duration-200"
                >
                  sales.ics9.service@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#1877f2] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+6620001234"
                  className="text-[#b0b3b8] text-sm hover:text-[#1877f2] transition-colors duration-200"
                >
                  02-1166615
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#3e4042]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#65676b] text-xs">
            © {new Date().getFullYear()} ICS — In Concept Service.
            สงวนลิขสิทธิ์ทุกประการ
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[#65676b] text-xs hover:text-[#b0b3b8] transition-colors duration-200"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link
              href="/terms"
              className="text-[#65676b] text-xs hover:text-[#b0b3b8] transition-colors duration-200"
            >
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
