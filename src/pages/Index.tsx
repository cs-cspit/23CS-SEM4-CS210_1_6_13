import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw,
  Sparkles,
  ListFilter,
  Save,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Language, ExecutionResponse } from '@/lib/types';
import { executeCode, getExampleCode, abortExecution } from '@/lib/api';
import CodeEditor from '@/components/CodeEditor';
import LanguageSelector from '@/components/LanguageSelector';
import ExecutionResults from '@/components/ExecutionResults';
import AIFeedback from '@/components/AIFeedback';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const Index = () => {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResponse, setExecutionResponse] = useState<ExecutionResponse | null>(null);
  
  useEffect(() => {
    // Load example code when language changes
    setCode(getExampleCode(language));
    
    // Reset execution results when language changes
    setExecutionResponse(null);
  }, [language]);
  
  const handleExecuteCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute');
      return;
    }
    
    setIsExecuting(true);
    setExecutionResponse(null); // Clear previous results
    
    try {
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Execute code with streaming updates
      const result = await executeCode({
        code,
        language,
        input: input.trim() || undefined
      });
      
      // Verify the response has the expected structure
      if (!result || !result.result) {
        throw new Error('Invalid response structure');
      }
      
      setExecutionResponse(result);
      
      if (result.result.errors) {
        toast.error('Code executed with errors');
      } else {
        toast.success('Code executed successfully');
      }
    } catch (error) {
      console.error('Error executing code:', error);
      toast.error('Failed to execute code. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleAbortExecution = () => {
    if (abortExecution()) {
      toast.info('Execution aborted');
      setIsExecuting(false);
    }
  };
  
  const handleReset = () => {
    setCode(getExampleCode(language));
    setInput('');
    setExecutionResponse(null);
    toast.info('Code reset to example');
  };

  const handleSaveCode = () => {
    try {
      // Create a Blob containing the code
      const blob = new Blob([code], { type: 'text/plain' });
      
      // Create file extension based on language
      const fileExtensions: Record<Language, string> = {
        python: 'py',
        java: 'java',
        cpp: 'cpp'
      };
      
      const extension = fileExtensions[language] || 'txt';
      const filename = `code.${extension}`;
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Code saved as ${filename}`);
    } catch (error) {
      console.error('Error saving code:', error);
      toast.error('Failed to save code');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container py-8">
        <section className="mb-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">CompileSense</h1>
            <p className="text-muted-foreground">
              An AI-powered online compiler with real-time execution feedback.
            </p>
          </div>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <LanguageSelector value={language} onChange={setLanguage} />
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset to example"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSaveCode}
                  title="Save code"
                >
                  <Save className="h-4 w-4" />
                </Button>
                
                {isExecuting ? (
                  <Button 
                    onClick={handleAbortExecution}
                    variant="destructive"
                    className="space-x-2"
                  >
                    <StopCircle className="h-4 w-4 mr-1" />
                    <span>Stop</span>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleExecuteCode}
                    className="space-x-2"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    <span>Run Code</span>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="glass-panel glass-panel-hover transition-all">
              <CodeEditor 
                language={language} 
                value={code} 
                onChange={setCode} 
              />
            </div>
            
            <div className="border rounded-lg">
              <div className="flex items-center p-2 border-b bg-muted/30">
                <span className="text-sm font-medium">Input</span>
                <div className="ml-auto flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setInput('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Enter program input here (if needed)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-0 focus-visible:ring-0 resize-none min-h-[100px]"
              />
            </div>
            
            <ExecutionResults 
              result={executionResponse?.result} 
              isLoading={isExecuting}
            />
          </div>
          
          <div className="space-y-6">
            <PerformanceMetrics 
              executionTime={executionResponse?.result?.executionTime} 
              memoryUsage={executionResponse?.result?.memoryUsage}
              complexity={executionResponse?.result?.complexity}
            />
            
            <AIFeedback 
              feedback={executionResponse?.aiFeedback} 
              isLoading={isExecuting}
            />
          </div>
        </div>
        
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 glass-panel-hover">
              <div className="mb-4 p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Execution</h3>
              <p className="text-muted-foreground text-sm">
                Execute code in Python, JavaScript, Java, and C++ with real-time feedback and performance metrics.
              </p>
            </div>
            
            <div className="glass-panel p-6 glass-panel-hover">
              <div className="mb-4 p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground text-sm">
                Get intelligent suggestions to improve code performance, readability, and security.
              </p>
            </div>
            
            <div className="glass-panel p-6 glass-panel-hover">
              <div className="mb-4 p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                <ListFilter className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Complexity Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Understand your algorithm's performance with automated time and space complexity estimation.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
