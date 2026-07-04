export type CodeType = 'Application' | 'Web Application' | 'Service Support';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type WorkPeriodUnit = 'Days' | 'Hours';
export type TaskStatus = 'New' | 'Todo' | 'InProgress' | 'Test' | 'Done';
export type DeploymentStatus = 'Wait Approve' | 'Wait Deploy' | 'Deployed';
export type IssueTag = 'Feature' | 'Bug' | 'Work' | 'Story' | 'Job' | 'Service';

export interface Issue {
  id: number;
  projectName: string;
  codeType: CodeType;
  detail?: string;
  githubLink?: string;
  issueCreateDate: string;
  priority: Priority;
  taskWorkPeriod?: number;
  taskWorkPeriodUnit?: WorkPeriodUnit;
  targetDate?: string;
  issuer?: string;
  developer?: string;
  tester?: string;
  taskStatus: TaskStatus;
  deploymentStatus: DeploymentStatus;
  anydesk?: string;
  teamViewer?: string;
  contractDetail?: string;
  tags?: string[];
  createdBy?: string;
  isCancelled: boolean;
  visibility?: 'all' | 'creator';
  createdAt: string;
  updatedAt: string;
}

export type CreateIssueDto = Omit<Issue, 'id' | 'isCancelled' | 'createdAt' | 'updatedAt'>;

export const CODE_TYPES: CodeType[] = ['Application', 'Web Application', 'Service Support'];
export const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
export const WORK_PERIOD_UNITS: WorkPeriodUnit[] = ['Days', 'Hours'];
export const TASK_STATUSES: TaskStatus[] = ['New', 'Todo', 'InProgress', 'Test', 'Done'];
export const DEPLOYMENT_STATUSES: DeploymentStatus[] = ['Wait Approve', 'Wait Deploy', 'Deployed'];
export const ISSUE_TAGS: IssueTag[] = ['Feature', 'Bug', 'Work', 'Story', 'Job', 'Service'];

export const PRIORITY_COLORS: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

export const TAG_COLORS: Record<IssueTag, string> = {
  Feature: 'bg-blue-100 text-blue-700',
  Bug: 'bg-red-100 text-red-700',
  Work: 'bg-amber-100 text-amber-700',
  Story: 'bg-emerald-100 text-emerald-700',
  Job: 'bg-violet-100 text-violet-700',
  Service: 'bg-cyan-100 text-cyan-700',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  New: 'bg-gray-100 text-gray-700',
  Todo: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Test: 'bg-yellow-100 text-yellow-700',
  Done: 'bg-green-100 text-green-700',
};
