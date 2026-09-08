"use client";

import { useState } from "react";

const serviceOptions = [
  { value: "", label: "เลือกบริการที่สนใจ" },
  { value: "software", label: "รับพัฒนาซอฟต์แวร์" },
  { value: "pos", label: "ซอฟต์แวร์ POS" },
  { value: "colo", label: "Colo ให้เช่า" },
  { value: "server", label: "Server ให้บริการ" },
  { value: "support", label: "Support ติดตั้งเครื่อง" },
  { value: "network", label: "วางระบบ LAN/WiFi" },
  { value: "other", label: "อื่นๆ" },
];

const contactInfo = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: "โทรศัพท์",
    value: "02-1166615",
    link: "tel:+6620001234",
    sub: "จ–ศ 9:00–18:00",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: "อีเมล",
    value: "sales.ics9.service@gmail.com",
    link: "mailto:sales.ics9.service@gmail.com",
    sub: "ตอบกลับภายใน 24 ชั่วโมง",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: "ที่อยู่",
    value: "101/122 ม.2 ถ.กาญจนาภิเษก ต.บางคูเวียง อ.บางกรวย จ.นนทบุรี 11130",
    link: null,
    sub: "ให้บริการทั่วกรุงเทพฯ และปริมณฑล",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: "LINE Official",
    value: "@261madsf",
    link: "https://line.me/ti/p/@261madsf",
    sub: "พิมพ์ได้เลย ตอบไว",
  },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
};

type Status = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message)
          ? data.message[0]
          : data.error || data.message;
        throw new Error(msg || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }

      setStatus("success");
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        message: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1d1d1f] text-sm placeholder:text-[#9d9d9d] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all duration-200";

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl" data-animate="fade-up">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-4">
              Contact Us
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-[#1d1d1f] leading-tight tracking-tight mb-5">
              พูดคุยกับเรา
              <br />
              ได้เลยวันนี้
            </h1>
            <p className="text-[#6e6e73] text-xl leading-relaxed">
              ไม่ว่าคุณจะมีโปรเจกต์ในมือ หรือแค่ต้องการปรึกษา เราพร้อมรับฟัง
              และให้คำแนะนำอย่างตรงไปตรงมา
            </p>
          </div>
        </div>
      </section>

      {/* Contact Layout */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">
                ช่องทางติดต่อ
              </h2>
              <p className="text-[#6e6e73] text-sm mb-8 leading-relaxed">
                เลือกช่องทางที่สะดวกสำหรับคุณ ทีมของเราพร้อมตอบคำถามและให้ความช่วยเหลือ
              </p>

              <div className="flex flex-col gap-4 mb-10">
                {contactInfo.map((info, i) => (
                  <div
                    key={info.label}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-[#f5f5f7] hover:bg-gray-100 transition-colors duration-200"
                    data-animate="fade-left"
                    data-delay={String(i * 80)}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1d1d1f] shadow-sm flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#6e6e73] mb-0.5">
                        {info.label}
                      </p>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-[#1d1d1f] font-medium text-sm hover:text-[#0071e3] transition-colors duration-200"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-[#1d1d1f] font-medium text-sm">
                          {info.value}
                        </p>
                      )}
                      <p className="text-[#6e6e73] text-xs mt-0.5">{info.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business Hours */}
              <div className="bg-[#1d1d1f] rounded-2xl p-6 text-white" data-animate="fade-up" data-delay="320">
                <h3 className="font-semibold mb-4">เวลาทำการ</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { day: "จันทร์ – ศุกร์", time: "9:00 – 18:00" },
                    { day: "เสาร์", time: "9:00 – 14:00" },
                    { day: "อาทิตย์", time: "ปิดทำการ" },
                  ].map((item) => (
                    <div
                      key={item.day}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-white/60">{item.day}</span>
                      <span
                        className={
                          item.time === "ปิดทำการ"
                            ? "text-white/30"
                            : "text-white"
                        }
                      >
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3" data-animate="fade-right" data-delay="100">
              <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10">
                <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">
                  ส่งข้อความถึงเรา
                </h2>
                <p className="text-[#6e6e73] text-sm mb-8">
                  กรอกข้อมูลด้านล่าง เราจะติดต่อกลับภายใน 24 ชั่วโมง
                </p>

                {status === "success" ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">
                      ส่งข้อความสำเร็จ!
                    </h3>
                    <p className="text-[#6e6e73] mb-6">
                      ขอบคุณที่ติดต่อเรา เราจะตอบกลับภายใน 24 ชั่วโมง
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="text-sm font-medium text-[#0071e3] hover:underline"
                    >
                      ส่งข้อความใหม่
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-[#1d1d1f] mb-2"
                        >
                          ชื่อ-นามสกุล{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="กรุณากรอกชื่อ-นามสกุล"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-[#1d1d1f] mb-2"
                        >
                          อีเมล <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="xxxx@gmail.com"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-[#1d1d1f] mb-2"
                        >
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="08x-xxx-xxxx"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="company"
                          className="block text-sm font-medium text-[#1d1d1f] mb-2"
                        >
                          ชื่อบริษัท / องค์กร
                        </label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          value={form.company}
                          onChange={handleChange}
                          placeholder="บริษัท ABC จำกัด"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="service"
                        className="block text-sm font-medium text-[#1d1d1f] mb-2"
                      >
                        บริการที่สนใจ
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        {serviceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-[#1d1d1f] mb-2"
                      >
                        รายละเอียดเพิ่มเติม{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="อธิบายความต้องการของคุณ เช่น ขนาดโปรเจกต์ งบประมาณ หรือคำถามที่ต้องการ..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {status === "error" && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-red-600 text-sm">{errorMessage}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full bg-[#1d1d1f] text-white font-medium py-3.5 rounded-xl hover:bg-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                    >
                      {status === "loading" ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          กำลังส่ง...
                        </span>
                      ) : (
                        "ส่งข้อความ"
                      )}
                    </button>

                    <p className="text-center text-[#6e6e73] text-xs">
                      การส่งแบบฟอร์มนี้ถือว่าคุณยอมรับ{" "}
                      <a
                        href="/privacy"
                        className="underline hover:text-[#1d1d1f] transition-colors"
                      >
                        นโยบายความเป็นส่วนตัว
                      </a>{" "}
                      ของเรา
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
