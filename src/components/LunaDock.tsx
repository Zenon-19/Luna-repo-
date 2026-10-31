import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  HelpCircle, 
  ArrowUpRight, 
  Bot, 
  CheckCircle2, 
  History, 
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, AIParseResult, ProjectUpdateRecord } from '../types';
import { parseNaturalLanguageUpdate, askLunaQuery } from '../services/api';
import { LunaConfirmationCard } from './LunaConfirmationCard';

interface LunaDockProps {
  projects: Project[];
  onApplyUpdate: (result: AIParseResult, originalMessage: string) => void;
  recentRecord: ProjectUpdateRecord | null;
  currency: string;
  prefillMessage?: string;
  onClearPrefill?: () => void;
}

export const LunaDock: React.FC<LunaDockProps> = ({
  projects,
  onApplyUpdate,
  recentRecord,
  currency,
  prefillMessage,
  onClearPrefill,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'update' | 'ask'>('update');
  const [answerResponse, setAnswerResponse] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<AIParseResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Handle prefill updates when user clicks "Update" on a project card
  useEffect(() => {
    if (prefillMessage) {
      setInputMessage(prefillMessage);
      setMode('update');
      setIsExpanded(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillMessage]);

  // Voice dictation using Web Speech API
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your update directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Submit natural language input
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = inputMessage.trim();
    if (!msg || isProcessing) return;

    setIsProcessing(true);
    setAnswerResponse(null);
    setPendingConfirmation(null);

    try {
      if (mode === 'ask') {
        const res = await askLunaQuery(msg, projects, [], []);
        setAnswerResponse(res.answer);
      } else {
        // Update mode
        const parseResult = await parseNaturalLanguageUpdate(msg, projects);

        if (parseResult.requires_confirmation) {
          setPendingConfirmation(parseResult);
        } else {
          // High confidence: auto-apply!
          onApplyUpdate(parseResult, msg);
          setInputMessage('');

          // Trigger celebratory confetti if completed or high progress
          if (
            parseResult.updated_fields?.progress_percentage === 100 ||
            (parseResult.new_milestones && parseResult.new_milestones.length > 0)
          ) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 },
            });
          }
        }
      }
    } catch (err) {
      console.error('Error processing update with Luna:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPending = (result: AIParseResult) => {
    onApplyUpdate(result, inputMessage);
    setPendingConfirmation(null);
    setInputMessage('');
  };

  const samplePrompts = [
    {
      label: 'Flownest: 68% + ₹8L',
      prompt: 'Flownest completed the CRM onboarding module today. Progress should be 68%. We also got positive feedback from three potential clients. Estimated value is now ₹8 lakh.',
    },
    {
      label: 'Celesti: 80% + ₹12L',
      prompt: 'Celesti website development is 80% complete. We finished the dashboard and 3D product showcase. Estimated project value is now ₹12 lakh.',
    },
    {
      label: 'NovaPay: GA Launch Pilot',
      prompt: 'NovaPay tax automation module is complete. Processed ₹42L test volume. Progress 95%, estimated value ₹25L.',
    },
    {
      label: 'PysDev: Delayed 2 weeks',
      prompt: 'PysDev Studio marketplace review delayed by 2 weeks due to permission issues. Health dropped to 64, progress 44%.',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-5 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        {/* Pending Confirmation Modal / Card */}
        {pendingConfirmation && (
          <div className="mb-3">
            <LunaConfirmationCard
              parseResult={pendingConfirmation}
              projects={projects}
              onConfirm={handleConfirmPending}
              onCancel={() => setPendingConfirmation(null)}
              onSelectAlternativeProject={(projId) => {
                const found = projects.find((p) => p.id === projId);
                if (found) {
                  setPendingConfirmation({
                    ...pendingConfirmation,
                    target_project_id: found.id,
                    target_project_name: found.name,
                  });
                }
              }}
            />
          </div>
        )}

        {/* Q&A Answer Bubble */}
        {answerResponse && (
          <div className="mb-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-black shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Luna Intelligence Answer
                  </span>
                  <p className="text-sm text-[#0A0A0A] font-normal leading-relaxed mt-1 whitespace-pre-line">
                    {answerResponse}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnswerResponse(null)}
                className="text-slate-400 hover:text-black text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recent Update Feedback Toast */}
        {recentRecord && !pendingConfirmation && !answerResponse && (
          <div className="mb-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-black">
                {recentRecord.project_name}:
              </span>
              <span className="text-slate-600 line-clamp-1">{recentRecord.ai_summary}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">Audit Log Saved</span>
          </div>
        )}

        {/* Main Dock Container */}
        <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-3 sm:p-4 transition-all">
          {/* Top Bar inside dock: Mode switcher & Quick Prompt Chips */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode('update')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    mode === 'update'
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-black'
                  }`}
                >
                  ⚡ Send Update
                </button>
                <button
                  type="button"
                  onClick={() => setMode('ask')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    mode === 'ask'
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-black'
                  }`}
                >
                  💬 Ask Luna
                </button>
              </div>

              <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                {mode === 'update'
                  ? 'Describe progress, values, or milestones'
                  : 'Ask portfolio questions'}
              </span>
            </div>

            {/* Minimize / Expand prompt chips */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 hover:text-black text-xs flex items-center gap-1 px-1.5 py-0.5"
            >
              <span className="hidden sm:inline text-[11px] font-medium">
                {isExpanded ? 'Hide Samples' : 'Quick Samples'}
              </span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          {isExpanded && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
              <span className="text-slate-400 shrink-0 text-[10px] uppercase font-semibold">
                Try:
              </span>
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputMessage(s.prompt);
                    setMode('update');
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-all cursor-pointer font-medium"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Natural Language Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400">
                <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin text-black' : ''}`} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  mode === 'update'
                    ? '“Celesti website development is 80% complete. Estimated value is now ₹12 lakh.”'
                    : '“Which project is progressing fastest, and what is our total Q3 pipeline?”'
                }
                className="w-full bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl pl-10 pr-12 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs"
                disabled={isProcessing}
              />

              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs transition-colors ${
                  isListening
                    ? 'bg-rose-50 text-rose-700 animate-pulse border border-rose-200'
                    : 'text-slate-400 hover:text-black hover:bg-slate-100'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Voice Input'}
              >
                {isListening ? <Mic className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isProcessing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {mode === 'update' ? 'Update Luna' : 'Ask'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
