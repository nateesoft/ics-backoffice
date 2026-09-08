import Link from "next/link";
import ServiceCard from "@/components/site/ServiceCard";
import HeroHeading from "@/components/site/HeroHeading";

const services = [
  {
    id: "software",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "รับพัฒนาซอฟต์แวร์",
    titleEn: "Software Development",
    description: "พัฒนาซอฟต์แวร์ตามความต้องการ ครอบคลุมทั้ง Web, Mobile และ Desktop Application ด้วยทีมนักพัฒนามืออาชีพ",
    features: ["Web Application", "Mobile App (iOS/Android)", "API Integration"],
  },
  {
    id: "pos",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "ซอฟต์แวร์ POS",
    titleEn: "POS Software",
    description: "ระบบขายหน้าร้านที่ครบครัน รองรับการจัดการสต็อก รายงาน และการเชื่อมต่อกับอุปกรณ์ต่างๆ",
    features: ["ระบบจัดการสต็อก", "รายงานยอดขาย", "รองรับหลายสาขา"],
  },
  {
    id: "colo",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    title: "Colo ให้เช่า",
    titleEn: "Colocation Rental",
    description: "บริการ Colocation ในดาต้าเซ็นเตอร์มาตรฐาน พร้อมระบบรักษาความปลอดภัยและไฟฟ้าสำรอง 24 ชั่วโมง",
    features: ["Uptime 99.9%", "Network 1Gbps+", "24/7 Monitoring"],
    variant: "featured" as const,
  },
  {
    id: "server",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: "Server ให้บริการ",
    titleEn: "Server Services",
    description: "บริการ Dedicated Server และ Cloud Server ประสิทธิภาพสูง พร้อมทีมดูแลระบบตลอด 24 ชั่วโมง",
    features: ["Dedicated Server", "Cloud Hosting", "Managed Services"],
  },
  {
    id: "support",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Support ติดตั้งเครื่อง",
    titleEn: "Hardware Installation Support",
    description: "บริการติดตั้งและซ่อมบำรุงอุปกรณ์คอมพิวเตอร์ เซิร์ฟเวอร์ และอุปกรณ์เครือข่ายโดยช่างผู้เชี่ยวชาญ",
    features: ["ติดตั้ง On-site", "ซ่อมบำรุงประจำ", "รับประกันงาน"],
  },
  {
    id: "network",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    title: "วางระบบ LAN/WiFi",
    titleEn: "Network Setup: LAN/WiFi",
    description: "ออกแบบและติดตั้งระบบเครือข่ายทั้ง LAN และ WiFi สำหรับองค์กร รองรับผู้ใช้จำนวนมากด้วยความเสถียรสูง",
    features: ["Network Design", "WiFi Enterprise", "Firewall & Security"],
  },
];

const stats = [
  { value: "200+", label: "โปรเจกต์ที่สำเร็จ", labelEn: "Projects Completed" },
  { value: "10+", label: "ปีประสบการณ์", labelEn: "Years of Experience" },
  { value: "50+", label: "ลูกค้าที่ไว้วางใจ", labelEn: "Trusted Clients" },
  { value: "24/7", label: "การสนับสนุน", labelEn: "Support" },
];

const products = [
  {
    id: "server",
    name: "Server & Rack",
    nameEn: "Enterprise Server",
    description: "เซิร์ฟเวอร์ประสิทธิภาพสูงสำหรับองค์กร พร้อมระบบสำรองข้อมูลและ RAID",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=480&h=320&fit=crop&auto=format",
    badge: "Best Seller",
    badgeColor: "bg-[#1877f2]",
    href: "/services#server",
  },
  {
    id: "computer",
    name: "Computer & Workstation",
    nameEn: "Desktop & Laptop",
    description: "คอมพิวเตอร์และเวิร์กสเตชันสำหรับการทำงาน ทั้งในออฟฟิศและ Remote",
    image: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=480&h=320&fit=crop&auto=format",
    badge: "Popular",
    badgeColor: "bg-green-500",
    href: "/services#support",
  },
  {
    id: "printer",
    name: "Printer & Scanner",
    nameEn: "Office Equipment",
    description: "เครื่องพิมพ์และสแกนเนอร์ระดับองค์กร รองรับปริมาณงานสูงและเชื่อมต่อเครือข่าย",
    image: "https://images.unsplash.com/photo-1562077981-4d7eafd44932?w=480&h=320&fit=crop&auto=format",
    badge: "New",
    badgeColor: "bg-orange-500",
    href: "/services#support",
  },
  {
    id: "software",
    name: "Software & POS",
    nameEn: "Business Software",
    description: "ซอฟต์แวร์บริหารธุรกิจและระบบ POS ครบครัน ออกแบบเฉพาะสำหรับธุรกิจไทย",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=480&h=320&fit=crop&auto=format",
    badge: "Custom",
    badgeColor: "bg-purple-600",
    href: "/services#software",
  },
];

const featuredServices = [
  {
    id: "datacenter",
    label: "Infrastructure",
    title: "Data Center & Colocation",
    description:
      "ให้บริการพื้นที่ Colocation ในดาต้าเซ็นเตอร์มาตรฐาน Tier III พร้อมระบบไฟฟ้าสำรอง UPS และ Generator ระบบปรับอากาศแม่นยำ และระบบรักษาความปลอดภัยตลอด 24 ชั่วโมง",
    features: [
      "Uptime SLA 99.9%",
      "Redundant Power (N+1)",
      "Network Bandwidth 1Gbps+",
      "CCTV & Access Control 24/7",
      "Remote Hands Service",
    ],
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=700&h=480&fit=crop&auto=format",
    href: "/services#colo",
    imageLeft: false,
  },
  {
    id: "network",
    label: "Networking",
    title: "ระบบเครือข่าย LAN/WiFi องค์กร",
    description:
      "ออกแบบและติดตั้งระบบเครือข่ายองค์กรระดับ Enterprise ทั้ง Wired และ Wireless ด้วยอุปกรณ์คุณภาพสูงจาก Cisco, Aruba, และ Ubiquiti พร้อม Firewall และระบบรักษาความปลอดภัย",
    features: [
      "Network Design & Planning",
      "WiFi 6 Enterprise AP",
      "Firewall & Intrusion Prevention",
      "VLAN & Network Segmentation",
      "On-site Installation & Config",
    ],
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=700&h=480&fit=crop&auto=format",
    href: "/services#network",
    imageLeft: true,
  },
];

const testimonials = [
  {
    id: 1,
    name: "คุณสมชาย วิริยะกุล",
    role: "CEO",
    company: "TechRetail Co., Ltd.",
    avatar: "สว",
    avatarBg: "bg-blue-500",
    rating: 5,
    quote:
      "ICS ช่วยวาง Infrastructure ทั้งหมดให้บริษัทเรา ทั้ง Server, Network และ POS Software ทำงานได้อย่างราบรื่น ทีมงานมืออาชีพ ตอบสนองรวดเร็ว แก้ปัญหาได้ตรงจุด",
  },
  {
    id: 2,
    name: "คุณวราภรณ์ ศรีสมบูรณ์",
    role: "IT Manager",
    company: "MedSupply Thailand",
    avatar: "วร",
    avatarBg: "bg-purple-500",
    rating: 5,
    quote:
      "เราใช้บริการ Colocation และ Dedicated Server จาก ICS มากกว่า 3 ปีแล้ว ระบบเสถียรมาก Downtime แทบไม่มี ทีม Support พร้อมช่วยเหลือตลอด 24 ชั่วโมง",
  },
  {
    id: 3,
    name: "คุณธนพล อินทร์ทอง",
    role: "ผู้จัดการสาขา",
    company: "Golden Food Chain",
    avatar: "ธน",
    avatarBg: "bg-green-500",
    rating: 5,
    quote:
      "ระบบ POS ที่ ICS พัฒนาให้ ช่วยจัดการสต็อกและรายงานยอดขายได้ง่ายมาก รองรับ 5 สาขาได้อย่างไร้รอยต่อ ลดเวลาการทำงานได้มากกว่า 40%",
  },
  {
    id: 4,
    name: "คุณนภัสรา เจริญทรัพย์",
    role: "Operations Director",
    company: "Sirichai Group",
    avatar: "นภ",
    avatarBg: "bg-orange-500",
    rating: 5,
    quote:
      "ICS ออกแบบระบบ WiFi สำหรับออฟฟิศ 5 ชั้นให้เรา ครอบคลุมทุกพื้นที่ ไม่มีจุด Dead Zone เลย พนักงาน 200+ คนใช้งานพร้อมกันได้สบาย",
  },
  {
    id: 5,
    name: "คุณเอกพล รัตนมงคล",
    role: "Managing Director",
    company: "EK Logistics",
    avatar: "เอก",
    avatarBg: "bg-red-500",
    rating: 5,
    quote:
      "ทีม ICS มืออาชีพมาก ตั้งแต่การวางแผน การติดตั้ง จนถึงการ Support หลังการขาย ราคาสมเหตุสมผล คุ้มค่าคุ้มราคา แนะนำเลยครับ",
  },
  {
    id: 6,
    name: "คุณปิยะมาศ กิตติวรรณ",
    role: "Head of IT",
    company: "BlueStar Manufacturing",
    avatar: "ปิย",
    avatarBg: "bg-teal-500",
    rating: 5,
    quote:
      "เราให้ ICS ดูแลระบบ IT ทั้งหมดขององค์กร ตั้งแต่ Server, Network จนถึง Software ช่วยให้ทีม IT ภายในโฟกัสกับงาน Strategic ได้มากขึ้น",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-gradient-to-br from-[#1877f2] via-[#1565d8] to-[#0d47a1]">
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating background icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

          {/* Server */}
          <div className="absolute top-[14%] left-[7%] w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 anim-float-a hidden sm:flex">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>

          {/* Programmer / Code */}
          <div className="absolute top-[18%] right-[8%] w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 anim-float-b hidden sm:flex">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>

          {/* POS Terminal */}
          <div className="absolute top-[52%] left-[5%] w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 anim-float-c hidden md:flex">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Printer */}
          <div className="absolute top-[55%] right-[6%] w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/50 anim-float-d hidden sm:flex">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>

          {/* Software / App Window */}
          <div className="absolute bottom-[22%] left-[12%] w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/40 anim-float-e hidden md:flex">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Network / WiFi */}
          <div className="absolute bottom-[28%] right-[11%] w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/40 anim-float-f hidden md:flex">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>

          {/* Database */}
          <div className="absolute top-[35%] left-[2%] w-10 h-10 rounded-xl bg-white/8 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/30 anim-float-b hidden lg:flex">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 3.134 3 7 3s7-1 7-3V7M4 7c0 2 3.134 3 7 3s7-1 7-3M4 7c0-2 3.134-3 7-3s7 1 7 3" />
            </svg>
          </div>

          {/* Cloud Server */}
          <div className="absolute top-[30%] right-[2%] w-10 h-10 rounded-xl bg-white/8 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/30 anim-float-e hidden lg:flex">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>

        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 text-xs font-medium tracking-wide">
              In Concept Service — IT Solutions
            </span>
          </div>

          <HeroHeading />

          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed mb-10">
            ICS คือพาร์ทเนอร์ด้านเทคโนโลยีของคุณ ครอบคลุมตั้งแต่การพัฒนาซอฟต์แวร์
            โครงสร้างพื้นฐาน IT ไปจนถึงระบบเครือข่ายองค์กร
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/services"
              className="w-full sm:w-auto bg-white text-[#1877f2] font-semibold px-8 py-3.5 rounded-full hover:bg-[#e7f3ff] transition-colors duration-200 text-sm shadow-lg"
            >
              ดูบริการทั้งหมด
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-transparent text-white font-medium px-8 py-3.5 rounded-full border border-white/40 hover:border-white/70 hover:bg-white/10 transition-all duration-200 text-sm"
            >
              ปรึกษาฟรี
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#1c1e21] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={stat.value} className="text-center" data-animate="fade-up" data-delay={String(i * 100)}>
                <div className="text-4xl md:text-5xl font-bold text-[#1877f2] mb-2">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
                <div className="text-white/30 text-xs mt-0.5">{stat.labelEn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14" data-animate="fade-up">
            <p className="text-[#1877f2] text-sm font-semibold tracking-widest uppercase mb-3">Our Products</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1c1e21] leading-tight tracking-tight mb-4">
              สินค้าและอุปกรณ์
              <br />
              ของเรา
            </h2>
            <p className="text-[#65676b] text-lg leading-relaxed">
              จำหน่ายและติดตั้งอุปกรณ์ IT คุณภาพสูง คัดสรรสำหรับองค์กรทุกขนาด
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <Link
                key={product.id}
                href={product.href}
                className="group bg-[#f0f2f5] rounded-2xl overflow-hidden border border-[#dde0e4] hover:border-[#1877f2]/40 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300"
                data-animate="fade-up"
                data-delay={String(i * 80)}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-48">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                    {product.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-[#1c1e21] text-base mb-0.5 group-hover:text-[#1877f2] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[#1877f2] text-xs font-medium mb-2">{product.nameEn}</p>
                  <p className="text-[#65676b] text-sm leading-relaxed line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-[#1877f2] text-sm font-semibold">
                    ดูรายละเอียด
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-[#f0f2f5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14" data-animate="fade-up">
            <p className="text-[#1877f2] text-sm font-semibold tracking-widest uppercase mb-3">Our Services</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1c1e21] leading-tight tracking-tight mb-4">
              บริการครบวงจร
              <br />
              ด้านเทคโนโลยี
            </h2>
            <p className="text-[#65676b] text-lg leading-relaxed">
              เราพร้อมตอบสนองทุกความต้องการด้าน IT ขององค์กรคุณ ด้วยทีมผู้เชี่ยวชาญที่มีประสบการณ์กว่า 10 ปี
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <div key={service.id} data-animate="fade-up" data-delay={String((i % 3) * 80)}>
                <ServiceCard {...service} />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-[#1877f2] font-semibold hover:text-[#166fe5] transition-colors duration-200"
            >
              ดูรายละเอียดบริการทั้งหมด
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services with Images */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16" data-animate="fade-up">
            <p className="text-[#1877f2] text-sm font-semibold tracking-widest uppercase mb-3">Highlight Services</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1c1e21] leading-tight tracking-tight mb-4">
              บริการเด่น
              <br />
              ของเรา
            </h2>
            <p className="text-[#65676b] text-lg leading-relaxed">
              โซลูชันระดับองค์กรที่ออกแบบมาเพื่อตอบโจทย์ธุรกิจของคุณโดยเฉพาะ
            </p>
          </div>

          <div className="flex flex-col gap-20">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${service.imageLeft ? "lg:flex lg:flex-row-reverse" : ""}`}
              >
                {/* Text */}
                <div className={service.imageLeft ? "lg:pl-4" : "lg:pr-4"} data-animate={service.imageLeft ? "fade-right" : "fade-left"}>
                  <span className="inline-block text-[#1877f2] text-xs font-bold tracking-widest uppercase bg-[#e7f3ff] px-3 py-1 rounded-full mb-4">
                    {service.label}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold text-[#1c1e21] leading-tight tracking-tight mb-4">
                    {service.title}
                  </h3>
                  <p className="text-[#65676b] text-base leading-relaxed mb-6">{service.description}</p>
                  <ul className="space-y-2.5 mb-8">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[#1c1e21] text-sm">
                        <div className="w-5 h-5 rounded-full bg-[#e7f3ff] flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-[#1877f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-2 bg-[#1877f2] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#166fe5] transition-colors duration-200 text-sm shadow-md shadow-blue-200"
                  >
                    ดูรายละเอียด
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Image */}
                <div className={`relative ${service.imageLeft ? "lg:order-first" : ""}`} data-animate={service.imageLeft ? "fade-left" : "fade-right"} data-delay="100">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-72 md:h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#1877f2]/20 to-transparent" />
                  </div>
                  {/* Decorative dot grid */}
                  <div
                    className={`absolute -z-10 w-48 h-48 opacity-20 ${service.imageLeft ? "-left-6 -bottom-6" : "-right-6 -bottom-6"}`}
                    style={{
                      backgroundImage: "radial-gradient(#1877f2 1.5px, transparent 1.5px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-[#f0f2f5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#1877f2] text-sm font-semibold tracking-widest uppercase mb-3">Why ICS</p>
              <h2 className="text-4xl md:text-5xl font-bold text-[#1c1e21] leading-tight tracking-tight mb-6">
                ทำไมต้องเลือก
                <br />
                ICS?
              </h2>
              <p className="text-[#65676b] text-lg leading-relaxed mb-8">
                เราไม่ได้เป็นแค่ผู้ให้บริการ แต่เราคือพาร์ทเนอร์ที่เข้าใจธุรกิจของคุณ
                และพร้อมเดินหน้าไปพร้อมกัน
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-[#1877f2] text-white font-semibold px-7 py-3 rounded-full hover:bg-[#166fe5] transition-colors duration-200 text-sm shadow-md shadow-blue-200"
              >
                เรียนรู้เพิ่มเติมเกี่ยวกับเรา
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: "เชื่อถือได้",
                  desc: "ให้บริการด้วยมาตรฐานระดับองค์กร พร้อม SLA ที่ชัดเจน",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: "รวดเร็ว",
                  desc: "ทีมงานพร้อมตอบสนองและแก้ไขปัญหาได้ทันที",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: "ทีมผู้เชี่ยวชาญ",
                  desc: "นักพัฒนาและวิศวกรที่มีประสบการณ์ตรงมากกว่า 10 ปี",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "คุ้มค่า",
                  desc: "ราคาโปร่งใส ไม่มีค่าใช้จ่ายซ่อนเร้น",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 border border-[#dde0e4] hover:border-[#1877f2]/30 hover:shadow-md hover:shadow-blue-50 transition-all duration-200"
                  data-animate="fade-up"
                  data-delay={String(i * 90)}
                >
                  <div className="w-10 h-10 bg-[#e7f3ff] rounded-xl flex items-center justify-center text-[#1877f2] mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-[#1c1e21] mb-2">{item.title}</h3>
                  <p className="text-[#65676b] text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#1c1e21] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[#1877f2] text-sm font-semibold tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              เสียงจาก
              <br />
              ลูกค้าของเรา
            </h2>
            <p className="text-white/55 text-lg leading-relaxed">
              ความไว้วางใจจากลูกค้ากว่า 50 องค์กร คือสิ่งที่เราภาคภูมิใจที่สุด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-200 flex flex-col"
                data-animate="fade-up"
                data-delay={String((i % 3) * 80)}
              >
                {/* Stars */}
                <StarRating count={t.rating} />

                {/* Quote */}
                <blockquote className="mt-4 text-white/80 text-sm leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 pt-5 border-t border-white/10">
                  <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-white/45 text-xs mt-0.5">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall rating summary */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 py-8 border-t border-white/10">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-1">5.0</div>
              <StarRating count={5} />
              <div className="text-white/45 text-xs mt-1.5">คะแนนเฉลี่ยจากลูกค้า</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1877f2] mb-1">50+</div>
              <div className="text-white/60 text-sm">องค์กรที่ไว้วางใจ ICS</div>
              <div className="text-white/30 text-xs mt-0.5">Trusted Organizations</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1877f2] mb-1">98%</div>
              <div className="text-white/60 text-sm">ลูกค้าต่ออายุสัญญา</div>
              <div className="text-white/30 text-xs mt-0.5">Contract Renewal Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-[#1877f2] via-[#1565d8] to-[#0d47a1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
            พร้อมยกระดับ
            <br />
            ธุรกิจของคุณแล้วหรือยัง?
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            ติดต่อเราวันนี้เพื่อรับคำปรึกษาฟรี และค้นพบว่าเราจะช่วยให้ธุรกิจของคุณเติบโตได้อย่างไร
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-white text-[#1877f2] font-semibold px-8 py-3.5 rounded-full hover:bg-[#e7f3ff] transition-colors duration-200 text-sm shadow-lg"
            >
              ติดต่อเราวันนี้
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto border border-white/40 text-white font-medium px-8 py-3.5 rounded-full hover:border-white/70 hover:bg-white/10 transition-all duration-200 text-sm"
            >
              ดูบริการทั้งหมด
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
