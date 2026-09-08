import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — ICS",
  description:
    "ICS (In Concept Service) ก่อตั้งโดยทีมผู้เชี่ยวชาญด้าน IT มากกว่า 10 ปี มุ่งมั่นให้บริการด้านเทคโนโลยีที่ครบวงจรแก่ธุรกิจไทย",
};

const values = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "ซื่อสัตย์และโปร่งใส",
    titleEn: "Integrity & Transparency",
    desc: "เราเชื่อในความโปร่งใสทุกด้าน ราคาชัดเจน ไม่มีค่าใช้จ่ายซ่อนเร้น และสื่อสารตรงไปตรงมากับลูกค้าทุกราย",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "นวัตกรรมอย่างต่อเนื่อง",
    titleEn: "Continuous Innovation",
    desc: "เราลงทุนในการพัฒนาทีมและเทคโนโลยีอย่างต่อเนื่อง เพื่อให้ลูกค้าได้รับ Solution ที่ทันสมัยที่สุด",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "ลูกค้าคือศูนย์กลาง",
    titleEn: "Customer-Centric",
    desc: "ทุกการตัดสินใจของเราเริ่มต้นจากคำถามว่า 'สิ่งนี้ดีที่สุดสำหรับลูกค้าหรือเปล่า?' ความสำเร็จของคุณคือความสำเร็จของเรา",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "ส่งมอบได้จริง",
    titleEn: "Deliver Results",
    desc: "เราให้ความสำคัญกับการส่งมอบงานตรงเวลาและตรงตาม Requirement ด้วยคุณภาพที่เกินความคาดหมาย",
  },
];

const team = [
  {
    name: "ยุทธนา สังข์แก้ว",
    nameEn: "Yuttana Sangkeaw",
    role: "CEO & Founder",
    roleDesc: "ผู้ก่อตั้งและซีอีโอ",
    expertise: "15+ ปีในวงการ Software Retail และ IT Services",
    bg: "bg-gradient-to-br from-gray-100 to-gray-200",
    initials: "YS",
  },
  {
    name: "นที ภูวงษ",
    nameEn: "Nathee Phuwong",
    role: "CTO & Founder & Software Architect",
    roleDesc: "หัวหน้าฝ่ายเทคนิค",
    expertise: "Software Architecture",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    initials: "NP",
  }
];

const milestones = [
  { year: "2014", event: "ก่อตั้งบริษัท ICS โดยกลุ่มวิศวกรไอทีที่มีวิสัยทัศน์ร่วมกัน" },
  { year: "2016", event: "ขยายบริการสู่ Colocation และ Server Services รองรับลูกค้าองค์กร" },
  { year: "2018", event: "เปิดตัวระบบ POS ที่พัฒนาขึ้นเอง ครอบคลุมร้านค้าและร้านอาหาร" },
  { year: "2020", event: "ผ่านการรับรองมาตรฐาน ISO 27001 ด้านความปลอดภัยสารสนเทศ" },
  { year: "2022", event: "ขยายทีมและรองรับลูกค้าองค์กรขนาดใหญ่กว่า 50 รายทั่วประเทศ" },
  { year: "2024", event: "เปิด Data Center แห่งที่ 2 พร้อมยกระดับบริการสู่ Cloud-native Solutions" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-4">About ICS</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1d1d1f] leading-[1.05] tracking-tight mb-6">
              เราเชื่อว่าเทคโนโลยี
              <br />
              <span className="text-[#6e6e73]">ควรเข้าถึงได้ทุกคน</span>
            </h1>
            <p className="text-[#6e6e73] text-xl leading-relaxed max-w-2xl">
              ICS ก่อตั้งขึ้นด้วยความเชื่อที่ว่าธุรกิจทุกขนาดสมควรได้รับเทคโนโลยีที่ดีที่สุด
              โดยไม่ต้องใช้งบประมาณมหาศาล
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#1d1d1f] rounded-3xl p-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-3">Vision</p>
              <h2 className="text-2xl font-bold text-white mb-4 leading-tight">วิสัยทัศน์</h2>
              <p className="text-white/70 leading-relaxed">
                เป็น IT Partner ที่เชื่อถือได้อันดับหนึ่งของธุรกิจไทย ด้วยการให้บริการเทคโนโลยีที่ครบวงจร
                มีคุณภาพ และราคาที่เข้าถึงได้
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 border border-gray-200">
              <div className="w-12 h-12 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#6e6e73] text-xs font-semibold tracking-widest uppercase mb-3">Mission</p>
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4 leading-tight">พันธกิจ</h2>
              <p className="text-[#6e6e73] leading-relaxed">
                มอบ Solution ด้านเทคโนโลยีที่ตอบโจทย์ธุรกิจอย่างแท้จริง ด้วยทีมผู้เชี่ยวชาญที่ทุ่มเท
                และการบริการที่เกินความคาดหมายในทุกครั้ง
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-3">Our Values</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] leading-tight tracking-tight">
              ค่านิยมที่ขับเคลื่อน
              <br />
              ทุกสิ่งที่เราทำ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-7 border border-gray-200/80">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center text-[#1d1d1f] mb-5">
                  {value.icon}
                </div>
                <h3 className="font-semibold text-[#1d1d1f] mb-1">{value.title}</h3>
                <p className="text-[#6e6e73] text-xs tracking-wide mb-3">{value.titleEn}</p>
                <p className="text-[#6e6e73] text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-3">Our Team</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] leading-tight tracking-tight">
              ทีมผู้เชี่ยวชาญ
              <br />
              ที่คุณไว้วางใจได้
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((member) => (
              <div
                key={member.name}
                className="group rounded-2xl overflow-hidden border border-gray-200/80 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`${member.bg} h-40 flex items-center justify-center`}>
                  <div className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-[#1d1d1f]">{member.initials}</span>
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <h3 className="font-semibold text-[#1d1d1f] text-sm">{member.name}</h3>
                  <p className="text-[#6e6e73] text-xs mt-0.5 mb-1">{member.nameEn}</p>
                  <p className="text-[#0071e3] text-xs font-medium mb-2">{member.role}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-[#6e6e73] text-xs">{member.expertise}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[#0071e3] text-sm font-semibold tracking-widest uppercase mb-3">Our Journey</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] leading-tight tracking-tight">
              เส้นทางกว่า 10 ปี
              <br />
              ของ ICS
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />

            <div className="flex flex-col gap-6">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="flex gap-8 items-start">
                  <div className="relative flex-shrink-0 hidden md:block">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10 relative">
                      <span className="text-xs font-bold text-[#1d1d1f]">{milestone.year.slice(2)}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-gray-300 transition-colors duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#0071e3] font-bold text-sm md:hidden">{milestone.year}</span>
                      <span className="text-[#1d1d1f] font-bold text-sm hidden md:block">{milestone.year}</span>
                    </div>
                    <p className="text-[#6e6e73] text-sm leading-relaxed">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1d1d1f]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            ร่วมเดินทางไปกับเรา
          </h2>
          <p className="text-white/60 text-lg mb-8">
            ไม่ว่าธุรกิจของคุณจะอยู่ในขั้นตอนไหน ICS พร้อมเป็นพาร์ทเนอร์ที่คุณไว้วางใจได้
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-white text-[#1d1d1f] font-semibold px-8 py-3.5 rounded-full hover:bg-[#f5f5f7] transition-colors duration-200 text-sm"
            >
              ติดต่อเรา
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto border border-white/30 text-white font-medium px-8 py-3.5 rounded-full hover:border-white/60 hover:bg-white/5 transition-all duration-200 text-sm"
            >
              ดูบริการของเรา
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
