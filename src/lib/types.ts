export type Language = 'python' | 'java' | 'cpp';

export interface CodeExecution {
  code: string;
  language: Language;
  input?: string;
}

export interface ExecutionResult {
  output: string;
  errors?: string;
  executionTime: number;
  memoryUsage: number;
  complexity?: ComplexityEstimate;
}

export interface ComplexityEstimate {
  time: string;
  space: string;
  explanation: string;
}

export interface AIFeedback {
  suggestions: CodeSuggestion[];
  overallQuality: number; // 1-10 scale
  summary: string;
}

export interface CodeSuggestion {
  type: 'performance' | 'readability' | 'security' | 'bestPractice';
  title: string;
  description: string;
  lineNumbers?: number[];
  severity: 'info' | 'warning' | 'critical';
  improvementCode?: string;
}

export interface ExecutionResponse {
  result: ExecutionResult;
  aiFeedback: AIFeedback;
}
