import { useState, useMemo, useRef } from 'react';
import {
  GitBranch,
  Search,
  CheckCircle2,
  Flag,
  ArrowRight,
  List,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { TwineStoryData, TwinePassage } from '../types/twine';

interface BranchVisualizerProps {
  story: TwineStoryData;
  activePassageName?: string;
  visitedPassages?: string[];
  onSelectPassage?: (passage: TwinePassage) => void;
}

export function BranchVisualizer({
  story,
  activePassageName,
  visitedPassages = [],
  onSelectPassage,
}: BranchVisualizerProps) {
  const [viewTab, setViewTab] = useState<'graph' | 'list'>('graph');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPassage, setSelectedPassage] = useState<TwinePassage | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filtered passages
  const filteredPassages = useMemo(() => {
    if (!searchQuery.trim()) return story.passages;
    const q = searchQuery.toLowerCase();
    return story.passages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [story.passages, searchQuery]);

  // Layout node coordinates for SVG graph
  const { nodePositions, connections, graphBounds } = useMemo(() => {
    // Map passage name to pid
    const nameToPid: Record<string, string> = {};
    story.passages.forEach((p) => {
      nameToPid[p.name] = p.pid;
    });

    // Check if original Twine pos attributes exist and are spread out
    let hasOriginalSpread = false;
    const xCoords = story.passages.map((p) => p.pos.x);
    const yCoords = story.passages.map((p) => p.pos.y);
    const minX = Math.min(...xCoords, 100);
    const maxX = Math.max(...xCoords, 100);
    const minY = Math.min(...yCoords, 100);
    const maxY = Math.max(...yCoords, 100);

    if (maxX - minX > 200 || maxY - minY > 200) {
      hasOriginalSpread = true;
    }

    const positions: Record<string, { x: number; y: number }> = {};

    if (hasOriginalSpread) {
      // Normalize original positions to fit smoothly
      story.passages.forEach((p) => {
        positions[p.pid] = {
          x: p.pos.x,
          y: p.pos.y,
        };
      });
    } else {
      // Calculate layered topological layout
      const levels: Record<string, number> = {};
      const startPid = story.startNodePid || story.passages[0]?.pid || '1';
      levels[startPid] = 0;

      const queue: string[] = [startPid];
      const visited = new Set<string>([startPid]);

      while (queue.length > 0) {
        const currentPid = queue.shift()!;
        const currentPassage = story.passages.find((p) => p.pid === currentPid);
        const currentLevel = levels[currentPid] || 0;

        if (currentPassage) {
          for (const targetName of currentPassage.links) {
            const targetPid = nameToPid[targetName];
            if (targetPid && !visited.has(targetPid)) {
              visited.add(targetPid);
              levels[targetPid] = currentLevel + 1;
              queue.push(targetPid);
            }
          }
        }
      }

      // Assign remaining unvisited nodes
      story.passages.forEach((p) => {
        if (levels[p.pid] === undefined) {
          levels[p.pid] = 2;
        }
      });

      // Group by level
      const levelGroups: Record<number, TwinePassage[]> = {};
      story.passages.forEach((p) => {
        const lvl = levels[p.pid] || 0;
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(p);
      });

      // Space out nodes
      const colWidth = 240;
      const rowHeight = 110;
      Object.entries(levelGroups).forEach(([lvlStr, passagesAtLevel]) => {
        const lvl = parseInt(lvlStr, 10);
        passagesAtLevel.forEach((p, idx) => {
          const totalAtLevel = passagesAtLevel.length;
          const offsetY = (idx - (totalAtLevel - 1) / 2) * rowHeight;
          positions[p.pid] = {
            x: 80 + lvl * colWidth,
            y: 260 + offsetY,
          };
        });
      });
    }

    // Connections
    const edges: { sourcePid: string; targetPid: string; targetName: string }[] = [];
    story.passages.forEach((p) => {
      p.links.forEach((targetName) => {
        const targetPid = nameToPid[targetName];
        if (targetPid) {
          edges.push({
            sourcePid: p.pid,
            targetPid,
            targetName,
          });
        }
      });
    });

    // Compute graph bounds
    const allX = Object.values(positions).map((pos) => pos.x);
    const allY = Object.values(positions).map((pos) => pos.y);
    const calculatedMinX = allX.length > 0 ? Math.min(...allX) - 100 : 0;
    const calculatedMaxX = allX.length > 0 ? Math.max(...allX) + 250 : 800;
    const calculatedMinY = allY.length > 0 ? Math.min(...allY) - 100 : 0;
    const calculatedMaxY = allY.length > 0 ? Math.max(...allY) + 200 : 600;

    return {
      nodePositions: positions,
      connections: edges,
      graphBounds: {
        width: Math.max(800, calculatedMaxX - calculatedMinX),
        height: Math.max(600, calculatedMaxY - calculatedMinY),
        minX: calculatedMinX,
        minY: calculatedMinY,
      },
    };
  }, [story]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'svg' || (e.target as HTMLElement).id === 'graph-canvas') {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* Search and Mode Switcher */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches or passages..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center p-0.5 bg-slate-800 border border-slate-700 rounded-lg">
          <button
            onClick={() => setViewTab('graph')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewTab === 'graph' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Visual Flowchart Graph"
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Graph</span>
          </button>
          <button
            onClick={() => setViewTab('list')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewTab === 'list' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Passage List View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {viewTab === 'graph' ? (
        <div
          id="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex-1 bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Zoom/Reset floating controls */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Graph Canvas */}
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
              </marker>
              <marker
                id="arrowhead-dim"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {connections.map((edge, idx) => {
              const src = nodePositions[edge.sourcePid];
              const tgt = nodePositions[edge.targetPid];
              if (!src || !tgt) return null;

              const isEdgeHighlighted =
                selectedPassage?.pid === edge.sourcePid ||
                selectedPassage?.pid === edge.targetPid;

              const dx = tgt.x - src.x;
              const curveX = (src.x + tgt.x) / 2;

              return (
                <path
                  key={`edge-${idx}`}
                  d={`M ${src.x + 80} ${src.y + 25} C ${curveX} ${src.y + 25}, ${curveX} ${tgt.y + 25}, ${tgt.x} ${tgt.y + 25}`}
                  fill="none"
                  stroke={isEdgeHighlighted ? '#38bdf8' : '#334155'}
                  strokeWidth={isEdgeHighlighted ? 2 : 1.2}
                  strokeDasharray={isEdgeHighlighted ? 'none' : '4,3'}
                  markerEnd={isEdgeHighlighted ? 'url(#arrowhead)' : 'url(#arrowhead-dim)'}
                  className="transition-colors duration-200"
                />
              );
            })}

            {/* Passage Nodes */}
            {story.passages.map((passage) => {
              const pos = nodePositions[passage.pid] || { x: 100, y: 100 };
              const isStart = passage.isStart;
              const isEnding = passage.isEnding;
              const isActive = passage.name === activePassageName;
              const isVisited = visitedPassages.includes(passage.name);
              const isSelected = selectedPassage?.pid === passage.pid;

              return (
                <g
                  key={passage.pid}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPassage(passage);
                    onSelectPassage?.(passage);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Active glow pulse */}
                  {isActive && (
                    <rect
                      x="-4"
                      y="-4"
                      width="168"
                      height="58"
                      rx="10"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="animate-pulse opacity-80"
                    />
                  )}

                  {/* Node Box */}
                  <rect
                    width="160"
                    height="50"
                    rx="8"
                    className={`transition-all duration-150 ${
                      isSelected
                        ? 'fill-slate-800 stroke-sky-400 stroke-2'
                        : isActive
                        ? 'fill-slate-900 stroke-sky-500 stroke-1.5'
                        : isVisited
                        ? 'fill-slate-900/90 stroke-indigo-500/60 stroke-1'
                        : 'fill-slate-900/80 stroke-slate-700/80 stroke-1 hover:stroke-slate-500'
                    }`}
                  />

                  {/* Node Type Indicator Strip */}
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height="50"
                    rx="2"
                    fill={isStart ? '#10b981' : isEnding ? '#f59e0b' : '#38bdf8'}
                  />

                  {/* Node Title */}
                  <text
                    x="12"
                    y="22"
                    className={`text-[12px] font-semibold select-none ${
                      isActive ? 'fill-sky-300' : 'fill-slate-100'
                    }`}
                  >
                    {passage.name.length > 18 ? passage.name.slice(0, 16) + '…' : passage.name}
                  </text>

                  {/* Node Badges / Info */}
                  <text x="12" y="38" className="text-[10px] fill-slate-400 select-none">
                    {isStart ? '★ Start Node' : isEnding ? '🏁 Resolution' : `➔ ${passage.links.length} choice(s)`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredPassages.map((passage) => {
            const isStart = passage.isStart;
            const isEnding = passage.isEnding;
            const isActive = passage.name === activePassageName;
            const isVisited = visitedPassages.includes(passage.name);
            const isSelected = selectedPassage?.pid === passage.pid;

            return (
              <div
                key={passage.pid}
                onClick={() => {
                  setSelectedPassage(passage);
                  onSelectPassage?.(passage);
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-sky-400 ring-1 ring-sky-400/30'
                    : isActive
                    ? 'bg-slate-800/80 border-sky-500/60'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {isStart && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        START
                      </span>
                    )}
                    {isEnding && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ENDING
                      </span>
                    )}
                    <h4 className="text-xs font-semibold text-white truncate">{passage.name}</h4>
                  </div>
                  {isVisited && (
                    <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Explored
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-2 font-normal">
                  {passage.content.replace(/\[\[.*?\]\]/g, '').trim()}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                  <span>{passage.links.length} outgoing choice(s)</span>
                  <span>{passage.content.trim().split(/\s+/).length} words</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Passage Details Bottom Drawer */}
      {selectedPassage && (
        <div className="mt-3 p-3 bg-slate-900 border border-slate-700/80 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                {selectedPassage.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedPassage(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="max-h-28 overflow-y-auto text-xs text-slate-300 whitespace-pre-line mb-2 custom-scrollbar">
            {selectedPassage.content}
          </div>

          {selectedPassage.links.length > 0 && (
            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Branch Pathways:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPassage.links.map((link, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-[11px] text-sky-300"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                    {link}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
