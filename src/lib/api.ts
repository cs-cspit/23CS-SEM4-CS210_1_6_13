import { CodeExecution, ExecutionResponse, Language } from "./types";

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';

// Mock data for the API response
const getMockResult = (language: Language, code: string): ExecutionResponse => {
  // Extract potential errors from the code for the mock
  const hasError = code.includes('error') || code.includes('throw');
  
  const executionTime = Math.random() * 0.2 + 0.01; // Random time between 0.01 and 0.21s
  const memoryUsage = Math.random() * 8 + 2; // Random memory between 2 and 10MB
  
  return {
    result: {
      output: hasError ? '' : generateOutput(code, language),
      errors: hasError ? `Error executing ${language} code: Syntax error at line 3` : undefined,
      executionTime,
      memoryUsage,
      complexity: {
        time: code.includes('sort') ? "O(n log n)" : "O(n)",
        space: "O(n)",
        explanation: "The algorithm uses a sorting operation which has O(n log n) time complexity and requires additional space proportional to input size."
      }
    },
    aiFeedback: {
      suggestions: [
        {
          type: "performance",
          title: "Use more efficient data structure",
          description: "Consider using a HashMap instead of linear search for lookups to improve performance.",
          lineNumbers: [12, 15],
          severity: "info",
          improvementCode: "const map = new Map();\nfor (const item of items) {\n  map.set(item.id, item);\n}"
        },
        {
          type: "readability",
          title: "Improve variable naming",
          description: "Variable names like 'x' and 'y' are not descriptive. Consider using more meaningful names.",
          lineNumbers: [8, 9],
          severity: "warning",
          improvementCode: "const userCount = totalUsers;\nconst activeUsers = onlineUsers;"
        },
        {
          type: "bestPractice",
          title: "Add error handling",
          description: "Add try-catch blocks around code that could potentially throw exceptions.",
          lineNumbers: [24],
          severity: "critical",
          improvementCode: "try {\n  const result = riskyOperation();\n  // Handle result\n} catch (error) {\n  console.error('Operation failed:', error);\n}"
        }
      ],
      overallQuality: 7,
      summary: "The code is generally well-structured but could benefit from some performance optimizations and better error handling."
    }
  };
};

// Language-specific examples
const examples: Record<Language, string> = {
  python: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 2, 1, 0, 5, 7, 4, 9]))`,
  java: `import java.util.Arrays;

public class QuickSort {
    public static void main(String[] args) {
        int[] array = {3, 6, 8, 2, 1, 0, 5, 7, 4, 9};
        quickSort(array, 0, array.length - 1);
        System.out.println(Arrays.toString(array));
    }
    
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }
    
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        
        for (int j = low; j < high; j++) {
            if (arr[j] <= pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        return i + 1;
    }
}`,
  cpp: `#include <iostream>
#include <vector>

// Function declarations
void printArray(const std::vector<int>& arr);
int partition(std::vector<int>& arr, int low, int high);
void quickSort(std::vector<int>& arr, int low, int high);

// Function to print array
void printArray(const std::vector<int>& arr) {
    for (int num : arr) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
}

// Function to partition array for quicksort
int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

// Quicksort function
void quickSort(std::vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    Performance::Timer timer;
    
    std::vector<int> arr = {3, 6, 8, 2, 1, 0, 5, 7, 4, 9};
    std::cout << "Original array: ";
    printArray(arr);
    
    quickSort(arr, 0, arr.size() - 1);
    
    std::cout << "Sorted array: ";
    printArray(arr);
    
    timer.stop();
    return 0;
}`,
};

// Simulate a WebSocket connection for streaming output
class MockStreamingExecutor {
  private abortController: AbortController | null = null;
  private outputCallback: ((chunk: string) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private completeCallback: ((results: ExecutionResponse) => void) | null = null;
  private executionStartTime: number = 0;
  private memorySnapshots: number[] = [];
  private language: Language = 'javascript';
  private code: string = '';
  private input: string = '';
  
  constructor() {
    // Initialize the mock streaming executor
  }
  
  connect(onOpen?: () => void) {
    // Simulate connection opening
    setTimeout(() => {
      console.log('Mock streaming connection established');
      if (onOpen) onOpen();
    }, 100);
    return this;
  }
  
  onOutput(callback: (chunk: string) => void) {
    this.outputCallback = callback;
    return this;
  }
  
  onError(callback: (error: string) => void) {
    this.errorCallback = callback;
    return this;
  }
  
  onComplete(callback: (results: ExecutionResponse) => void) {
    this.completeCallback = callback;
    return this;
  }
  
  execute(data: CodeExecution) {
    this.abortController = new AbortController();
    this.executionStartTime = performance.now();
    this.language = data.language;
    this.code = data.code;
    this.input = data.input || '';
    
    // Start the execution process
    this.simulateExecution();
    
    return {
      abort: () => {
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
          if (this.errorCallback) {
            this.errorCallback('Execution aborted by user');
          }
        }
      }
    };
  }
  
  private simulateExecution() {
    this.executionStartTime = Date.now();
    this.memorySnapshots = [];
    
    // Start memory tracking
    this.trackMemoryUsage();
    
    try {
      // Evaluate the code based on language
      let result = '';
      switch (this.language) {
        case 'javascript':
          // Create a safe evaluation environment with console.log capture
          const safeEval = new Function('console', 'input', `
            const originalConsole = console;
            let output = '';
            console = {
              log: (...args) => {
                const text = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                output += text + '\\n';
                originalConsole.log(text);
              }
            };
            try {
              ${this.code}
              return output;
            } catch (error) {
              throw error;
            } finally {
              console = originalConsole;
            }
          `);
          
          result = safeEval(console, this.input);
          break;
          
        case 'python':
          // For Python, we'll need to implement proper execution
          // This could involve making API calls to a backend service
          result = this.generateSimulatedOutput();
          break;
          
        case 'java':
          // For Java, we'll need to implement proper execution
          result = this.generateSimulatedOutput();
          break;
          
        case 'cpp':
          // For C++, we'll need to implement proper execution
          result = this.generateSimulatedOutput();
          break;
      }
      
      // Complete execution with success
      this.completeExecution(false);
      
      return result;
    } catch (error) {
      // Handle execution errors
      if (this.errorCallback) {
        this.errorCallback(error.toString());
      }
      
      // Complete execution with error
      this.completeExecution(true);
      
      return '';
    }
  }
  
  private getExecutionStages(language: Language, hasErrors: boolean): Array<{type: 'output' | 'error', content: string, delay: number}> {
    const stages: Array<{type: 'output' | 'error', content: string, delay: number}> = [];
    
    if (hasErrors) {
      // Simulate compilation errors first
      stages.push({
        type: 'error',
        content: `Compiling ${language} code...\n`,
        delay: 300
      });
      
      // Add appropriate language-specific error message
      stages.push({
        type: 'error',
        content: this.getLanguageSpecificError(language),
        delay: 500
      });
    } else {
      // Simulate successful execution
      stages.push({
        type: 'output',
        content: `Compiling ${language} code...\n`,
        delay: 300
      });
      
      stages.push({
        type: 'output',
        content: `Running ${language} program...\n`,
        delay: 400
      });
      
      // For languages that take input, show the input being processed
      if (this.input && this.input.length > 0) {
        stages.push({
          type: 'output',
          content: `Processing input...\n`,
          delay: 200
        });
      }
      
      // For more complex code, add intermediate output
      if (this.code.length > 300 || this.code.includes('for') || this.code.includes('while')) {
        stages.push({
          type: 'output',
          content: `Processing iteration 1...\n`,
          delay: 200
        });
        
        stages.push({
          type: 'output',
          content: `Processing iteration 2...\n`,
          delay: 200
        });
      }
      
      // Generate actual program output based on code analysis
      const output = this.generateSimulatedOutput();
      
      // Split output into chunks for streaming
      const outputChunks = output.split('\n');
      for (let i = 0; i < outputChunks.length; i++) {
        if (outputChunks[i].trim()) {
          stages.push({
            type: 'output',
            content: outputChunks[i] + '\n',
            delay: 150 + Math.random() * 200
          });
        }
      }
    }
    
    return stages;
  }
  
  private generateSimulatedOutput(): string {
    // Parse and analyze the code to determine what it's doing
    if (this.code.includes('quickSort') || this.code.includes('quicksort') || this.code.includes('sort(')) {
      return this.generateSortingOutput();
    } else if (this.code.includes('fibonacci')) {
      return this.generateFibonacciOutput();
    } else if (this.code.includes('factorial')) {
      return this.generateFactorialOutput();
    } else if (this.code.includes('print') || this.code.includes('System.out.println') || 
              this.code.includes('console.log') || this.code.includes('cout')) {
      return this.extractPrintStatements();
    } else {
      return this.generateDefaultOutput();
    }
  }
  
  private generateSortingOutput(): string {
    const array = [3, 6, 8, 2, 1, 0, 5, 7, 4, 9];
    let output = `Initial array: [${array.join(', ')}]\n`;
    
    // Add intermediate steps based on language
    if (this.language === 'python' || this.language === 'javascript') {
      output += "Partitioning around pivot: 5\n";
      output += "Left partition: [3, 2, 1, 0, 4]\n";
      output += "Right partition: [6, 8, 7, 9]\n";
      output += "Recursively sorting partitions...\n";
      output += "Merging results...\n";
    } else if (this.language === 'java' || this.language === 'cpp') {
      output += "Pivot element: 5\n";
      output += "Partition index: 4\n";
      output += "After first partition: [3, 2, 1, 0, 4, 5, 8, 7, 6, 9]\n";
      output += "Recursively sorting left and right partitions...\n";
    }
    
    output += "Sorted array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]";
    return output;
  }
  
  private generateFibonacciOutput(): string {
    let output = "Calculating Fibonacci sequence...\n";
    const fibNumbers = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
    
    for (let i = 0; i < 10; i++) {
      output += `F(${i}) = ${fibNumbers[i]}\n`;
    }
    
    return output.trim();
  }
  
  private generateFactorialOutput(): string {
    let output = "Computing factorial...\n";
    
    // Extract number from the code if possible, default to 5
    const match = this.code.match(/factorial\s*\(\s*(\d+)/);
    const n = match ? parseInt(match[1]) : 5;
    
    for (let i = n; i > 0; i--) {
      output += `factorial(${i}) = ${i}${i > 1 ? ` * factorial(${i-1})` : ''}\n`;
    }
    
    // Calculate result
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    output += `Result: ${result}`;
    return output;
  }
  
  private extractPrintStatements(): string {
    let output = "";
    const lines = this.code.split('\n');
    
    // Extract print statements based on language
    for (const line of lines) {
      let printContent = null;
      
      if (this.language === 'python' && line.includes('print(')) {
        printContent = line.match(/print\s*\((.*)\)/)?.[1];
      } else if (this.language === 'javascript' && line.includes('console.log')) {
        printContent = line.match(/console\.log\s*\((.*)\)/)?.[1];
      } else if (this.language === 'java' && line.includes('System.out.println')) {
        printContent = line.match(/System\.out\.println\s*\((.*)\)/)?.[1];
      } else if (this.language === 'cpp' && line.includes('cout')) {
        printContent = line.match(/cout\s*<<\s*(.*?)(?:<<|;)/)?.[1];
      }
      
      if (printContent) {
        // Clean the content from quotes if present
        printContent = printContent.trim();
        if ((printContent.startsWith('"') && printContent.endsWith('"')) || 
            (printContent.startsWith("'") && printContent.endsWith("'"))) {
          printContent = printContent.slice(1, -1);
        }
        
        output += printContent + '\n';
      }
    }
    
    return output.trim() || this.generateDefaultOutput();
  }
  
  private generateDefaultOutput(): string {
    return `Program executed successfully.\n\nOutput for ${this.language} code:\n[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`;
  }
  
  private getLanguageSpecificError(language: Language): string {
    switch (language) {
      case 'python':
        return "  File \"<string>\", line 3\n    def quicksort(arr):\n                    ^\nSyntaxError: expected ':'";
      case 'java':
        return "Main.java:5: error: ';' expected\n  public static void main(String[] args) {\n                                        ^\n1 error";
      case 'cpp':
        return "main.cpp:8:10: error: expected ';' after expression\n  int x = 5\n         ^\n         ;";
      default:
        return "Syntax error in your code.";
    }
  }
  
  private trackMemoryUsage() {
    // Simulate increasing memory usage during execution
    const memoryTracker = setInterval(() => {
      if (this.abortController?.signal.aborted) {
        clearInterval(memoryTracker);
        return;
      }
      
      // Generate a realistic memory usage pattern (increasing over time)
      const baseMemory = 3.0; // Base memory in MB
      const executionProgress = Math.min(1.0, (performance.now() - this.executionStartTime) / 2000);
      const complexity = this.code.length / 500; // Complexity based on code length
      const currentMemory = baseMemory + (complexity * executionProgress * 4); 
      
      this.memorySnapshots.push(currentMemory);
    }, 200);
    
    // Cleanup after max 5 seconds
    setTimeout(() => {
      clearInterval(memoryTracker);
    }, 5000);
  }
  
  private completeExecution(hasErrors: boolean) {
    if (!this.completeCallback) return;
    
    // Calculate execution metrics
    const executionTime = (performance.now() - this.executionStartTime) / 1000;
    
    // Calculate memory usage (peak)
    const peakMemory = this.memorySnapshots.length > 0 
      ? Math.max(...this.memorySnapshots) 
      : 3.0;
    
    // Generate complexity estimate based on code patterns
    const complexity = this.estimateComplexity();
    
    // Generate the final output in a more detailed way
    const finalOutput = hasErrors ? '' : this.generateSimulatedOutput();
    
    // Prepare the final result
    const result: ExecutionResponse = {
      result: {
        output: finalOutput,
        errors: hasErrors ? this.getLanguageSpecificError(this.language) : undefined,
        executionTime,
        memoryUsage: peakMemory,
        complexity
      },
      aiFeedback: generateAIFeedback(this.code, this.language)
    };
    
    // Call the completion callback with the final results
    this.completeCallback(result);
  }
  
  private estimateComplexity() {
    // Analyze code to estimate complexity
    let timeComplexity = "O(n)";
    let spaceComplexity = "O(n)";
    let explanation = "Linear time and space complexity for basic operations.";
    
    // Check for nested loops (O(n²))
    if ((this.code.match(/for/g) || []).length > 1 || this.code.includes('for') && this.code.includes('while')) {
      timeComplexity = "O(n²)";
      explanation = "Quadratic time complexity due to nested loops.";
    }
    
    // Check for sorting algorithms (O(n log n))
    if (this.code.includes('sort') || this.code.includes('quicksort') || this.code.includes('mergesort')) {
      timeComplexity = "O(n log n)";
      explanation = "The algorithm uses sorting operations with O(n log n) time complexity.";
    }
    
    // Check for recursion with exponential patterns
    if (this.code.includes('fibonacci') && !this.code.includes('memo')) {
      timeComplexity = "O(2^n)";
      explanation = "Exponential time complexity due to recursive Fibonacci implementation without memoization.";
    }
    
    return {
      time: timeComplexity,
      space: spaceComplexity,
      explanation
    };
  }
}

// Global executor instance
let streamingExecutor: MockStreamingExecutor | null = null;

export const executeCode = async (data: CodeExecution): Promise<ExecutionResponse> => {
  try {
    console.log('Attempting to connect to backend at:', API_BASE_URL);
    console.log('Sending request data:', data);

    const response = await fetch(`${API_BASE_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Backend response not OK:', response.status, response.statusText);
      throw new Error(result.result?.errors || `HTTP error! status: ${response.status}`);
    }

    // Validate the response structure
    if (!result || !result.result) {
      throw new Error('Invalid response structure from server');
    }

    return result;
  } catch (error) {
    console.error('Error executing code:', error);
    
    // Return a structured error response
    return {
      result: {
        output: '',
        errors: error instanceof Error ? error.message : 'An unknown error occurred',
        executionTime: 0,
        memoryUsage: 0,
        complexity: {
          time: "Unknown",
          space: "Unknown",
          explanation: "Could not determine complexity due to execution error"
        }
      },
      aiFeedback: {
        suggestions: [],
        overallQuality: 0,
        summary: error instanceof Error ? error.message : "Code execution failed. Please check your code and try again."
      }
    };
  }
};

// Detect common syntax errors based on language
function detectSyntaxErrors(code: string, language: Language): boolean {
  switch (language) {
    case 'python':
      return code.includes('print(') && !code.includes(')') || code.includes('def ') && !code.includes(':');
    case 'java':
      return code.includes('public class') && !code.includes('{') || code.includes('System.out.println') && !code.includes(';');
    case 'cpp':
      return code.includes('cout <<') && !code.includes(';') || code.includes('#include') && !code.includes('<iostream>');
    default:
      return false;
  }
}

// Generate realistic output based on code content
function generateOutput(code: string, language: Language): string {
  // Enhanced output generation based on code content
  if (code.includes('print') || code.includes('System.out.println') || 
      code.includes('cout')) {
    // Extract print statements
    const lines = code.split('\n');
    let output = "";
    
    for (const line of lines) {
      let printContent = null;
      
      if (language === 'python' && line.includes('print(')) {
        printContent = line.match(/print\s*\((.*)\)/)?.[1];
      } else if (language === 'java' && line.includes('System.out.println')) {
        printContent = line.match(/System\.out\.println\s*\((.*)\)/)?.[1];
      } else if (language === 'cpp' && line.includes('cout')) {
        printContent = line.match(/cout\s*<<\s*(.*?)(?:<<|;)/)?.[1];
      }
      
      if (printContent) {
        // Clean the content from quotes if present
        printContent = printContent.trim();
        if ((printContent.startsWith('"') && printContent.endsWith('"')) || 
            (printContent.startsWith("'") && printContent.endsWith("'"))) {
          printContent = printContent.slice(1, -1);
        }
        
        output += printContent + '\n';
      }
    }
    
    return output.trim() || `Program executed successfully for ${language}.`;
  } else {
    return `Program executed successfully for ${language}:\n[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`;
  }
}

// Generate more relevant AI feedback based on code analysis
function generateAIFeedback(code: string, language: Language) {
  const suggestions = [];
  let overallQuality = 8;
  
  // Check for performance issues
  if (code.includes('for') && code.includes('for')) {
    suggestions.push({
      type: "performance" as const,
      title: "Nested loops detected",
      description: "Your code contains nested loops which may lead to O(n²) time complexity.",
      lineNumbers: [code.split('\n').findIndex(line => line.includes('for')) + 1],
      severity: "warning" as const,
      improvementCode: "// Consider using a more efficient algorithm\n// or data structure to avoid nested loops"
    });
    overallQuality -= 1;
  }
  
  // Check for error handling
  if (!(code.includes('try') && code.includes('catch')) && 
     (language === 'javascript' || language === 'java' || language === 'cpp')) {
    suggestions.push({
      type: "bestPractice" as const,
      title: "Missing error handling",
      description: "Your code doesn't include error handling mechanisms.",
      lineNumbers: [5],
      severity: "info" as const,
      improvementCode: language === 'javascript' ? 
        "try {\n  // Your code here\n} catch (error) {\n  console.error('Error:', error);\n}" :
        "try {\n  // Your code here\n} catch (Exception e) {\n  System.out.println(\"Error: \" + e.getMessage());\n}"
    });
    overallQuality -= 0.5;
  }
  
  // Check for code readability
  if (code.split('\n').some(line => line.length > 80)) {
    suggestions.push({
      type: "readability" as const,
      title: "Long lines detected",
      description: "Some lines in your code exceed 80 characters, which may reduce readability.",
      lineNumbers: [code.split('\n').findIndex(line => line.length > 80) + 1],
      severity: "info" as const,
      improvementCode: "// Break long lines into multiple lines\n// to improve code readability"
    });
    overallQuality -= 0.5;
  }
  
  return {
    suggestions,
    overallQuality: Math.max(1, Math.min(10, overallQuality)),
    summary: suggestions.length > 0 ? 
      "The code could be improved in several areas highlighted in the suggestions." :
      "The code is well-structured and follows good programming practices."
  };
}

export const getExampleCode = (language: Language): string => {
  return examples[language] || '';
};

// New function to abort current execution
export const abortExecution = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/abort`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error aborting execution:', error);
    return false;
  }
};
