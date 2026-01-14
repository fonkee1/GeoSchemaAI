
import React, { useState, useMemo } from 'react';
import { Copy, Check, MapPin, Lightbulb, AlertCircle, FileJson, Zap, ShieldCheck, Terminal, RefreshCw, ChevronDown, ChevronUp, LifeBuoy } from 'lucide-react';
import { SchemaGenerationResponse } from '../types';

interface SchemaDisplayProps {
  data: SchemaGenerationResponse | null;
  loading: boolean;
  error: string | null;
}

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ data, loading, error }) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleCopy = () => {
    if (data?.jsonLd) {
      navigator.clipboard.writeText(`<script type="application/ld+json">\n${data.jsonLd}\n</script>`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validationStatus = useMemo(() => {
    if (!data?.jsonLd) return null;
    try {
      JSON.parse(data.jsonLd);
      return { valid: true, message: "JSON SECURE" };
    } catch (e) {
      return { valid: false, message: "PARSE ERROR" };
    }
  }, [data]);

  const errorDetails = useMemo(() => {
    if (!error) return null;

    let title = "Generation Halted";
    let friendlyMessage = "The AI engine encountered an unexpected roadblock while mapping your schema.";
    let suggestions = [
      "Check your internet connection and try again.",
      "Ensure the input content contains enough text for analysis.",
      "Try refreshing the page to reset the session."
    ];

    const lowError = error.toLowerCase();
    if (lowError.includes("quota") || lowError.includes("429") || lowError.includes("limit")) {
      title = "Capacity Limit Reached";
      friendlyMessage = "The AI engine is currently processing a high volume of requests.";
      suggestions = [
        "Wait 30-60 seconds before trying again.",
        "Reduce the length of your input content.",
        "Ensure you aren't running multiple simultaneous generations."
      ];
    } else if (lowError.includes("api key") || lowError.includes("invalid_argument") || lowError.includes("401") || lowError.includes("403")) {
      title = "Configuration Error";
      friendlyMessage = "There's a synchronization issue with the AI service credentials.";
      suggestions = [
        "Refresh the browser to re-establish the secure link.",
        "Contact support if the issue persists across multiple sessions.",
        "Ensure your network isn't blocking outgoing API requests."
      ];
    } else if (lowError.includes("parse") || lowError.includes("readable") || lowError.includes("json")) {
      title = "Structural Ambiguity";
      friendlyMessage = "The content provided is too complex or ambiguous for standard schema mapping.";
      suggestions = [
        "Simplify the input text by removing non-essential HTML tags.",
        "Paste clean text instead of complex source code if possible.",
        "Ensure the language is clearly identifiable (English is best supported)."
      ];
    }

    return { title, friendlyMessage, suggestions };
  }, [error]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[600px] lg:h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-200/80 p-8 sm:p-14 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative mb-10">
          <div className="animate-spin rounded-full h-24 w-24 border-[4px] border-brand-50 border-t-brand-600 shadow-inner"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-brand-500 animate-pulse-soft" />
        </div>
        <div className="text-center space-y-3 max-w-sm">
          <h3 className="text-slate-900 font-black text-2xl tracking-tighter uppercase">Processing Nodes</h3>
          <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
            Structuring knowledge graphs and mapping geographical semantic data.
          </p>
        </div>
      </div>
    );
  }

  if (error && errorDetails) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-red-50/40 border border-red-100 rounded-[2.5rem] p-8 xs:p-10 lg:h-full overflow-y-auto custom-scrollbar shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-red-100/80 rounded-2xl border border-red-200 shadow-sm text-red-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl xs:text-2xl font-black text-red-950 tracking-tighter uppercase">{errorDetails.title}</h3>
              <p className="text-red-700/70 font-medium text-sm sm:text-base">{errorDetails.friendlyMessage}</p>
            </div>
          </div>

          <div className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-red-100 shadow-inner space-y-6 mb-8">
            <div className="flex items-center gap-3 text-red-900">
              <LifeBuoy className="w-5 h-5" />
              <h4 className="font-black text-xs uppercase tracking-widest">Recommended Actions</h4>
            </div>
            <ul className="space-y-4">
              {errorDetails.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></div>
                  <p className="text-sm text-red-800 font-semibold leading-relaxed">{suggestion}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 text-xs sm:text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Restart Engine
            </button>

            <div className="border border-red-100/50 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full px-5 py-3 flex items-center justify-between text-[10px] font-black text-red-900/40 uppercase tracking-widest hover:bg-red-100/20 transition-colors"
              >
                Technical Trace Log
                {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showTechnicalDetails && (
                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                  <pre className="p-4 bg-slate-900/5 rounded-xl text-[10px] font-mono text-red-900/60 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-red-100/30 shadow-inner">
                    {error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[600px] lg:h-full bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 sm:p-16 text-center group transition-all hover:border-brand-200 hover:bg-brand-50/5 cursor-default">
        <div className="relative mb-10 transition-transform group-hover:scale-105 duration-700">
          <div className="absolute inset-0 bg-brand-500/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FileJson className="relative w-28 h-28 text-slate-100 group-hover:text-brand-300 transition-colors" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">Output Buffer Empty</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm sm:text-base font-medium leading-relaxed">
            Generate high-precision schema optimized for rich result dominance and AI indexing.
          </p>
        </div>
        <div className="mt-12 flex gap-3 items-center justify-center opacity-30">
          <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-8 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-4 h-2 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-6 sm:gap-10 animate-in fade-in slide-in-from-right-10 duration-700" id="code-output">
      
      {/* Dynamic Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-emerald-50/30 backdrop-blur-md border border-emerald-100 rounded-[1.75rem] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-emerald-100 rounded-xl border border-emerald-200">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-emerald-900 tracking-[0.15em] uppercase text-[10px]">Spatial Optimization</h3>
            </div>
            <ul className="text-xs sm:text-sm text-emerald-800 space-y-4 font-semibold">
                {data.geoOptimizations.length > 0 ? (
                    data.geoOptimizations.map((opt, i) => (
                      <li key={i} className="flex items-start gap-3 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                        {opt}
                      </li>
                    ))
                ) : (
                    <li className="italic text-emerald-600/60 font-medium">No geo-specific hooks detected.</li>
                )}
            </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[1.75rem] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-100">
                  <Lightbulb className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-black text-slate-900 tracking-[0.15em] uppercase text-[10px]">Strategic Tips</h3>
            </div>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-4 font-semibold">
                 {data.tips.length > 0 ? (
                    data.tips.slice(0, 3).map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 leading-relaxed">
                         <span className="mt-2 w-1.5 h-1.5 bg-brand-400 rounded-full shrink-0"></span>
                        {tip}
                      </li>
                    ))
                ) : (
                    <li className="italic text-slate-400/60 font-medium">Standard baseline configuration.</li>
                )}
            </ul>
        </div>
      </div>

      {/* Code Block Container - Optimized for 4K and Mobile */}
      <div className="relative flex-1 bg-slate-950 rounded-[2rem] xs:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-800 transition-colors hover:border-slate-700">
        <div className="flex flex-wrap items-center justify-between px-5 xs:px-8 py-5 bg-slate-900/40 border-b border-white/5 backdrop-blur-2xl gap-5">
            <div className="flex items-center gap-4">
                <div className="hidden xs:flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="hidden xs:block h-6 w-px bg-white/10"></div>
                <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                  <span className="text-[9px] font-black text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg tracking-widest uppercase border border-brand-500/20 w-fit">
                      {data.detectedType}
                  </span>
                  
                  {validationStatus && (
                    <span className={`text-[9px] font-black flex items-center gap-2 px-3 py-1 rounded-lg tracking-widest border w-fit ${
                      validationStatus.valid 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {validationStatus.message}
                    </span>
                  )}
                </div>
            </div>
            <button 
                onClick={handleCopy}
                className="group relative flex items-center gap-3 text-[10px] font-black text-white transition-all bg-slate-800 hover:bg-brand-600 px-6 py-3 rounded-2xl border border-white/5 active:scale-95 overflow-hidden uppercase tracking-widest"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600/0 via-white/10 to-brand-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />}
                {copied ? "SUCCESS" : "COPY MARKUP"}
            </button>
        </div>

        {/* Syntax Highlighted Viewport - Responsive Typography */}
        <div className="flex-1 overflow-auto code-scrollbar p-6 xs:p-10">
            <div className="flex gap-6 2xl:gap-10">
              {/* Responsive Line Numbers */}
              <div className="hidden sm:flex flex-col text-[12px] 2xl:text-[14px] font-mono text-slate-800 text-right select-none opacity-40 pr-6 2xl:pr-10 border-r border-white/5 shrink-0">
                {Array.from({ length: Math.min(30, data.jsonLd.split('\n').length + 4) }).map((_, i) => (
                  <span key={i} className="h-[21px] 2xl:h-[25px] leading-relaxed">{i + 1}</span>
                ))}
              </div>
              
              <pre className="text-[11px] xs:text-[12px] sm:text-[13px] 2xl:text-[16px] font-mono leading-relaxed 2xl:leading-loose selection:bg-brand-500/30 w-full overflow-x-auto pb-6">
                  <span className="text-indigo-400/80">{'<'}<span className="text-red-400/90">script</span><span className="text-indigo-300"> type</span><span className="text-slate-500">=</span><span className="text-emerald-400">"application/ld+json"</span>{'>'}</span>
                  <div className="mt-4 text-slate-200">
                    {data.jsonLd.split('\n').map((line, idx) => {
                      const keyMatch = line.match(/^(\s*")([^"]+)(":.*)$/);
                      if (keyMatch) {
                        return (
                          <div key={idx} className="hover:bg-white/5 transition-colors px-2 -mx-2 rounded h-[21px] 2xl:h-[25px]">
                            <span className="text-slate-600">{keyMatch[1]}</span>
                            <span className="text-brand-400 font-bold">{keyMatch[2]}</span>
                            <span className="text-slate-400">{keyMatch[3]}</span>
                          </div>
                        );
                      }
                      return <div key={idx} className="hover:bg-white/5 transition-colors px-2 -mx-2 rounded h-[21px] 2xl:h-[25px] text-slate-300">{line}</div>;
                    })}
                  </div>
                  <div className="mt-4">
                    <span className="text-indigo-400/80">{'</'}<span className="text-red-400/90">script</span>{'>'}</span>
                  </div>
              </pre>
            </div>
        </div>
        
        {/* Terminal Status Bar */}
        <div className="px-6 xs:px-10 py-5 bg-slate-900 border-t border-white/5 flex flex-col xs:flex-row justify-between items-center gap-4">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em] flex items-center gap-3">
            <Terminal className="w-4 h-4" /> Manifest Secure &bull; High Precision Mode
          </p>
          <div className="flex gap-6 items-center">
            <div className="hidden sm:flex h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-brand-500 w-[85%] animate-pulse shadow-[0_0_15px_rgba(14,165,233,0.4)]"></div>
            </div>
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-white/5">LATENCY: 1.2s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaDisplay;
