import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExamCategory } from '@/types';
import { motion } from 'motion/react';
import { Upload, FileText, ChevronRight, Filter } from 'lucide-react';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ExamManifestItem {
  id: string;
  title: string;
  category: string;
  subject: string;
  level: number;
  filename: string;
}

const EXAM_CONFIGS = {
  CIE: {
    title: '电子学会 (CIE)',
    subjects: [
      { name: 'Graphical', displayName: '图形化编程', levels: 4, color: 'bg-blue-500' },
      { name: 'Python', displayName: 'Python 编程', levels: 6, color: 'bg-yellow-500' },
    ]
  },
  CCF: {
    title: '计算机学会 (CCF)',
    subjects: [
      { name: 'Graphical', displayName: '图形化编程 (GESP)', levels: 4, color: 'bg-green-500' },
      { name: 'Python', displayName: 'Python 编程 (GESP)', levels: 8, color: 'bg-blue-600' },
      { name: 'C++', displayName: 'C++ 编程 (GESP)', levels: 8, color: 'bg-purple-600' },
    ]
  }
};

export default function ExamList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialCategory = searchParams.get('category') || 'all';
  const [availableExams, setAvailableExams] = useState<ExamManifestItem[]>([]);
  const [uploadedExams, setUploadedExams] = useState<any[]>([]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  // We need to fetch exam manifest and load uploaded exams
  useEffect(() => {
    fetch('/exams/index.json')
      .then(res => {
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
          }
        }
        return [];
      })
      .then(data => setAvailableExams(data))
      .catch(err => console.error('Failed to fetch exam manifest', err));

    // Load uploaded exams from localStorage
    const storedExams = localStorage.getItem('uploadedExams');
    if (storedExams) {
      try {
        setUploadedExams(JSON.parse(storedExams));
      } catch (e) {
        console.error('Failed to parse uploaded exams', e);
      }
    }
  }, []);

  // Combine available exams and uploaded exams
  const allExams = useMemo(() => {
    const combined = [...availableExams];
    
    // Add uploaded exams that match the current category
    uploadedExams.forEach((exam, index) => {
      // Try to determine category/subject from title if not explicitly set
      let examCategory = exam.category || 'CCF'; // Default to CCF if unknown
      let examSubject = exam.subject || 'Graphical';
      let examLevel = exam.level || 1;
      
      if (exam.examinationPaperTitle) {
        if (exam.examinationPaperTitle.includes('CIE') || exam.examinationPaperTitle.includes('电子学会')) examCategory = 'CIE';
        if (exam.examinationPaperTitle.includes('CCF') || exam.examinationPaperTitle.includes('计算机学会')) examCategory = 'CCF';
        
        if (exam.examinationPaperTitle.includes('Python')) examSubject = 'Python';
        if (exam.examinationPaperTitle.includes('C++')) examSubject = 'C++';
        if (exam.examinationPaperTitle.includes('图形化') || exam.examinationPaperTitle.includes('Scratch')) examSubject = 'Graphical';
        
        const levelMatch = exam.examinationPaperTitle.match(/([一二三四五六七八])级/);
        if (levelMatch) {
          const levelMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8 };
          examLevel = levelMap[levelMatch[1]] || 1;
        }
      }

      combined.push({
        id: `uploaded_${index}_${Date.now()}`,
        title: exam.examinationPaperTitle || `上传的试卷 ${index + 1}`,
        category: examCategory,
        subject: examSubject,
        level: examLevel,
        filename: 'uploaded',
        isUploaded: true,
        rawData: exam
      } as any);
    });
    
    return combined;
  }, [availableExams, uploadedExams]);

  const availableSubjects = useMemo(() => {
    if (selectedCategory === 'all') {
      const subjectsMap = new Map();
      Object.values(EXAM_CONFIGS).forEach(config => {
        config.subjects.forEach(s => {
          if (!subjectsMap.has(s.name)) {
            subjectsMap.set(s.name, { 
              ...s, 
              displayName: s.name === 'Graphical' ? '图形化编程' : s.name === 'Python' ? 'Python 编程' : 'C++ 编程' 
            });
          } else {
            const existing = subjectsMap.get(s.name);
            if (s.levels > existing.levels) {
              existing.levels = s.levels;
            }
          }
        });
      });
      return Array.from(subjectsMap.values());
    } else {
      return EXAM_CONFIGS[selectedCategory as keyof typeof EXAM_CONFIGS]?.subjects || [];
    }
  }, [selectedCategory]);

  // Calculate available levels based on selected subject
  const availableLevels = useMemo(() => {
    if (selectedSubject === 'all') {
      const maxLevels = availableSubjects.length > 0 ? Math.max(...availableSubjects.map(s => s.levels)) : 8;
      return Array.from({ length: maxLevels }, (_, i) => i + 1);
    }
    const subjectConfig = availableSubjects.find(s => s.name === selectedSubject);
    return Array.from({ length: subjectConfig?.levels || 0 }, (_, i) => i + 1);
  }, [selectedSubject, availableSubjects]);

  // Filter exams
  const filteredExams = useMemo(() => {
    return allExams.filter(exam => {
      if (selectedCategory !== 'all' && exam.category !== selectedCategory) return false;
      if (selectedSubject !== 'all' && exam.subject !== selectedSubject) return false;
      if (selectedLevel !== 'all' && exam.level !== selectedLevel) return false;
      return true;
    });
  }, [allExams, selectedCategory, selectedSubject, selectedLevel]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubject('all');
    setSelectedLevel('all');
    if (cat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  // Handle subject change (reset level if it exceeds new subject's max level)
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    if (subject !== 'all' && selectedLevel !== 'all') {
      const subjectConfig = availableSubjects.find(s => s.name === subject);
      if (subjectConfig && selectedLevel > subjectConfig.levels) {
        setSelectedLevel('all');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        let validData = null;
        
        // Case 1: Standard response format { data: { paperQuestionsVOS: ... } }
        if (json.data && Array.isArray(json.data.paperQuestionsVOS)) {
            validData = json.data;
        } 
        // Case 2: Direct data format { paperQuestionsVOS: ... }
        else if (Array.isArray(json.paperQuestionsVOS)) {
            validData = json;
        }

        if (validData) {
            // Save to localStorage so it persists
            const storedExams = localStorage.getItem('uploadedExams');
            let examsList = [];
            if (storedExams) {
              try {
                examsList = JSON.parse(storedExams);
              } catch (e) {}
            }
            examsList.push(validData);
            localStorage.setItem('uploadedExams', JSON.stringify(examsList));
            
            // Navigate to practice immediately
            navigate('/practice/custom/uploaded/1', { state: { examData: validData } });
        } else {
            alert('无效的试卷文件格式: 缺少 paperQuestionsVOS 数据');
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
        alert('解析 JSON 失败');
      }
    };
    reader.readAsText(file);
  };

  const pageTitle = selectedCategory === 'all' ? '全部试卷' : EXAM_CONFIGS[selectedCategory as keyof typeof EXAM_CONFIGS]?.title || '试卷列表';

  return (
    <div className="container mx-auto px-4 py-10 min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">选择科目和等级开始练习</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                上传试卷
            </Button>
            <Link to="/">
                <Button variant="outline">返回首页</Button>
            </Link>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-8 border-muted bg-muted/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Category Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>考试类别</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleCategoryChange('all')}
                className={cn(
                  "rounded-full transition-all",
                  selectedCategory === 'all' 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                全部类别
              </Button>
              {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => handleCategoryChange(key)}
                  className={cn(
                    "rounded-full transition-all", 
                    selectedCategory === key 
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {config.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>考试科目</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubjectChange('all')}
                className={cn(
                  "rounded-full transition-all",
                  selectedSubject === 'all' 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                全部科目
              </Button>
              {availableSubjects.map(subject => (
                <Button
                  key={subject.name}
                  variant="outline"
                  onClick={() => handleSubjectChange(subject.name)}
                  className={cn(
                    "rounded-full transition-all", 
                    selectedSubject === subject.name 
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mr-2", subject.color)} />
                  {subject.displayName}
                </Button>
              ))}
            </div>
          </div>

          {/* Level Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>考试等级</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedLevel('all')}
                className={cn(
                  "rounded-full transition-all",
                  selectedLevel === 'all' 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                全部等级
              </Button>
              {availableLevels.map(level => (
                <Button
                  key={level}
                  variant="outline"
                  onClick={() => setSelectedLevel(level)}
                  className={cn(
                    "rounded-full transition-all", 
                    selectedLevel === level 
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white ring-2 ring-blue-600 ring-offset-2 font-bold shadow-md" 
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  等级 {level}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            试卷列表 <span className="text-muted-foreground text-base font-normal ml-2">({filteredExams.length} 份)</span>
          </h2>
        </div>

        {filteredExams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredExams.map((exam, idx) => {
              const subjectConfig = availableSubjects.find(s => s.name === exam.subject);
              
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                >
                  <Link 
                    to={`/practice/file/${exam.filename}`}
                    state={{ 
                      examInfo: exam, 
                      examData: (exam as any).isUploaded ? (exam as any).rawData : null 
                    }}
                    className="block h-full"
                  >
                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col relative overflow-hidden">
                      {(exam as any).isUploaded && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                          已上传
                        </div>
                      )}
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex flex-wrap gap-2">
                            <span className={cn(
                              "text-xs font-medium px-2.5 py-0.5 rounded-full text-white",
                              subjectConfig?.color || "bg-gray-500"
                            )}>
                              {subjectConfig?.displayName || exam.subject}
                            </span>
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              等级 {exam.level}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors flex-1 mb-4">
                          {exam.title}
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>标准试卷</span>
                          </div>
                          <div className="flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                            <span>开始练习</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">没有找到匹配的试卷</h3>
              <p className="text-muted-foreground max-w-sm">
                当前筛选条件下暂无试卷，请尝试更改筛选条件，或者上传您自己的试卷文件。
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  handleCategoryChange('all');
                }}
              >
                清除所有筛选
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
