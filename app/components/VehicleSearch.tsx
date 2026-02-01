"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Car, AlertCircle, Filter, ChevronRight } from 'lucide-react';
import { VehicleResult } from '../types';
import { ENDPOINTS } from '../config';

interface VehicleSearchProps {
    onSelect: (vehicle: VehicleResult) => void;
}

interface DropdownItem {
    slug: string;
    name: string;
}

export default function VehicleSearch({ onSelect }: VehicleSearchProps) {
    const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
    
    // Quick Search State
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<VehicleResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState("");

    // Manual Search State
    const [makes, setMakes] = useState<DropdownItem[]>([]);
    const [models, setModels] = useState<DropdownItem[]>([]);
    const [generations, setGenerations] = useState<DropdownItem[]>([]);
    const [modifications, setModifications] = useState<DropdownItem[]>([]); // Stap 4
    
    const [selectedMake, setSelectedMake] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [selectedGeneration, setSelectedGeneration] = useState<string>("");
    const [selectedModification, setSelectedModification] = useState<string>(""); // Stap 4
    
    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingGenerations, setLoadingGenerations] = useState(false);
    const [loadingModifications, setLoadingModifications] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    // --- Quick Search Logic ---
    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSearched(false);
        setLastQuery(query);
        
        try {
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "search",
                    query 
                })
            });
            const data = await res.json();
            const items = data.results || (Array.isArray(data) ? data : []);
            setResults(items);
        } catch (e) {
            console.error("Vehicle search failed", e);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    // --- Manual Search Logic ---
    
    useEffect(() => {
        if (activeTab === 'manual' && makes.length === 0) {
            fetchMakes();
        }
    }, [activeTab]);

    const fetchMakes = async () => {
        setLoadingMakes(true);
        try {
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "get_makes" })
            });
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.data || data.makes || []);
            setMakes(items);
        } catch (e) {
            console.error("Failed to fetch makes", e);
        } finally {
            setLoadingMakes(false);
        }
    };

    const handleMakeChange = async (makeSlug: string) => {
        setSelectedMake(makeSlug);
        // Reset alles eronder
        setSelectedModel("");
        setSelectedGeneration("");
        setSelectedModification("");
        setModels([]);
        setGenerations([]);
        setModifications([]);
        setResults([]);
        setSearched(false);

        if (!makeSlug) return;

        setLoadingModels(true);
        try {
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "get_models",
                    make: makeSlug
                })
            });
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.data || data.models || []);
            setModels(items);
        } catch (e) {
            console.error("Failed to fetch models", e);
        } finally {
            setLoadingModels(false);
        }
    };

    const handleModelChange = async (modelSlug: string) => {
        setSelectedModel(modelSlug);
        // Reset alles eronder
        setSelectedGeneration("");
        setSelectedModification("");
        setGenerations([]);
        setModifications([]);
        setResults([]);
        setSearched(false);

        if (!modelSlug) return;

        setLoadingGenerations(true);
        try {
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "get_generations",
                    make: selectedMake,
                    model: modelSlug
                })
            });
            const data = await res.json();
            const items = data.generations || (Array.isArray(data) ? data : []);
            setGenerations(items);
        } catch (e) {
            console.error("Failed to fetch generations", e);
        } finally {
            setLoadingGenerations(false);
        }
    };

    const handleGenerationChange = async (generationSlug: string) => {
        setSelectedGeneration(generationSlug);
        // Reset alles eronder
        setSelectedModification("");
        setModifications([]);
        setResults([]);
        setSearched(false);

        if (!generationSlug) return;

        setLoadingModifications(true);
        try {
            // HIER roepen we de nieuwe n8n actie aan
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "get_modifications",
                    make: selectedMake,
                    model: selectedModel,
                    generation: generationSlug
                })
            });
            const data = await res.json();
            const items = data.modifications || (Array.isArray(data) ? data : []);
            setModifications(items);
        } catch (e) {
            console.error("Failed to fetch modifications", e);
        } finally {
            setLoadingModifications(false);
        }
    };

    const handleModificationChange = async (modificationSlug: string) => {
        setSelectedModification(modificationSlug);
        setResults([]);
        setSearched(false);

        if (!modificationSlug) return;

        setLoadingResults(true);
        try {
            // HIER sturen we de modification slug mee naar get_vehicles
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "get_vehicles",
                    make: selectedMake,
                    model: selectedModel,
                    generation: selectedGeneration,
                    modification: modificationSlug 
                })
            });
            const data = await res.json();
            const items = data.results || (Array.isArray(data) ? data : []);
            setResults(items);
            setSearched(true);
        } catch (e) {
            console.error("Failed to fetch vehicle details", e);
        } finally {
            setLoadingResults(false);
        }
    };

    const handleSelect = (item: VehicleResult) => {
        onSelect(item);
    };

    return (
        <div className="flex flex-col h-full bg-bg-soft p-2">
            {/* Tabs */}
            <div className="flex border-b border-border-subtle mb-3">
                <button
                    className={`flex-1 pb-2 text-xs font-medium transition-colors relative ${
                        activeTab === 'quick' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                    }`}
                    onClick={() => setActiveTab('quick')}
                >
                    Snel Zoeken
                    {activeTab === 'quick' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent"></div>
                    )}
                </button>
                <button
                    className={`flex-1 pb-2 text-xs font-medium transition-colors relative ${
                        activeTab === 'manual' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                    }`}
                    onClick={() => setActiveTab('manual')}
                >
                    Handmatig
                    {activeTab === 'manual' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent"></div>
                    )}
                </button>
            </div>

            {/* Quick Search Input */}
            {activeTab === 'quick' && (
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                        <input 
                            className="w-full bg-bg-elevated border border-border-subtle rounded-md pl-9 pr-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary/50"
                            placeholder="Zoek merk, model, jaar..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button 
                        className="btn px-4" 
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : "Zoek"}
                    </button>
                </div>
            )}

            {/* Manual Search Dropdowns */}
            {activeTab === 'manual' && (
                <div className="flex flex-col gap-2 mb-3">
                    {/* Make Select */}
                    <div className="relative">
                        <select
                            className="w-full bg-bg-elevated border border-border-subtle rounded-md pl-3 pr-8 py-2 text-xs text-text-primary focus:border-accent focus:outline-none appearance-none disabled:opacity-50"
                            value={selectedMake}
                            onChange={(e) => handleMakeChange(e.target.value)}
                            disabled={loadingMakes}
                        >
                            <option value="">Selecteer Merk...</option>
                            {makes.map((make) => (
                                <option key={make.slug} value={make.slug}>
                                    {make.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            {loadingMakes ? <Loader2 className="animate-spin" size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                        </div>
                    </div>

                    {/* Model Select */}
                    <div className="relative">
                        <select
                            className="w-full bg-bg-elevated border border-border-subtle rounded-md pl-3 pr-8 py-2 text-xs text-text-primary focus:border-accent focus:outline-none appearance-none disabled:opacity-50"
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            disabled={!selectedMake || loadingModels}
                        >
                            <option value="">Selecteer Model...</option>
                            {models.map((model) => (
                                <option key={model.slug} value={model.slug}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            {loadingModels ? <Loader2 className="animate-spin" size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                        </div>
                    </div>

                    {/* Generation Select */}
                    <div className="relative">
                        <select
                            className="w-full bg-bg-elevated border border-border-subtle rounded-md pl-3 pr-8 py-2 text-xs text-text-primary focus:border-accent focus:outline-none appearance-none disabled:opacity-50"
                            value={selectedGeneration}
                            onChange={(e) => handleGenerationChange(e.target.value)}
                            disabled={!selectedModel || loadingGenerations}
                        >
                            <option value="">Selecteer Generatie...</option>
                            {generations.map((gen) => (
                                <option key={gen.slug} value={gen.slug}>
                                    {gen.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            {loadingGenerations ? <Loader2 className="animate-spin" size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                        </div>
                    </div>

                    {/* Modification Select (NIEUW) */}
                    <div className="relative">
                        <select
                            className="w-full bg-bg-elevated border border-border-subtle rounded-md pl-3 pr-8 py-2 text-xs text-text-primary focus:border-accent focus:outline-none appearance-none disabled:opacity-50"
                            value={selectedModification}
                            onChange={(e) => handleModificationChange(e.target.value)}
                            disabled={!selectedGeneration || loadingModifications}
                        >
                            <option value="">Selecteer Uitvoering...</option>
                            {modifications.map((mod) => (
                                <option key={mod.slug} value={mod.slug}>
                                    {mod.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            {loadingModifications ? <Loader2 className="animate-spin" size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                {(loading || loadingResults) && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs">Ophalen voertuiggegevens...</span>
                    </div>
                )}
                
                {!loading && !loadingResults && searched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary p-4 text-center">
                        <AlertCircle size={24} className="mb-2 opacity-50 text-red-400" />
                        <span className="text-sm font-medium text-text-primary mb-1">Geen resultaten gevonden</span>
                        {activeTab === 'quick' && (
                            <div className="text-xs opacity-60 max-w-[200px]">
                                We konden niets vinden voor <span className="font-mono text-accent">"{lastQuery}"</span>.
                                <br/>
                                <button onClick={() => setActiveTab('manual')} className="mt-2 text-accent hover:underline">
                                    Probeer handmatig zoeken &rarr;
                                </button>
                            </div>
                        )}
                        {activeTab === 'manual' && (
                            <div className="text-xs opacity-60">
                                Geen configuraties gevonden voor deze selectie.
                            </div>
                        )}
                    </div>
                )}

                {!loading && !loadingResults && !searched && results.length === 0 && activeTab === 'quick' && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-40">
                        <Car size={32} strokeWidth={1} className="mb-2" />
                        <span className="text-xs">Start met zoeken</span>
                    </div>
                )}

                {!loading && !loadingResults && !searched && results.length === 0 && activeTab === 'manual' && selectedGeneration && !selectedModification && (
                     <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-40">
                        <Filter size={32} strokeWidth={1} className="mb-2" />
                        <span className="text-xs">Selecteer een uitvoering om resultaten te zien</span>
                    </div>
                )}

                <div className="flex flex-col gap-2 pr-1">
                    {results.map((item, idx) => (
                        <button
                            key={idx}
                            className="text-left w-full p-3 rounded-md bg-bg-elevated/50 hover:bg-bg-elevated border border-border-subtle hover:border-accent/50 transition-all group relative overflow-hidden"
                            onClick={() => handleSelect(item)}
                        >
                            <div className="absolute top-0 left-0 w-[2px] h-full bg-accent/0 group-hover:bg-accent transition-colors"></div>
                            
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Car size={14} className="text-accent/70 group-hover:text-accent" />
                                    <span className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">
                                        {item.vehicle_make} {item.vehicle_model} <span className="text-text-secondary font-normal">{item.vehicle_generation}</span>
                                    </span>
                                </div>
                                <div className="text-[10px] bg-bg-soft px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary font-mono">
                                    {item.vehicle_trim}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                                <div className="flex justify-between items-center text-text-secondary">
                                    <span>Steekmaat:</span>
                                    <span className="text-text-primary font-mono">{item.tech_bolt_pattern}</span>
                                </div>
                                <div className="flex justify-between items-center text-text-secondary">
                                    <span>Naafgat:</span>
                                    <span className="text-text-primary font-mono">{item.tech_center_bore}</span>
                                </div>
                                <div className="flex justify-between items-center text-text-secondary">
                                    <span>OEM Voor:</span>
                                    <span className="text-text-primary font-mono truncate ml-2" title={item.oem_front_rim}>{item.oem_front_rim}</span>
                                </div>
                                <div className="flex justify-between items-center text-text-secondary">
                                    <span>OEM Achter:</span>
                                    <span className="text-text-primary font-mono truncate ml-2" title={item.oem_rear_rim}>{item.oem_rear_rim}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
