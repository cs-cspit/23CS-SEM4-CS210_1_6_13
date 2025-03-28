
import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("w-full py-6 border-t border-border mt-auto", className)}>
      <div className="container flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CompileSense. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
