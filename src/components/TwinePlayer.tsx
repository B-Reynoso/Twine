import { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  GitBranch,
  X,
  ExternalLink,
  Clock,
  Eye,
  Info,
  ChevronDown,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { TwineStoryData } from '../types/twine';
import { BranchVisualizer } from './BranchVisualizer';
import { recordStoryPlayed } from '../utils/storage';

interface TwinePlayerProps {
  story: TwineStoryData;
  onClose: () => void;
  onDelete?: (id: string) => void;
  initialFullscreen?: boolean;
}

function prepareTwineHtml(rawHtml: string): string {
  const resetScript = `
<script id="__twine_bridge_controller">
(function() {
  function handleScenarioRestart() {
    try { sessionStorage.clear(); } catch(e) {}
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && (k.indexOf('twine') !== -1 || k.indexOf('sugar') !== -1 || k.indexOf('harlowe') !== -1 || k.indexOf('state') !== -1)) {
          localStorage.removeItem(k);
        }
      }
    } catch(e) {}

    try {
      if (window.location && window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch(e) {}

    // 1. Custom scenario runner
    if (typeof window.__restartTwineScenario === 'function') {
      try {
        window.__restartTwineScenario();
        return;
      } catch(e) {}
    }

    // 2. SugarCube engine
    if (window.SugarCube && window.SugarCube.Engine && typeof window.SugarCube.Engine.restart === 'function') {
      try {
        window.SugarCube.Engine.restart();
        return;
      } catch(e) {}
    }

    // 3. Harlowe / general reload with clean session starts at beginning
    try {
      window.location.reload();
    } catch(e) {}
  }

  window.__twineHostResetToBeginning = handleScenarioRestart;

  window.addEventListener('message', function(ev) {
    if (ev && (ev.data === 'TWINE_RESTART' || (ev.data && ev.data.type === 'TWINE_RESTART'))) {
      handleScenarioRestart();
    }
  });
})();
</script>
`;

  if (rawHtml.includes('</head>')) {
    return rawHtml.replace('</head>', `${resetScript}</head>`);
  } else if (rawHtml.includes('</body>')) {
    return rawHtml.replace('</body>', `${resetScript}</body>`);
  } else {
    return rawHtml + resetScript;
  }
}

export function TwinePlayer({ story, onClose, onDelete, initialFullscreen = true }: TwinePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showBranchDrawer, setShowBranchDrawer] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentPassageName, setCurrentPassageName] = useState<string>('');
  const [visitedPassages, setVisitedPassages] = useState<string[]>([]);
  const [bgTheme, setBgTheme] = useState<'slate' | 'black' | 'charcoal'>('slate');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const hideHudTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize blob URL with bridge controller injected
  useEffect(() => {
    recordStoryPlayed(story.id);

    const preparedHtml = prepareTwineHtml(story.rawHtml);
    const blob = new Blob([preparedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    // Initial passage
    const startPassage = story.passages.find((p) => p.pid === story.startNodePid) || story.passages[0];
    if (startPassage) {
      setCurrentPassageName(startPassage.name);
      setVisitedPassages([startPassage.name]);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [story]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Attempt real browser fullscreen if initialFullscreen is true
  useEffect(() => {
    if (initialFullscreen && containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // Fullscreen API may be blocked in iframe environment; CSS fallback handles it
      });
    }
  }, [initialFullscreen]);

  // Listen for message from Twine scenario
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TWINE_PASSAGE_CHANGED') {
        const name = event.data.passageName;
        if (name) {
          setCurrentPassageName(name);
          setVisitedPassages((prev) => (prev.includes(name) ? prev : [...prev, name]));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-hide HUD on idle
  const handleMouseMove = () => {
    setShowHud(true);
    if (hideHudTimerRef.current) clearTimeout(hideHudTimerRef.current);
    hideHudTimerRef.current = setTimeout(() => {
      if (!showBranchDrawer) {
        setShowHud(false);
      }
    }, 3800);
  };

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.();
        setIsBrowserFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsBrowserFullscreen(false);
      }
    } catch (e) {
      // Toggle CSS fullscreen if native fails
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleRestart = () => {
    // 1. Reset HUD timer and current passage tracking
    setElapsedSeconds(0);
    const startPassage = story.passages.find((p) => p.pid === story.startNodePid) || story.passages[0];
    if (startPassage) {
      setCurrentPassageName(startPassage.name);
      setVisitedPassages([startPassage.name]);
    }

    // 2. Direct reset via iframe contentWindow
    const iframeEl = iframeRef.current;
    if (!iframeEl) return;

    try {
      const cw = iframeEl.contentWindow as any;
      if (cw) {
        // Clear Twine story sessions from sessionStorage & localStorage
        try {
          cw.sessionStorage?.clear();
          for (let i = (cw.localStorage?.length || 0) - 1; i >= 0; i--) {
            const k = cw.localStorage?.key(i);
            if (k && (k.includes('twine') || k.includes('sugar') || k.includes('harlowe') || k.includes('state'))) {
              cw.localStorage?.removeItem(k);
            }
          }
        } catch (e) {}

        // Reset URL hash
        try {
          if (cw.location && cw.location.hash) {
            cw.history?.replaceState(null, '', cw.location.pathname + cw.location.search);
          }
        } catch (e) {}

        // Check if explicit hook was registered by our injected bridge or custom story
        if (typeof cw.__twineHostResetToBeginning === 'function') {
          cw.__twineHostResetToBeginning();
          return;
        }

        if (typeof cw.__restartTwineScenario === 'function') {
          cw.__restartTwineScenario();
          return;
        }

        if (cw.SugarCube?.Engine?.restart) {
          cw.SugarCube.Engine.restart();
          return;
        }

        // Send postMessage as backup
        cw.postMessage({ type: 'TWINE_RESTART' }, '*');

        // Reload window with clean storage
        cw.location?.reload();
        return;
      }
    } catch (e) {
      console.warn('Direct iframe restart error:', e);
    }

    // Fallback: re-assign iframe src to trigger clean navigation
    if (blobUrl) {
      iframeEl.src = blobUrl;
    }
  };

  const openInNewTab = () => {
    if (!blobUrl) return;
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // Fallback
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.click();
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bgStyles = {
    slate: 'bg-slate-950',
    black: 'bg-black',
    charcoal: 'bg-zinc-950',
  };

  return (
    <div
      ref={containerRef}
      id="twine-player-container"
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col w-full h-full overflow-hidden select-none transition-colors duration-300 ${bgStyles[bgTheme]}`}
    >
      {/* Floating HUD Top Bar */}
      <header
        id="twine-player-header-hud"
        className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ease-out px-4 py-3 flex items-center justify-between ${
          showHud
            ? 'opacity-100 translate-y-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-xs'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Left: Story Info & Close */}
        <div className="flex items-center gap-3">
          <button
            id="player-exit-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-sm font-medium border border-white/10 transition-all cursor-pointer shadow-sm"
            title="Return to Story Library"
          >
            <X className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Exit Player</span>
          </button>

          <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                {story.title}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                {story.format}
              </span>
            </div>
            {currentPassageName && (
              <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-sm flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Branch: <span className="text-slate-200 font-medium">{currentPassageName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Controls HUD */}
        <div className="flex items-center gap-2">
          {/* Scenario Timer */}
          <div
            id="scenario-timer"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300"
            title="Elapsed Scenario Session Duration"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Visited Branches Badge */}
          <div
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-slate-300 font-medium"
            title="Passages explored in this session"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {visitedPassages.length} / {story.passages.length} nodes
            </span>
          </div>

          {/* Inspect Branches Visualizer Button */}
          <button
            id="toggle-branch-map-btn"
            onClick={() => setShowBranchDrawer(!showBranchDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showBranchDrawer
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
            }`}
            title="Inspect Scenario Branch Network"
          >
            <GitBranch className="w-4 h-4 text-sky-300" />
            <span className="hidden sm:inline">Branch Map</span>
          </button>

          {/* Restart Scenario Button */}
          <button
            id="restart-scenario-btn"
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
            title="Restart Scenario from Start Passage"
          >
            <RotateCcw className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Open in Standalone Tab */}
          <button
            id="open-standalone-tab-btn"
            onClick={openInNewTab}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Open Pure Standalone Scenario in New Window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Delete Scenario Button */}
          {onDelete && (
            <div className="relative">
              {!isConfirmingDelete ? (
                <button
                  id="player-delete-scenario-btn"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition-all cursor-pointer"
                  title="Delete This Scenario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute right-0 top-full mt-1.5 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-rose-500/50 shadow-xl z-50">
                  <span className="text-[11px] text-rose-300 whitespace-nowrap pl-1">Delete?</span>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white"
                  >
                    No
                  </button>
                  <button
                    id="player-confirm-delete-btn"
                    onClick={() => {
                      onDelete(story.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    Yes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="toggle-fullscreen-btn"
            onClick={toggleBrowserFullscreen}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-all cursor-pointer"
            title={isBrowserFullscreen ? 'Exit Browser Fullscreen' : 'Enter Fullscreen'}
          >
            {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Twine Scenario Iframe Container */}
      <main className="relative flex-1 w-full h-full">
        {blobUrl ? (
          <iframe
            ref={iframeRef}
            id="twine-scenario-iframe"
            src={blobUrl}
            title={story.title}
            allow="fullscreen; autoplay; clipboard-write; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            className="w-full h-full border-0 bg-transparent block"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
            Loading Twine scenario...
          </div>
        )}

        {/* Ambient HUD Reveal Trigger when HUD is hidden */}
        {!showHud && (
          <div
            onMouseEnter={() => setShowHud(true)}
            className="absolute top-0 left-0 right-0 h-6 z-30 cursor-pointer"
            title="Hover to reveal controls"
          />
        )}
      </main>

      {/* Floating Bottom Subtle Quick Bar */}
      <footer
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg text-xs text-slate-300 ${
          showHud ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Backdrop:</span>
          <button
            onClick={() => setBgTheme('slate')}
            className={`w-4 h-4 rounded-full border ${
              bgTheme === 'slate' ? 'border-sky-400 scale-110' : 'border-transparent'
            } bg-slate-900`}
            title="Deep Slate"
          />
          <button
            onClick={() => setBgTheme('black')}
            className={`w-4 h-4 rounded-full border ${
              bgTheme === 'black' ? 'border-sky-400 scale-110' : 'border-transparent'
            } bg-black`}
            title="Pure OLED Black"
          />
          <button
            onClick={() => setBgTheme('charcoal')}
            className={`w-4 h-4 rounded-full border ${
              bgTheme === 'charcoal' ? 'border-sky-400 scale-110' : 'border-transparent'
            } bg-zinc-900`}
            title="Dark Charcoal"
          />
        </div>

        <div className="h-3 w-px bg-white/15" />

        <div className="text-[11px] text-slate-400">
          Twine Engine: <span className="text-slate-200">{story.format} v{story.formatVersion}</span>
        </div>

        <div className="h-3 w-px bg-white/15" />

        <button
          onClick={() => setShowHud(false)}
          className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Hide Bar
        </button>
      </footer>

      {/* Side Branch Visualizer Overlay */}
      {showBranchDrawer && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-2/3 md:w-1/2 lg:w-2/5 z-50 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Scenario Branch Map</h3>
                <p className="text-xs text-slate-400">All passages, links, and resolution nodes</p>
              </div>
            </div>
            <button
              onClick={() => setShowBranchDrawer(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-3">
            <BranchVisualizer
              story={story}
              activePassageName={currentPassageName}
              visitedPassages={visitedPassages}
              onSelectPassage={(p) => {
                // If the user clicks a passage in the branch visualizer, we can inspect or note it
                setCurrentPassageName(p.name);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
