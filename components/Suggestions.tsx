
import React, { useRef } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, X, Sparkles, Building, ShieldCheck, Code, Search, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface Suggestion {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'ai';
  action: () => void;
}

interface SuggestionsProps {
  onApply: (id: string) => void;
  onClose: () => void;
  currentType: string;
}

const Suggestions: React.FC<SuggestionsProps> = ({ onApply, onClose, currentType }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 240 : scrollLeft + 240;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const suggestions: Suggestion[] = [
    { id: 'ai-features', label: 'AI Features', icon: <Sparkles className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />, variant: 'ai', action: () => onApply('ai-features') },
    { id: 'validation', label: 'Add schema validation', icon: <CheckCircle2 className="w-3.5 h-3.5" />, action: () => onApply('validation') },
    { id: 'event', label: "Add 'Event' schema", icon: <Calendar className="w-3.5 h-3.5" />, action: () => onApply('event') },
    { id: 'style', label: 'Improve output styling', icon: <Code className="w-3.5 h-3.5" />, action: () => onApply('style') },
    { id: 'org', label: 'Add Organization Schema', icon: <Building className="w-3.5 h-3.5" />, action: () => onApply('org') },
    { id: 'faq', label: 'Add FAQPage Schema', icon: <Search className="w-3.5 h-3.5" />, action: () => onApply('faq') },
    { id: 'geo', label: 'Enhance Geo-targeting', icon: <MapPin className="w-3.5 h-3.5" />, action: () => onApply('geo') },
  ];

  return (
    <div className="mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Suggestions</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          aria-label="Close suggestions"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="relative group">
        <div 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 shadow-sm border border-slate-200 rounded-full text-slate-600 hover:text-brand-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </div>

        <div 
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 px-1 scroll-smooth"
        >
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={s.action}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95 border
                ${s.variant === 'ai' 
                  ? 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
                }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        <div 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 shadow-sm border border-slate-200 rounded-full text-slate-600 hover:text-brand-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Suggestions;
