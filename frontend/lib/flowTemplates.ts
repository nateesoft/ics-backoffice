import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import { FlowTemplate } from '@/types/flowProject';

// App-shell templates below are built only from node types the flow-generate UI builder
// actually understands (see components/flow-generate/ui-builder/{treeOps,customRenderers}.tsx):
// HorizontalLayout / VerticalLayout for structure, Label / Button for content. That keeps the
// cloned uiSchema fully editable in the drag-and-drop canvas, not just a static preview.
const EMPTY_SCHEMA: JsonSchema7 = { type: 'object', properties: {} };

type Style = Record<string, string | number>;

function text(value: string, className: string, style?: Style): UiSchemaNode {
  return { type: 'Label', text: value, options: { className, ...(style ? { style } : {}) } };
}

function btn(label: string, className: string, style?: Style): UiSchemaNode {
  return { type: 'Button', text: label, options: { variant: 'secondary', type: 'button', className, ...(style ? { style } : {}) } };
}

function row(className: string, elements: UiSchemaNode[], style?: Style): UiSchemaNode {
  return { type: 'HorizontalLayout', elements, options: { className: `flex flex-row ${className}`, ...(style ? { style } : {}) } };
}

function col(className: string, elements: UiSchemaNode[], style?: Style): UiSchemaNode {
  return { type: 'VerticalLayout', elements, options: { className: `flex flex-col ${className}`, ...(style ? { style } : {}) } };
}

function shell(elements: UiSchemaNode[]): UiSchemaNode {
  return col('min-h-screen bg-white', elements);
}

function logo(): UiSchemaNode {
  return row('items-center gap-2', [
    text('◆', 'text-xl leading-none text-indigo-600'),
    text('Company Logo', 'text-base font-bold text-slate-800'),
  ], { flex: '0 0 auto' });
}

function menuLink(label: string): UiSchemaNode {
  return text(label, 'px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition');
}

function topMenuLink(label: string): UiSchemaNode {
  return text(label, 'px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition');
}

function logoutButton(): UiSchemaNode {
  return btn('Logout', 'text-sm text-red-600 border-red-200 hover:bg-red-50');
}

function contentSlot(hint: string): UiSchemaNode {
  return col('flex-1 items-center justify-center p-6 overflow-auto bg-slate-50', [
    text(hint, 'text-sm text-slate-400 italic text-center'),
  ], { flex: '1 1 auto' });
}

function footerBar(note = '© 2026 Company Name. All rights reserved.'): UiSchemaNode {
  return row('items-center justify-center px-4 py-3 border-t border-slate-200 bg-white', [
    text(note, 'text-xs text-slate-400'),
  ]);
}

const CONTENT_HINT = '⬇️ พื้นที่นี้สำหรับแสดง Content จาก JsonForm ที่ออกแบบไว้ — ลาก Page/Component ที่สร้างไว้มาแทนที่ข้อความนี้';

// 1. Classic sidebar admin dashboard — the most common layout for internal/back-office tools
// worldwide (AdminLTE, Ant Design Pro, Material Dashboard, ...).
function sidebarAdminDashboard(): UiSchemaNode {
  const appbar = row('items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm', [
    logo(),
    row('items-center gap-3', [
      text('Welcome, Admin', 'text-sm text-slate-500'),
      logoutButton(),
    ], { flex: '0 0 auto', marginLeft: 'auto' }),
  ]);
  const sidebar = col('bg-white border-r border-slate-200 p-3 gap-1', [
    menuLink('📊 Dashboard'),
    menuLink('📁 Projects'),
    menuLink('✅ Tasks'),
    menuLink('📄 Reports'),
    menuLink('⚙️ Settings'),
  ], { flex: '0 0 14rem' });
  const body = row('flex-1', [sidebar, contentSlot(CONTENT_HINT)], { flex: '1 1 auto' });
  return shell([appbar, body, footerBar()]);
}

// 2. Top navigation SaaS app — main nav lives in the header bar itself, full-width content
// below (Linear, Stripe Dashboard, most modern SaaS products).
function topNavSaasApp(): UiSchemaNode {
  const nav = row('items-center gap-1', [
    topMenuLink('Dashboard'),
    topMenuLink('Projects'),
    topMenuLink('Billing'),
    topMenuLink('Settings'),
  ], { flex: '1 1 auto' });
  const appbar = row('items-center gap-4 px-4 py-3 bg-white border-b border-slate-200 shadow-sm', [
    logo(),
    nav,
    logoutButton(),
  ]);
  return shell([appbar, contentSlot(CONTENT_HINT)]);
}

// 3. Toolbar utility app — appbar + a classic File/Edit/View menu bar underneath, content
// fills the rest (desktop-tool feel, e.g. VS Code, internal admin utilities).
function toolbarUtilityApp(): UiSchemaNode {
  const appbar = row('items-center justify-between px-4 py-3 bg-white border-b border-slate-200', [
    logo(),
    logoutButton(),
  ]);
  const fileMenuBar = row('items-center gap-1 px-4 py-1.5 bg-slate-50 border-b border-slate-200', [
    topMenuLink('File'),
    topMenuLink('Edit'),
    topMenuLink('View'),
    topMenuLink('Tools'),
    topMenuLink('Help'),
  ]);
  return shell([appbar, fileMenuBar, contentSlot(CONTENT_HINT)]);
}

// 4. Master-detail split view — a list panel on the left, detail/content on the right
// (Gmail, Slack, Notion — the standard pattern for browsing + editing records).
function masterDetailSplit(): UiSchemaNode {
  const appbar = row('items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm', [
    logo(),
    row('items-center gap-3', [
      text('Welcome, Admin', 'text-sm text-slate-500'),
      logoutButton(),
    ], { flex: '0 0 auto', marginLeft: 'auto' }),
  ]);
  const fileMenuBar = row('items-center gap-1 px-4 py-1.5 bg-slate-50 border-b border-slate-200', [
    topMenuLink('File'),
    topMenuLink('New'),
    topMenuLink('Filter'),
  ]);
  const masterList = col('bg-white border-r border-slate-200 overflow-auto', [
    text('📄 Item 1 — รายละเอียดโดยย่อ...', 'block px-4 py-3 border-b border-slate-100 text-sm text-slate-600 hover:bg-indigo-50 cursor-pointer'),
    text('📄 Item 2 — รายละเอียดโดยย่อ...', 'block px-4 py-3 border-b border-slate-100 text-sm text-slate-600 hover:bg-indigo-50 cursor-pointer'),
    text('📄 Item 3 — รายละเอียดโดยย่อ...', 'block px-4 py-3 border-b border-slate-100 text-sm text-slate-600 hover:bg-indigo-50 cursor-pointer'),
  ], { flex: '0 0 18rem' });
  const detailPane = contentSlot('เลือกรายการด้านซ้ายเพื่อแสดงรายละเอียด หรือวาง Content จาก JsonForm ที่ออกแบบไว้ตรงนี้');
  const body = row('flex-1', [masterList, detailPane], { flex: '1 1 auto' });
  return shell([appbar, fileMenuBar, body]);
}

// 5. Centered auth / onboarding — single centered card, no side/top nav (Stripe Checkout,
// login/signup/wizard screens across most SaaS products).
function centeredAuthOnboarding(): UiSchemaNode {
  const appbar = row('items-center justify-center px-4 py-4 bg-white border-b border-slate-100', [logo()]);
  const card = col('items-center justify-center flex-1 p-6 bg-slate-50', [
    col('w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 gap-4', [
      text('ยินดีต้อนรับ', 'text-lg font-bold text-slate-800 text-center'),
      text(
        '⬇️ พื้นที่นี้สำหรับแสดง Content จาก JsonForm ที่ออกแบบไว้ (เช่นฟอร์ม Login, Signup หรือ Wizard) — ลาก Page/Component ที่สร้างไว้มาแทนที่ข้อความนี้',
        'text-sm text-slate-400 italic text-center'
      ),
    ]),
  ], { flex: '1 1 auto' });
  return shell([appbar, card, footerBar()]);
}

// Catalog of templates available for cloning into a new Flow Generate project.
// 'simple-crud-app-v1' mirrors the `templates` entry defined in web-generation.json (data CRUD
// pages/workflows, no shell to seed). The rest are app-shell layout templates: selecting one
// seeds the new project's Main Page UI with ready-to-edit chrome (appbar/menu/footer) plus a
// content slot where the project's own JsonForm-designed pages get dropped in.
export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    templateId: 'simple-crud-app-v1',
    name: 'Simple CRUD Application',
    description: 'Reusable CRUD template: list / search / view / create / update / delete for a single resource.',
  },
  {
    templateId: 'sidebar-admin-dashboard-v1',
    name: 'Sidebar Admin Dashboard',
    description: 'Layout มาตรฐานของระบบ Admin/Back-office ทั่วโลก (คล้าย AdminLTE, Ant Design Pro) — Appbar พร้อมโลโก้บริษัทและปุ่ม Logout, เมนูด้านซ้าย (Left Sidebar), Footer ด้านล่าง และพื้นที่แสดง Content ฝั่งขวาสำหรับ JsonForm ที่ออกแบบไว้',
    schema: EMPTY_SCHEMA,
    uiSchema: sidebarAdminDashboard(),
  },
  {
    templateId: 'top-nav-saas-app-v1',
    name: 'Top Navigation SaaS App',
    description: 'Layout แบบ Top Navigation ที่นิยมในแอป SaaS ยุคใหม่ (คล้าย Linear, Stripe Dashboard) — Appbar พร้อมโลโก้บริษัท เมนูหลักอยู่แถบบนแบบแนวนอน และพื้นที่ Content เต็มความกว้างด้านล่างสำหรับ JsonForm ที่ออกแบบไว้',
    schema: EMPTY_SCHEMA,
    uiSchema: topNavSaasApp(),
  },
  {
    templateId: 'toolbar-file-menu-app-v1',
    name: 'Toolbar Utility App',
    description: 'Layoutสไตล์ Desktop Tool / Utility App (คล้าย VS Code, โปรแกรมจัดการไฟล์) — Appbar พร้อมโลโก้และปุ่ม Logout, แถบเมนู File/Edit/View ด้านบน และพื้นที่ Content ด้านล่างเต็มความกว้างสำหรับ JsonForm ที่ออกแบบไว้',
    schema: EMPTY_SCHEMA,
    uiSchema: toolbarUtilityApp(),
  },
  {
    templateId: 'master-detail-split-v1',
    name: 'Master-Detail Split View',
    description: 'Layout แบบสองคอลัมน์ Master-Detail ที่นิยมในแอปจัดการข้อมูล (คล้าย Gmail, Slack, Notion) — Appbar พร้อมโลโก้และปุ่ม Logout, แถบเมนู File ด้านบน, รายการฝั่งซ้าย (List Panel) และพื้นที่แสดงรายละเอียด/Content จาก JsonForm ฝั่งขวา',
    schema: EMPTY_SCHEMA,
    uiSchema: masterDetailSplit(),
  },
  {
    templateId: 'centered-auth-onboarding-v1',
    name: 'Centered Auth / Onboarding',
    description: 'Layout แบบ Single Column จัดกึ่งกลาง ที่นิยมสำหรับหน้า Login, Signup หรือ Wizard/Onboarding (คล้าย Stripe Checkout, SaaS Onboarding) — Appbar พร้อมโลโก้บริษัทตรงกลาง และการ์ด Content ตรงกลางหน้าจอสำหรับ JsonForm ที่ออกแบบไว้ พร้อม Footer ด้านล่าง',
    schema: EMPTY_SCHEMA,
    uiSchema: centeredAuthOnboarding(),
  },
];

export function getFlowTemplate(templateId: string): FlowTemplate | null {
  return FLOW_TEMPLATES.find(t => t.templateId === templateId) ?? null;
}
