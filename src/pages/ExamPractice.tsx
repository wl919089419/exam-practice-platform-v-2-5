import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockExamData } from '@/data/mockExam';
import { Question, QuestionOption } from '@/types';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

// Declare Pyodide types
declare global {
  interface Window {
    loadPyodide: any;
  }
}

import { loader } from '@monaco-editor/react';

// Configure Monaco loader to use local files if possible, or fallback to a reliable CDN
// For strict local offline usage, users should copy `node_modules/monaco-editor/min/vs` to `public/monaco/vs`
loader.config({ paths: { vs: '/monaco/vs' } });

export default function ExamPractice() {
  const { category, subject, level, filename } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [programmingStatus, setProgrammingStatus] = useState<Record<string, boolean>>({});
  const [pyodide, setPyodide] = useState<any>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    expected: string;
    actual: string;
    index: number;
  }[] | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [score, setScore] = useState(0);

  const [customInput, setCustomInput] = useState('');
  
  // Refs for input handling to avoid re-registering Pyodide modules
  const inputDataRef = useRef<string[]>([]);
  const inputIndexRef = useRef(0);

  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isScratchEditorOpen, setIsScratchEditorOpen] = useState(false);
  const [isScratchQuestionOpen, setIsScratchQuestionOpen] = useState(false);
  const [openedScratchEditors, setOpenedScratchEditors] = useState<Record<string, boolean>>({});
  const [enlargedImageSrc, setEnlargedImageSrc] = useState<string | null>(null);

  // Exam Data State
  const [examData, setExamData] = useState<any>(location.state?.examData || (filename ? null : mockExamData.data));
  const [isLoadingExam, setIsLoadingExam] = useState(!!filename && !location.state?.examData);

  const questions = React.useMemo(() => {
    const rawQuestions = examData?.paperQuestionsVOS || [];
    return rawQuestions.map((q: any) => {
      if ((q.type === 1 || q.type === 2 || q.type === 3) && (!q.score || q.score === 0)) {
        return { ...q, score: 2 };
      }
      return q;
    });
  }, [examData]);
  const currentQuestion = questions[currentQuestionIndex];

  const isGraphical = location.state?.examInfo?.subject === 'Graphical' || subject === 'Graphical' || examData?.examinationPaperTitle?.includes('图形化');
  const isCpp = location.state?.examInfo?.subject === 'C++' || subject === 'C++' || examData?.examinationPaperTitle?.includes('C++');

  // Handle image clicks for enlargement
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setEnlargedImageSrc((target as HTMLImageElement).src);
    }
  };

  // Fetch exam data if filename is present and data not in state
  useEffect(() => {
    if (filename && !location.state?.examData) {
        setIsLoadingExam(true);
        fetch(`/exams/${filename}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load exam file");
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                  return res.json();
                } else {
                  throw new Error("Invalid content type, expected JSON");
                }
            })
            .then(json => {
                // Handle different JSON structures
                let validData = null;
                if (json.data && Array.isArray(json.data.paperQuestionsVOS)) {
                    validData = json.data;
                } else if (Array.isArray(json.paperQuestionsVOS)) {
                    validData = json;
                }
                
                if (validData) {
                    setExamData(validData);
                } else {
                    console.error("Invalid exam data format");
                }
                setIsLoadingExam(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingExam(false);
            });
    }
  }, [filename, location.state]);

  // Initialize Pyodide
  useEffect(() => {
    async function initPyodide() {
      try {
        if (window.loadPyodide && !pyodide) {
          const py = await window.loadPyodide({
            indexURL: "/pyodide/"
          });
          
          // Register input module once
          py.registerJsModule("js_input", {
            input: () => {
              const inputs = inputDataRef.current;
              const index = inputIndexRef.current;
              if (index < inputs.length) {
                inputIndexRef.current++;
                return inputs[index];
              }
              return null;
            }
          });
          
          setPyodide(py);
          setIsPyodideLoading(false);
        }
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setIsPyodideLoading(false);
      }
    }
    initPyodide();
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;

    // Reset state when question changes
    setTestResults(null);
    setOutput('');
    setCustomInput(''); // Reset custom input
    
    // Reset code when question changes if it's a programming question
    if (currentQuestion.type === 4) {
        if (codeAnswers[currentQuestion.id]) {
            setCode(codeAnswers[currentQuestion.id]);
        } else {
            // Basic template based on subject
            if (isCpp) {
                setCode(currentQuestion.questionsDetailDTO?.inputFormat ? 
                    `// 输入格式: ${currentQuestion.questionsDetailDTO.inputFormat}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // 在此处编写代码\n    cout << "Hello World" << endl;\n    return 0;\n}` : 
                    `#include <iostream>\nusing namespace std;\n\nint main() {\n    // 在此处编写代码\n    cout << "Hello World" << endl;\n    return 0;\n}`);
            } else {
                setCode(currentQuestion.questionsDetailDTO?.inputFormat ? 
                    `# 输入格式: ${currentQuestion.questionsDetailDTO.inputFormat}\n# 在此处编写代码\n` : 
                    `def main():\n    # 在此处编写代码\n    print("Hello World")\n\nif __name__ == "__main__":\n    main()`);
            }
        }
    }
  }, [currentQuestionIndex, currentQuestion, subject]);

  if (isLoadingExam) {
      return (
          <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">正在加载试卷...</p>
              </div>
          </div>
      );
  }

  if (!examData) {
      return (
          <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                  <p className="text-red-500 mb-4">试卷加载失败或不存在</p>
                  <Button onClick={() => navigate('/exams')}>返回列表</Button>
              </div>
          </div>
      );
  }

  if (!currentQuestion) {
      return (
          <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                  <p className="text-red-500 mb-4">试卷数据异常或题目为空</p>
                  <Button onClick={() => navigate('/exams')}>返回列表</Button>
              </div>
          </div>
      );
  }

  const handleRunCode = async () => {
    if (!code) return;
    
    if (!isCpp && !pyodide) return;

    setIsRunning(true);
    setOutput('运行中...');
    setTestResults(null);
    
    try {
        // Prepare input from customInput
        const inputs = customInput.split(/\r?\n/);
        // Remove trailing empty line if it's an artifact of splitting (e.g. "5\n" -> ["5", ""])
        if (inputs.length > 0 && inputs[inputs.length - 1] === '') {
            inputs.pop();
        }
        
        if (isCpp) {
            // Run C++ code using Wandbox API
            const response = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    compiler: 'gcc-head',
                    code: code,
                    stdin: customInput
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== "0" && result.compiler_error) {
                setOutput(result.compiler_error);
            } else {
                let out = "";
                if (result.program_output) out += result.program_output;
                if (result.program_error) out += result.program_error;
                setOutput(out || '运行成功，无输出');
            }
            
        } else {
            // Run Python code
            // Update refs for the pre-registered module to use
            inputDataRef.current = inputs;
            inputIndexRef.current = 0;

            const pythonWrapper = `
import js_input
import sys

# Mock input
def input(prompt=""):
    val = js_input.input()
    if val is None:
        raise EOFError("EOFError: End of input. Your code tried to read more input than provided in the 'Input Data' box.")
    return str(val)

# Capture stdout
class CatchOut:
    def __init__(self):
        self.value = ""
    def write(self, txt):
        self.value += txt
    def flush(self):
        pass

old_stdout = sys.stdout
sys.stdout = CatchOut()
old_stderr = sys.stderr
sys.stderr = CatchOut()

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(e)

output = sys.stdout.value
error = sys.stderr.value
sys.stdout = old_stdout
sys.stderr = old_stderr
output + error
`;
            const runOutput = await pyodide.runPythonAsync(pythonWrapper);
            setOutput(runOutput);
        }

    } catch (error: any) {
        setOutput(`执行错误: ${error.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isSubmitted) return; // Prevent changes after submission
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
    
    // Auto-advance for choice/true-false questions if not the last question
    if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
        }, 300);
    }
  };

  const handleSubmit = () => {
    let totalScore = 0;
    questions.forEach((q: any) => {
        if (q.type === 4) {
            if (programmingStatus[q.id]) {
                totalScore += q.score;
            }
        } else {
            if (answers[q.id] === q.referenceAnswer) {
                totalScore += q.score;
            }
        }
    });
    setScore(totalScore);
    setIsSubmitted(true);
    setIsResultModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title="考试结果">
        <div className="space-y-4">
            <div className="text-center py-6">
                <div className="text-4xl font-bold text-primary mb-2">{score} 分</div>
                <p className="text-muted-foreground">总分: {questions.reduce((acc: number, q: any) => acc + q.score, 0)} 分</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded">
                    <div className="font-semibold mb-1">选择/判断题</div>
                    <div>正确: {questions.filter((q: any) => q.type !== 4 && answers[q.id] === q.referenceAnswer).length} / {questions.filter((q: any) => q.type !== 4).length}</div>
                </div>
                <div className="bg-muted p-3 rounded">
                    <div className="font-semibold mb-1">编程题</div>
                    <div>通过: {Object.values(programmingStatus).filter(Boolean).length} / {questions.filter((q: any) => q.type === 4).length}</div>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsResultModalOpen(false)}>查看详情</Button>
                <Button onClick={() => navigate('/exams')}>返回列表</Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isOverviewOpen} onClose={() => setIsOverviewOpen(false)} title="题目总览">
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {questions.map((q: any, idx: number) => {
                const isAnswered = q.type === 4 
                    ? (codeAnswers[q.id] && codeAnswers[q.id].trim().length > 0)
                    : (answers[q.id] !== undefined);
                
                let variant = "outline";
                let className = "";
                
                if (currentQuestionIndex === idx) {
                    variant = "default";
                    className = "ring-2 ring-offset-2 ring-primary";
                } else if (isSubmitted) {
                    // Check correctness after submission
                    let isCorrect = false;
                    if (q.type === 4) {
                        isCorrect = !!programmingStatus[q.id];
                    } else {
                        isCorrect = answers[q.id] === q.referenceAnswer;
                    }
                    
                    if (isCorrect) {
                        variant = "secondary";
                        className = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
                    } else {
                        variant = "secondary";
                        className = "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
                    }
                } else if (isAnswered) {
                    variant = "secondary";
                    className = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
                }

                return (
                    <Button
                        key={q.id}
                        variant={variant as any}
                        className={cn(
                            "w-full h-10 p-0 font-medium",
                            className
                        )}
                        onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setIsOverviewOpen(false);
                        }}
                    >
                        {idx + 1}
                    </Button>
                );
            })}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span>当前</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
                    <span>已答</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-background border"></div>
                    <span>未答</span>
                </div>
            </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-4 bg-card p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-xl font-bold">{examData.examinationPaperTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {category} - {subject} - {level}级 | 第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsOverviewOpen(true)}
            className="flex lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
            题目总览
          </Button>
          <Button 
            variant="default" 
            className="bg-blue-600 hover:bg-blue-700 font-bold text-white"
            onClick={handleSubmit}
            disabled={isSubmitted}
          >
            提交试卷
          </Button>
          <div className="w-px h-8 bg-border mx-2"></div>
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            上一题
          </Button>
          <Button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            下一题
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-6">
        {/* Desktop Overview Sidebar */}
        <Card className="hidden lg:flex flex-col w-64 border-t-4 border-t-purple-500 shadow-md">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                    题目列表
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-2">
                    {questions.map((q: any, idx: number) => {
                        const isAnswered = q.type === 4 
                            ? (codeAnswers[q.id] && codeAnswers[q.id].trim().length > 0)
                            : (answers[q.id] !== undefined);
                        
                        let variant = "default"; // Default is Unanswered (Blue/Primary)
                        let className = "";
                        
                        // Determine base status
                        if (isSubmitted) {
                            let isCorrect = false;
                            if (q.type === 4) {
                                isCorrect = !!programmingStatus[q.id];
                            } else {
                                isCorrect = answers[q.id] === q.referenceAnswer;
                            }
                            
                            if (isCorrect) {
                                variant = "secondary";
                                className = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
                            } else {
                                variant = "secondary";
                                className = "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
                            }
                        } else if (isAnswered) {
                            variant = "secondary";
                            className = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
                        }

                        // Apply Current style (Outline + Ring)
                        if (currentQuestionIndex === idx) {
                            // If it has a status color, keep it but add ring
                            if (variant === "secondary") {
                                className = cn(className, "ring-2 ring-offset-2 ring-primary");
                            } else {
                                // If it was default (Unanswered), make it Outline for "Current"
                                variant = "outline";
                                className = "ring-2 ring-offset-2 ring-primary";
                            }
                        }

                        return (
                            <Button
                                key={q.id}
                                variant={variant as any}
                                className={cn(
                                    "w-full h-9 p-0 font-medium text-xs",
                                    className
                                )}
                                onClick={() => setCurrentQuestionIndex(idx)}
                            >
                                {idx + 1}
                            </Button>
                        );
                    })}
                </div>
                
                <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-background border border-primary"></div>
                        <span>当前题目</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
                        <span>已答题目</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span>未答题目</span>
                    </div>
                    {isSubmitted && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
                            <span>错误题目</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Question Panel */}
        <Card className="flex flex-col h-full overflow-hidden border-t-4 border-t-blue-500">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center justify-between">
                <span className="text-lg">第 {currentQuestionIndex + 1} 题</span>
                <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                    {currentQuestion.type === 1 ? '单选题' : 
                     currentQuestion.type === 3 ? '判断题' : '编程题'} 
                    {' '}({currentQuestion.score} 分)
                </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            <div 
                className="prose prose-slate dark:prose-invert max-w-none mb-8 cursor-pointer [&_img]:cursor-zoom-in [&_img]:hover:opacity-90 [&_img]:transition-opacity"
                dangerouslySetInnerHTML={{ __html: currentQuestion.title }}
                onClick={handleContentClick}
            />

            {/* Options for Choice/True-False */}
            {(currentQuestion.type === 1 || currentQuestion.type === 3) && (
              <div className="space-y-3">
                {currentQuestion.questionsOptionList ? (
                    currentQuestion.questionsOptionList.map((opt: QuestionOption) => {
                        const isSelected = answers[currentQuestion.id] === opt.questionOption;
                        const isCorrect = currentQuestion.referenceAnswer === opt.questionOption;
                        
                        let optionClass = "border-transparent bg-muted/30";
                        if (isSubmitted) {
                            if (isCorrect) {
                                optionClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                            } else if (isSelected) {
                                optionClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                            }
                        } else if (isSelected) {
                            optionClass = "border-primary bg-primary/5 ring-1 ring-primary";
                        }

                        return (
                        <div 
                            key={opt.sortNum}
                            className={cn(
                                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                                optionClass
                            )}
                            onClick={() => handleOptionSelect(opt.questionOption)}
                        >
                            <div className={cn(
                                "font-bold mr-4 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors shrink-0",
                                isSubmitted 
                                    ? (isCorrect ? "bg-green-500 text-white border-green-500" : (isSelected ? "bg-red-500 text-white border-red-500" : "bg-background border-muted-foreground/30 text-muted-foreground"))
                                    : (isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted-foreground/30 text-muted-foreground")
                            )}>
                                {opt.questionOption}
                            </div>
                            <div 
                                className="flex-1 overflow-hidden [&_img]:cursor-zoom-in [&_img]:hover:opacity-90 [&_img]:transition-opacity" 
                                dangerouslySetInnerHTML={{ __html: opt.questionOptionContent }} 
                                onClick={(e) => {
                                    // If an image was clicked, handle enlargement but don't select the option
                                    if ((e.target as HTMLElement).tagName === 'IMG') {
                                        e.stopPropagation();
                                        handleContentClick(e);
                                    }
                                }}
                            />
                        </div>
                        );
                    })
                ) : (
                    // Fallback for True/False
                    ['正确', '错误'].map((opt, idx) => {
                        const optionValue = idx === 0 ? '1' : '0'; // Assuming '1' is True, '0' is False based on mock data
                        const isSelected = answers[currentQuestion.id] === optionValue;
                        const isCorrect = currentQuestion.referenceAnswer === optionValue;

                        let optionClass = "border-transparent bg-muted/30";
                        if (isSubmitted) {
                            if (isCorrect) {
                                optionClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                            } else if (isSelected) {
                                optionClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                            }
                        } else if (isSelected) {
                            optionClass = "border-primary bg-primary/5 ring-1 ring-primary";
                        }

                        return (
                         <div 
                            key={idx}
                            className={cn(
                                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                                optionClass
                            )}
                            onClick={() => handleOptionSelect(optionValue)}
                        >
                            <div className={cn(
                                "font-bold mr-4 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                                isSubmitted 
                                    ? (isCorrect ? "bg-green-500 text-white border-green-500" : (isSelected ? "bg-red-500 text-white border-red-500" : "bg-background border-muted-foreground/30 text-muted-foreground"))
                                    : (isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted-foreground/30 text-muted-foreground")
                            )}>
                                {idx === 0 ? 'T' : 'F'}
                            </div>
                            <div className="flex-1">{opt}</div>
                        </div>
                        );
                    })
                )}
              </div>
            )}

            {/* Explanation Section */}
            {isSubmitted && (
                <div className="mt-8 p-6 bg-muted/50 rounded-xl border-2 border-muted">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
                        试题解析
                    </h3>
                    
                    {(currentQuestion.type === 1 || currentQuestion.type === 3) && (
                        <div className="mb-4 p-3 bg-background rounded-lg border">
                            <span className="font-semibold text-muted-foreground mr-2">正确答案:</span>
                            <span className="font-bold text-green-600 text-lg">
                                {currentQuestion.type === 3 
                                    ? (currentQuestion.referenceAnswer === '1' ? '正确 (T)' : '错误 (F)')
                                    : currentQuestion.referenceAnswer}
                            </span>
                        </div>
                    )}

                    {currentQuestion.analyzeContent ? (
                        <div 
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: currentQuestion.analyzeContent }}
                        />
                    ) : (
                        <p className="text-muted-foreground italic">暂无解析</p>
                    )}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Editor/Output Panel (Only for Programming Questions) */}
        {currentQuestion.type === 4 ? (
          isGraphical ? (
            <Card className="flex flex-col h-full overflow-hidden min-h-0 border-t-4 border-t-orange-500 shadow-md">
              <CardHeader className="py-2 px-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                <span className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Scratch 3 编程环境
                </span>
              </CardHeader>
              <div className="flex-1 flex items-center justify-center bg-muted/10">
                <div className="text-center space-y-6 p-8">
                    <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">进入 Scratch 3 编程</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            点击下方按钮进入全屏 Scratch 3 编程环境。在编程环境中，你可以随时查看题目要求。
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Button 
                            size="lg" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 shadow-md"
                            onClick={() => {
                                setOpenedScratchEditors(prev => ({...prev, [currentQuestion.id]: true}));
                                setIsScratchEditorOpen(true);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            开始编程
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline"
                            onClick={() => {
                                setProgrammingStatus(prev => ({...prev, [currentQuestion.id]: true}));
                                setCodeAnswers(prev => ({...prev, [currentQuestion.id]: "已在 Scratch 环境中完成"}));
                            }}
                            className={programmingStatus[currentQuestion.id] ? "bg-green-100 text-green-700 border-green-200" : ""}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M20 6 9 17l-5-5"/></svg>
                            {programmingStatus[currentQuestion.id] ? "已标记完成" : "标记为完成"}
                        </Button>
                    </div>
                </div>
              </div>
            </Card>
          ) : (
          <div className="flex flex-col h-full gap-4 min-h-0">
            <Card className={`flex-1 flex flex-col overflow-hidden min-h-0 border-t-4 shadow-md ${isCpp ? 'border-t-purple-500' : 'border-t-yellow-500'}`}>
              <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                <span className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isCpp ? 'text-purple-600' : 'text-yellow-600'}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    代码编辑器 ({isCpp ? 'C++' : 'Python'})
                </span>
                <div className="flex items-center gap-2">
                    {isPyodideLoading && !isCpp && <span className="text-xs text-muted-foreground">加载环境中...</span>}
                    <Button size="sm" onClick={handleRunCode} disabled={isRunning || (isPyodideLoading && !isCpp)} className="bg-green-600 hover:bg-green-700 text-white">
                    {isRunning ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            运行中...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            运行代码
                        </>
                    )}
                    </Button>
                </div>
              </CardHeader>
              <div className="flex-1 min-h-0 relative">
                <Editor
                  height="100%"
                  language={isCpp ? 'cpp' : 'python'}
                  value={code}
                  onChange={(value) => {
                    const newCode = value || '';
                    setCode(newCode);
                    setCodeAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: newCode
                    }));
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                  }}
                />
              </div>
            </Card>
            
            <div className="h-1/3 flex gap-4 min-h-0">
                <Card className="flex-1 flex flex-col overflow-hidden min-h-0 border-t-4 border-t-blue-500 shadow-md">
                    <CardHeader className="py-2 px-4 border-b bg-muted/30">
                        <span className="font-medium text-sm">输入数据</span>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <textarea
                            className="w-full h-full p-4 bg-background resize-none focus:outline-none font-mono text-sm"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="在此输入测试数据..."
                        />
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col overflow-hidden min-h-0 border-t-4 border-t-slate-500 shadow-md">
                    <CardHeader className="py-2 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                            运行输出
                        </span>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-auto bg-[#1e1e1e] text-slate-300 font-mono text-sm">
                        <pre className="p-4 whitespace-pre-wrap">{output || '等待运行...'}</pre>
                    </CardContent>
                </Card>
            </div>
          </div>
          )
        ) : (
            <Card className="flex items-center justify-center text-muted-foreground bg-muted/10 border-dashed">
                <div className="text-center">
                    <p>请在左侧选择答案</p>
                </div>
            </Card>
        )}
      </div>
      </div>

      {/* Full-screen Scratch Editor Overlay - Rendered but hidden to preserve state */}
      <div className={cn(
        "fixed inset-0 z-50 flex flex-col bg-white transition-opacity duration-200",
        isScratchEditorOpen ? "opacity-100" : "opacity-0 pointer-events-none hidden"
      )}>
        {/* Top Bar Overlay */}
        <div className="h-12 bg-orange-500 text-white flex items-center justify-between px-4 shadow-md shrink-0">
           <div className="flex items-center gap-4">
              <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 hover:text-white" 
                  onClick={() => setIsScratchEditorOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
                返回试卷
              </Button>
              <span className="font-bold hidden sm:inline">Scratch 3 编程环境</span>
           </div>
           <div className="flex items-center gap-2">
              <Button 
                  variant="secondary" 
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold"
                  onClick={() => setIsScratchQuestionOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                查看题目
              </Button>
           </div>
        </div>

        {/* Scratch Iframes - Render one per graphical programming question that has been opened */}
        <div className="flex-1 w-full relative">
          {questions.map((q: any) => {
            if (q.type !== 4 || !isGraphical) return null;
            if (!openedScratchEditors[q.id]) return null;

            return (
              <iframe 
                key={q.id}
                src="https://codingclip.com/editor" 
                className={cn(
                  "absolute inset-0 w-full h-full border-0",
                  currentQuestion?.id === q.id ? "block" : "hidden"
                )}
                allow="camera; microphone"
                title={`Scratch 3 Editor - ${q.id}`}
              />
            );
          })}
        </div>

        {/* Question Modal inside Scratch Editor */}
        <Modal isOpen={isScratchQuestionOpen} onClose={() => setIsScratchQuestionOpen(false)} title={`第 ${currentQuestionIndex + 1} 题`}>
          <div className="max-h-[70vh] overflow-y-auto p-2">
              <div 
                  className="prose prose-slate max-w-none dark:prose-invert cursor-pointer [&_img]:cursor-zoom-in [&_img]:hover:opacity-90 [&_img]:transition-opacity"
                  dangerouslySetInnerHTML={{ __html: currentQuestion?.title || '' }}
                  onClick={handleContentClick}
              />
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t">
              <Button onClick={() => setIsScratchQuestionOpen(false)}>关闭</Button>
          </div>
        </Modal>
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImageSrc && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setEnlargedImageSrc(null)}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src={enlargedImageSrc} 
                    alt="Enlarged view" 
                    className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-md shadow-2xl scale-150 transform origin-center"
                    style={{ minWidth: '50vw' }}
                />
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute top-4 right-4 rounded-full bg-black/50 text-white hover:bg-black/70 border-0 z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setEnlargedImageSrc(null);
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
