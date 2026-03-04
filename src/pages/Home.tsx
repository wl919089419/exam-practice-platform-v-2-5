import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-1 lg:px-0 min-h-[calc(100vh-3.5rem)]">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          考级练习平台
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;熟能生巧。通过我们全面的题库和在线评测系统，为您的编程考级做好充分准备。&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              选择考级类别
            </h1>
            <p className="text-sm text-muted-foreground">
              请选择您要练习的考试委员会以开始练习。
            </p>
          </div>
          
          <div className="grid gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/exams?category=CIE">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle>电子学会 (CIE)</CardTitle>
                    <CardDescription>
                      涵盖：图形化 (1-4级), Python (1-6级)
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/exams?category=CCF">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle>计算机学会 (CCF)</CardTitle>
                    <CardDescription>
                      涵盖：图形化 (1-4级), Python (1-8级), C++ (1-8级)
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
