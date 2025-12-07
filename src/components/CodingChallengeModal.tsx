import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Clock, Code, X, Send } from 'lucide-react';
import {
    SupportedLanguage,
    LANGUAGE_DISPLAY_NAMES,
    DEFAULT_CODE_TEMPLATES
} from '@/types/coding-challenge-types';

interface CodingChallengeModalProps {
    isOpen: boolean;
    question: string;
    onSubmit: (code: string, language: string, timeSpent: number) => void;
    onAbort: () => void;
}

const CODING_TIME_LIMIT = 10 * 60; // 10 minutes in seconds

export function CodingChallengeModal({
    isOpen,
    question,
    onSubmit,
    onAbort,
}: CodingChallengeModalProps) {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<SupportedLanguage>('javascript');
    const [timeLeft, setTimeLeft] = useState(CODING_TIME_LIMIT);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Initialize code template when language changes
    // Initialize code template when language changes or question changes
    useEffect(() => {
        const prefix = language === 'python' ? '# ' : '// ';
        const formattedQuestion = question
            ? question
                .split('\n')
                .map(line => `${prefix}${line}`)
                .join('\n')
            : '';

        const template = DEFAULT_CODE_TEMPLATES[language];
        setCode(formattedQuestion ? `${formattedQuestion}\n\n${template}` : template);
    }, [language, question]);

    // Start timer when modal opens
    useEffect(() => {
        if (isOpen && !startTime) {
            setStartTime(Date.now());
            setTimeLeft(CODING_TIME_LIMIT);
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeSpent = () => {
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 1000);
    };

    const handleSubmit = () => {
        const timeSpent = getTimeSpent();
        onSubmit(code, language, timeSpent);
        resetState();
    };

    const handleAutoSubmit = () => {
        const timeSpent = CODING_TIME_LIMIT;
        onSubmit(code, language, timeSpent);
        resetState();
    };

    const handleAbort = () => {
        onAbort();
        resetState();
    };

    const resetState = () => {
        const prefix = language === 'python' ? '# ' : '// ';
        const formattedQuestion = question
            ? question
                .split('\n')
                .map(line => `${prefix}${line}`)
                .join('\n')
            : '';
        const template = DEFAULT_CODE_TEMPLATES[language];

        setCode(formattedQuestion ? `${formattedQuestion}\n\n${template}` : template);
        setTimeLeft(CODING_TIME_LIMIT);
        setStartTime(null);
    };

    const getTimerColor = () => {
        if (timeLeft > 300) return 'text-green-600'; // > 5 min
        if (timeLeft > 120) return 'text-yellow-600'; // > 2 min
        return 'text-red-600'; // < 2 min
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 bg-gray-950"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Code className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Coding Challenge</h2>
                            <p className="text-sm text-gray-400">Write your solution below</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 ${getTimerColor()} font-mono text-lg font-bold`}>
                            <Clock className="h-5 w-5" />
                            {formatTime(timeLeft)}
                        </div>

                        {/* Language Selector */}
                        <Select value={language} onValueChange={(value) => setLanguage(value as SupportedLanguage)}>
                            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(LANGUAGE_DISPLAY_NAMES).map(([key, name]) => (
                                    <SelectItem key={key} value={key}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Question */}
                <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
                    <p className="text-sm font-medium text-gray-300 leading-relaxed">
                        {question}
                    </p>
                </div>

                {/* Code Editor */}
                <div className="flex-1 overflow-hidden">
                    <Editor
                        height="100%"
                        language={language === 'cpp' ? 'cpp' : language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                            padding: { top: 16, bottom: 16 },
                        }}
                    />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900">
                    <div className="text-sm text-gray-400">
                        Interview is paused. Submit your code to continue.
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleAbort}
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Abort
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Code
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
