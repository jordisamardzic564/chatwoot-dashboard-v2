"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ExternalLink, 
  FileText, 
  MessageSquare, 
  Bot, 
  RefreshCw, 
  Check, 
  Save,
  Send,
  ChevronRight
} from 'lucide-react';

// --- CONFIGURATIE ---
const API_BASE = "https://n8n.srv865019.hstgr.cloud/webhook";
const ENDPOINTS = {
  LOOKUP: `${API_BASE}/chatwoot-odoo-lookup`,
  CREATE_QUOTE: `${API_BASE}/chatwoot-odoo-create-quote`,
  ADD_NOTE: `${API_BASE}/chatwoot-odoo-add-note`,
  AI_ANALYZE: `${API_BASE}/chatwoot-ai-analyze`,
  MANUAL_SYNC: `${API_BASE}/chatwoot-manual-sync`,
  UPDATE_LEAD: `${API_BASE}/odoo-update-lead`,
  ASK_AI: `${API_BASE}/ask-ai-agent`,
};

// --- TYPES ---
interface Lead {
  id: number;
  name: string;
  phone: string | null;
  email_from: string | null;
  stage_id: [number, string] | boolean; // Odoo returns [id, name] or false
  probability: number;
  create_date: string;
  x_studio_source: string;
  x_studio_naam?: string;
  x_studio_voertuig_lead?: string;
  x_studio_velgmodel_lead?: string;
  x_studio_inchmaat_lead?: string;
  x_studio_kleur_lead?: string;
  x_studio_chatwoot_contact_id_1: string;
}

interface ChatwootData {
  conversationId: number | null;
  accountId: number | null;
  contactId: number | null;
  contactName?: string;
  contactPhone?: string;
}

// --- STAGES CONFIG ---
const PIPELINE_STAGES = [
    { id: 1, name: "Nieuw" },
    { id: 2, name: "Offerte" },
    { id: 3, name: "Wheel rendering" },
    { id: 4, name: "Onderhandeling" },
    { id: 5, name: "Gewonnen" },
    { id: 6, name: "Lost" }
];

export default function Dashboard() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [cwData, setCwData] = useState<ChatwootData>({ conversationId: null, accountId: 142114, contactId: null });
  const [status, setStatus] = useState<string>("Wachten op Chatwoot...");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // --- INITIAL LOAD & CHATWOOT LISTENER ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event !== "appContext") return;

        const data: ChatwootData = {
          conversationId: parsed.data?.conversation?.id || null,
          accountId: parsed.data?.account?.id || null,
          contactId: parsed.data?.contact?.id || null,
          contactName: parsed.data?.contact?.name,
          contactPhone: parsed.data?.contact?.phone_number,
        };
        
        setCwData(data);

        if (data.contactId) {
          loadOdoo(data.contactId);
        } else {
          setStatus("Geen Contact ID ontvangen.");
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener("message", handleMessage);
    window.parent.postMessage("chatwoot-dashboard-app:fetch-info", "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const loadOdoo = async (contactId: number) => {
    setLoading(true);
    setStatus("Odoo data laden...");
    try {
      const res = await fetch(`${ENDPOINTS.LOOKUP}?contact_id=${contactId}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setLead(data.lead || null);
      setStatus(data.lead ? "" : "Geen gekoppelde lead gevonden.");
    } catch (e) {
      setStatus("Fout bij ophalen Odoo data.");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleManualSync = async () => {
    if (!cwData.contactId) return;
    setSyncing(true);
    setStatus("Syncen met Odoo...");
    try {
      const res = await fetch(ENDPOINTS.MANUAL_SYNC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatwoot_id: cwData.contactId,
          name: cwData.contactName,
          phone: cwData.contactPhone
        })
      });
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setStatus("Gesynchroniseerd!");
      } else {
        setStatus("Geen lead aangemaakt/gevonden.");
      }
    } catch (e) {
      setStatus("Sync mislukt.");
    } finally {
      setSyncing(false);
    }
  };

  const updateLeadField = async (field: string, value: any) => {
    if (!lead) return;
    // Optimistic update
    const oldLead = { ...lead };
    setLead({ ...lead, [field]: value });
    
    try {
        await fetch(ENDPOINTS.UPDATE_LEAD, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lead_id: lead.id, [field]: value })
        });
    } catch (e) {
        console.error("Update failed", e);
        setLead(oldLead); // Revert
        setStatus("Update mislukt.");
    }
  };

  if (loading) {
    return <div className="p-4 text-text-secondary text-sm">{status}</div>;
  }

  if (!lead && !loading && cwData.contactId) {
    return (
      <div className="shell">
        <div className="surface">
          <div className="muted-banner flex flex-col gap-4 items-center text-center py-8">
             <div>
                <strong className="block text-white mb-1">Geen lead gevonden</strong>
                <span className="text-xs opacity-70">Deze contactpersoon staat nog niet in Odoo CRM.</span>
             </div>
             <button 
                onClick={handleManualSync} 
                disabled={syncing}
                className="btn"
            >
                {syncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                Sync met Odoo
             </button>
          </div>
          {status && <div id="status" className="mt-4 text-center">{status}</div>}
        </div>
      </div>
    );
  }

  if (!lead) {
      return <div className="p-4 text-text-secondary text-sm">Wachten op data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {status && <div id="status">{status}</div>}
      <div className="shell">
        <div className="surface">
          <Header lead={lead} />
          <PipelineBar 
            currentStageId={Array.isArray(lead.stage_id) ? lead.stage_id[0] : null} 
            onStageSelect={(id) => updateLeadField('stage_id', id)}
          />
          
          <div className="grid-layout">
            <DetailsPanel lead={lead} onUpdate={updateLeadField} />
            <ActionsPanel 
                lead={lead} 
                cwData={cwData} 
                setStatus={setStatus} 
                onLeadUpdate={(l) => setLead(l)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function Header({ lead }: { lead: Lead }) {
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
                <a className="btn" href={odooUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Open in Odoo
                </a>
            </div>
        </div>
    );
}

function PipelineBar({ currentStageId, onStageSelect }: { currentStageId: number | null, onStageSelect: (id: number) => void }) {
    // Find index of current stage to determine past/current/future states
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStageId);
    
    return (
        <div className="mb-4 overflow-x-auto">
            <div className="flex items-center bg-bg-soft rounded-md overflow-hidden border border-border-subtle text-[11px] font-medium min-w-max">
                {PIPELINE_STAGES.map((stage, idx) => {
                    const isActive = stage.id === currentStageId;
                    const isPast = currentIndex > -1 && idx < currentIndex;
                    
                    let bgClass = "bg-bg-soft text-text-secondary hover:bg-bg-elevated";
                    if (isActive) bgClass = "bg-accent/10 text-accent border-b-2 border-accent";
                    else if (isPast) bgClass = "text-text-primary/70";

                    return (
                        <button
                            key={stage.id}
                            onClick={() => onStageSelect(stage.id)}
                            className={`
                                relative px-3 py-2 flex items-center justify-center transition-colors
                                ${bgClass}
                                ${idx !== PIPELINE_STAGES.length - 1 ? 'border-r border-border-subtle/30' : ''}
                            `}
                        >
                            <span className="whitespace-nowrap">{stage.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function DetailsPanel({ lead, onUpdate }: { lead: Lead, onUpdate: (field: string, val: any) => void }) {
    const prob = typeof lead.probability === "number" ? lead.probability : 0;

    return (
        <div className="panel">
            <div className="panel-title-row">
                <div className="panel-title">Lead details</div>
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

                {/* Fase removed from here as it is now in the top bar */}

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

                <div className="label">Voertuig</div>
                <EditableField 
                    value={lead.x_studio_voertuig_lead || ""} 
                    onChange={(v) => onUpdate('x_studio_voertuig_lead', v)} 
                />
                
                <div className="label">Velgmodel</div>
                <EditableField 
                    value={lead.x_studio_velgmodel_lead || ""} 
                    onChange={(v) => onUpdate('x_studio_velgmodel_lead', v)} 
                />
                
                <div className="label">Inchmaat</div>
                <EditableField 
                    value={lead.x_studio_inchmaat_lead || ""} 
                    onChange={(v) => onUpdate('x_studio_inchmaat_lead', v)} 
                />
                
                <div className="label">Kleur</div>
                <EditableField 
                    value={lead.x_studio_kleur_lead || ""} 
                    onChange={(v) => onUpdate('x_studio_kleur_lead', v)} 
                />
            </div>

            <div className="prob-bar">
                <div className="prob-fill" style={{ width: `${Math.min(prob, 100)}%` }}></div>
            </div>
        </div>
    );
}

function EditableField({ value, onChange, className = "" }: { value: string, onChange: (val: string) => void, className?: string }) {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => setLocalValue(value), [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
        setIsEditing(false);
    };

    return (
        <div className={`value ${className}`}>
            <input 
                className="input-edit"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={handleBlur}
            />
        </div>
    );
}

function ActionsPanel({ lead, cwData, setStatus, onLeadUpdate }: { 
    lead: Lead, 
    cwData: ChatwootData, 
    setStatus: (s: string) => void,
    onLeadUpdate: (l: Lead) => void
}) {
    const [note, setNote] = useState("");
    const [aiMode, setAiMode] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);

    const createQuote = async () => {
        setStatus("Quote aanmaken...");
        try {
            const res = await fetch(ENDPOINTS.CREATE_QUOTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lead_id: lead.id })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) window.open(data.url, "_blank");
                setStatus("Quote aangemaakt.");
            } else {
                setStatus("Error bij quote.");
            }
        } catch {
            setStatus("Error bij quote.");
        }
    };

    const addNote = async () => {
        if (!note.trim()) return;
        setStatus("Notitie verzenden...");
        try {
            await fetch(ENDPOINTS.ADD_NOTE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lead_id: lead.id, note })
            });
            setNote("");
            setStatus("Notitie toegevoegd.");
        } catch {
            setStatus("Error: note.");
        }
    };

    const runAutoFill = async () => {
        setStatus("AI leest chat...");
        try {
            const res = await fetch(ENDPOINTS.AI_ANALYZE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    lead_id: lead.id,
                    contact_id: cwData.contactId,
                    conversation_id: cwData.conversationId,
                    account_id: cwData.accountId
                })
            });
            const data = await res.json();
            if (data.updates) {
                onLeadUpdate({ ...lead, ...data.updates });
                setStatus("Lead geüpdatet door AI.");
            }
        } catch (e) {
            setStatus("AI update mislukt.");
        }
    };

    const askAiAgent = async () => {
        if (!aiQuery.trim()) return;
        setLoadingAi(true);
        try {
            const res = await fetch(ENDPOINTS.ASK_AI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lead_id: lead.id, query: aiQuery })
            });
            const data = await res.json();
            setAiResponse(data.answer || "Geen antwoord ontvangen.");
        } catch {
            setAiResponse("Fout bij ophalen antwoord.");
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <div className="panel">
            <div className="panel-title-row">
                <div className="panel-title">Acties</div>
                <div className="panel-dot"></div>
            </div>

            <div className="actions-row">
                <button className="btn btn-ghost text-accent border-accent-soft" onClick={runAutoFill}>
                    <Bot size={16} /> AI Chat Analyse
                </button>
                
                <button className="btn btn-ghost" onClick={createQuote}>
                    <FileText size={16} /> Create quote
                </button>
                
                <button className="btn btn-ghost" onClick={() => setAiMode(!aiMode)}>
                    <MessageSquare size={16} /> AI Assistent
                </button>
            </div>

            {aiMode ? (
                <div className="chat-ui">
                    {aiResponse && (
                        <div className="chat-messages">
                            <div className="chat-msg user">{aiQuery}</div>
                            <div className="chat-msg ai">{aiResponse}</div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input 
                            className="note-textarea h-10 min-h-0" 
                            placeholder="Vraag de AI iets over deze lead..."
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && askAiAgent()}
                        />
                        <button className="btn" onClick={askAiAgent} disabled={loadingAi}>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <textarea 
                        className="note-textarea"
                        placeholder="Interne notitie..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                    {note && (
                        <button 
                            className="absolute bottom-2 right-2 btn p-1 h-6 w-6" 
                            onClick={addNote}
                        >
                            <Send size={12} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
