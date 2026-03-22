import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2, BarChart2, Lightbulb } from 'lucide-react';
import { Button } from './ui/Button';
import { calculateATSScore } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ATSScoreCheckerProps {
  onBack: () => void;
}

interface ATSResult {
  score: number;
  suggestions: string[];
  analysis: string;
}

const ATSScoreChecker: React.FC<ATSScoreCheckerProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ATSResult | null>(null);
  const [lastProcessedFile, setLastProcessedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      const text = await extractTextFromPDF(file);
      if (!text.trim()) {
        throw new Error('Could not extract text from the PDF. It might be an image-based PDF.');
      }
      
      const analysisResult = await calculateATSScore(text);
      setResult(analysisResult);
      setLastProcessedFile(file);
    } catch (err: any) {
      console.error('ATS Score Checker Error:', err);
      setError(err.message || 'Failed to process the resume. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} md:size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ATS Score Checker</h1>
            <p className="text-slate-500 text-xs md:text-base">Upload your resume to see how well it performs with Applicant Tracking Systems.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Upload Section */}
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
              <Upload size={18} md:size={20} className="text-blue-600" />
              Upload Resume
            </h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf"
              />
              {file ? (
                <>
                  <FileText size={40} md:size={48} className="text-blue-600 mb-3 md:mb-4" />
                  <p className="text-slate-900 font-medium text-center break-all text-sm md:text-base">{file.name}</p>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                    <Upload size={24} md:size={32} className="text-blue-600" />
                  </div>
                  <p className="text-slate-900 font-medium text-sm md:text-base">Click to upload or drag and drop</p>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">PDF files only (Max 5MB)</p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing || file === lastProcessedFile}
              isLoading={isProcessing}
              className="w-full mt-6 py-3 md:py-4 text-base md:text-lg"
            >
              {file === lastProcessedFile && result ? 'Score Calculated' : 'Check ATS Score'}
            </Button>
          </div>

          {/* Results Section */}
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[300px] md:min-h-[400px]">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900">Analyzing your resume...</h3>
                  <p className="text-slate-500 mt-2">Gemini AI is scanning for keywords and formatting.</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <BarChart2 size={20} className="text-blue-600" />
                      Analysis Result
                    </h2>
                    <div className={`px-4 py-2 rounded-full font-bold text-xl ${getScoreBg(result.score)} ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Analysis</h3>
                    <p className="text-slate-700 leading-relaxed">{result.analysis}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" />
                      Suggestions to Improve
                    </h3>
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex gap-3 text-slate-700">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Pro Tip</p>
                        <p className="text-xs text-blue-700 mt-1">
                          A score above 80 is considered excellent. If your score is lower, try using our "ATS Classic" template which is specifically designed for high machine readability.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                  <BarChart2 size={64} className="mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No Analysis Yet</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">
                    Upload your resume and click the button to see your ATS compatibility score.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScoreChecker;
