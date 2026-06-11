import React, { useState, useEffect, useCallback } from 'react';
import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers';

export interface AICommentatorProps {
  onCommentGenerated?: (comment: string) => void;
  prompt: string;
  autoGenerate?: boolean;
  className?: string;
}

export const AICommentator: React.FC<AICommentatorProps> = ({
  onCommentGenerated,
  prompt,
  autoGenerate = false,
  className = '',
}) => {
  const [generator, setGenerator] = useState<TextGenerationPipeline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comment, setComment] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Инициализация модели (один раз)
  const initGenerator = useCallback(async () => {
    if (generator || isLoading) return;
    setIsLoading(true);
    setLoadProgress(0);
    setError(null);
    try {
      // Компактная модель ~135M параметров, ~200МБ в квантованном виде
      const pipe = await pipeline(
        'text-generation',
        'Xenova/SmolLM-135M-Instruct',
        { progress_callback: (progress: any) => setLoadProgress(progress.progress || 0) }
      );
      setGenerator(pipe);
    } catch (err) {
      console.error('Failed to load AI model:', err);
      setError('Не удалось загрузить модель. Попробуйте перезагрузить страницу.');
    } finally {
      setIsLoading(false);
    }
  }, [generator, isLoading]);

  const generateComment = useCallback(async () => {
    if (!generator) {
      await initGenerator();
      return;
    }
    if (!prompt.trim()) {
      setComment('❓ Нет данных для анализа.');
      onCommentGenerated?.('❓ Нет данных для анализа.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const fullPrompt = `Ты — комментатор-эксперт по теории «Амбиент». 
Проанализируй ситуацию и напиши содержательный комментарий (2-4 предложения) на русском языке.

Контекст: ${prompt}

Комментарий:`;
      const output = await generator(fullPrompt, {
        max_new_tokens: 128,
        temperature: 0.7,
        do_sample: true,
      });
      const arr = output as Array<{ generated_text: string }>;
      const result = arr[0]?.generated_text?.replace(fullPrompt, '').trim() || 'Не удалось сгенерировать комментарий.';
      setComment(result);
      onCommentGenerated?.(result);
    } catch (err) {
      console.error('Generation failed:', err);
      setComment('⚠️ Ошибка генерации. Попробуйте ещё раз.');
      onCommentGenerated?.('⚠️ Ошибка генерации. Попробуйте ещё раз.');
    } finally {
      setIsGenerating(false);
    }
  }, [generator, prompt, onCommentGenerated, initGenerator]);

  // Автогенерация при монтировании
  useEffect(() => {
    if (autoGenerate && prompt) {
      generateComment();
    }
  }, [autoGenerate, prompt, generateComment]);

  return (
    <div className={`bg-amber-100/60 rounded-lg p-3 border border-amber-400 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-amber-900">🧠 AI Комментатор (локальный)</span>
        {!generator && !isLoading && (
          <button
            onClick={initGenerator}
            className="text-xs bg-amber-700 text-white px-2 py-1 rounded hover:bg-amber-800"
          >
            🔌 Активировать AI
          </button>
        )}
        {generator && !isGenerating && (
          <button
            onClick={generateComment}
            className="text-xs bg-amber-700 text-white px-2 py-1 rounded hover:bg-amber-800"
          >
            ✨ Спросить AI
          </button>
        )}
      </div>
      {isLoading && (
        <div className="text-xs text-amber-700">
          Загрузка модели: {Math.round(loadProgress * 100)}%…
          <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
            <div className="bg-amber-700 h-1.5 rounded-full" style={{ width: `${loadProgress * 100}%` }} />
          </div>
        </div>
      )}
      {isGenerating && <div className="text-sm text-amber-600 italic animate-pulse">🤔 Генерация...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {comment && !isGenerating && (
        <div className="text-sm text-amber-900 border-l-3 border-amber-600 pl-2 italic">
          «{comment}»
        </div>
      )}
    </div>
  );
};
