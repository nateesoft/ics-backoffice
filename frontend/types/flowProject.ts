export interface FlowProject {
  id: string;
  name: string;
  description: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowTemplate {
  templateId: string;
  name: string;
  description: string;
}
