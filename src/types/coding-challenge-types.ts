export interface CodingChallenge {
    id: string;
    question: string;
    code: string;
    language: string;
    timeSpent: number; // in seconds
    submittedAt: string;
}

export type SupportedLanguage =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'java'
    | 'cpp'
    | 'go';

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    go: 'Go',
};

export const DEFAULT_CODE_TEMPLATES: Record<SupportedLanguage, string> = {
    javascript: `// Write your solution here
function solution() {
  
}`,
    typescript: `// Write your solution here
function solution(): void {
  
}`,
    python: `# Write your solution here
def solution():
    pass`,
    java: `// Write your solution here
public class Solution {
    public void solution() {
        
    }
}`,
    cpp: `// Write your solution here
#include <iostream>
using namespace std;

void solution() {
    
}`,
    go: `// Write your solution here
package main

func solution() {
    
}`,
};
