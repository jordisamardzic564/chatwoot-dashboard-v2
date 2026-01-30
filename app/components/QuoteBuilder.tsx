"use client";

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Lead } from '../types';
import { ENDPOINTS } from '../config';

interface QuoteBuilderProps {
    lead: Lead;
    setStatus: (s: string) => void;
}

export default function QuoteBuilder({ lead, setStatus }: QuoteBuilderProps) {
    const [productCodeFront, setProductCodeFront] = useState("");
    const [productCodeRear, setProductCodeRear] = useState("");

    const createQuote = async () => {
        if (!lead.x_studio_voertuig_lead) {
            if (!confirm("Er is nog geen voertuig geselecteerd. Wil je toch doorgaan met de offerte?")) return;
        }
        
        if (!productCodeFront) {
             setStatus("Vul minstens productcode vooras in.");
             return;
        }

        setStatus("Quote aanmaken...");
        try {
            const res = await fetch(ENDPOINTS.CREATE_QUOTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    lead_id: lead.id,
                    product_code_front: productCodeFront,
                    product_code_rear: productCodeRear
                })
            });
            const text = await res.text();
            console.log("Create Quote Response:", text);

            if (res.ok) {
                try {
                    const data = JSON.parse(text);
                    if (data.url) window.open(data.url, "_blank");
                    setStatus("Quote aangemaakt.");
                } catch (e) {
                    setStatus("Quote gemaakt, maar ongeldig antwoord.");
                }
            } else {
                setStatus(`Error bij quote: ${res.status}`);
            }
        } catch (e) {
            console.error(e);
            setStatus("Netwerkfout bij quote.");
        }
    };

    return (
        <div className="panel">
            <div className="panel-title-row">
                <div className="panel-title">Offerte Samenstellen</div>
                <div className="panel-dot"></div>
            </div>

            <div className="flex flex-col gap-3 mb-4">
                <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 block">Productcode Vooras</label>
                    <input 
                        className="w-full bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/40 font-mono"
                        placeholder="Bijv. PS3GBL20"
                        value={productCodeFront}
                        onChange={(e) => setProductCodeFront(e.target.value.toUpperCase())}
                    />
                </div>
                <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1 block">Productcode Achteras <span className="font-normal opacity-60">(optioneel)</span></label>
                    <input 
                        className="w-full bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/40 font-mono"
                        placeholder="Bijv. PS3GBL21 (leeg = zelfde als voor)"
                        value={productCodeRear}
                        onChange={(e) => setProductCodeRear(e.target.value.toUpperCase())}
                    />
                </div>
            </div>

            <div className="actions-row">
                <button className="btn btn-ghost" onClick={createQuote}>
                    <FileText size={16} /> Create quote
                </button>
            </div>
        </div>
    );
}
