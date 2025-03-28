import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Map our language types to Monaco's language identifiers
const languageMap: Record<Language, string> = {
  python: 'python',
  java: 'java',
  cpp: 'cpp'
};

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize editor when component mounts
  useEffect(() => {
    if (editorRef.current && !monacoEditorRef.current) {
      // Configure Monaco environment to fix worker issues
      if (typeof window !== 'undefined') {
        window.MonacoEnvironment = {
          getWorkerUrl: function(_moduleId: string, label: string) {
            // Use CDN-hosted workers to avoid build issues
            if (label === 'json') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/json/json.worker.js';
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/css/css.worker.js';
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/html/html.worker.js';
            }
            if (label === 'typescript' || label === 'javascript') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js';
            }
            return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/editor/editor.worker.js';
          }
        };
      }

      // Load Monaco editor dynamically
      import('monaco-editor').then(monaco => {
        // Register language-specific configurations and intellisense
        setupLanguageConfigurations(monaco);
        
        // Register themes
        monaco.editor.defineTheme('compileSenseLight', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
            { token: 'string', foreground: '032f62' },
            { token: 'number', foreground: '005cc5' },
            { token: 'regexp', foreground: '032f62' },
            { token: 'type', foreground: '6f42c1' },
            { token: 'class', foreground: '6f42c1' },
            { token: 'function', foreground: '6f42c1' },
            { token: 'operator', foreground: 'd73a49' }
          ],
          colors: {
            'editor.background': '#FAFAFA',
            'editor.foreground': '#1F2937',
            'editor.lineHighlightBackground': '#F3F4F6',
            'editorCursor.foreground': '#3B82F6',
            'editorWhitespace.foreground': '#D1D5DB',
            'editorIndentGuide.background': '#E5E7EB',
            'editor.selectionBackground': '#BFDBFE',
          }
        });

        monaco.editor.defineTheme('compileSenseDark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'regexp', foreground: 'D16969' },
            { token: 'type', foreground: '4EC9B0' },
            { token: 'class', foreground: '4EC9B0' },
            { token: 'function', foreground: 'DCDCAA' },
            { token: 'operator', foreground: 'D4D4D4' }
          ],
          colors: {
            'editor.background': '#111827',
            'editor.foreground': '#E5E7EB',
            'editor.lineHighlightBackground': '#1F2937',
            'editorCursor.foreground': '#60A5FA',
            'editorWhitespace.foreground': '#4B5563',
            'editorIndentGuide.background': '#374151',
            'editor.selectionBackground': '#2563EB50',
          }
        });

        // Initialize editor
        const editor = monaco.editor.create(editorRef.current!, {
          value,
          language: languageMap[language],
          theme: 'compileSenseLight',
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: 'on',
          lineHeight: 1.6,
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            alwaysConsumeMouseWheel: false
          },
          renderLineHighlight: 'line',
          roundedSelection: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 2,
          wordWrap: 'on',
          fixedOverflowWidgets: true, // Fix for suggestion widgets being cut off
          suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showIssues: true,
            showUsers: true,
            showSnippets: true
          }
        });

        // Add debouncing to avoid too many updates
        let debounceTimeout: NodeJS.Timeout;
        editor.onDidChangeModelContent(() => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            onChange(editor.getValue());
          }, 300);
        });

        // Store editor reference
        monacoEditorRef.current = editor;
        setIsEditorReady(true);

        // Listen for dark mode changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
          const theme = e.matches ? 'compileSenseDark' : 'compileSenseLight';
          monaco.editor.setTheme(theme);
        };

        // Set initial theme
        handleThemeChange(mediaQuery);
        
        // Listen for changes
        mediaQuery.addEventListener('change', handleThemeChange);

        // Listen for execution events to provide visual feedback
        const handleExecutionStart = () => {
          // Add a subtle decoration to the editor to indicate execution
          const decorations = editor.createDecorationsCollection([
            {
              range: new monaco.Range(1, 1, 1, 1),
              options: {
                isWholeLine: true,
                className: 'editor-executing-line',
                glyphMarginClassName: 'editor-executing-glyph'
              }
            }
          ]);
          
          // Store the decorations for later removal
          (editor as any)._executionDecorations = decorations;
        };
        
        const handleExecutionComplete = () => {
          // Remove execution decorations
          if ((editor as any)._executionDecorations) {
            (editor as any)._executionDecorations.clear();
          }
        };
        
        window.addEventListener('code-execution-start', handleExecutionStart);
        window.addEventListener('code-execution-complete', handleExecutionComplete);
        window.addEventListener('code-execution-aborted', handleExecutionComplete);

        // Cleanup on unmount
        return () => {
          mediaQuery.removeEventListener('change', handleThemeChange);
          window.removeEventListener('code-execution-start', handleExecutionStart);
          window.removeEventListener('code-execution-complete', handleExecutionComplete);
          window.removeEventListener('code-execution-aborted', handleExecutionComplete);
          clearTimeout(debounceTimeout);
          editor.dispose();
        };
      });
    }
  }, []);

  // Update editor language when our language prop changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setModelLanguage(
        monacoEditorRef.current.getModel()!,
        languageMap[language]
      );
    }
  }, [language]);

  // Update editor value when our value prop changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue();
      if (value !== currentValue) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  // Setup language-specific configurations for better intellisense
  const setupLanguageConfigurations = (monaco: typeof import('monaco-editor')) => {
    // Add language-specific snippets and autocompletion
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        // Calculate proper ranges for the suggestions
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: [
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new function',
              range: range
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:parameters}):\n\t\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new class',
              range: range
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for ${1:item} in ${2:items}:\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
              range: range
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if ${1:condition}:\n\t${2:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'If statement',
              range: range
            },
          ]
        };
      }
    });
    
    // Add more languages
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        // Calculate proper ranges for the suggestions
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: [
            {
              label: 'function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Function definition',
              range: range
            },
            {
              label: 'arrow',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '(${1:params}) => {\n\t${2}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Arrow function',
              range: range
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
              range: range
            },
          ]
        };
      }
    });
  };

  return (
    <div 
      ref={editorRef} 
      className={cn("h-[500px] rounded-lg overflow-hidden border border-border shadow-sm transition-all", className)}
    />
  );
};

export default CodeEditor;
