import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  popular?: boolean;
  new?: boolean;
}

export enum ToolCategory {
  ORGANIZE = 'Organize PDF',
  CONVERT_TO = 'Convert to PDF',
  CONVERT_FROM = 'Convert from PDF',
  SECURITY = 'Security',
  EDIT = 'Edit PDF',
  ADVANCED = 'Advanced',
}

export interface ProcessedFile {
  name: string;
  data: Uint8Array | string; // Base64 or raw bytes
  type: string;
}

export interface UserHistoryItem {
  id: string;
  toolName: string;
  timestamp: number;
  fileName: string;
}
