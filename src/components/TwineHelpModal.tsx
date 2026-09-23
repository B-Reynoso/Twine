import { X, HelpCircle, FileCheck, Layers, GitBranch, Maximize2 } from 'lucide-react';

interface TwineHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TwineHelpModal({ isOpen, onClose }: TwineHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="help-modal-container"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">How Twine Hosting Works</h2>
              <p className="text-xs text-slate-400">Publishing and running scenario-based activities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              1. Export from Twine
            </h3>
            <p>
              In the Twine editor (browser or desktop app), click the arrow next to your story title in the bottom bar, then select <strong className="text-sky-300">"Publish to File"</strong>. This saves a standalone <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">.html</code> file containing your complete story data, styles, scripts, and format engine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-400" />
              2. Branch Preservation
            </h3>
            <p>
              Our hosting platform parses the native <code className="text-sky-300">&lt;tw-storydata&gt;</code> and <code className="text-sky-300">&lt;tw-passagedata&gt;</code> structures to verify starting nodes, branches, links, and ending nodes while keeping the original execution engine 100% intact.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-amber-400" />
              3. Immersive Full-Screen Player
            </h3>
            <p>
              When launched, the scenario expands into an immersive full-screen view with an unobtrusive auto-hiding HUD. Learners can focus completely on the scenario decisions with restart controls, branch visualization, session timers, and standalone window launch.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              4. Supported Formats
            </h3>
            <p>
              Supports all standard Twine 1.x and 2.x story formats including <strong className="text-slate-100">Harlowe 1/2/3</strong>, <strong className="text-slate-100">SugarCube 1/2</strong>, <strong className="text-slate-100">Chapbook</strong>, and <strong className="text-slate-100">Snowman</strong>.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
