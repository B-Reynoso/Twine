import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { TwineStoryData } from './types/twine';
import { getAllStories, saveStory, deleteStory } from './utils/storage';
import { parseTwineHtml } from './utils/twineParser';
import { TwinePlayer } from './components/TwinePlayer';
import { RightSidebarMenu } from './components/RightSidebarMenu';
import { UploadCloud, AlertCircle, FileCode } from 'lucide-react';
import { sampleStories } from './data/sampleStories';

export default function App() {
  const [stories, setStories] = useState<TwineStoryData[]>([]);
  const [activePlayerStory, setActivePlayerStory] = useState<TwineStoryData | null>(null);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load previously hosted scenarios
  useEffect(() => {
    async function loadData() {
      try {
        const stored = await getAllStories();
        setStories(stored);
      } catch (err) {
        console.error('Failed to load stories:', err);
      }
    }
    loadData();
  }, []);

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.match(/\.(html|htm|txt)$/i)) {
      setErrorMessage('Please upload a valid Twine HTML file (.html or .htm).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error('File content is empty.');

        const story = parseTwineHtml(content, file.name);

        // Save to storage
        await saveStory(story);

        // Update stored scenarios list
        setStories((prev) => [story, ...prev.filter((s) => s.id !== story.id)]);

        setIsProcessing(false);

        // Immediately load the scenario activity in full screen mode with all branches intact
        setActivePlayerStory(story);
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err?.message || 'Failed to parse Twine HTML file.');
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage('Error reading file.');
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
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDeleteStory = async (id: string) => {
    await deleteStory(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    if (activePlayerStory?.id === id) setActivePlayerStory(null);
  };

  const handleLoadSample = async () => {
    const sample = sampleStories[0];
    await saveStory(sample);
    setStories((prev) => [sample, ...prev.filter((s) => s.id !== sample.id)]);
    setActivePlayerStory(sample);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      {/* Right Hand Side Menu for Hosted Scenarios */}
      <RightSidebarMenu
        stories={stories}
        isOpen={isRightMenuOpen}
        onOpen={() => setIsRightMenuOpen(true)}
        onClose={() => setIsRightMenuOpen(false)}
        onPlay={(story) => setActivePlayerStory(story)}
        onDelete={handleDeleteStory}
        onLoadSample={handleLoadSample}
      />

      {/* Main Clean Centered Interface */}
      <main className="flex flex-col items-center text-center max-w-xl w-full">
        {/* Title */}
        <h1
          id="app-title"
          className="text-4xl sm:text-6xl font-light tracking-tight text-white mb-8"
        >
          Twine
        </h1>

        {/* Drop Box */}
        <div
          id="twine-drop-box"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group w-full rounded-2xl border-2 border-dashed p-12 sm:p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/60'
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

          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-300">Loading scenario...</p>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 group-hover:text-white mb-4 transition-colors">
                <UploadCloud className="w-8 h-8 stroke-[1.8]" />
              </div>

              <span className="text-lg sm:text-xl font-medium text-slate-200 group-hover:text-white transition-colors">
                Drop Twine HTML File
              </span>

              <span className="text-xs text-slate-500 mt-1.5">
                or click to browse
              </span>
            </>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            id="error-message"
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </main>

      {/* Full-Screen Twine Scenario Player */}
      {activePlayerStory && (
        <TwinePlayer
          story={activePlayerStory}
          onClose={() => setActivePlayerStory(null)}
          onDelete={handleDeleteStory}
          initialFullscreen={true}
        />
      )}
    </div>
  );
}
