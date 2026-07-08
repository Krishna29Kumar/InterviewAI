/**
 * FILE: client/src/hooks/useCopyPasteDetector.js
 * =================================================
 * DSA questions pe copy-paste detect karta hai.
 * Agar copy-paste kiya → interview terminate + 0 score
 */

import { useRef, useState, useCallback, useEffect } from 'react';

// Yeh topics DSA/Coding ke hain — inpe copy-paste ban hai
const DSA_KEYWORDS = [
    'array', 'string', 'linked list', 'tree', 'graph', 'stack', 'queue',
    'heap', 'hash', 'dynamic programming', 'recursion', 'sorting', 'searching',
    'binary search', 'algorithm', 'complexity', 'big o', 'leetcode', 'coding',
    'implement', 'write a function', 'write code', 'program to', 'code to',
    'data structure', 'pointer', 'node', 'traverse', 'fibonacci', 'factorial',
    'palindrome', 'anagram', 'subsequence', 'substring', 'matrix', 'grid',
    'dfs', 'bfs', 'backtracking', 'greedy', 'divide and conquer',
];

export function isDSAQuestion(questionText = '') {
    const lower = questionText.toLowerCase();
    return DSA_KEYWORDS.some(kw => lower.includes(kw));
}

export function useCopyPasteDetector({
    currentQuestion = '',
    isActive = false,
    onViolation,      // callback jab copy-paste detect ho
}) {
    const [violationCount, setViolationCount] = useState(0);
    const [isTerminated, setIsTerminated] = useState(false);
    const lastPasteTimeRef = useRef(0);
    const isDSA = true; // Saare questions pe apply

    const handleViolation = useCallback((type) => {
        if (!isDSA || !isActive || isTerminated) return;

        const now = Date.now();
        // Debounce — same violation 2 sec ke andar dobara mat count karo
        if (now - lastPasteTimeRef.current < 2000) return;
        lastPasteTimeRef.current = now;

        setViolationCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 1) {
                // Pehli baar pe hi terminate karo
                setIsTerminated(true);
                onViolation?.({
                    type,
                    count: newCount,
                    question: currentQuestion,
                    timestamp: new Date().toISOString(),
                });
            }
            return newCount;
        });
    }, [isDSA, isActive, isTerminated, currentQuestion, onViolation]);

    // Keyboard shortcut detect karo (Ctrl+V, Cmd+V, Ctrl+C, Cmd+C)
    useEffect(() => {
        if (!isActive || !isDSA) return;

        const handleKeyDown = (e) => {
            const isMeta = e.ctrlKey || e.metaKey;
            if (isMeta && e.key === 'v') {
                e.preventDefault();
                handleViolation('keyboard_paste');
            }
            if (isMeta && e.key === 'c') {
                // Copy allow karo but track karo
                console.warn('[CopyDetect] Copy attempt on DSA question');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isDSA, handleViolation]);

    // Right click disable karo on DSA questions
    useEffect(() => {
        if (!isActive || !isDSA) return;

        const handleContextMenu = (e) => {
            e.preventDefault();
            handleViolation('right_click');
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, [isActive, isDSA, handleViolation]);

    const reset = useCallback(() => {
        setViolationCount(0);
        setIsTerminated(false);
        lastPasteTimeRef.current = 0;
    }, []);

    return {
        isDSAQuestion: isDSA,
        violationCount,
        isTerminated,
        reset,
    };
}