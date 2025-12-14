import React, { useState } from 'react';
import { Presentation, AppState } from './types';
import UploadForm from './components/UploadForm';
import SlideDeck from './components/SlideDeck';
import { GraduationCap, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [presentationData, setPresentationData] = useState<Presentation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleUploadSuccess = (data: Presentation) => {
    setPresentationData(data);
    setAppState(AppState.PRESENTATION);
  };

  const handleStartGeneration = () => {
    setAppState(AppState.GENERATING);
    setErrorMsg("");
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setAppState(AppState.ERROR);
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setPresentationData(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen font-sans text-gray-900">
      
      {appState === AppState.UPLOAD || appState === AppState.GENERATING || appState === AppState.ERROR ? (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
          {/* Landing Header */}
          <div className="py-12 text-center px-4">
             <div className="flex justify-center mb-4">
               <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                 <GraduationCap className="w-10 h-10 text-white" />
               </div>
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
               SmartLesson <span className="text-blue-600">智课</span>
             </h1>
             <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
               AI 驱动的互动课堂生成器。上传文档或图片，立即生成带解析和语音讲解的互动课件。
             </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-4 pb-12">
            {appState === AppState.ERROR && (
               <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                 <div>
                   <h3 className="font-bold text-red-800">发生错误</h3>
                   <p className="text-sm text-red-600">{errorMsg}</p>
                   <button 
                    onClick={() => setAppState(AppState.UPLOAD)}
                    className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
                   >
                     返回重试
                   </button>
                 </div>
               </div>
            )}

            <UploadForm 
              onSuccess={handleUploadSuccess} 
              onStart={handleStartGeneration}
              onError={handleError}
            />

            {/* Features Grid */}
            <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="font-bold text-gray-800 mb-2">多格式支持</h3>
                <p className="text-sm text-gray-500">支持直接粘贴讲义文本，或上传 PPT/PDF 截图。智能识别图文内容。</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="font-bold text-gray-800 mb-2">自动生成互动</h3>
                <p className="text-sm text-gray-500">AI 自动提取知识点，并为每一页生成选择题和详细解析。</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="font-bold text-gray-800 mb-2">语音同步讲解</h3>
                <p className="text-sm text-gray-500">内置 TTS 语音合成，点击按钮即可播放专业老师口吻的答案解析。</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        presentationData && <SlideDeck data={presentationData} onReset={handleReset} />
      )}
    </div>
  );
};

export default App;