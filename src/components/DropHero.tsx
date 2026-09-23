import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileCode,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';
import { parseTwineHtml } from '../utils/twineParser';

interface DropHeroProps {
  onStoryLoaded: (story: TwineStoryData, launchImmediately: boolean) => void;
  onOpenHelp: () => void;
}

export function DropHero({ onStoryLoaded, onOpenHelp }: DropHeroProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.match(/\.(html|htm|txt)$/i)) {
      setErrorMsg('Please drop a valid Twine HTML file (.html or .htm).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error('File content is empty.');

        const story = parseTwineHtml(content, file.name);
        setIsProcessing(false);
        // By default, launch the uploaded scenario activity in full screen mode immediately as requested!
        onStoryLoaded(story, true);
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMsg(err?.message || 'Unable to parse Twine story passages.');
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMsg('Error reading file from disk.');
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 p-6 sm:p-10 shadow-2xl">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Value Prop */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Zero Configuration Twine Runner
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Host & Play Branching Scenarios in <span className="text-sky-400">Full Screen</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Upload your Twine HTML exports. All decision pathways, macros, styling, and story format runtimes (Harlowe, SugarCube, Chapbook, Snowman) remain 100% intact with immersive fullscreen presentation.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Screen Focus HUD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Branch Map Visualizer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Preserves All Runtimes</span>
            </div>
          </div>
        </div>

        {/* Right Drag & Drop Interactive Target */}
        <div className="w-full lg:w-96">
          <div
            id="hero-drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
              isDragging
                ? 'border-sky-400 bg-sky-500/15 scale-[1.02] shadow-2xl shadow-sky-500/20'
                : 'border-slate-700/80 hover:border-sky-400/70 bg-slate-950/60 hover:bg-slate-950/90'
            }`}
          >
            <input
              ref={fileInputRef}
              id="hero-twine-file-input"
              type="file"
              accept=".html,.htm,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="py-4">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-white">Loading Scenario...</p>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 mb-3 transition-transform group-hover:scale-110">
                  <UploadCloud className="w-7 h-7 stroke-[2]" />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  Drop Twine HTML File
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-[220px]">
                  Loads your scenario and launches full screen mode instantly
                </p>

                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-colors">
                  <FileCode className="w-3.5 h-3.5" />
                  Select .html File
                </span>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
