import {
  Play,
  GitBranch,
  FileCode,
  Download,
  Trash2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';
import { analyzeTwineStory } from '../utils/twineParser';

interface StoryCardProps {
  story: TwineStoryData;
  onPlay: (story: TwineStoryData) => void;
  onInspect: (story: TwineStoryData) => void;
  onDelete: (id: string) => void;
}

export function StoryCard({ story, onPlay, onInspect, onDelete }: StoryCardProps) {
  const analysis = analyzeTwineStory(story);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([story.rawHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove "${story.title}" from your hosted scenarios?`)) {
      onDelete(story.id);
    }
  };

  return (
    <div
      id={`story-card-${story.id}`}
      className="group relative flex flex-col justify-between bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5"
    >
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25">
              {story.format}
            </span>
            {story.isSample && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured Scenario
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-500 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Download Original Twine HTML"
            >
              <Download className="w-4 h-4" />
            </button>
            {!story.isSample && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete Story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 mb-1.5">
          {story.title}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[2rem]">
          {story.description ||
            `Interactive branching scenario featuring ${story.passages.length} passages and ${analysis.totalLinks} branching choices.`}
        </p>

        {/* Story Stats Pills */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center mb-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Passages</span>
            <span className="text-xs font-bold text-slate-200">{analysis.totalPassages}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Branches</span>
            <span className="text-xs font-bold text-sky-400">{analysis.totalLinks}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Endings</span>
            <span className="text-xs font-bold text-amber-400">{analysis.endingPassagesCount}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <button
          id={`launch-fullscreen-${story.id}`}
          onClick={() => onPlay(story)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Full Screen Scenario</span>
        </button>

        <button
          id={`inspect-branches-${story.id}`}
          onClick={() => onInspect(story)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
        >
          <GitBranch className="w-3.5 h-3.5 text-sky-400" />
          <span>Inspect Branches & Flowchart</span>
        </button>
      </div>
    </div>
  );
}
