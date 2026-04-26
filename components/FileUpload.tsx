
import React, { useState, useCallback } from 'react';
import { UploadedFile, QuizType, FocusArea, QuizConfig } from '../types';
import { SUPPORTED_FILE_TYPES, MOCK_EXTRACTED_TEXT, QUIZ_TYPES } from '../constants';
import { Plus, Minus } from 'lucide-react';
import UploadIcon from './icons/UploadIcon';
import FileIcon from './icons/FileIcon';
import Spinner from './icons/Spinner';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[], extractedText: string, config: QuizConfig) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  
  // Configuration moved here from Step 2
  const [quizType, setQuizType] = useState<QuizType>(QuizType.MULTIPLE_CHOICE);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);
    setError(null);
    const uploadedFiles: UploadedFile[] = [];
    let hasImage = false;

    const filePromises = acceptedFiles.map(file => {
      return new Promise<UploadedFile>((resolve, reject) => {
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          return reject(new Error(`File type not supported: ${file.name}`));
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          if (file.type.startsWith('image/')) hasImage = true;
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result as string,
          });
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(filePromises);
      uploadedFiles.push(...results);
      // For non-image files, we use mock text. If an image is present, the prompt will be different.
      const extractedText = hasImage ? "Describe the content of the uploaded image(s) and generate questions based on it." : MOCK_EXTRACTED_TEXT;
      onFilesUploaded(uploadedFiles, extractedText, { numQuestions, quizType, focusArea: FocusArea.GRAMMAR });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setIsLoading(false);
      setFiles([]);
    }
  }, [onFilesUploaded, numQuestions, quizType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setFiles(selectedFiles);
      processFiles(selectedFiles);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEntering) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles && droppedFiles.length > 0) {
      setFiles(droppedFiles);
      processFiles(droppedFiles);
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    onFilesUploaded([], manualText, { numQuestions, quizType, focusArea: FocusArea.GRAMMAR });
  };

  return (
    <div className="w-full space-y-8">
      {/* Configuration Section moved to Step 1 */}
      <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
        <label className="block text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wider">Quiz Settings</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Quiz Type</label>
            <div className="flex gap-2">
              {QUIZ_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuizType(type)}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded-lg border-2 transition-all ${
                    quizType === type 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Number of Questions</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setNumQuestions(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg border-2 border-slate-200 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all"
              >
                <Minus size={18} />
              </button>
              <div className="w-12 text-center text-xl font-bold text-indigo-700">
                {numQuestions}
              </div>
              <button
                type="button"
                onClick={() => setNumQuestions(prev => Math.min(20, prev + 1))}
                className="p-2 rounded-lg border-2 border-slate-200 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all"
              >
                <Plus size={18} />
              </button>
              <span className="text-xs text-slate-400"> (Min: 1, Max: 20)</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div
          onDragEnter={(e) => handleDragEvents(e, true)}
          onDragLeave={(e) => handleDragEvents(e, false)}
          onDragOver={(e) => handleDragEvents(e, true)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 sm:p-12 border-4 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-100'}`}
        >
          {isLoading ? (
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-lg text-slate-600">Processing files...</p>
            </div>
          ) : (
            <>
              <UploadIcon />
              <p className="mt-4 text-xl font-semibold text-slate-700">Drag & drop files here</p>
              <p className="text-slate-500">or</p>
              <label htmlFor="file-upload" className="mt-2 cursor-pointer px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Browse Files
              </label>
              <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept={SUPPORTED_FILE_TYPES.join(',')} />
              <p className="mt-4 text-sm text-slate-400 max-w-xs text-center">
                Supported formats: PDF, DOCX, TXT, PPTX, JPG, PNG
              </p>
            </>
          )}
        </div>
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
        {files.length > 0 && !isLoading && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-700">Uploaded Files:</h3>
            <ul className="mt-2 space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center p-2 bg-slate-100 rounded-md">
                  <FileIcon />
                  <span className="ml-3 text-slate-800">{file.name}</span>
                  <span className="ml-auto text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full">
        <div className="border-t border-slate-300 w-full"></div>
        <span className="bg-slate-50 px-3 text-slate-500 text-sm font-medium whitespace-nowrap">OR USE TEXT</span>
        <div className="border-t border-slate-300 w-full"></div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
        <label htmlFor="manual-text" className="block text-lg font-bold text-indigo-900 mb-1">
          Grammar Topic or Content
        </label>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          Type a specific grammar topic (e.g., <span className="font-medium text-slate-700 underline decoration-indigo-200">"Passive Voice"</span>, <span className="font-medium text-slate-700 underline decoration-indigo-200">"Conditionals"</span>) or paste text to generate targeted practice.
        </p>
        <textarea
          id="manual-text"
          rows={4}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
          placeholder="e.g. Present Perfect vs Past Simple..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleManualSubmit}
            disabled={!manualText.trim() || isLoading}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Generate Grammar Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
