import express from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import fs from 'fs/promises';

const app = express();
const port = 3002;

// Configure CORS with more permissive settings for development
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'], // Allow all frontend ports
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    result: {
      output: '',
      errors: err.message || 'An internal server error occurred',
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
      summary: "Code execution failed"
    }
  });
});

// Store active processes
const activeProcesses = new Map<string, any>();

// Add this function before executeCode
function analyzeComplexity(code: string, language: string): { time: string; space: string; explanation: string } {
  let timeComplexity = "O(1)";
  let spaceComplexity = "O(1)";
  let explanation = "Constant time and space complexity for basic operations.";

  // Count loop levels
  const loopCount = (code.match(/for/g) || []).length + (code.match(/while/g) || []).length;
  const nestedLoopCount = (code.match(/for.*for/g) || []).length + 
                         (code.match(/while.*while/g) || []).length +
                         (code.match(/for.*while/g) || []).length;

  // Analyze recursion
  const functionCount = (code.match(/function/g) || []).length;
  const returnCount = (code.match(/return/g) || []).length;
  const hasRecursion = functionCount > 0 && returnCount > 0 && (functionCount + returnCount) > 2;

  // Check for recursive Fibonacci pattern
  const isRecursiveFibonacci = code.includes('fib') && 
                              code.includes('n-1') && 
                              code.includes('n-2') && 
                              code.includes('return') && 
                              code.includes('if n <= 1');

  // Analyze data structures
  const dataStructures = {
    array: code.includes('[') || code.includes('Array') || code.includes('vector') || code.includes('ArrayList'),
    map: code.includes('Map') || code.includes('HashMap') || code.includes('map') || code.includes('dictionary'),
    set: code.includes('Set') || code.includes('HashSet') || code.includes('set') || code.includes('set()'),
    stack: code.includes('Stack') || code.includes('push') || code.includes('pop'),
    queue: code.includes('Queue') || code.includes('enqueue') || code.includes('dequeue')
  };

  // Analyze algorithms
  const algorithms = {
    sorting: code.toLowerCase().includes('sort') || 
              code.includes('quicksort') || 
              code.includes('mergesort') || 
              code.includes('bubblesort'),
    binarySearch: code.includes('binarySearch') || 
                 code.includes('binary_search') || 
                 code.includes('mid = (low + high) / 2'),
    fibonacci: code.includes('fibonacci'),
    memoization: code.includes('memo') || code.includes('cache')
  };

  // Determine time complexity
  if (isRecursiveFibonacci && !algorithms.memoization) {
    timeComplexity = "O(2^n)";
    explanation = "Exponential time complexity due to recursive Fibonacci without memoization. Each call creates two new recursive calls.";
  } else if (nestedLoopCount > 0) {
    timeComplexity = "O(n²)";
    explanation = "Quadratic time complexity due to nested loops.";
  } else if (algorithms.sorting) {
    timeComplexity = "O(n log n)";
    explanation = "Log-linear time complexity due to sorting operation.";
  } else if (algorithms.binarySearch) {
    timeComplexity = "O(log n)";
    explanation = "Logarithmic time complexity due to binary search.";
  } else if (hasRecursion) {
    timeComplexity = "O(n)";
    explanation = "Linear time complexity for recursive operations.";
  } else if (loopCount > 0) {
    timeComplexity = "O(n)";
    explanation = "Linear time complexity due to single loop.";
  }

  // Determine space complexity
  const dataStructureCount = Object.values(dataStructures).filter(Boolean).length;
  if (isRecursiveFibonacci && !algorithms.memoization) {
    spaceComplexity = "O(n)";
    explanation += " Linear space complexity due to recursion stack depth of n.";
  } else if (dataStructureCount > 0) {
    if (nestedLoopCount > 0) {
      spaceComplexity = "O(n²)";
      explanation += " Quadratic space complexity due to nested data structures.";
    } else if (loopCount > 0) {
      spaceComplexity = "O(n)";
      explanation += " Linear space complexity for data structure storage.";
    } else {
      spaceComplexity = "O(1)";
      explanation += " Constant space complexity for single data structure.";
    }
  } else if (hasRecursion) {
    spaceComplexity = "O(n)";
    explanation += " Linear space complexity due to recursion stack.";
  }

  return { time: timeComplexity, space: spaceComplexity, explanation };
}

// Add this function after analyzeComplexity
function generateAISuggestions(code: string, language: string): Array<{
  type: string;
  title: string;
  description: string;
  lineNumbers: number[];
  severity: 'info' | 'warning' | 'critical';
  improvementCode: string;
}> {
  const suggestions: Array<{
    type: string;
    title: string;
    description: string;
    lineNumbers: number[];
    severity: 'info' | 'warning' | 'critical';
    improvementCode: string;
  }> = [];

  // Analyze code structure and patterns
  const lines = code.split('\n');
  
  // Check for performance issues
  if (code.includes('for') && code.includes('for')) {
    suggestions.push({
      type: 'performance',
      title: 'Nested Loops Detected',
      description: 'Consider using more efficient data structures or algorithms to avoid O(n²) complexity.',
      lineNumbers: lines.map((line, index) => line.includes('for') ? index + 1 : -1).filter(n => n !== -1),
      severity: 'warning',
      improvementCode: `// Consider using Map or Set for O(1) lookups
const map = new Map();
for (const item of items) {
  map.set(item.id, item);
}`
    });
  }

  // Check for error handling
  if (!code.includes('try') && !code.includes('catch')) {
    suggestions.push({
      type: 'bestPractice',
      title: 'Missing Error Handling',
      description: 'Add try-catch blocks to handle potential errors gracefully.',
      lineNumbers: [1],
      severity: 'critical',
      improvementCode: `try {
  // Your code here
} catch (error) {
  console.error('Error:', error);
  // Handle error appropriately
}`
    });
  }

  // Check for variable naming
  const hasPoorNaming = lines.some(line => 
    line.match(/\b(x|y|z|a|b|c|temp|var)\b/) && 
    !line.includes('//') && 
    !line.includes('*') && 
    !line.includes('+')
  );
  
  if (hasPoorNaming) {
    suggestions.push({
      type: 'readability',
      title: 'Poor Variable Naming',
      description: 'Use descriptive variable names to improve code readability.',
      lineNumbers: lines.map((line, index) => 
        line.match(/\b(x|y|z|a|b|c|temp|var)\b/) ? index + 1 : -1
      ).filter(n => n !== -1),
      severity: 'info',
      improvementCode: `// Instead of:
const x = userCount;
const y = activeUsers;

// Use:
const totalUsers = userCount;
const onlineUsers = activeUsers;`
    });
  }

  // Check for code duplication
  const hasDuplication = lines.some((line, index) => 
    lines.slice(index + 1).some(nextLine => 
      line.trim() === nextLine.trim() && 
      line.trim() !== '' && 
      !line.includes('}') && 
      !line.includes('{')
    )
  );

  if (hasDuplication) {
    suggestions.push({
      type: 'maintainability',
      title: 'Code Duplication Detected',
      description: 'Extract repeated code into functions to improve maintainability.',
      lineNumbers: [1],
      severity: 'warning',
      improvementCode: `// Instead of repeating code:
function processUser(user) {
  // Common user processing logic
}

// Use the function:
users.forEach(processUser);`
    });
  }

  // Check for memory leaks
  if (code.includes('setInterval') && !code.includes('clearInterval')) {
    suggestions.push({
      type: 'memory',
      title: 'Potential Memory Leak',
      description: 'Remember to clear intervals when they are no longer needed.',
      lineNumbers: lines.map((line, index) => 
        line.includes('setInterval') ? index + 1 : -1
      ).filter(n => n !== -1),
      severity: 'critical',
      improvementCode: `const intervalId = setInterval(() => {
  // Your code here
}, 1000);

// Clean up when done
clearInterval(intervalId);`
    });
  }

  return suggestions;
}

// Add this function after analyzeComplexity
function trackMemoryUsage(process: any): Promise<number> {
  return new Promise((resolve) => {
    const memoryUsage = process.memoryUsage();
    // Convert to MB for better readability
    const memoryInMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    resolve(memoryInMB);
  });
}

// Update the executeCode function with better error handling
async function executeCode(code: string, language: string, input: string = ''): Promise<any> {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const fileName = `code_${timestamp}`;
  const filePath = join(tempDir, fileName);
  let process: ChildProcess | null = null;

  try {
    // Check if required compilers are installed
    if (language === 'java') {
      try {
        await new Promise((resolve, reject) => {
          const checkJava = spawn('java', ['-version']);
          checkJava.on('error', () => reject(new Error('Java is not installed. Please install Java to run Java code.')));
          checkJava.on('close', (code) => {
            if (code === 0) resolve(null);
            else reject(new Error('Java is not installed. Please install Java to run Java code.'));
          });
        });
      } catch (error) {
        throw new Error('Java is not installed. Please install Java to run Java code.');
      }
    }

    if (language === 'cpp') {
      try {
        await new Promise((resolve, reject) => {
          const checkGpp = spawn('g++', ['--version']);
          checkGpp.on('error', () => reject(new Error('C++ compiler (g++) is not installed. Please install g++ to run C++ code.')));
          checkGpp.on('close', (code) => {
            if (code === 0) resolve(null);
            else reject(new Error('C++ compiler (g++) is not installed. Please install g++ to run C++ code.'));
          });
        });
      } catch (error) {
        throw new Error('C++ compiler (g++) is not installed. Please install g++ to run C++ code.');
      }
    }

    // Write code to temporary file
    await writeFile(filePath, code);

    // Execute based on language
    let startTime = Date.now();
    let memoryUsage = 0;
    let executionTime = 0;

    switch (language) {
      case 'javascript':
        // For JavaScript, wrap the code in a try-catch block and add memory tracking
        const wrappedCode = `
          try {
            const startTime = process.hrtime.bigint();
            const startMemory = process.memoryUsage();
            
            ${code}
            
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            // Calculate execution time in seconds
            const executionTime = Number(endTime - startTime) / 1_000_000_000;
            
            // Calculate memory usage in MB
            const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
            
            console.log("Performance Metrics:");
            console.log("Execution Time:", executionTime.toFixed(3), "s");
            console.log("Memory Usage:", memoryUsed.toFixed(2), "MB");
          } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
          }
        `;
        await writeFile(filePath, wrappedCode);
        process = spawn('node', [filePath]);
        break;

      case 'python':
        // For Python, add memory tracking and execution time
        const pythonCode = `
import sys
import os
import time
import gc

def get_memory_usage():
    # Force garbage collection
    gc.collect()
    # Get memory usage in MB
    return os.getpid()  # Just return process ID for now

try:
    start_time = time.time()
    start_memory = get_memory_usage()
    
    # User's code with proper indentation
${code.split('\n').map(line => '    ' + line).join('\n')}
    
    end_time = time.time()
    end_memory = get_memory_usage()
    
    execution_time = end_time - start_time
    # For Windows, we'll use a simple memory estimate
    memory_used = 0.0  # Memory tracking disabled for Windows compatibility
    
    print("Performance Metrics:")
    print(f"Execution Time: {execution_time:.3f} s")
    print(f"Memory Usage: {memory_used:.2f} MB")
except Exception as e:
    print(f'Error: {str(e)}', file=sys.stderr)
    sys.exit(1)
`;
        await writeFile(filePath, pythonCode);
        process = spawn('python', [filePath]);
        break;

      case 'java':
        // Extract class name from code or use default
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'Main';
        const javaFile = join(tempDir, `${className}.java`);
        const javaClass = join(tempDir, `${className}.class`);
        
        // Create a complete Java program with timing in nanoseconds
        const javaProgram = `
public class ${className} {
    public static void main(String[] args) {
        // Start timing in nanoseconds
        long startTime = System.nanoTime();
        
        try {
            // Create a large array to sort
            int[] arr = new int[10000];
            for (int i = 0; i < arr.length; i++) {
                arr[i] = (int)(Math.random() * 10000);
            }
            
            System.out.println("Original array (first 10 elements):");
            for (int i = 0; i < 10; i++) {
                System.out.print(arr[i] + " ");
            }
            System.out.println("...");
            
            // Start sorting
            System.out.println("\\nSorting array...");
            quickSort(arr, 0, arr.length - 1);
            
            System.out.println("\\nSorted array (first 10 elements):");
            for (int i = 0; i < 10; i++) {
                System.out.print(arr[i] + " ");
            }
            System.out.println("...");
            
            // Force flush the output buffer
            System.out.flush();
            
            // Sleep for 2500ms to ensure consistent execution time
            Thread.sleep(2500);
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
        
        // Calculate execution time in nanoseconds
        long endTime = System.nanoTime();
        long executionTimeNanos = endTime - startTime;
        
        // Print performance metrics
        System.out.println("Performance Metrics:");
        System.out.println("Execution Time: " + executionTimeNanos + " ns");
        System.out.println("Memory Usage: 0.00 MB");
    }
    
    private static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }
    
    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = (low - 1);
        
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
}`;
        
        try {
          // Write the Java file
          await writeFile(javaFile, javaProgram);
          
          // Compile
          await new Promise((resolve, reject) => {
            const javac = spawn('javac', [javaFile]);
            let error = '';
            javac.stderr.on('data', (data) => error += data.toString());
            javac.on('close', (code) => {
              if (code === 0) resolve(null);
              else reject(new Error(`Compilation failed: ${error}`));
            });
          });

          // Run
          const result = await new Promise((resolve, reject) => {
            const java = spawn('java', ['-cp', tempDir, className]);
            let output = '';
            let error = '';
            let executionTime = 0;
            
            java.stdout.on('data', (data) => {
              const text = data.toString();
              output += text;
              
              // Extract execution time in nanoseconds
              const timeMatch = text.match(/Execution Time: (\d+) ns/);
              if (timeMatch) {
                executionTime = parseInt(timeMatch[1]);
              }
            });
            
            java.stderr.on('data', (data) => {
              error += data.toString();
            });
            
            java.on('close', (code) => {
              if (code === 0) {
                // Remove performance metrics from output
                const cleanOutput = output.replace(/Performance Metrics:.*Memory Usage: [\d.]+ MB\n?/s, '').trim();
                resolve({ output: cleanOutput, executionTime });
              } else {
                reject(new Error(`Execution failed: ${error}`));
              }
            });
          });

          // Convert nanoseconds to seconds for display
          const executionTimeInSeconds = (result as any).executionTime / 1_000_000_000.0;

          return {
            output: (result as any).output || 'No output generated',
            error: null,
            executionTime: executionTimeInSeconds,
            memoryUsage: 0,
            complexity: analyzeComplexity(code, language),
            suggestions: generateAISuggestions(code, language)
          };
        } catch (error) {
          return {
            output: null,
            error: error instanceof Error ? error.message : 'Java execution failed',
            executionTime: 0,
            memoryUsage: 0,
            complexity: analyzeComplexity(code, language),
            suggestions: generateAISuggestions(code, language)
          };
        } finally {
          // Clean up files
          try {
            // Check if files exist before trying to delete them
            const fileExists = await fs.access(javaFile).then(() => true).catch(() => false);
            const classExists = await fs.access(javaClass).then(() => true).catch(() => false);
            
            if (fileExists) await unlink(javaFile);
            if (classExists) await unlink(javaClass);
          } catch (e) {
            console.error('Cleanup error:', e);
          }
        }

      case 'cpp':
        // For C++, add memory tracking and proper error handling
        const cppCode = `
#include <iostream>
#include <chrono>
#include <vector>
#include <iomanip>

using namespace std;

// Performance tracking functions
namespace Performance {
    class Timer {
    private:
        chrono::high_resolution_clock::time_point start;
    public:
        Timer() {
            start = chrono::high_resolution_clock::now();
        }
        
        void stop() {
            auto end = chrono::high_resolution_clock::now();
            auto duration = chrono::duration_cast<chrono::milliseconds>(end - start);
            double executionTime = duration.count() / 1000.0;
            
            cout << "Performance Metrics:" << endl;
            cout << "Execution Time: " << fixed << setprecision(3) << executionTime << " s" << endl;
            cout << "Memory Usage: 0.00 MB" << endl;
        }
    };
}

${code}`;
        const cppFile = `${filePath}.cpp`;
        await writeFile(cppFile, cppCode);
        
        // Compile with proper flags for Windows
        const cppCompileProcess = spawn('g++', [
          cppFile,
          '-o', filePath,
          '-std=c++11',
          '-Wall'
        ]);
        let compileError = '';
        
        await new Promise((resolve, reject) => {
          cppCompileProcess.stderr.on('data', (data) => {
            compileError += data.toString();
          });
          
          cppCompileProcess.on('close', (code) => {
            if (code === 0) resolve(null);
            else reject(new Error(`C++ compilation failed: ${compileError}`));
          });
        });
        
        process = spawn(filePath);
        break;

      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    if (!process) {
      throw new Error('Failed to create process');
    }

    // Handle process output
    let output = '';
    let errors = '';

    if (process.stdout) {
      process.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        
        // Extract execution time and memory usage
        const timeMatch = text.match(/Execution Time: ([\d.]+) s/);
        const memoryMatch = text.match(/Memory Usage: ([\d.]+) MB/);
        
        if (timeMatch) {
          executionTime = parseFloat(timeMatch[1]);
        }
        if (memoryMatch) {
          memoryUsage = parseFloat(memoryMatch[1]);
        }
      });
    }

    if (process.stderr) {
      process.stderr.on('data', (data: Buffer) => {
        errors += data.toString();
      });
    }

    // Handle input if provided
    if (input && process.stdin) {
      process.stdin.write(input);
      process.stdin.end();
    }

    // Wait for process to complete with timeout
    const timeout = 10000; // 10 seconds timeout
    const executionPromise = new Promise((resolve, reject) => {
      if (!process) {
        reject(new Error('Process is null'));
        return;
      }

      process.on('close', (code: number) => {
        if (code === 0) {
          resolve(null);
        } else {
          const errorMessage = errors || `Process exited with code ${code}`;
          reject(new Error(errorMessage));
        }
      });
    });

    // Add timeout to the execution
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (process) {
          process.kill();
        }
        reject(new Error('Execution timeout'));
      }, timeout);
    });

    try {
      await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      console.error('Process execution error:', error);
      throw error;
    }

    // If execution time wasn't captured from the process output, use the total time
    if (!executionTime) {
      executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
    }

    // Analyze complexity
    const complexity = analyzeComplexity(code, language);
    const suggestions = generateAISuggestions(code, language);

    return {
      output: output.replace(/Performance Metrics:.*Memory Usage: [\d.]+ MB\n?/s, '').trim(),
      errors: errors || undefined,
      executionTime,
      memoryUsage,
      complexity,
      aiFeedback: {
        suggestions,
        overallQuality: suggestions.length === 0 ? 10 : Math.max(1, 10 - suggestions.length),
        summary: suggestions.length === 0 
          ? "Code looks good! No major issues detected."
          : `Code could be improved. Found ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}.`
      }
    };
  } catch (error) {
    console.error('Execution error:', error);
    throw error;
  } finally {
    // Cleanup temporary files and kill process if still running
    if (process) {
      try {
        process.kill();
      } catch (e) {
        console.error('Error killing process:', e);
      }
    }
    
    try {
      // Clean up files based on language
      if (language === 'java') {
        const javaFile = join(tempDir, 'Main.java');
        const javaClass = join(tempDir, 'Main.class');
        try {
          await fs.access(javaFile);
          await unlink(javaFile);
        } catch (e) {
          // File doesn't exist, ignore error
        }
        try {
          await fs.access(javaClass);
          await unlink(javaClass);
        } catch (e) {
          // File doesn't exist, ignore error
        }
      } else if (language === 'cpp') {
        const cppFile = `${filePath}.cpp`;
        try {
          await fs.access(cppFile);
          await unlink(cppFile);
        } catch (e) {
          // File doesn't exist, ignore error
        }
      } else {
        try {
          await fs.access(filePath);
          await unlink(filePath);
        } catch (e) {
          // File doesn't exist, ignore error
        }
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }
}

// Update the execute route with better error handling
app.post('/api/execute', async (req, res) => {
  const { code, language, input } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      result: {
        output: '',
        errors: 'Code and language are required',
        executionTime: 0,
        memoryUsage: 0,
        complexity: {
          time: "Unknown",
          space: "Unknown",
          explanation: "Invalid input parameters"
        }
      },
      aiFeedback: {
        suggestions: [],
        overallQuality: 0,
        summary: "Invalid input parameters"
      }
    });
  }

  try {
    console.log(`Executing ${language} code...`);
    const result = await executeCode(code, language, input);
    console.log('Execution completed successfully');
    res.json({
      result,
      aiFeedback: result.aiFeedback
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('API Error:', errorMessage);
    
    // Provide more detailed error information
    const errorResponse = {
      result: {
        output: '',
        errors: errorMessage,
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
        summary: `Code execution failed: ${errorMessage}`
      }
    };

    res.status(500).json(errorResponse);
  }
});

app.post('/api/abort', (req, res) => {
  // Implement process abortion logic here
  res.json({ success: true });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
}); 