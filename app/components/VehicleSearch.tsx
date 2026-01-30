"use client";

import React, { useState } from 'react';
import { Search, Loader2, Car } from 'lucide-react';
import { VehicleResult } from '../types';
import { ENDPOINTS } from '../config';

interface VehicleSearchProps {
    onSelect: (vehicle: VehicleResult) => void;
}

export default function VehicleSearch({ onSelect }: VehicleSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<VehicleResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        setSearched(false);
        
        try {
            const res = await fetch(ENDPOINTS.VEHICLE_SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
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

    const handleSelect = (item: VehicleResult) => {
        onSelect(item);
        setResults([]);
        setQuery("");
        setSearched(false);
    };

    return (
        <div className="flex flex-col h-full bg-bg-soft p-2">
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
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs">Connecting to Wheel-Size API...</span>
                    </div>
                )}
                
                {!loading && searched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                        <span className="text-xs opacity-60">Geen voertuigen gevonden.</span>
                    </div>
                )}

                {!loading && !searched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-40">
                        <Car size={32} strokeWidth={1} className="mb-2" />
                        <span className="text-xs">Start met zoeken</span>
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
