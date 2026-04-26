
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Document, Packer, Paragraph, TextRun, Numbering, LevelFormat, AlignmentType } from 'docx';

interface QuizViewProps {
  quizData: QuizQuestion[];
  onCreateNew: () => void;
}

const QuizQuestionCard: React.FC<{ question: QuizQuestion; index: number }> = ({ question, index }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  const isMultipleChoice = question.options && question.options.length > 0;

  const handleSelectAnswer = (optionIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(optionIndex);
  };
  
  const getOptionClass = (optionIndex: number) => {
    if (showAnswer) {
      if (optionIndex === question.correctAnswerIndex) {
        return 'bg-green-100 border-green-500 text-green-800';
      }
      if (optionIndex === selectedAnswer) {
        return 'bg-red-50 border-red-200 text-red-600';
      }
    } else {
      if (optionIndex === selectedAnswer) {
        return 'bg-indigo-100 border-indigo-500';
      }
    }
    return 'bg-white hover:bg-slate-50';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="text-lg font-semibold text-slate-800 whitespace-pre-wrap">
          {index + 1}. {question.question}
        </div>
        <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded tracking-wider shrink-0">
          {isMultipleChoice ? 'Multiple Choice' : 'Transformation'}
        </span>
      </div>
      
      {isMultipleChoice ? (
        <div className="space-y-3">
          {question.options!.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelectAnswer(i)}
              className={`w-full text-left p-3 border rounded-lg transition-all ${getOptionClass(i)}`}
            >
              <span className="font-mono mr-3">{String.fromCharCode(65 + i)}</span>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={showAnswer}
            placeholder="Type missing 2-5 words here..."
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
            rows={2}
          />
          <p className="text-xs text-slate-400 italic">Target: Complete the sentence using 2 to 5 words.</p>
        </div>
      )}

      {showAnswer && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-sm font-bold text-green-800 mb-1">Answer:</p>
          <p className="text-lg font-bold text-green-600">
            {isMultipleChoice 
              ? `${String.fromCharCode(65 + question.correctAnswerIndex!)}. ${question.options![question.correctAnswerIndex!]}`
              : question.modelAnswer}
          </p>
          {question.explanation && (
            <div className="mt-2 text-sm text-green-700 italic border-t border-green-200 pt-2">
              {question.explanation}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-right">
        <button onClick={() => setShowAnswer(!showAnswer)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          {showAnswer ? 'Hide' : 'Show'} Answer
        </button>
      </div>
    </div>
  );
};

const QuizView: React.FC<QuizViewProps> = ({ quizData, onCreateNew }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleDownload = (format: 'docx') => {
    if (format === 'docx') {
      generateDocx(quizData);
    }
  };

  const handleCopyText = async () => {
    if (!navigator.clipboard) return;

    let html = `<html><body><h2 style="color: #334155;">Grammar - Quiz - Maker Generated Quiz</h2>`;
    quizData.forEach((q, idx) => {
      const isMC = q.options && q.options.length > 0;
      html += `<div style="margin-bottom: 24px;">`;
      html += `<p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${idx + 1}. ${q.question}</p>`;
      
      if (isMC) {
        html += `<div style="margin-top: 0;">`;
        q.options!.forEach((opt, optIdx) => {
          const isCorrect = optIdx === q.correctAnswerIndex;
          const style = isCorrect ? 'color: #16a34a; font-weight: bold;' : 'color: #334155;';
          html += `<div style="${style} margin-bottom: 4px;">${String.fromCharCode(65 + optIdx)}. ${opt}</div>`;
        });
        html += `</div>`;
      } else {
        html += `<p style="color: #16a34a; font-weight: bold;">Answer: ${q.modelAnswer}</p>`;
      }
      
      if (q.explanation) {
        html += `<p style="color: #64748b; font-style: italic; font-size: 14px;">Note: ${q.explanation}</p>`;
      }
      html += `</div>`;
    });
    html += `</body></html>`;

    let text = `Grammar - Quiz - Maker Generated Quiz\n\n`;
    quizData.forEach((q, idx) => {
      const isMC = q.options && q.options.length > 0;
      text += `${idx + 1}. ${q.question}\n`;
      if (isMC) {
        q.options!.forEach((opt, optIdx) => {
          const isCorrect = optIdx === q.correctAnswerIndex;
          const marker = isCorrect ? ' [CORRECT]' : '';
          text += `${String.fromCharCode(65 + optIdx)}. ${opt}${marker}\n`;
        });
      } else {
        text += `Answer: ${q.modelAnswer}\n`;
      }
      if (q.explanation) {
        text += `Explanation: ${q.explanation}\n`;
      }
      text += `\n`;
    });

    try {
      // @ts-ignore
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      try {
        await navigator.clipboard.writeText(text);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (e) {
        console.error('Fallback copy failed', e);
      }
    }
  };

  const generateDocx = (data: QuizQuestion[]) => {
    const numbering = {
      config: [
        {
          reference: "quiz-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "%2)",
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
            },
          ],
        },
      ],
    };

    const docChildren: any[] = [
      new Paragraph({ text: "Grammar - Quiz - Maker Generated Quiz", heading: "Title", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
    ];

    data.forEach((q, qi) => {
      const isMC = q.options && q.options.length > 0;
      docChildren.push(new Paragraph({ text: q.question, numbering: { reference: "quiz-numbering", level: 0 } }));
      
      if (isMC) {
        q.options!.forEach((opt, i) => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: opt,
                color: i === q.correctAnswerIndex ? "16a34a" : undefined,
                bold: i === q.correctAnswerIndex,
              }),
            ],
            numbering: { reference: "quiz-numbering", level: 1 },
          }));
        });
      } else {
        docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: "Answer: ", bold: true, color: "16a34a" }),
            new TextRun({ text: q.modelAnswer || "", color: "16a34a" }),
          ],
          indent: { left: 1440 },
        }));
      }

      if (q.explanation) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `Explanation: ${q.explanation}`, italic: true, color: "64748b" })],
          indent: { left: 1440 },
        }));
      }
      
      docChildren.push(new Paragraph({ text: "" }));
    });

    const doc = new Document({
      numbering,
      sections: [{ children: docChildren }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quiz.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Your Generated Quiz</h2>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button 
            onClick={handleCopyText} 
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
              copyStatus === 'copied' 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {copyStatus === 'copied' ? 'Copied!' : 'Copy Text'}
          </button>
          <button onClick={() => handleDownload('docx')} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Download DOCX</button>
          <button onClick={onCreateNew} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Create New</button>
        </div>
      </div>
      <div className="space-y-6">
        {quizData.map((q, i) => (
          <QuizQuestionCard key={i} question={q} index={i} />
        ))}
      </div>
    </div>
  );
};

export default QuizView;
