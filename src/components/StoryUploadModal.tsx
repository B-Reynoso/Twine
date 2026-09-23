import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  X,
  FileCode,
  CheckCircle,
  AlertCircle,
  Play,
  Save,
  Layers,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';
import { parseTwineHtml, analyzeTwineStory } from '../utils/twineParser';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStory: (story: TwineStoryData, launchImmediately: boolean) => void;
}

export function StoryUploadModal({ isOpen, onClose, onSaveStory }: StoryUploadModalProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsedStory, setParsedStory] = useState<TwineStoryData | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file.name.match(/\.(html|htm|txt)$/i)) {
      setErrorMsg('Please select a valid Twine HTML file (.html or .htm).');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error('File appears to be empty.');
        }

        const story = parseTwineHtml(content, file.name);
        setParsedStory(story);
        setCustomTitle(story.title);
        setCustomDescription(
          `Interactive scenario with ${story.passages.length} branching passages, format: ${story.format}.`
        );
        setIsLoading(false);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to parse Twine HTML structure.');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('An error occurred reading the local file.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleCommit = (launchImmediately: boolean) => {
    if (!parsedStory) return;
    const finalStory: TwineStoryData = {
      ...parsedStory,
      title: customTitle.trim() || parsedStory.title,
      description: customDescription.trim(),
    };
    onSaveStory(finalStory, launchImmediately);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedStory(null);
    setCustomTitle('');
    setCustomDescription('');
    setFileName('');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analysis = parsedStory ? analyzeTwineStory(parsedStory) : null;

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="upload-modal-container"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload Twine Scenario HTML</h2>
              <p className="text-xs text-slate-400">
                Host Harlowe, SugarCube, Chapbook, or Snowman interactive stories
              </p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* File Drop Area */}
          {!parsedStory && (
            <div
              id="drop-zone-container"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-sky-400 bg-sky-500/10 scale-[0.99]'
                  : 'border-slate-700 hover:border-sky-500/60 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                id="twine-file-input"
                type="file"
                accept=".html,.htm,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-4 rounded-full bg-slate-800 border border-slate-700 text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="w-8 h-8" />
              </div>

              <h3 className="text-sm sm:text-base font-medium text-white mb-1">
                Drag and drop your Twine HTML file here
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">
                Supports standalone Twine exports from Twine 2 & 1 (Harlowe, SugarCube, Chapbook, Snowman)
              </p>

              <button
                type="button"
                id="browse-files-btn"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Browse Local Files
              </button>

              <div className="mt-4 text-[11px] text-slate-500">
                Max recommended file size: 50MB
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-white">Analyzing Twine story passages...</p>
              <p className="text-xs text-slate-400">Verifying branch architecture and engine runtime</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Upload Failed</strong>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Parsed Scenario Preview */}
          {parsedStory && analysis && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-200">
                      Twine Scenario Verified Successfully
                    </h4>
                    <p className="text-[11px] text-emerald-400/80">
                      File: {fileName} ({(parsedStory.sizeBytes / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Scenario Metadata Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scenario Title
                  </label>
                  <input
                    id="scenario-title-input"
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                    placeholder="Enter activity title..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scenario Notes / Briefing (Optional)
                  </label>
                  <textarea
                    id="scenario-notes-input"
                    rows={2}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="Brief guidance for learners or participants..."
                  />
                </div>
              </div>

              {/* Story Structure Diagnostics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Passages
                  </span>
                  <span className="text-base font-bold text-white">
                    {analysis.totalPassages}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Branch Links
                  </span>
                  <span className="text-base font-bold text-sky-400">
                    {analysis.totalLinks}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Endings
                  </span>
                  <span className="text-base font-bold text-amber-400">
                    {analysis.endingPassagesCount}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Engine
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate block mt-1">
                    {parsedStory.format}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {parsedStory && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              id="save-only-btn"
              onClick={() => handleCommit(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save to Library
            </button>
            <button
              id="launch-immediately-btn"
              onClick={() => handleCommit(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch in Full Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
