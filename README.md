# CompileSense

A modern, feature-rich online code compiler and execution platform that supports multiple programming languages with real-time performance analysis and AI-powered code suggestions.

## Overview

Smart Compiler Hub is a web-based IDE that allows users to write, compile, and execute code in multiple programming languages while providing detailed performance metrics, complexity analysis, and AI-powered code suggestions. The platform features a modern, responsive UI and supports real-time code execution with comprehensive error handling.

## Features

### 1. Multi-Language Support
- **JavaScript**: Native Node.js execution
- **Python**: Python interpreter with memory tracking
- **Java**: Full Java compiler and runtime support
- **C++**: GCC compiler with performance monitoring

### 2. Performance Analysis
- Real-time execution time tracking
- Memory usage monitoring
- Performance visualization graphs
- Detailed metrics display
- Complexity analysis (Big O notation)

### 3. AI-Powered Features
- Code complexity analysis
- Performance optimization suggestions
- Code quality recommendations
- Best practices enforcement
- Error detection and resolution

### 4. User Interface
- Modern, responsive design
- Real-time code execution
- Syntax highlighting
- Error highlighting
- Performance metrics visualization
- Dark/Light mode support

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React hooks
- **Charts**: Recharts for performance visualization
- **Code Editor**: Monaco Editor integration

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Process Management**: Child process handling
- **File System**: Temporary file management
- **Error Handling**: Comprehensive error catching

## Key Components

### 1. Code Execution Engine
```typescript
async function executeCode(code: string, language: string, input: string = ''): Promise<any>
```
- Handles code compilation and execution
- Manages process lifecycle
- Captures output and errors
- Tracks performance metrics

### 2. Performance Metrics
```typescript
interface PerformanceMetricsProps {
  executionTime?: number;
  memoryUsage?: number;
  complexity?: ComplexityEstimate;
  className?: string;
}
```
- Real-time execution time tracking
- Memory usage monitoring
- Complexity analysis visualization
- Performance scoring system

### 3. AI Analysis
```typescript
function analyzeComplexity(code: string, language: string)
function generateAISuggestions(code: string, language: string)
```
- Code complexity analysis
- Performance optimization suggestions
- Best practices recommendations
- Error detection

## Language-Specific Features

### Java
- Full class compilation support
- Nanosecond precision timing
- Memory usage tracking
- Exception handling
- Output buffering

### Python
- Memory usage monitoring
- Garbage collection integration
- Error handling
- Output capture

### C++
- GCC compilation
- Performance tracking
- Memory monitoring
- Error handling

### JavaScript
- Node.js runtime
- Memory tracking
- Error handling
- Performance monitoring

## Performance Metrics System

### 1. Execution Time Tracking
- Nanosecond precision for Java
- Millisecond precision for other languages
- Real-time monitoring
- Performance visualization

### 2. Memory Usage Monitoring
- Process memory tracking
- Heap usage analysis
- Memory leak detection
- Resource cleanup

### 3. Complexity Analysis
- Time complexity calculation
- Space complexity estimation
- Algorithm analysis
- Performance scoring

## Error Handling

### 1. Compilation Errors
- Detailed error messages
- Line number highlighting
- Syntax error detection
- Type checking

### 2. Runtime Errors
- Exception handling
- Stack trace capture
- Error visualization
- Recovery suggestions

### 3. System Errors
- Process management
- Resource cleanup
- Timeout handling
- Memory management

## Security Features

### 1. Code Execution
- Sandboxed environment
- Resource limits
- Timeout enforcement
- Memory constraints

### 2. Input Validation
- Code sanitization
- Input validation
- Output filtering
- Error handling

## API Endpoints

### 1. Code Execution
```typescript
POST /api/execute
{
  code: string;
  language: string;
  input?: string;
}
```

### 2. Process Management
```typescript
POST /api/abort
```

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- Java Development Kit (JDK)
- Python (v3.7 or higher)
- GCC (for C++ support)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

