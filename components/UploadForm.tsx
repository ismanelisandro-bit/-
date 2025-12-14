import React, { useState, useCallback } from 'react';
import { fileToGenerativePart, generateLessonPlan } from '../services/geminiService';
import { Presentation } from '../types';
import { Loader2, Upload, FileText, Image as ImageIcon } from 'lucide-react';

interface UploadFormProps {
  onSuccess: (data: Presentation) => void;
  onStart: () => void;
  onError: (msg: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSuccess, onStart, onError }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!textInput && selectedFiles.length === 0) {
      onError("请至少上传图片或输入文字内容");
      return;
    }

    setIsProcessing(true);
    onStart();

    try {
      // Process images
      const imageParts = await Promise.all(
        selectedFiles.map(file => fileToGenerativePart(file))
      );

      // Call API
      const presentation = await generateLessonPlan(textInput, imageParts);
      onSuccess(presentation);
    } catch (err: any) {
      onError(err.message || "生成失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-blue-50">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">新建互动课程</h2>
        <p className="text-gray-500">上传课件截图、PDF页面图片，或直接粘贴教学大纲文字</p>
      </div>

      <div className="space-y-6">
        {/* Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            粘贴文本资料 (Doc/PDF内容)
          </label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="在此处粘贴文本内容..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            上传图片 (支持 PPT截图, 试卷照片)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>选择文件</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="sr-only" 
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                </label>
                <p className="pl-1">或拖拽文件到这里</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF (最大 10MB)</p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 text-sm text-blue-600">
              已选择 {selectedFiles.length} 个文件
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            isProcessing 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
              正在解析生成 PPT...
            </>
          ) : (
            '一键生成互动课件'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadForm;