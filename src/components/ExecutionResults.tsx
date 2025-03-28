
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ExecutionResult } from '@/lib/types';
import { Terminal, Clock, MemoryStick, StopCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { abortExecution } from '@/lib/api';

interface ExecutionResultsProps {
  result?: ExecutionResult;
  isLoading: boolean;
  className?: string;
}

const ExecutionResults: React.FC<ExecutionResultsProps> = ({ result, isLoading, className }) => {
  const [liveOutput, setLiveOutput] = useState<string>('');
  const [liveErrors, setLiveErrors] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('output');
  const outputRef = useRef<HTMLPreElement>(null);
  
  // Clear output when starting a new execution
  useEffect(() => {
    if (isLoading) {
      setLiveOutput('');
      setLiveErrors('');
    }
  }, [isLoading]);
  
  // Listen for real-time output events
  useEffect(() => {
    const handleOutput = (event: CustomEvent) => {
      const { chunk, type } = event.detail;
      
      if (type === 'output') {
        setLiveOutput(prev => prev + chunk);
        // Auto-switch to output tab when output is received
        setActiveTab('output');
      } else if (type === 'error') {
        setLiveErrors(prev => prev + chunk);
        // Auto-switch to errors tab when errors are received
        setActiveTab('errors');
      }
      
      // Auto-scroll to bottom of output
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    };
    
    // Handle execution abort
    const handleAbort = () => {
      setLiveOutput(prev => prev + "\n[Execution aborted by user]\n");
    };
    
    // Add event listeners
    window.addEventListener('code-execution-output', handleOutput as EventListener);
    window.addEventListener('code-execution-aborted', handleAbort);
    
    // Cleanup
    return () => {
      window.removeEventListener('code-execution-output', handleOutput as EventListener);
      window.removeEventListener('code-execution-aborted', handleAbort);
    };
  }, []);
  
  // When final result comes in, use it instead of live output
  useEffect(() => {
    if (result && !isLoading) {
      if (result.output) {
        setLiveOutput(result.output);
      }
      if (result.errors) {
        setLiveErrors(result.errors);
      }
    }
  }, [result, isLoading]);
  
  const handleStopExecution = () => {
    abortExecution();
  };
  
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center">
            <Terminal className="mr-2 h-4 w-4" />
            Live Execution
          </CardTitle>
          <Button 
            variant="destructive" 
            size="sm"
            className="h-8"
            onClick={handleStopExecution}
          >
            <StopCircle className="mr-1 h-4 w-4" />
            Stop
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
              <TabsTrigger value="output" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Output
              </TabsTrigger>
              {liveErrors && (
                <TabsTrigger value="errors" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-destructive">
                  Errors
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="output" className="p-4 pt-2">
              <pre 
                ref={outputRef}
                className="bg-code text-code-foreground p-3 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap h-[200px] overflow-y-auto"
              >
                {liveOutput || (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="w-4 h-4 border-t-2 border-b-2 border-primary rounded-full animate-spin mr-2" />
                    Executing code...
                  </div>
                )}
              </pre>
            </TabsContent>
            {liveErrors && (
              <TabsContent value="errors" className="p-4 pt-2">
                <pre 
                  className="bg-destructive/10 text-destructive p-3 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap h-[200px] overflow-y-auto"
                >
                  {liveErrors}
                </pre>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    );
  }
  
  if (!result && !liveOutput && !liveErrors) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center">
            <Terminal className="mr-2 h-4 w-4" />
            Execution Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
            Execute your code to see results
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden shadow-sm border-border", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Terminal className="mr-2 h-4 w-4" />
          Execution Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="output" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Output
            </TabsTrigger>
            {(result?.errors || liveErrors) && (
              <TabsTrigger value="errors" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-destructive">
                Errors
              </TabsTrigger>
            )}
            {result && (
              <TabsTrigger value="metrics" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Metrics
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="output" className="p-4 pt-2">
            <pre 
              ref={outputRef}
              className="bg-code text-code-foreground p-3 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap h-[200px] overflow-y-auto"
            >
              {liveOutput || 'No output generated'}
            </pre>
          </TabsContent>
          {(result?.errors || liveErrors) && (
            <TabsContent value="errors" className="p-4 pt-2">
              <pre className="bg-destructive/10 text-destructive p-3 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap h-[200px] overflow-y-auto">
                {liveErrors || result?.errors || 'No errors'}
              </pre>
            </TabsContent>
          )}
          {result && (
            <TabsContent value="metrics" className="p-4 pt-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-accent rounded-md">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Execution Time</p>
                      <p className="text-xl font-semibold">{result.executionTime.toFixed(3)}s</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-accent rounded-md">
                    <MemoryStick className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Memory Usage</p>
                      <p className="text-xl font-semibold">{result.memoryUsage.toFixed(1)} MB</p>
                    </div>
                  </div>
                </div>
                
                {result.complexity && (
                  <div className="bg-accent p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Complexity Analysis</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-background p-2 rounded-md">
                        <p className="text-xs text-muted-foreground">Time Complexity</p>
                        <p className="font-mono text-sm font-medium">{result.complexity.time}</p>
                      </div>
                      <div className="bg-background p-2 rounded-md">
                        <p className="text-xs text-muted-foreground">Space Complexity</p>
                        <p className="font-mono text-sm font-medium">{result.complexity.space}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{result.complexity.explanation}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExecutionResults;
