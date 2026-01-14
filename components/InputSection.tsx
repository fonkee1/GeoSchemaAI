import React, { useState } from 'react';
import { SchemaType, SAMPLE_HTML_TEMPLATE, LocalBusinessDetails, OrganizationDetails, Address, OpeningHourEntry } from '../types';
import { Wand2, FileCode, Map, Globe, Building2, Phone, Clock, DollarSign, Sparkles, Image as ImageIcon, Link, Plus, Trash2, AlignLeft } from 'lucide-react';
import Suggestions from './Suggestions';

interface InputSectionProps {
  content: string;
  setContent: (val: string) => void;
  schemaType: SchemaType;
  setSchemaType: (val: SchemaType) => void;
  targetGeo: string;
  setTargetGeo: (val: string) => void;
  url: string;
  setUrl: (val: string) => void;
  localDetails: LocalBusinessDetails;
  setLocalDetails: (val: LocalBusinessDetails) => void;
  organizationDetails: OrganizationDetails;
  setOrganizationDetails: (val: OrganizationDetails) => void;
  onGenerate: () => void;
  loading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  content,
  setContent,
  schemaType,
  setSchemaType,
  targetGeo,
  setTargetGeo,
  url,
  setUrl,
  localDetails,
  setLocalDetails,
  organizationDetails,
  setOrganizationDetails,
  onGenerate,
  loading
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleAddressChange = (type: 'local' | 'org', key: keyof Address, value: string) => {
    if (type === 'local') {
      setLocalDetails({
        ...localDetails,
        address: { ...(localDetails.address || {}), [key]: value }
      });
    } else {
      setOrganizationDetails({
        ...organizationDetails,
        address: { ...(organizationDetails.address || {}), [key]: value }
      });
    }
  };

  const addOpeningHour = () => {
    const newEntry: OpeningHourEntry = { dayOfWeek: 'Monday', opens: '09:00', closes: '17:00' };
    setLocalDetails({
      ...localDetails,
      openingHours: [...(localDetails.openingHours || []), newEntry]
    });
  };

  const removeOpeningHour = (index: number) => {
    const hours = [...(localDetails.openingHours || [])];
    hours.splice(index, 1);
    setLocalDetails({ ...localDetails, openingHours: hours });
  };

  const updateOpeningHour = (index: number, key: keyof OpeningHourEntry, value: string) => {
    const hours = [...(localDetails.openingHours || [])];
    hours[index] = { ...hours[index], [key]: value };
    setLocalDetails({ ...localDetails, openingHours: hours });
  };

  const AddressBuilder = ({ type }: { type: 'local' | 'org' }) => {
    const addr = type === 'local' ? localDetails.address : organizationDetails.address;
    return (
      <div className="space-y-4 mt-4 p-4 xs:p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interactive Address Builder</label>
        <input 
          type="text" 
          value={addr?.streetAddress || ''}
          onChange={(e) => handleAddressChange(type, 'streetAddress', e.target.value)}
          placeholder="Street Address"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300"
        />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <input 
            type="text" 
            value={addr?.addressLocality || ''}
            onChange={(e) => handleAddressChange(type, 'addressLocality', e.target.value)}
            placeholder="City"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300"
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" 
              value={addr?.addressRegion || ''}
              onChange={(e) => handleAddressChange(type, 'addressRegion', e.target.value)}
              placeholder="State"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300"
            />
            <input 
              type="text" 
              value={addr?.postalCode || ''}
              onChange={(e) => handleAddressChange(type, 'postalCode', e.target.value)}
              placeholder="Zip"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleApplySuggestion = (id: string) => {
    switch (id) {
      case 'event': setSchemaType(SchemaType.EVENT); break;
      case 'org': setSchemaType(SchemaType.ORGANIZATION); break;
      case 'faq': setSchemaType(SchemaType.FAQ); break;
      case 'geo': setSchemaType(SchemaType.LOCAL_BUSINESS); if (!targetGeo) setTargetGeo('Local Area'); break;
      default: console.log(`Suggestion ${id} applied`); break;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-4">
      {showSuggestions && (
        <Suggestions onApply={handleApplySuggestion} onClose={() => setShowSuggestions(false)} currentType={schemaType} />
      )}

      {/* Configuration Card */}
      <div className="bg-white p-5 xs:p-7 rounded-3xl shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-xl shrink-0">
              <FileCode className="w-5 h-5 text-brand-600" />
            </div>
            Core Configuration
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5">Schema Type</label>
                <select 
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value as SchemaType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer hover:bg-white"
                >
                    {Object.values(SchemaType).map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>
            <div className="group">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Website URL
                </label>
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/target-page"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-300 hover:bg-white"
                />
            </div>
        </div>

        <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                <Map className="w-3 h-3" /> Target Geo / Service Territory
            </label>
             <input 
                type="text" 
                value={targetGeo}
                onChange={(e) => setTargetGeo(e.target.value)}
                placeholder="e.g. Greater Las Vegas Area, NV"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-300 hover:bg-white"
            />
        </div>
      </div>

      {/* Dynamic Builder Card */}
      {(schemaType === SchemaType.LOCAL_BUSINESS || schemaType === SchemaType.ORGANIZATION) && (
        <div className="bg-white p-5 xs:p-7 rounded-3xl shadow-sm border border-brand-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-wider">
                <div className="p-2 bg-brand-50 rounded-xl">
                    <Building2 className="w-4 h-4 text-brand-600" />
                </div>
                {schemaType === SchemaType.LOCAL_BUSINESS ? 'Local Business Asset Builder' : 'Organization Identity Builder'}
            </h2>
            
            <div className="space-y-6">
                {schemaType === SchemaType.ORGANIZATION && (
                   <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Name</label>
                        <input 
                            type="text" 
                            value={organizationDetails.name || ''}
                            onChange={(e) => setOrganizationDetails({ ...organizationDetails, name: e.target.value })}
                            placeholder="e.g. Acme Corporation"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><AlignLeft className="w-3 h-3" /> Mission Description</label>
                        <textarea 
                            value={organizationDetails.description || ''}
                            onChange={(e) => setOrganizationDetails({ ...organizationDetails, description: e.target.value })}
                            placeholder="Concise 1-2 sentence overview of your value proposition..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                        />
                      </div>
                   </div>
                )}

                <AddressBuilder type={schemaType === SchemaType.LOCAL_BUSINESS ? 'local' : 'org'} />

                {schemaType === SchemaType.LOCAL_BUSINESS && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3" /> Telephone</label>
                          <input 
                              type="tel" 
                              value={localDetails.telephone || ''}
                              onChange={(e) => setLocalDetails({ ...localDetails, telephone: e.target.value })}
                              placeholder="+1-702-555-0123"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Price Tier</label>
                          <input 
                              type="text" 
                              value={localDetails.priceRange || ''}
                              onChange={(e) => setLocalDetails({ ...localDetails, priceRange: e.target.value })}
                              placeholder="e.g. $$ or $$$"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Business Hours
                        </label>
                        <button 
                          onClick={addOpeningHour}
                          className="text-[10px] font-black text-brand-600 flex items-center gap-1.5 hover:text-brand-700 transition-colors bg-brand-50 px-3 py-1.5 rounded-lg"
                        >
                          <Plus className="w-3 h-3" /> Add Schedule
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {localDetails.openingHours?.map((entry, idx) => (
                          <div key={idx} className="flex flex-col xs:flex-row items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group animate-in slide-in-from-left-4">
                            <select 
                              value={entry.dayOfWeek}
                              onChange={(e) => updateOpeningHour(idx, 'dayOfWeek', e.target.value)}
                              className="w-full xs:w-auto text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mo-Fr', 'Sa-Su'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <div className="flex items-center gap-2 w-full xs:w-auto">
                              <input 
                                type="time" 
                                value={entry.opens}
                                onChange={(e) => updateOpeningHour(idx, 'opens', e.target.value)}
                                className="flex-1 xs:flex-none text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              />
                              <span className="text-slate-400 text-xs font-bold">to</span>
                              <input 
                                type="time" 
                                value={entry.closes}
                                onChange={(e) => updateOpeningHour(idx, 'closes', e.target.value)}
                                className="flex-1 xs:flex-none text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              />
                            </div>
                            <button 
                              onClick={() => removeOpeningHour(idx)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!localDetails.openingHours || localDetails.openingHours.length === 0) && (
                          <div className="text-[11px] text-slate-400 font-medium italic text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                            Standard hours will be inferred from content.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {schemaType === SchemaType.ORGANIZATION && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Logo URL</label>
                        <input 
                            type="text" 
                            value={organizationDetails.logoUrl || ''}
                            onChange={(e) => setOrganizationDetails({ ...organizationDetails, logoUrl: e.target.value })}
                            placeholder="https://cdn.example.com/brand.png"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Link className="w-3 h-3" /> Social Web Links</label>
                        <input 
                            type="text" 
                            value={organizationDetails.socialLinks || ''}
                            onChange={(e) => setOrganizationDetails({ ...organizationDetails, socialLinks: e.target.value })}
                            placeholder="FB, LinkedIn, X URLs (comma separated)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                    </div>
                  </div>
                )}
            </div>
        </div>
      )}

      {/* Input Textarea Card */}
      <div className="flex-1 flex flex-col bg-white p-5 xs:p-7 rounded-3xl shadow-sm border border-slate-200/80 min-h-[450px] transition-all hover:shadow-md">
        <div className="flex flex-col xs:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-3">
                Knowledge Input
                <Sparkles className="w-4 h-4 text-brand-400" />
            </h2>
            <button 
                onClick={() => setContent(SAMPLE_HTML_TEMPLATE)}
                className="w-full xs:w-auto text-[11px] font-black text-brand-600 hover:text-white hover:bg-brand-600 px-5 py-2.5 rounded-2xl transition-all border-2 border-brand-100 hover:border-brand-600 uppercase tracking-widest"
            >
                Load Analysis Sample
            </button>
        </div>
        <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your source code, raw text content, or product descriptions here..."
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-all custom-scrollbar shadow-inner mb-6"
        />
        <div>
            <button 
                onClick={onGenerate}
                disabled={loading || !content.trim()}
                className={`w-full group relative flex items-center justify-center gap-4 py-5 px-10 rounded-[2rem] text-white font-black shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs sm:text-sm
                    ${loading || !content.trim() 
                        ? 'bg-slate-300 cursor-not-allowed opacity-80' 
                        : 'bg-slate-900 hover:bg-brand-600 shadow-brand-500/10'
                    }`}
            >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                        Neural Mapping...
                    </div>
                ) : (
                    <>
                        <Wand2 className="w-5 h-5 transition-transform group-hover:rotate-12 group-hover:scale-110" /> Generate Optimized Schema
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
