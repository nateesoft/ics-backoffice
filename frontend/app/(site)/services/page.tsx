import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "บริการของเรา — ICS",
  description:
    "ICS ให้บริการครบวงจรด้าน IT ตั้งแต่พัฒนาซอฟต์แวร์ ระบบ POS Colocation Server รวมถึงวางระบบเครือข่าย LAN/WiFi",
};

const services = [
  {
    id: "software",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "รับพัฒนาซอฟต์แวร์",
    titleEn: "Software Development",
    description:
      "เราพัฒนาซอฟต์แวร์ที่ตอบโจทย์ธุรกิจของคุณอย่างแท้จริง ด้วยกระบวนการที่ได้มาตรฐานและทีมนักพัฒนามืออาชีพ เราครอบคลุมทุก Platform ตั้งแต่ Web Application, Mobile App ไปจนถึง Desktop Application",
    features: [
      "Web Application (React, Next.js, Vue)",
      "Mobile Application (iOS & Android)",
      "Desktop Application",
      "API Development & Integration",
      "Database Design & Optimization",
      "Cloud Deployment (AWS, GCP, Azure)",
      "System Architecture Consulting",
      "Maintenance & Support",
    ],
    process: [
      { step: "01", title: "วิเคราะห์ความต้องการ", desc: "ศึกษาและวิเคราะห์ Business Requirement อย่างละเอียด" },
      { step: "02", title: "ออกแบบระบบ", desc: "วางแผน System Architecture และ UI/UX Design" },
      { step: "03", title: "พัฒนา", desc: "พัฒนาตาม Agile methodology พร้อม Sprint Reviews" },
      { step: "04", title: "ทดสอบและส่งมอบ", desc: "QA Testing อย่างเข้มข้นก่อน Deploy" },
    ],
  },
  {
    id: "pos",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "ซอฟต์แวร์ POS",
    titleEn: "POS Software",
    description:
      "ระบบ Point of Sale ที่ออกแบบมาเพื่อธุรกิจร้านค้า ร้านอาหาร และ Retail ครบครัน ง่ายใช้งาน รองรับหลายสาขา พร้อมระบบ Backend ที่แข็งแกร่ง",
    features: [
      "ระบบขายหน้าร้านแบบ Real-time",
      "จัดการสต็อกสินค้าอัตโนมัติ",
      "รายงานยอดขายและวิเคราะห์ข้อมูล",
      "รองรับหลายสาขาและหลาย User",
      "เชื่อมต่อกับเครื่อง Barcode Scanner, Printer",
      "ระบบสมาชิกและโปรโมชัน",
      "รองรับการชำระเงินหลายประเภท",
      "ระบบสำรองข้อมูลอัตโนมัติ",
    ],
    process: [
      { step: "01", title: "สำรวจหน้าร้าน", desc: "ศึกษา Flow การทำงานและความต้องการเฉพาะ" },
      { step: "02", title: "ปรับแต่งระบบ", desc: "Customize ระบบให้เหมาะกับธุรกิจของคุณ" },
      { step: "03", title: "ติดตั้งและทดสอบ", desc: "ติดตั้งและทดสอบระบบทั้งหมดอย่างครบถ้วน" },
      { step: "04", title: "ฝึกอบรมและ Support", desc: "อบรมพนักงานและให้การสนับสนุนต่อเนื่อง" },
    ],
  },
  {
    id: "colo",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    title: "Colo ให้เช่า",
    titleEn: "Colocation Rental",
    description:
      "บริการ Colocation ในดาต้าเซ็นเตอร์ที่ได้มาตรฐาน Tier III พร้อมระบบความปลอดภัยสูงสุด ระบบไฟฟ้าสำรอง และระบายความร้อนที่มีประสิทธิภาพ รองรับทั้ง 1U ถึง Full Rack",
    features: [
      "Data Center มาตรฐาน Tier III",
      "Uptime SLA 99.9%",
      "Internet Bandwidth 1Gbps – 10Gbps",
      "ระบบไฟฟ้าสำรอง UPS + Generator",
      "ระบบรักษาความปลอดภัย 24 ชั่วโมง",
      "ระบบ CCTV และ Access Control",
      "Remote Hands Service",
      "Monitoring & Alerting",
    ],
    process: [
      { step: "01", title: "ประเมินความต้องการ", desc: "วิเคราะห์ขนาด Rack และ Bandwidth ที่ต้องการ" },
      { step: "02", title: "เสนอแพ็กเกจ", desc: "เสนอ Package ที่เหมาะสมพร้อม SLA ชัดเจน" },
      { step: "03", title: "ติดตั้งอุปกรณ์", desc: "ช่วยติดตั้งอุปกรณ์ใน Data Center" },
      { step: "04", title: "Monitoring ต่อเนื่อง", desc: "ดูแลและ Monitor ระบบตลอด 24 ชั่วโมง" },
    ],
  },
  {
    id: "server",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: "Server ให้บริการ",
    titleEn: "Server Services",
    description:
      "บริการ Server ทั้งแบบ Dedicated และ Cloud ที่ประสิทธิภาพสูง ราคาคุ้มค่า พร้อมทีม System Administrator ดูแลระบบตลอด 24 ชั่วโมง 365 วัน",
    features: [
      "Dedicated Server (Custom Spec)",
      "VPS / Cloud Server",
      "Managed Server Services",
      "OS Installation & Configuration",
      "Security Hardening",
      "Backup & Disaster Recovery",
      "Performance Monitoring",
      "24/7 Technical Support",
    ],
    process: [
      { step: "01", title: "วิเคราะห์ Workload", desc: "ประเมิน Resource ที่เหมาะสมกับการใช้งาน" },
      { step: "02", title: "จัดเตรียม Server", desc: "ติดตั้ง OS และ Configure ระบบ" },
      { step: "03", title: "ทดสอบประสิทธิภาพ", desc: "Benchmark และทดสอบระบบก่อน Production" },
      { step: "04", title: "ดูแลต่อเนื่อง", desc: "Monitoring และ Maintenance อย่างสม่ำเสมอ" },
    ],
  },
  {
    id: "support",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Support ติดตั้งเครื่อง",
    titleEn: "Hardware Installation Support",
    description:
      "บริการติดตั้ง ซ่อมบำรุง และดูแลอุปกรณ์คอมพิวเตอร์ เซิร์ฟเวอร์ และอุปกรณ์เครือข่ายทุกประเภท โดยช่างผู้เชี่ยวชาญที่พร้อม On-site ทั่วกรุงเทพฯ และปริมณฑล",
    features: [
      "ติดตั้งคอมพิวเตอร์และ Workstation",
      "ติดตั้งและ Config Server",
      "ซ่อมบำรุงอุปกรณ์ทุกประเภท",
      "Preventive Maintenance รายเดือน/รายไตรมาส",
      "Hardware Upgrade",
      "Data Recovery",
      "On-site Service ทั่วกรุงเทพฯ",
      "รับประกันงานทุกชิ้น",
    ],
    process: [
      { step: "01", title: "นัดหมายและสำรวจ", desc: "นัดเวลาและสำรวจหน้างานก่อนดำเนินการ" },
      { step: "02", title: "เสนอราคา", desc: "ให้ใบเสนอราคาที่ชัดเจน ไม่มีค่าใช้จ่ายซ่อนเร้น" },
      { step: "03", title: "ดำเนินการ On-site", desc: "ช่างผู้เชี่ยวชาญดำเนินการพร้อมอุปกรณ์ครบ" },
      { step: "04", title: "ทดสอบและรับประกัน", desc: "ทดสอบหลังติดตั้งและออกใบรับประกันงาน" },
    ],
  },
  {
    id: "network",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    title: "วางระบบ LAN/WiFi",
    titleEn: "Network Setup: LAN/WiFi",
    description:
      "ออกแบบและติดตั้งระบบเครือข่ายองค์กรทั้ง LAN และ Wireless ที่มีเสถียรภาพสูง รองรับผู้ใช้หลายร้อยคนพร้อมกัน ครอบคลุมตั้งแต่ SME ไปจนถึงองค์กรขนาดใหญ่",
    features: [
      "Network Design & Planning",
      "Structured Cabling (CAT6/CAT6A)",
      "Enterprise WiFi (Cisco, Ubiquiti, Aruba)",
      "Managed Switch & Router Setup",
      "Firewall & UTM Configuration",
      "VLAN & Network Segmentation",
      "VPN Setup (Site-to-Site, Remote Access)",
      "Network Monitoring & Management",
    ],
    process: [
      { step: "01", title: "Survey หน้างาน", desc: "สำรวจพื้นที่และออกแบบ Network Topology" },
      { step: "02", title: "เสนอ Design", desc: "นำเสนอ Network Design พร้อมงบประมาณ" },
      { step: "03", title: "ติดตั้งระบบ", desc: "วาง Cable, ติดตั้ง AP และ Configure ระบบ" },
      { step: "04", title: "ทดสอบและ Handover", desc: "ทดสอบสัญญาณทั้งระบบและส่งมอบพร้อม Document" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-4">Our Services</p>
            <h1 className="text-5xl md:text-6xl font-bold text-[#1d1d1f] leading-tight tracking-tight mb-6">
              บริการที่ครอบคลุม
              <br />
              ทุกความต้องการ IT
            </h1>
            <p className="text-[#6e6e73] text-xl leading-relaxed mb-8">
              ตั้งแต่การพัฒนาซอฟต์แวร์ไปจนถึงโครงสร้างพื้นฐาน เราพร้อมเป็น
              One-stop Solution สำหรับทุกความต้องการด้านเทคโนโลยีของคุณ
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {services.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-xs font-medium text-[#6e6e73] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-gray-300 hover:text-[#1d1d1f] transition-colors duration-200"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-4 bg-white">
        {services.map((service, index) => (
          <div
            key={service.id}
            id={service.id}
            className={`py-20 scroll-mt-20 ${index % 2 === 1 ? "bg-[#f5f5f7]" : "bg-white"}`}
          >
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left: Info */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-16 h-16 bg-[#1d1d1f] rounded-2xl flex items-center justify-center text-white mb-6">
                    {service.icon}
                  </div>
                  <p className="text-[#6e6e73] text-sm font-medium tracking-widest uppercase mb-2">
                    {service.titleEn}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] leading-tight tracking-tight mb-5">
                    {service.title}
                  </h2>
                  <p className="text-[#6e6e73] text-lg leading-relaxed mb-8">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-[#1d1d1f] text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-[#1d1d1f] text-white font-medium px-7 py-3 rounded-full hover:bg-[#0071e3] transition-colors duration-200 text-sm"
                  >
                    สนใจบริการนี้
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Right: Process */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <h3 className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">
                    ขั้นตอนการทำงาน
                  </h3>
                  <div className="flex flex-col gap-4">
                    {service.process.map((step, i) => (
                      <div
                        key={step.step}
                        className="flex gap-5 p-5 bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#1d1d1f]">{step.step}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1d1d1f] mb-1">{step.title}</h4>
                          <p className="text-[#6e6e73] text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1d1d1f]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            ไม่แน่ใจว่าบริการไหนเหมาะกับคุณ?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            ปรึกษาทีมผู้เชี่ยวชาญของเราได้ฟรี เราจะช่วยวิเคราะห์และแนะนำ Solution ที่เหมาะสมที่สุด
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#1d1d1f] font-semibold px-8 py-3.5 rounded-full hover:bg-[#f5f5f7] transition-colors duration-200 text-sm"
          >
            ขอรับคำปรึกษาฟรี
          </Link>
        </div>
      </section>
    </>
  );
}
