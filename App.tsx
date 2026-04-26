
import React, { useState, useCallback } from 'react';
import { AppState, QuizQuestion, QuizConfig, UploadedFile, FocusArea, QuizType } from './types';
import FileUpload from './components/FileUpload';
import QuizView from './components/QuizView';
import { generateQuiz } from './services/geminiService';
import Spinner from './components/icons/Spinner';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOADING);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    numQuestions: 5,
    focusArea: FocusArea.GRAMMAR,
    quizType: QuizType.MULTIPLE_CHOICE,
  });
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = useCallback(async (config: QuizConfig, currentFiles: UploadedFile[], currentText: string) => {
    setQuizConfig(config);
    setAppState(AppState.GENERATING);
    setError(null);

    try {
      const imageParts = currentFiles
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          inlineData: {
            mimeType: file.type,
            data: file.content.split(',')[1],
          },
        }));

      const generatedQuestions = await generateQuiz(
        currentText, 
        imageParts, 
        config.numQuestions, 
        config.focusArea,
        config.quizType
      );
      setQuizData(generatedQuestions);
      setAppState(AppState.VIEWING_QUIZ);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate quiz. ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleFilesUploaded = useCallback((files: UploadedFile[], text: string, config: QuizConfig) => {
    setUploadedFiles(files);
    setExtractedText(text);
    handleGenerateQuiz(config, files, text);
  }, [handleGenerateQuiz]);

  const handleCreateNew = useCallback(() => {
    setUploadedFiles([]);
    setExtractedText('');
    setQuizData([]);
    setError(null);
    setAppState(AppState.UPLOADING);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.UPLOADING:
        return <FileUpload onFilesUploaded={handleFilesUploaded} />;
      case AppState.GENERATING:
        return (
          <div className="text-center p-8">
            <div className="flex justify-center items-center mb-4">
              <Spinner />
            </div>
            <h2 className="text-2xl font-semibold text-slate-700">Generating Your Quiz...</h2>
            <p className="text-slate-500 mt-2">Our AI is hard at work. This might take a moment.</p>
          </div>
        );
      case AppState.VIEWING_QUIZ:
        return <QuizView quizData={quizData} onCreateNew={handleCreateNew} />;
      case AppState.ERROR:
        return (
          <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-2xl font-semibold text-red-700">Oops! Something went wrong.</h2>
            <p className="text-red-600 mt-2 mb-4">{error}</p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
          Grammar - Quiz - Maker
        </h1>
        <p className="mt-2 text-lg text-slate-600">Turn any document or image into a quiz instantly.</p>
      </header>
      <main className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-4 sm:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={appState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
