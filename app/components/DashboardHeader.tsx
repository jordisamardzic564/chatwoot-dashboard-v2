"use client";

import React from 'react';
import { ExternalLink, Unlink } from 'lucide-react';
import { Lead } from '../types';

interface HeaderProps {
    lead: Lead;
    onUnlink: () => void;
}

export default function DashboardHeader({ lead, onUnlink }: HeaderProps) {
    const odooUrl = `https://korbach-forged.odoo.com/web#id=${lead.id}&model=crm.lead&view_type=form`;

    return (
        <div className="header">
            <div>
                <div className="lead-title">{lead.name || "Lead zonder titel"}</div>
                <div className="subtitle">{lead.x_studio_source || "-"}</div>
                <div className="badge-row">
                    <div className="id-pill">Lead ID: <span className="value-mono">{lead.id}</span></div>
                </div>
            </div>
            <div className="header-actions">
                <button 
                    className="btn btn-ghost text-text-secondary hover:text-red-400 hover:bg-red-400/10" 
                    onClick={onUnlink} 
                    title="Ontkoppel Lead"
                >
                    <Unlink size={16} />
                </button>
                <a className="btn" href={odooUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Open in Odoo
                </a>
            </div>
        </div>
    );
}
