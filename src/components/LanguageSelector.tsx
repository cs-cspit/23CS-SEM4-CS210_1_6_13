import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Language } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSelectorProps {
  value: Language;
  onChange: (value: Language) => void;
  className?: string;
}

const languages: { value: Language; label: string; icon: string }[] = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: 'C++' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, className }) => {
  const selectedLanguage = languages.find(lang => lang.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("h-10 px-4 font-medium", className)}
        >
          <span className="mr-2">{selectedLanguage?.icon}</span>
          {selectedLanguage?.label}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[180px] animate-fade-in animate-slide-in">
        <DropdownMenuRadioGroup value={value} onValueChange={(val) => onChange(val as Language)}>
          {languages.map((language) => (
            <DropdownMenuRadioItem 
              key={language.value} 
              value={language.value}
              className="flex items-center cursor-pointer"
            >
              <span className="mr-2 text-sm">{language.icon}</span>
              {language.label}
              {language.value === value && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
