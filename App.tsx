import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ScanSearch, Menu, Info, ExternalLink, Wand2, FileCode, Map, Globe, 
  Building2, Phone, Clock, DollarSign, Sparkles, Image as ImageIcon, Link, 
  Plus, Trash2, AlignLeft, Copy, Check, MapPin, Lightbulb, AlertCircle, 
  FileJson, Zap, ShieldCheck, Terminal, RefreshCw, ChevronDown, ChevronUp, 
  LifeBuoy, Moon, Sun, History, Download, Eye, ArrowRight, Smartphone, Monitor,
  Loader2, Cpu
} from 'lucide-react';

// --- Types ---

enum SchemaType {
  AUTO = 'Auto-Detect',
  ARTICLE = 'Article / BlogPosting',
  LOCAL_BUSINESS = 'Local Business',
  PRODUCT = 'Product',
  EVENT = 'Event',
  ORGANIZATION = 'Organization',
  FAQ = 'FAQPage',
  JOB_POSTING = 'JobPosting'
}

interface Address {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
}

interface OpeningHourEntry {
  dayOfWeek: string;
  opens: string;
  closes: string;
}

interface LocalBusinessDetails {
  address?: Address;
  telephone?: string;
  openingHours?: OpeningHourEntry[];
  priceRange?: string;
}

interface OrganizationDetails {
  name?: string;
  description?: string;
  logoUrl?: string;
  socialLinks?: string;
  address?: Address;
}

interface SchemaGenerationRequest {
  content: string;
  type: SchemaType;
  targetGeo?: string;
  url?: string;
  localBusinessDetails?: LocalBusinessDetails;
  organizationDetails?: OrganizationDetails;
}

interface SchemaGenerationResponse {
  jsonLd: string;
  aiMetaTag: string;
  detectedType: string;
  geoOptimizations: string[];
  tips: string[];
  timestamp?: number;
}

interface ValidationResult {
  score: number;
  warnings: string[];
  errors: string[];
  valid: boolean;
}

// --- Service ---

const generateSchema = async (request: SchemaGenerationRequest, apiKey: string): Promise<SchemaGenerationResponse> => {
  if (!apiKey) throw new Error("API Key is missing. Please configure your environment.");
  
  const { content, type, targetGeo, url, localBusinessDetails, organizationDetails } = request;

  // Prompt engineered for "Gold Standard" multi-entity schema & Google Rich Results
  const prompt = `
    You are a Senior Technical SEO Specialist. Your goal is to generate a "Gold Standard" JSON-LD schema and AI-Optimization strategy.
    
    INPUT DATA:
    - Target URL: ${url || "https://example.com/"}
    - Location Intent: ${targetGeo || "Infer from text"}
    - Primary Type: ${type}
    - Explicit Business Data: ${localBusinessDetails ? JSON.stringify(localBusinessDetails) : ''}
    - Explicit Org Data: ${organizationDetails ? JSON.stringify(organizationDetails) : ''}
    - Page Content: """${content.substring(0, 20000)}"""

    REQUIREMENTS (THE 100% STANDARD):
    1. **Structure:** Use a "@graph" array to stack multiple entities in one script if applicable.
    2. **Entities to Include:**
       - The Main Entity (e.g., LocalBusiness).
       - **Service Entities:** Identify key services in the text and create separate Service items linked to the provider.
       - **FAQPage:** If the content allows, generate an FAQPage entity.
    3. **Geo-Precision:** - If it's a LocalBusiness, you MUST include 'geo' (latitude/longitude) and 'areaServed'.
       - Inside 'areaServed', try to include a 'geoMidpoint' simulation if a specific city is mentioned.
       - Use 'servesLocation' array for surrounding cities mentioned or implied.
    4. **AI-Meta Content:** Generate a specialized <meta name="ai-content" content="..."> string. This should be a concise, dense summary of the business, services, and location designed specifically for LLMs to read.
    5. **Google Rich Results Compliance (CRITICAL):**
       - STRICTLY include ALL required properties for Google Rich Results.
       - **For LocalBusiness/Organization:** Must include 'image' (use logo or infer URL), 'priceRange', 'telephone', 'address', and 'openingHours'.
       - **For Article/BlogPosting:** Must include 'author', 'datePublished', 'headline', and 'image'.
       - **For Product:** Must include 'brand', 'review' or 'aggregateRating', and 'offers'.
       - If specific data is missing, use reasonable placeholders but **DO NOT OMIT** required fields.

    OUTPUT FORMAT (JSON ONLY):
    {
      "jsonLd": { ... complete valid JSON-LD object using @graph if multiple entities ... },
      "aiMetaTag": "<meta name=\"ai-content\" content=\"...\" >",
      "detectedType": "Primary Type Detected",
      "geoOptimizations": ["Specific geo signal added 1", "Specific geo signal added 2"],
      "tips": ["Strategy Tip 1", "Strategy Tip 2"]
    }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Cleanup to ensure valid JSON
    const cleanText = text.replace(/```json\n|\n```/g, '');
    let parsed;
    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        console.warn("JSON Parse failed, attempting loose cleanup", text);
        parsed = JSON.parse(cleanText.replace(/```/g, '')); 
    }
    
    return {
        jsonLd: JSON.stringify(parsed.jsonLd, null, 2), 
        aiMetaTag: parsed.aiMetaTag || '',
        detectedType: parsed.detectedType || "Unknown",
        geoOptimizations: parsed.geoOptimizations || [],
        tips: parsed.tips || [],
        timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Network error. Please check your internet connection or firewall.");
    }
    throw new Error(error.message || "AI failed to parse content.");
  }
};

// --- Utilities: Schema Validator ---

const validateSchemaQuality = (jsonLdString: string, aiMetaTag: string): ValidationResult => {
  let score = 100;
  const warnings: string[] = [];
  const errors: string[] = [];
  let data: any = {};

  try {
    data = JSON.parse(jsonLdString);
  } catch (e) {
    return { score: 0, warnings: [], errors: ["Invalid JSON Syntax"], valid: false };
  }

  const findType = (t: string) => {
    const str = JSON.stringify(data).toLowerCase();
    return str.includes(`"@type":"${t.toLowerCase()}"`) || str.includes(`"@type": "${t.toLowerCase()}"`);
  };
  const hasProp = (prop: string) => JSON.stringify(data).includes(`"${prop}"`);

  if (!aiMetaTag) { score -= 10; warnings.push("Missing 'ai-content' meta tag strategy"); }

  if (findType('LocalBusiness') || findType('Organization')) {
     if (!hasProp('geo')) { score -= 10; errors.push("Missing 'geo' coordinates (Critical for Local SEO)"); }
     if (!hasProp('image')) { score -= 10; warnings.push("Missing 'image' (Required for Rich Cards)"); }
     if (!hasProp('priceRange')) { score -= 5; warnings.push("Missing 'priceRange'"); }
     if (!hasProp('telephone')) { score -= 5; warnings.push("Missing 'telephone'"); }
     if (!hasProp('address')) { score -= 5; errors.push("Missing 'address'"); }
     if (!hasProp('geoMidpoint')) { score -= 0; warnings.push("Tip: 'geoMidpoint' helps service area targeting"); }
  }

  if (findType('Article')) {
      if (!hasProp('author')) { score -= 10; errors.push("Missing 'author'"); }
      if (!hasProp('datePublished')) { score -= 10; errors.push("Missing 'datePublished'"); }
      if (!hasProp('image')) { score -= 5; warnings.push("Missing 'image'"); }
  }

  if (!data['@context']) { score -= 20; errors.push("Missing '@context'"); }

  return { score: Math.max(0, score), warnings, errors, valid: errors.length === 0 };
};

// --- Helper Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-blue-500/50",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
    outline: "bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500",
    ghost: "bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, action, className = '' }: any) => (
  <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-6">
        {title && (
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3 uppercase tracking-wider">
            {Icon && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            {title}
          </h2>
        )}
        {action}
      </div>
    )}
    {children}
  </div>
);

// --- Main Application Component ---

export default function App() {
  const [apiKey, setApiKey] = useState('AIzaSyDOW4WpUQRPPsCzoI8wB1dUJ1-BHAKVXK8'); 
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history'>('edit');
  
  const [content, setContent] = useState('');
  const [schemaType, setSchemaType] = useState<SchemaType>(SchemaType.AUTO);
  const [targetGeo, setTargetGeo] = useState('');
  const [url, setUrl] = useState('');
  const [localDetails, setLocalDetails] = useState<LocalBusinessDetails>({});
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails>({});
  
  const [isScanning, setIsScanning] = useState(false);
  const [generatedData, setGeneratedData] = useState<SchemaGenerationResponse | null>(null);
  const [history, setHistory] = useState<SchemaGenerationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    const saved = localStorage.getItem('geoSchemaHistory');
    if (saved) setHistory(JSON.parse(saved));
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const validationResult = useMemo(() => {
    if (!generatedData) return null;
    return validateSchemaQuality(generatedData.jsonLd, generatedData.aiMetaTag);
  }, [generatedData]);

  // Formatted Output with Header and Footer
  const formattedCode = useMemo(() => {
    if (!generatedData) return '';
    // Uses escaped slash for script tag safety
    return `<!-- 🔥 JSON-LD SCHEMA — LocalBusiness + ServiceArea + Services + FAQ -->
<!-- ============================= -->
<script type="application/ld+json">
${generatedData.jsonLd}
<\/script>`;
  }, [generatedData]);

  const handleClearAll = () => {
    setUrl('');
    setTargetGeo('');
    setContent('');
    setLocalDetails({});
    setOrganizationDetails({});
    setGeneratedData(null);
    setError(null);
  };

  const handleUrlScan = async () => {
    if (!url) return;
    if (!url.startsWith('http')) {
        setError("Please enter a valid URL starting with http:// or https://");
        return;
    }
    setIsScanning(true);
    setError(null);
    try {
        let html = '';
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            if (response.ok) { const data = await response.json(); html = data.contents; }
        } catch (e) { console.warn("Proxy 1 failed"); }

        if (!html) {
             try {
                const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
                if (response.ok) html = await response.text();
            } catch (e) { console.warn("Proxy 2 failed"); }
        }

        if (!html) throw new Error("Could not access URL via proxy. Please paste content manually.");

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent?.trim() || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
        const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
        const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg, nav, footer');
        scripts.forEach(s => s.remove());
        const bodyText = doc.body.textContent?.replace(/\s+/g, ' ').trim().substring(0, 8000) || '';

        setContent(`PAGE TITLE: ${title}\nMETA DESCRIPTION: ${metaDesc}\nMAIN HEADING: ${h1}\n\nPAGE CONTENT:\n${bodyText}`);
        if (!organizationDetails.name) setOrganizationDetails(prev => ({ ...prev, name: h1 || title.split('|')[0].trim() }));
        if (!organizationDetails.description) setOrganizationDetails(prev => ({ ...prev, description: metaDesc }));
    } catch (e) {
        console.error(e);
        setError((e as Error).message);
    } finally {
        setIsScanning(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const realKey = apiKey || (window as any).GEMINI_API_KEY; 
      
      const request = {
        content, type: schemaType, targetGeo, url,
        localBusinessDetails: schemaType === SchemaType.LOCAL_BUSINESS ? localDetails : undefined,
        organizationDetails: schemaType === SchemaType.ORGANIZATION ? organizationDetails : undefined
      };
      
      let response;
      if (!realKey && content.length < 10) {
          await new Promise(r => setTimeout(r, 1000));
          response = { jsonLd: "{}", aiMetaTag: "", detectedType: "Demo", geoOptimizations: [], tips: [], timestamp: Date.now() };
      } else {
          response = await generateSchema(request, realKey);
      }

      setGeneratedData(response);
      const newHistory = [response, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('geoSchemaHistory', JSON.stringify(newHistory));
      setActiveTab('preview');
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const safeCopy = (text: string, setCopiedState: (b: boolean) => void) => {
     const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      if (navigator.clipboard) {
         navigator.clipboard.writeText(text).then(() => {
               setCopiedState(true); setTimeout(() => setCopiedState(false), 2000);
           });
      }
    }
    document.body.removeChild(textArea);
  };

  const downloadJson = () => {
    if (!generatedData) return;
    const blob = new Blob([formattedCode], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `schema-${generatedData.detectedType}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 dark:bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <ScanSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                GeoSchema<span className="text-blue-600 dark:text-blue-400">.AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Semantic SEO Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 mr-2">API KEY</span>
                <input type="password" placeholder="Paste Gemini Key..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 w-32" />
             </div>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
             <button onClick={() => setActiveTab('history')} className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><History className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mx-auto md:mx-0">
           <button onClick={() => setActiveTab('edit')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Configuration</button>
           <button onClick={() => setActiveTab('preview')} disabled={!generatedData} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40'}`}>Result {generatedData && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}</button>
           <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>History</button>
        </div>
        
        {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/30 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {activeTab === 'edit' && (
            <div className="lg:col-span-7 space-y-6">
               <Card title="Core Settings" icon={Globe} 
                 action={<button onClick={handleClearAll} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider flex items-center gap-2"><Trash2 className="w-3 h-3" /> Clear All</button>}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schema Type</label>
                        <select value={schemaType} onChange={(e) => setSchemaType(e.target.value as SchemaType)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                            {Object.values(SchemaType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target URL</label>
                        <div className="relative">
                            <input type="text" placeholder="[https://example.com](https://example.com)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-24 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                            <button onClick={handleUrlScan} disabled={isScanning || !url} className="absolute right-2 top-2 bottom-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2">
                                {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {isScanning ? '...' : 'Auto-Fill'}
                            </button>
                        </div>
                     </div>
                  </div>
                  <div className="mt-4 space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Geo / Service Area</label>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="e.g. New York Metro Area, NY" value={targetGeo} onChange={(e) => setTargetGeo(e.target.value)} className="w-full pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                     </div>
                  </div>
               </Card>

               {(schemaType === SchemaType.LOCAL_BUSINESS || schemaType === SchemaType.ORGANIZATION) && (
                 <Card title={schemaType === SchemaType.LOCAL_BUSINESS ? "Business Identity" : "Org Identity"} icon={Building2}>
                    <div className="space-y-4">
                        {schemaType === SchemaType.ORGANIZATION && <input type="text" placeholder="Organization Name" value={organizationDetails.name || ''} onChange={(e) => setOrganizationDetails({...organizationDetails, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white" />}
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Street Address" value={localDetails.address?.streetAddress || organizationDetails.address?.streetAddress || ''} onChange={(e) => { const val = e.target.value; if (schemaType === SchemaType.LOCAL_BUSINESS) setLocalDetails({...localDetails, address: {...localDetails.address, streetAddress: val}}); else setOrganizationDetails({...organizationDetails, address: {...organizationDetails.address, streetAddress: val}}); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white" />
                            <input type="text" placeholder="City" value={localDetails.address?.addressLocality || organizationDetails.address?.addressLocality || ''} onChange={(e) => { const val = e.target.value; if (schemaType === SchemaType.LOCAL_BUSINESS) setLocalDetails({...localDetails, address: {...localDetails.address, addressLocality: val}}); else setOrganizationDetails({...organizationDetails, address: {...organizationDetails.address, addressLocality: val}}); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white" />
                        </div>
                    </div>
                 </Card>
               )}

               <Card title="Content Analysis" icon={Sparkles} 
                 action={<button onClick={() => setContent("<h1>Welcome to Acme Cafe</h1><p>We serve the best coffee in Seattle. Open 9am-5pm.</p>")} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider">Load Sample</button>}>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your page content here..." className="w-full h-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none custom-scrollbar leading-relaxed" />
               </Card>

               <Button onClick={handleGenerate} disabled={loading || !content} className="w-full py-4 text-base rounded-2xl shadow-blue-500/20 shadow-xl">
                 {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : <><Wand2 className="w-5 h-5" /> Generate Optimized Schema</>}
               </Button>
            </div>
          )}

          {(activeTab === 'preview' || activeTab === 'history') && (
            <div className="lg:col-span-5 h-full">
               {activeTab === 'history' && (
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Recent Generations</h3>
                     {history.map((item, idx) => (
                        <div key={idx} onClick={() => { setGeneratedData(item); setActiveTab('preview'); }} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{item.detectedType}</span>
                              <span className="text-[10px] text-slate-400">{new Date(item.timestamp || 0).toLocaleTimeString()}</span>
                           </div>
                           <div className="text-xs text-slate-500 truncate">{item.geoOptimizations[0] || "No specific optimizations"}</div>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'preview' && generatedData && (
                 <div className="space-y-6">
                    {/* Schema Score */}
                    <div className={`p-5 rounded-2xl border ${validationResult?.score > 80 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                           <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Schema Quality Score</h4>
                           <span className="text-2xl font-black">{validationResult?.score}%</span>
                        </div>
                        {validationResult?.warnings.map((w, i) => <div key={i} className="flex items-start gap-2 text-xs font-medium opacity-80"><AlertCircle className="w-3.5 h-3.5 mt-0.5" /> {w}</div>)}
                        {validationResult?.errors.map((e, i) => <div key={i} className="flex items-start gap-2 text-xs font-medium text-red-600"><AlertCircle className="w-3.5 h-3.5 mt-0.5" /> {e}</div>)}
                    </div>

                    {/* AI Meta Tag */}
                    {generatedData.aiMetaTag && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                         <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Cpu className="w-3 h-3" /> AI-Ready Meta Tag</h4>
                            <button onClick={() => safeCopy(generatedData.aiMetaTag, setCopiedMeta)} className="p-1 hover:bg-white/50 rounded-md transition-colors">{copiedMeta ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-indigo-400" />}</button>
                         </div>
                         <code className="block text-[10px] text-indigo-800 dark:text-indigo-300 font-mono break-all leading-relaxed bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-indigo-200/50">{generatedData.aiMetaTag}</code>
                      </div>
                    )}

                    {/* Code Block */}
                    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                       <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/5">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/50" /><div className="w-3 h-3 rounded-full bg-amber-500/50" /><div className="w-3 h-3 rounded-full bg-emerald-500/50" /></div>
                          <div className="flex gap-2">
                             <button onClick={() => safeCopy(formattedCode, setCopied)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors relative">{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                             <button onClick={downloadJson} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                          </div>
                       </div>
                       <div className="bg-blue-900/20 text-blue-200 text-xs px-4 py-2 border-b border-white/5 flex items-center gap-2"><Info className="w-4 h-4" /><span>Note: User add <code>&lt;head&gt;</code> and <code>&lt;/head&gt;</code></span></div>
                       <div className="p-4 overflow-x-auto"><pre className="text-xs font-mono text-slate-300 leading-relaxed">{formattedCode}</pre></div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
