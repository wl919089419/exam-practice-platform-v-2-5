import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                考级练习平台
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/exams" className="transition-colors hover:text-foreground/80 text-foreground/60">
                考试列表
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
