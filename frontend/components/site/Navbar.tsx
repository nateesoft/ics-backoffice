"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "หน้าหลัก", labelEn: "Home" },
  { href: "/services", label: "บริการ", labelEn: "Services" },
  { href: "/about", label: "เกี่ยวกับเรา", labelEn: "About" },
  { href: "/contact", label: "ติดต่อ", labelEn: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#dde0e4] shadow-sm"
          : "bg-[#1877f2]"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="ICS Home"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 ${scrolled ? "bg-[#1877f2]" : "bg-white/20"}`}>
            <span className="text-white text-xs font-bold tracking-tight">
              ICS
            </span>
          </div>
          <span className={`font-bold text-sm tracking-wide hidden sm:block transition-colors duration-200 ${scrolled ? "text-[#1877f2]" : "text-white"}`}>
            In Concept Service
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? scrolled
                        ? "text-[#1877f2] bg-[#e7f3ff]"
                        : "text-white bg-white/20"
                      : scrolled
                      ? "text-[#65676b] hover:text-[#1c1e21] hover:bg-[#f0f2f5]"
                      : "text-white/80 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA + Login */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-200 ${
              scrolled
                ? "text-[#1877f2] hover:bg-[#e7f3ff]"
                : "text-white hover:bg-white/15"
            }`}
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/contact"
            className={`text-sm font-semibold px-5 py-2 rounded-full transition-colors duration-200 ${
              scrolled
                ? "bg-[#1877f2] text-white hover:bg-[#166fe5]"
                : "bg-white text-[#1877f2] hover:bg-[#e7f3ff]"
            }`}
          >
            เริ่มต้นกับเรา
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden flex flex-col gap-1.5 p-2 rounded-lg transition-colors ${
            scrolled ? "hover:bg-[#f0f2f5]" : "hover:bg-white/15"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${scrolled ? "bg-[#1c1e21]" : "bg-white"} ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${scrolled ? "bg-[#1c1e21]" : "bg-white"} ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-200 ${scrolled ? "bg-[#1c1e21]" : "bg-white"} ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-b border-[#dde0e4] px-6 py-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-3 ${
                  isActive
                    ? "text-[#1877f2] bg-[#e7f3ff]"
                    : "text-[#65676b] hover:text-[#1c1e21] hover:bg-[#f0f2f5]"
                }`}
              >
                {link.label}
                <span className="text-xs text-[#65676b] font-normal">
                  {link.labelEn}
                </span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[#dde0e4] mt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="block w-full text-center border border-[#1877f2] text-[#1877f2] text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#e7f3ff] transition-colors duration-200"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/contact"
              className="block w-full text-center bg-[#1877f2] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#166fe5] transition-colors duration-200"
            >
              เริ่มต้นกับเรา
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
