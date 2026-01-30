"use client";

import React from 'react';
import { Lead } from '../types';
import EditableField from './EditableField';

interface LeadPanelProps {
    lead: Lead;
    onUpdate: (field: string | Record<string, any>, val?: any) => void;
}

export default function LeadPanel({ lead, onUpdate }: LeadPanelProps) {
    const prob = typeof lead.probability === "number" ? lead.probability : 0;
    
    return (
        <div className="panel h-full">
            <div className="panel-title-row">
                <div className="panel-title">Klantgegevens</div>
                <div className="panel-dot"></div>
            </div>
            
            <div className="data-grid">
                <div className="label">Naam</div>
                <EditableField 
                    value={lead.x_studio_naam || lead.name || ""} 
                    onChange={(v) => onUpdate('name', v)} 
                />
                
                <div className="label">Telefoon</div>
                <EditableField 
                    value={lead.phone || ""} 
                    onChange={(v) => onUpdate('phone', v)} 
                    className="value-mono"
                />
                
                <div className="label">Email</div>
                <EditableField 
                    value={lead.email_from || ""} 
                    onChange={(v) => onUpdate('email_from', v)} 
                    className="value-mono"
                />

                <div className="label">Bron</div>
                <EditableField 
                    value={lead.x_studio_source || ""} 
                    onChange={(v) => onUpdate('x_studio_source', v)} 
                />
                
                <div className="label">Aangemaakt</div>
                <div className="value">{lead.create_date?.split(' ')[0] || "-"}</div>

                <div className="label">Probability</div>
                <div className="value flex items-center gap-1 justify-end">
                    <input 
                        type="number" 
                        className="input-edit w-16 text-right" 
                        value={prob}
                        onChange={(e) => onUpdate('probability', parseFloat(e.target.value))}
                        min={0} max={100}
                    />
                    <span>%</span>
                </div>
            </div>

            <div className="prob-bar mt-4">
                <div className="prob-fill" style={{ width: `${Math.min(prob, 100)}%` }}></div>
            </div>
        </div>
    )
}
