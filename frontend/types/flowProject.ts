export type CssFramework = 'tailwind' | 'bootstrap' | 'css-modules' | 'plain-css';
export type SupportedLanguage = 'en' | 'th';
export type FrontendFramework = 'NextJS' | 'ReactJS' | 'VueJS' | 'Angular';
export type BackendFramework = 'NestJS' | 'NodeJS' | 'Java Springboot' | 'Python' | 'Golang';
export type DatabaseType = 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQLite';
export type ThemeMode = 'light' | 'dark';

export const CSS_FRAMEWORKS: CssFramework[] = ['tailwind', 'bootstrap', 'css-modules', 'plain-css'];
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'th'];
export const FRONTEND_FRAMEWORKS: FrontendFramework[] = ['NextJS', 'ReactJS', 'VueJS', 'Angular'];
export const BACKEND_FRAMEWORKS: BackendFramework[] = ['NestJS', 'NodeJS', 'Java Springboot', 'Python', 'Golang'];
export const DATABASES: DatabaseType[] = ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'];
export const THEMES: ThemeMode[] = ['light', 'dark'];
export const CURRENCY_FORMATS = ['THB', 'USD', 'EUR', 'JPY', 'GBP'];
export const DATE_FORMATS = ['DD/MM/YYYY HH:mm:ss', 'MM/DD/YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss'];

export interface FlowProject {
  id: string;
  name: string;
  description: string;
  templateId: string;
  cssFramework: CssFramework;
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  formatDate: string;
  currencyFormat: string;
  frontendFramework: FrontendFramework;
  backendFramework: BackendFramework;
  database: DatabaseType;
  theme: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export interface FlowTemplate {
  templateId: string;
  name: string;
  description: string;
}
