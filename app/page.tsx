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
  ChevronRight,
  Search,
  Link2,
  Unlink,
  ShoppingBag
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
  SEARCH: `${API_BASE}/chatwoot-odoo-search`,
  MANUAL_LINK: `${API_BASE}/chatwoot-odoo-manual-link`,
  UNLINK: `${API_BASE}/chatwoot-odoo-unlink`,
  GET_ORDERS: `${API_BASE}/chatwoot-odoo-get-orders`,
};

// --- TYPES ---
interface Order {
  id: number;
  name: string;
  date: string | null;
  amount: number;
  state: string; // "Offerte", "Order" etc.
  raw_state?: string;
  url: string;
}

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
  
  // Search & Link state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // --- INITIAL LOAD & CHATWOOT LISTENER ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event !== "appContext") return;

        const data: ChatwootData = {
          conversationId: parsed.data?.conversation?.id || null,
          accountId: parsed.data?.account?.id || 142114, // Fallback to default if missing
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

  const handleUnlink = async () => {
    if (!lead || !cwData.contactId) return;
    if (!confirm("Weet je zeker dat je deze lead wilt ontkoppelen?")) return;

    setStatus("Ontkoppelen...");
    try {
        const res = await fetch(ENDPOINTS.UNLINK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chatwoot_contact_id: cwData.contactId 
            })
        });
        
        if (res.ok) {
            setLead(null);
            setStatus("Lead ontkoppeld.");
        } else {
            setStatus("Ontkoppelen mislukt.");
        }
    } catch (e) {
        console.error(e);
        setStatus("Fout bij ontkoppelen.");
    }
  };

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
          </div>
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
          <Header lead={lead} onUnlink={handleUnlink} />
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
          
          <div className="mt-4">
             <OrdersPanel leadId={lead.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function OrdersPanel({ leadId }: { leadId: number }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(ENDPOINTS.GET_ORDERS, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lead_id: leadId })
                });
                if (!res.ok) throw new Error("Mislukt");
                const data = await res.json();
                setOrders(data.orders || []);
            } catch (e) {
                setError("Kon orders niet laden");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (leadId) fetchOrders();
    }, [leadId]);

    if (loading) return <div className="panel p-4 text-xs text-text-secondary text-center">Orders laden...</div>;
    if (error) return <div className="panel p-4 text-xs text-red-400 text-center">{error}</div>;
    
    return (
        <div className="panel">
            <div className="panel-title-row">
                <div className="panel-title">Offertes & Orders</div>
                <div className="panel-dot"></div>
            </div>
            
            {orders.length === 0 ? (
                <div className="text-xs text-text-secondary text-center py-4 opacity-60">
                    Geen orders of offertes gevonden.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded bg-bg-soft border border-border-subtle/50 hover:border-border-subtle transition-colors text-xs">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${order.state === 'Order' ? 'bg-success/10 text-success' : 'bg-text-secondary/10 text-text-secondary'}`}>
                                    <ShoppingBag size={14} />
                                </div>
                                <div>
                                    <div className="font-medium text-text-primary">{order.name}</div>
                                    <div className="text-[10px] text-text-secondary">{order.date}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="font-mono text-text-primary">€ {order.amount.toFixed(2)}</div>
                                    <div className={`text-[10px] ${order.state === 'Order' ? 'text-success' : 'text-text-secondary'}`}>
                                        {order.state}
                                    </div>
                                </div>
                                
                                <a 
                                    href={order.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost h-7 w-7 p-0 rounded-full border-none hover:bg-bg-elevated"
                                    title="Open in Odoo"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Header({ lead, onUnlink }: { lead: Lead, onUnlink: () => void }) {
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
