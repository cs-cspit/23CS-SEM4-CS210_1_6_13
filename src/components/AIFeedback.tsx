
import React from 'react';
import { cn } from '@/lib/utils';
import { AIFeedback as AIFeedbackType, CodeSuggestion } from '@/lib/types';
import { Sparkles, AlertTriangle, AlertCircle, Info, Cpu, BookOpen, Shield, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface AIFeedbackProps {
  feedback?: AIFeedbackType;
  isLoading: boolean;
  className?: string;
}

// Configuration objects defined at the top level
const suggestionTypeIcons = {
  performance: <Cpu className="h-4 w-4" />,
  readability: <BookOpen className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  bestPractice: <Code className="h-4 w-4" />
};

const suggestionTypeColors = {
  performance: 'text-blue-500 dark:text-blue-400',
  readability: 'text-purple-500 dark:text-purple-400',
  security: 'text-red-500 dark:text-red-400',
  bestPractice: 'text-green-500 dark:text-green-400'
};

const severityIcons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  critical: <AlertCircle className="h-4 w-4" />
};

const severityColors = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const AIFeedback: React.FC<AIFeedbackProps> = ({ feedback, isLoading, className }) => {
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Sparkles className="h-10 w-10 mb-2 opacity-20" />
            <p>Execute your code to get AI feedback</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Quality Score: </span>
              <span className="font-semibold">{feedback.overallQuality}/10</span>
            </div>
            <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${feedback.overallQuality * 10}%` }}
              />
            </div>
          </div>
          
          <div className="bg-accent/50 rounded-md p-3 text-sm">
            {feedback.summary}
          </div>
          
          <Accordion type="multiple" className="w-full">
            {feedback.suggestions.map((suggestion, index) => {
              const typeIcon = suggestionTypeIcons[suggestion.type];
              const typeColor = suggestionTypeColors[suggestion.type];
              const severityIcon = severityIcons[suggestion.severity];
              const severityColor = severityColors[suggestion.severity];
              
              return (
                <AccordionItem value={`item-${index}`} key={index} className="border border-border rounded-md mb-2 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/20">
                    <div className="flex items-center w-full">
                      <span className={cn("mr-2", typeColor)}>
                        {typeIcon}
                      </span>
                      <span className="font-medium text-sm">{suggestion.title}</span>
                      <Badge className={cn("ml-auto", severityColor)}>
                        {suggestion.severity}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t bg-muted/10 p-4 pt-3">
                    <p className="text-sm mb-2">{suggestion.description}</p>
                    
                    {suggestion.lineNumbers && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs font-mono mr-1">
                          Line {suggestion.lineNumbers.join(', ')}
                        </Badge>
                      </div>
                    )}
                    
                    {suggestion.improvementCode && (
                      <div className="bg-code text-code-foreground p-3 rounded-md overflow-x-auto mt-2">
                        <pre className="text-xs font-mono whitespace-pre-wrap">{suggestion.improvementCode}</pre>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFeedback;
