
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ComplexityEstimate } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, MemoryStick, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetricsProps {
  executionTime?: number;
  memoryUsage?: number;
  complexity?: ComplexityEstimate;
  className?: string;
}

// Mapping complexity notations to numeric scores for visualization
const complexityScores: Record<string, number> = {
  'O(1)': 1,
  'O(log n)': 2, 
  'O(n)': 3,
  'O(n log n)': 4,
  'O(n²)': 5,
  'O(n³)': 6,
  'O(2^n)': 7,
  'O(n!)': 8
};

// Color mapping for complexity visualization
const complexityColors = {
  good: 'hsl(var(--success))',
  average: 'hsl(var(--warning))',
  poor: 'hsl(var(--destructive))'
};

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  executionTime, 
  memoryUsage, 
  complexity,
  className 
}) => {
  // Convert time and memory to performance score (1-10)
  const timeScore = useMemo(() => {
    if (!executionTime) return 0;
    // Lower is better, scale inversely (max 1 second = score 1)
    return Math.max(1, 10 - Math.min(9, Math.floor(executionTime * 10)));
  }, [executionTime]);

  const memoryScore = useMemo(() => {
    if (!memoryUsage) return 0;
    // Lower is better, scale inversely (max 10MB = score 1)
    return Math.max(1, 10 - Math.min(9, Math.floor(memoryUsage / 2)));
  }, [memoryUsage]);

  // Get complexity score and color
  const getComplexityScore = (complexityString?: string): number => {
    if (!complexityString) return 0;
    
    for (const [notation, score] of Object.entries(complexityScores)) {
      if (complexityString.includes(notation)) {
        return score;
      }
    }
    
    return 0;
  };

  const getComplexityColor = (score: number): string => {
    if (score <= 3) return complexityColors.good;
    if (score <= 5) return complexityColors.average;
    return complexityColors.poor;
  };

  const timeComplexityScore = getComplexityScore(complexity?.time);
  const spaceComplexityScore = getComplexityScore(complexity?.space);

  const complexityData = [
    { 
      name: 'Time', 
      value: timeComplexityScore, 
      complexity: complexity?.time || 'N/A',
      color: getComplexityColor(timeComplexityScore)
    },
    { 
      name: 'Space', 
      value: spaceComplexityScore, 
      complexity: complexity?.space || 'N/A',
      color: getComplexityColor(spaceComplexityScore)
    }
  ];

  // Performance overview data
  const performanceData = [
    { name: 'Execution Speed', value: timeScore, metric: executionTime ? `${executionTime.toFixed(3)}s` : '—' },
    { name: 'Memory Usage', value: memoryScore, metric: memoryUsage ? `${memoryUsage.toFixed(1)}MB` : '—' },
  ];

  if (!executionTime && !memoryUsage && !complexity) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Activity className="h-10 w-10 mb-2 opacity-20" />
            <p>Execute your code to see performance metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Activity className="mr-2 h-4 w-4" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Performance Rating */}
          {(executionTime || memoryUsage) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Runtime Performance</h4>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} hide />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border p-2 rounded-md shadow-sm">
                              <p className="text-xs font-medium">{data.name}:</p>
                              <p className="text-sm">{data.metric}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Complexity Analysis */}
          {complexity && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Algorithm Complexity</h4>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complexityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 8]} hide />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border p-2 rounded-md shadow-sm">
                              <p className="text-xs font-medium">{data.name} Complexity:</p>
                              <p className="text-sm font-mono">{data.complexity}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                      {complexityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Execution Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 bg-accent p-3 rounded-md">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-xs text-muted-foreground mb-1">Execution Time</h4>
                <div className="flex items-center">
                  <p className="text-lg font-semibold">{executionTime?.toFixed(3) || '—'} s</p>
                  {executionTime && executionTime < 0.1 && (
                    <Badge className="ml-2 bg-green-500/20 text-green-700 dark:text-green-400 dark:bg-green-900/30">
                      Fast
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-accent p-3 rounded-md">
              <MemoryStick className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-xs text-muted-foreground mb-1">Memory Usage</h4>
                <div className="flex items-center">
                  <p className="text-lg font-semibold">{memoryUsage?.toFixed(1) || '—'} MB</p>
                  {memoryUsage && memoryUsage < 6 && (
                    <Badge className="ml-2 bg-green-500/20 text-green-700 dark:text-green-400 dark:bg-green-900/30">
                      Efficient
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation if available */}
          {complexity?.explanation && (
            <div className="bg-accent/50 p-3 rounded-md text-sm mt-2">
              <div className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                <p className="text-xs text-muted-foreground">{complexity.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
