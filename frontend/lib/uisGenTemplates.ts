import type { NavPosition } from '@/types/uisGen';

// UIs Gen's app-shell templates are rendered as plain React chrome (see
// components/uis-gen/ShellFrame.tsx), not as a JSONForms uiSchema tree — the shell itself has no
// form fields, only static/nav chrome + a content region that hosts a Content node's own
// JsonForms-rendered tree as a child. This file only holds the catalog metadata (which nav
// positions each template supports).
export interface UisGenTemplate {
  templateId: string;
  name: string;
  description: string;
  hasNav: boolean;
  navPositions: NavPosition[];
}

export const UISGEN_TEMPLATES: UisGenTemplate[] = [
  {
    templateId: 'sidebar-admin-v1',
    name: 'Sidebar Admin Dashboard',
    description: 'Layout มาตรฐานของระบบ Admin/Back-office — Appbar ด้านบน เมนูหลักเป็นแถบด้านข้าง และพื้นที่ Content ส่วนที่เหลือ',
    hasNav: true,
    navPositions: ['left', 'right', 'top'],
  },
  {
    templateId: 'top-nav-saas-v1',
    name: 'Top Navigation SaaS App',
    description: 'เมนูหลักอยู่แถบบนแบบแนวนอน พื้นที่ Content เต็มความกว้างด้านล่าง',
    hasNav: true,
    navPositions: ['top', 'bottom'],
  },
  {
    templateId: 'centered-auth-v1',
    name: 'Centered Auth / Onboarding',
    description: 'ไม่มีเมนู — การ์ด Content จัดกึ่งกลางหน้าจอ เหมาะกับ Login/Signup/Wizard',
    hasNav: false,
    navPositions: [],
  },
];

export function getUisGenTemplate(templateId: string): UisGenTemplate | null {
  return UISGEN_TEMPLATES.find(t => t.templateId === templateId) ?? null;
}
