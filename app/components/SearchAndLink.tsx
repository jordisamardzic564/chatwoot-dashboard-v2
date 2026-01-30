"use client";

import React, { useState } from 'react';
import { RefreshCw, Search, ExternalLink, Link2, Plus } from 'lucide-react';
import { ChatwootData, Lead } from '../types';
import { ENDPOINTS } from '../config';

interface SearchAndLinkProps {
    cwData: ChatwootData;
    status: string;
    setStatus: (s: string) => void;
    loadOdoo: (id: number) => void;
}

export default function SearchAndLink({ cwData, status, setStatus, loadOdoo }: SearchAndLinkProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Lead[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateLead = async () => {
        if (!cwData.contactId) return;
        setIsCreating(true);
        setStatus("Nieuwe lead aanmaken...");
        try {
            const res = await fetch(ENDPOINTS.MANUAL_SYNC, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatwoot_id: cwData.contactId,
                    name: cwData.contactName || "Nieuwe Lead",
                    phone: cwData.contactPhone,
                    email: cwData.contactEmail
                })
            });
            const data = await res.json();
            if (data.lead) {
                setStatus("Lead aangemaakt! Laden...");
                await loadOdoo(cwData.contactId);
            } else {
                setStatus("Geen lead aangemaakt.");
            }
        } catch (e) {
            console.error(e);
            setStatus("Fout bij aanmaken.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setStatus("Vul een zoekterm in.");
            return;
        }
        setIsSearching(true);
        setStatus("Zoeken in Odoo...");
        setSearchResults([]);
    
        try {
            const res = await fetch(ENDPOINTS.SEARCH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery })
            });
            const data = await res.json();
            setSearchResults(data.leads || []);
            if ((data.leads || []).length === 0) {
                setStatus("Geen resultaten gevonden.");
            } else {
                setStatus("");
            }
        } catch (e) {
            console.error(e);
            setStatus("Fout bij zoeken.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleLink = async (odooLeadId: number) => {
        if (!cwData.contactId) return;
        setIsLinking(true);
        setStatus("Koppelen...");
        try {
            const res = await fetch(ENDPOINTS.MANUAL_LINK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    odoo_lead_id: odooLeadId,
                    chatwoot_contact_id: cwData.contactId 
                })
            });
            if (res.ok) {
                setStatus("Gekoppeld! Data laden...");
                await loadOdoo(cwData.contactId);
            } else {
                setStatus("Koppelen mislukt.");
            }
        } catch (e) {
            setStatus("Fout bij koppelen.");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="shell">
        <div className="surface">
          <div className="muted-banner flex flex-col gap-4 items-center text-center py-8">
             <div>
                <strong className="block text-white mb-1">Geen lead gevonden</strong>
                <span className="text-xs opacity-70">Zoek handmatig in Odoo om te koppelen.</span>
             </div>
          </div>
          
          <div className="panel mt-4">
            <div className="panel-title-row">
                <div className="panel-title">Zoek & Koppel</div>
                <div className="panel-dot"></div>
            </div>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="note-textarea mt-0 h-10 min-h-0" 
                    placeholder="Zoek naam, email, tel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                    onClick={handleSearch} 
                    disabled={isSearching}
                    className="btn"
                >
                    {isSearching ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                    Zoek
                </button>
            </div>

            {searchResults.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                    {searchResults.map((resLead) => (
                        <div key={resLead.id} className="p-3 bg-bg-soft rounded border border-border-subtle hover:border-border-subtle/80 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-semibold text-sm text-text-primary">{resLead.name}</div>
                                    <div className="text-xs text-text-secondary mt-0.5">
                                       {resLead.email_from}
                                       {resLead.email_from && resLead.phone && <span className="mx-1">•</span>}
                                       {resLead.phone}
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className="text-[10px] text-text-secondary font-mono">
                                        {resLead.create_date ? resLead.create_date.split(' ')[0] : ''}
                                     </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-subtle/30">
                                 <div className="text-xs font-medium text-accent truncate">
                                    {resLead.x_studio_voertuig_lead || <span className="text-text-secondary opacity-50">Geen voertuig</span>}
                                 </div>
                                 
                                 <div className="flex gap-2">
                                    <a 
                                        href={`https://korbach-forged.odoo.com/web#id=${resLead.id}&model=crm.lead&view_type=form`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost text-xs px-2 h-7 min-h-0"
                                        title="Bekijk in Odoo"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                    <button 
                                        onClick={() => handleLink(resLead.id)}
                                        disabled={isLinking}
                                        className="btn text-xs px-3 h-7 min-h-0"
                                    >
                                        {isLinking ? <RefreshCw className="animate-spin" size={12} /> : <Link2 size={12} />}
                                        Koppel
                                    </button>
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {status && <div className="mt-2 text-center text-xs text-text-secondary">{status}</div>}

            <div className="mt-4 pt-4 border-t border-border-subtle/30 text-center">
                <div className="text-[10px] text-text-secondary mb-2">Staat de lead er niet tussen?</div>
                <button 
                    onClick={handleCreateLead} 
                    disabled={isCreating}
                    className="btn btn-secondary w-full justify-center text-xs"
                >
                   {isCreating ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} />}
                   Nieuwe lead aanmaken
                </button>
            </div>
          </div>
        </div>
      </div>
    );
}
