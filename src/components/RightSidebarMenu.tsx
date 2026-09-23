import { useState } from 'react';
import {
  X,
  Play,
  Download,
  Trash2,
  FolderOpen,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';

interface RightSidebarMenuProps {
  stories: TwineStoryData[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onPlay: (story: TwineStoryData) => void;
  onDelete: (id: string) => void;
  onLoadSample?: () => void;
}

export function RightSidebarMenu({
  stories,
  isOpen,
  onClose,
  onOpen,
  onPlay,
  onDelete,
  onLoadSample,
}: RightSidebarMenuProps) {
  // Track which scenario ID is currently in "Confirm Delete" state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  // If no stories have been hosted yet, the menu stays hidden until the first scenario is hosted
  if (stories.length === 0) {
    return null;
  }

  const handleDownload = (e: React.MouseEvent, story: TwineStoryData) => {
    e.stopPropagation();
    const blob = new Blob([story.rawHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePromptDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(storyId);
  };

  const handleConfirmDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    onDelete(storyId);
    setConfirmDeleteId(null);
    if (stories.length <= 1) {
      onClose();
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleClearAll = () => {
    // Delete each story without browser prompt
    stories.forEach((s) => onDelete(s.id));
    setIsClearingAll(false);
    onClose();
  };

  return (
    <>
      {/* Trigger Button on the right hand side */}
      {!isOpen && (
        <button
          id="open-right-menu-btn"
          onClick={onOpen}
          className="fixed top-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md text-xs font-semibold transition-all duration-200 cursor-pointer hover:border-slate-600 hover:scale-105"
          title="Open Hosted Scenarios Menu"
        >
          <FolderOpen className="w-4 h-4 text-sky-400" />
          <span>Hosted Scenarios</span>
          <span className="px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
            {stories.length}
          </span>
        </button>
      )}

      {/* Backdrop overlay when open on mobile */}
      {isOpen && (
        <div
          id="right-menu-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Right Hand Side Menu / Drawer */}
      <aside
        id="right-scenarios-menu"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Hosted Scenarios
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
              {stories.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="close-right-menu-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clear All Confirmation Banner */}
        {isClearingAll && (
          <div className="p-3 bg-rose-950/80 border-b border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-medium text-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Delete all {stories.length} hosted scenarios?</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsClearingAll(false)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-clear-all-btn"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {stories.map((story) => {
            const isConfirming = confirmDeleteId === story.id;

            return (
              <div
                key={story.id}
                id={`hosted-scenario-${story.id}`}
                onClick={() => !isConfirming && onPlay(story)}
                className={`group relative flex flex-col p-3.5 rounded-xl border transition-all duration-200 ${
                  isConfirming
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/30'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-sky-500/40 cursor-pointer shadow-xs'
                }`}
              >
                {/* Regular View */}
                {!isConfirming ? (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                        {story.title}
                      </h3>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/20">
                        {story.format}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                      <span>{story.passages.length} passages</span>
                      <span>•</span>
                      <span>{(story.sizeBytes / 1024).toFixed(0)} KB</span>
                      {story.playCount > 0 && (
                        <>
                          <span>•</span>
                          <span>Played {story.playCount}x</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                        <Play className="w-3 h-3 fill-current" />
                        Play Full Screen
                      </span>

                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={(e) => handleDownload(e, story)}
                          className="p-1 rounded hover:bg-slate-700/80 hover:text-white transition-colors cursor-pointer"
                          title="Download HTML"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-btn-${story.id}`}
                          onClick={(e) => handlePromptDelete(e, story.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Delete Scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Inline Delete Confirmation */
                  <div className="space-y-2 py-1">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Delete &ldquo;{story.title}&rdquo;?</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-500/20">
                      <button
                        onClick={handleCancelDelete}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id={`confirm-delete-${story.id}`}
                        onClick={(e) => handleConfirmDelete(e, story.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Confirm Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions: Clear All & Add Sample */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={() => setIsClearingAll(true)}
            className="text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>

          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="hover:text-sky-300 transition-colors cursor-pointer"
            >
              + Add sample scenario
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
