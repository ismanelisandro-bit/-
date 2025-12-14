import React, { useState, useEffect, useRef } from 'react';
import { Presentation, Slide, AudioCache } from '../types';
import { generateSpeechForSlide } from '../services/geminiService';
import { 
  ChevronLeft, ChevronRight, Volume2, HelpCircle, 
  CheckCircle, XCircle, Loader2, RotateCcw 
} from 'lucide-react';

interface SlideDeckProps {
  data: Presentation;
  onReset: () => void;
}

const SlideDeck: React.FC<SlideDeckProps> = ({ data, onReset }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef<AudioCache>({});

  const currentSlide = data.slides[currentSlideIndex];
  const totalSlides = data.slides.length;

  useEffect(() => {
    // Reset state on slide change
    setRevealedAnswer(false);
    setSelectedOption(null);
    stopAudio();
  }, [currentSlideIndex]);

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleOptionClick = (index: number) => {
    if (revealedAnswer) return; // Prevent changing after reveal
    setSelectedOption(index);
  };

  const handleReveal = () => {
    setRevealedAnswer(true);
  };

  // Audio Logic
  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { /* ignore */ }
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playExplanation = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!currentSlide.quiz?.explanation) return;

    setIsGeneratingAudio(true);
    try {
      let buffer = audioCache.current[currentSlide.id];
      
      if (!buffer) {
        // Generate if not cached
        buffer = await generateSpeechForSlide(currentSlide.quiz.explanation);
        audioCache.current[currentSlide.id] = buffer;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlayingAudio(false);
      
      audioSourceRef.current = source;
      source.start(0);
      setIsPlayingAudio(true);

    } catch (error) {
      console.error("Audio playback failed", error);
      alert("语音播放失败，请检查网络或API Key配置");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <RotateCcw className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 truncate max-w-md">{data.topic}</h1>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Slide {currentSlideIndex + 1} / {totalSlides}
        </div>
      </header>

      {/* Main Slide Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Left Content */}
          <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{currentSlide.title}</h2>
            
            <div className="flex-1 space-y-4">
              {currentSlide.contentPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2.5 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-lg text-gray-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            {/* Audio Controls (Synced Headset Support) */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4">
                 <button 
                  onClick={playExplanation}
                  disabled={isGeneratingAudio || !revealedAnswer}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    !revealedAnswer 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isPlayingAudio 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  )}
                  <span className="font-medium">
                    {isPlayingAudio ? "停止播放" : "语音解析 (耳机同步)"}
                  </span>
                </button>
                {!revealedAnswer && (
                  <span className="text-xs text-gray-400">请先完成题目查看解析后播放</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Interactive Quiz */}
          <div className="w-full md:w-[400px] bg-gray-50 p-8 flex flex-col">
            <div className="mb-6 flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm">
              <HelpCircle className="w-5 h-5" />
              课堂互动
            </div>

            {currentSlide.quiz && (
              <div className="flex-1 flex flex-col">
                <p className="text-lg font-medium text-gray-800 mb-6">
                  {currentSlide.quiz.question}
                </p>

                <div className="space-y-3 flex-1">
                  {currentSlide.quiz.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = currentSlide.quiz!.correctAnswerIndex === idx;
                    
                    let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ";
                    
                    if (revealedAnswer) {
                      if (isCorrect) {
                        btnClass += "bg-green-50 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        btnClass += "bg-red-50 border-red-500 text-red-800";
                      } else {
                        btnClass += "bg-white border-transparent opacity-50";
                      }
                    } else {
                      if (isSelected) {
                        btnClass += "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md";
                      } else {
                        btnClass += "bg-white border-gray-200 text-gray-700 hover:bg-white hover:border-indigo-300 hover:shadow-sm";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={revealedAnswer}
                        className={btnClass}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                             revealedAnswer && isCorrect ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                          
                          {revealedAnswer && isCorrect && (
                            <CheckCircle className="absolute right-4 top-4 w-5 h-5 text-green-500" />
                          )}
                          {revealedAnswer && isSelected && !isCorrect && (
                            <XCircle className="absolute right-4 top-4 w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Controls Area */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                   {!revealedAnswer ? (
                     <button
                      onClick={handleReveal}
                      disabled={selectedOption === null}
                      className={`w-full py-3 rounded-lg font-bold text-white shadow-sm transition-all ${
                        selectedOption !== null 
                          ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform active:scale-95' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                     >
                       提交答案
                     </button>
                   ) : (
                     <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                       <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                         答案解析 
                         <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">建议朗读</span>
                       </h4>
                       <p className="text-sm text-gray-600 leading-relaxed">
                         {currentSlide.quiz.explanation}
                       </p>
                     </div>
                   )}
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              currentSlideIndex === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            上一页
          </button>

          <div className="h-1.5 w-64 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
            />
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              currentSlideIndex === totalSlides - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
            }`}
          >
            下一页
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SlideDeck;