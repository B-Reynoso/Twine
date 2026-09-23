import {
  Upload,
  HelpCircle,
  GitBranch,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  storyCount: number;
}

export function Header({
  onOpenUpload,
  onOpenHelp,
  searchQuery,
  onSearchChange,
  selectedFormat,
  onFormatChange,
  storyCount,
}: HeaderProps) {
  const formats = ['All', 'Harlowe', 'SugarCube', 'Chapbook'];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-slate-950 shadow-md shadow-sky-500/20">
              <GitBranch className="w-5 h-5 font-bold stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Twine Scenario Host
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Full Screen Player
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Interactive branching activity platform for education, simulations & interactive fiction
              </p>
            </div>
          </div>

          {/* Mobile Upload Button */}
          <button
            onClick={onOpenUpload}
            className="md:hidden p-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
            title="Upload Twine HTML"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Right Search, Filters & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search scenarios..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Format Filter Tabs */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {formats.map((fmt) => (
              <button
                key={fmt}
                onClick={() => onFormatChange(fmt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Guide / Help */}
          <button
            id="open-guide-btn"
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="How to publish and host Twine HTML"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Upload Primary CTA */}
          <button
            id="header-upload-btn"
            onClick={onOpenUpload}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/15 hover:shadow-sky-500/25 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Twine HTML</span>
          </button>
        </div>
      </div>
    </header>
  );
}
