export interface QuestionOption {
  questionId: string;
  questionOption: string;
  questionOptionContent: string;
  sortNum: number;
}

export interface Question {
  id: string;
  type: number; // 1: Single Choice, 3: True/False, 4: Programming
  title: string; // HTML content
  score: number;
  questionsOptionList?: QuestionOption[];
  referenceAnswer?: string;
  analyzeContent?: string; // Explanation
  questionsDetailDTO?: {
    testPointList?: {
      testCaseInput: string;
      testCaseOutput: string;
    }[];
    inputFormat?: string;
    outputFormat?: string;
    executionTimeLimit?: number;
    executionMemoryLimit?: number;
  };
}

export interface ExamPaperData {
  examTime: number;
  examinationPaperTitle: string;
  paperQuestionsVOS: Question[];
}

export interface ExamResponse {
  data: ExamPaperData;
  code: number;
  msg: string;
}

export type ExamCategory = 'CIE' | 'CCF'; // Chinese Institute of Electronics | China Computer Federation
export type ExamSubject = 'Graphical' | 'Python' | 'C++';

export interface ExamRoute {
  id: string;
  category: ExamCategory;
  subject: ExamSubject;
  level: number;
  title: string;
}
