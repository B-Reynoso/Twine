import { useState } from 'react';
import {
  X,
  Play,
  Download,
  Trash2,
  GitBranch,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  Check,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';
import { analyzeTwineStory } from '../utils/twineParser';
import { BranchVisualizer } from './BranchVisualizer';

interface StoryDetailModalProps {
  story: TwineStoryData;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (story: TwineStoryData) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export function StoryDetailModal({
  story,
  isOpen,
  onClose,
  onPlay,
  onDelete,
  onUpdateTitle,
}: StoryDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(story.title);

  if (!isOpen) return null;

  const analysis = analyzeTwineStory(story);

  const handleDownload = () => {
    const blob = new Blob([story.rawHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(story.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const estimatedReadingTime = Math.ceil(analysis.totalWords / 180);

  return (
    <div
      id="story-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="story-detail-modal"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="px-2 py-1 bg-slate-800 border border-sky-400 rounded text-sm text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate max-w-md">
                    {story.title}
                  </h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {story.format}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Created with {story.creator || 'Twine'} • Start Node: {analysis.startPassageName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="detail-play-btn"
              onClick={() => {
                onClose();
                onPlay(story);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Full Screen</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Download Twine HTML File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-6 py-3 bg-slate-950/70 border-b border-slate-800 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Passages
            </span>
            <span className="text-sm font-bold text-white">{analysis.totalPassages}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Branch Choices
            </span>
            <span className="text-sm font-bold text-sky-400">{analysis.totalLinks}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Resolution Nodes
            </span>
            <span className="text-sm font-bold text-amber-400">
              {analysis.endingPassagesCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Avg Branching
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {analysis.averageBranchingFactor}x
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Est. Reading
            </span>
            <span className="text-sm font-bold text-indigo-300">
              ~{estimatedReadingTime} min
            </span>
          </div>
        </div>

        {/* Body: Branch Flowchart Visualizer */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Interactive Scenario Branch Graph
            </h3>
            <span className="text-[11px] text-slate-400">
              Click any node to inspect passage text & choices
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <BranchVisualizer story={story} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <div>
            Story Size: {(story.sizeBytes / 1024).toFixed(1)} KB • Total Words: {analysis.totalWords}
          </div>
          {!story.isSample && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this scenario from your library?')) {
                  onDelete(story.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Scenario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
