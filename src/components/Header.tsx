
import React from 'react';
import { cn } from '@/lib/utils';
import { Code, Github, Settings } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("w-full border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-10", className)}>
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Code className="h-6 w-6 mr-2 text-primary" />
          <span className="text-xl font-semibold">CompileSense</span>
          <span className="ml-2 text-xs font-medium bg-accent px-2 py-1 rounded-full">Beta</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
