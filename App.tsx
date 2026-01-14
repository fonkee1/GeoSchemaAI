import React, { useState, useRef } from 'react';
import { SchemaType, SchemaGenerationRequest, SchemaGenerationResponse, LocalBusinessDetails, OrganizationDetails } from './types';
import { generateSchema } from './services/geminiService';
import InputSection from './components/InputSection';
import SchemaDisplay from './components/SchemaDisplay';
import { ScanSearch, Menu, Info, ExternalLink } from 'lucide-react';

export default function App() {
  const [content, setContent] = useState('');
  const [schemaType, setSchemaType] = useState<SchemaType>(SchemaType.AUTO);
  const [targetGeo, setTargetGeo] = useState('');
  const [url, setUrl] = useState('');
  const [localDetails, setLocalDetails] = useState<LocalBusinessDetails>({});
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails>({});
  
  const [generatedData, setGeneratedData] = useState<SchemaGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedData(null);

    try {
      const request: SchemaGenerationRequest = {
        content,
        type: schemaType,
        targetGeo,
        url,
        localBusinessDetails: schemaType === SchemaType.LOCAL_BUSINESS ? localDetails : undefined,
        organizationDetails: schemaType === SchemaType.ORGANIZATION ? organizationDetails : undefined
      };
      const response = await generateSchema(request);
      setGeneratedData(response);
      
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 xs:px-6 xl:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200 shrink-0">
                <ScanSearch className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tighter flex items-center gap-1 uppercase leading-none">
                  GeoSchema<span className="text-brand-600">.AI</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-brand-50 text-[9px] text-brand-700 rounded-md border border-brand-100 hidden xs:inline-block">BETA</span>
                </h1>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] hidden xs:block mt-0.5">Semantic SEO Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <nav className="hidden md:flex items-center gap-6">
               <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-wider">Documentation</a>
               <div className="h-4 w-px bg-slate-200"></div>
               <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                 Rich Test <ExternalLink className="w-3 h-3" />
               </a>
             </nav>
             <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors md:hidden">
                <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 xs:px-6 xl:px-8 py-6 sm:py-10 2xl:py-14">
        
        {/* Banner Alert - Optimized for all sizes */}
        <div className="mb-8 lg:mb-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md shrink-0 border border-white/10">
            <Info className="w-6 h-6 text-brand-400" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-bold text-lg sm:text-xl tracking-tight">Geo-Spatial Optimization for Search AI</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
              Enhance how search models like Gemini and Perplexity interpret your site's physical relevance. We bridge the gap between static HTML and semantic spatial intent using native Gemini 3 reasoning.
            </p>
          </div>
        </div>

        {/* Responsive Grid System: Stacks on mobile, Dual-pane on desktop, Comfortable gap on wide monitors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 2xl:gap-24 items-start">
            {/* Left Column: Input Configuration */}
            <div className="w-full space-y-8">
                <div className="lg:sticky lg:top-24">
                  <InputSection 
                      content={content}
                      setContent={setContent}
                      schemaType={schemaType}
                      setSchemaType={setSchemaType}
                      targetGeo={targetGeo}
                      setTargetGeo={setTargetGeo}
                      url={url}
                      setUrl={setUrl}
                      localDetails={localDetails}
                      setLocalDetails={setLocalDetails}
                      organizationDetails={organizationDetails}
                      setOrganizationDetails={setOrganizationDetails}
                      onGenerate={handleGenerate}
                      loading={loading}
                  />
                </div>
            </div>

            {/* Right Column: Dynamic Output */}
            <div ref={outputRef} className="w-full space-y-8 h-full">
                <div className="lg:sticky lg:top-24 scroll-mt-24 h-full">
                  <SchemaDisplay 
                      data={generatedData}
                      loading={loading}
                      error={error}
                  />
                </div>
            </div>
        </div>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed -bottom-48 -left-48 w-[600px] h-[600px] bg-brand-200/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 xs:px-6 xl:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs sm:text-sm text-slate-500 font-semibold tracking-tight">
              &copy; {new Date().getFullYear()} GeoSchema.AI &bull; Optimized for LLM Search Context
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Built by Senior Engineering for AI-First Indexing</p>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hidden sm:block">v1.3.0-PRO</span>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
