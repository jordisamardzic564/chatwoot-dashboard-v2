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
  ChevronDown,
  Search,
  Link2,
  Unlink,
  ShoppingBag,
  Car,
  X,
  Loader2
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
  VEHICLE_SEARCH: `${API_BASE}/chatwoot-vehicle-search`,
};

// --- TYPES ---
interface VehicleResult {
  name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_generation: string;
  vehicle_trim: string;
  vehicle_engine: string;
  tech_bolt_pattern: string;
  tech_center_bore: string;
  tech_torque: string;
  oem_front_rim: string;
  oem_rear_rim: string;
  oem_front_tire: string;
  oem_rear_tire: string;
}

interface Order {
  id: number;
  name: string;
  date: string | null;
  amount: number;
  state: string; // "Offerte", "Order" etc.
  raw_state?: string;
  url: string;
  commitment_date?: string | null;
  lines?: {
    name: string;
    qty: number;
    price: number;
  }[];
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
    <div className="w-full max-w-[1600px] mx-auto p-4">
      {status && <div id="status">{status}</div>}
      <div className="shell">
        <div className="surface">
          <Header lead={lead} onUnlink={handleUnlink} />
          <PipelineBar 
            currentStageId={Array.isArray(lead.stage_id) ? lead.stage_id[0] : null} 
            onStageSelect={(id) => updateLeadField('stage_id', id)}
          />
          
          <div className="grid-layout">
            {/* LINKER KOLOM: KLANT INFO */}
            <div className="flex flex-col gap-4">
                <LeadPanel lead={lead} onUpdate={updateLeadField} />
                <div className="hidden lg:block">
                     <OrdersPanel leadId={lead.id} />
                </div>
            </div>

            {/* MIDDEN KOLOM: VOERTUIG & CONFIGURATIE (COCKPIT) */}
            <div className="flex flex-col gap-4 h-full">
                <VehiclePanel lead={lead} onUpdate={updateLeadField} />
            </div>

            {/* RECHTER KOLOM: ACTIES & COMMUNICATIE */}
            <div className="flex flex-col gap-4">
                <ActionsPanel 
                    lead={lead} 
                    cwData={cwData} 
                    setStatus={setStatus} 
                    onLeadUpdate={(l) => setLead(l)}
                />
                 <div className="lg:hidden">
                     <OrdersPanel leadId={lead.id} />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function LeadPanel({ lead, onUpdate }: { lead: Lead, onUpdate: (field: string, val: any) => void }) {
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

function VehiclePanel({ lead, onUpdate }: { lead: Lead, onUpdate: (field: string, val: any) => void }) {
    return (
        <div className="panel flex flex-col h-full min-h-[400px]">
            <div className="panel-title-row">
                <div className="panel-title">Voertuig Configuratie</div>
                <div className="panel-dot"></div>
            </div>

            <div className="mb-4 flex-1">
                 <div className="text-[10px] uppercase text-text-secondary font-bold tracking-wider mb-2">Zoek Voertuig</div>
                 <div className="h-full min-h-[250px] border border-border-subtle rounded-lg bg-bg-soft overflow-hidden">
                    <VehicleSearch 
                        onSelect={(vehicleName) => onUpdate('x_studio_voertuig_lead', vehicleName)} 
                    />
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border-subtle/30">
                 <div>
                    <div className="label mb-1">Huidig Voertuig</div>
                    <EditableField 
                        value={lead.x_studio_voertuig_lead || ""} 
                        onChange={(v) => onUpdate('x_studio_voertuig_lead', v)} 
                        className="bg-bg-elevated p-2 rounded border border-border-subtle"
                    />
                 </div>
                 <div>
                    <div className="label mb-1">Velgmodel</div>
                    <EditableField 
                        value={lead.x_studio_velgmodel_lead || ""} 
                        onChange={(v) => onUpdate('x_studio_velgmodel_lead', v)} 
                        className="bg-bg-elevated p-2 rounded border border-border-subtle"
                    />
                 </div>
                 <div>
                    <div className="label mb-1">Inchmaat</div>
                    <EditableField 
                        value={lead.x_studio_inchmaat_lead || ""} 
                        onChange={(v) => onUpdate('x_studio_inchmaat_lead', v)} 
                        className="bg-bg-elevated p-2 rounded border border-border-subtle"
                    />
                 </div>
                 <div>
                    <div className="label mb-1">Kleur</div>
                    <EditableField 
                        value={lead.x_studio_kleur_lead || ""} 
                        onChange={(v) => onUpdate('x_studio_kleur_lead', v)} 
                        className="bg-bg-elevated p-2 rounded border border-border-subtle"
                    />
                 </div>
            </div>
        </div>
    );
}

function OrdersPanel({ leadId }: { leadId: number }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

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

    const toggleExpand = (id: number) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    if (loading) return <div className="panel p-4 text-xs text-text-secondary text-center">Orders laden...</div>;
    if (error) return <div className="panel p-4 text-xs text-red-400 text-center">{error}</div>;
    
    return (
        <div className="panel h-full">
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
                    {orders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                            <div key={order.id} className="bg-bg-soft rounded border border-border-subtle/50 overflow-hidden">
                                <div 
                                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-elevated transition-colors"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${order.state === 'Order' ? 'bg-success/10 text-success' : 'bg-text-secondary/10 text-text-secondary'}`}>
                                            <ShoppingBag size={14} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-text-primary text-xs">{order.name}</div>
                                            <div className="text-[10px] text-text-secondary">{order.date}</div>
                                            {order.state === 'Order' && order.commitment_date && (
                                                <div className="text-[10px] text-accent mt-0.5 flex items-center gap-1">
                                                    <span className="opacity-70">Lev:</span> {order.commitment_date}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-mono text-text-primary text-xs">€ {order.amount.toFixed(2)}</div>
                                            <div className={`text-[10px] ${order.state === 'Order' ? 'text-success' : 'text-text-secondary'}`}>
                                                {order.state}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-1 items-center">
                                            <a 
                                                href={order.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost h-7 w-7 p-0 rounded-full border-none hover:bg-bg-elevated text-text-secondary"
                                                title="Open in Odoo"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                            <div className={`text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && order.lines && order.lines.length > 0 && (
                                    <div className="border-t border-border-subtle/30 bg-black/20 p-2">
                                        <div className="flex flex-col gap-1.5">
                                            {order.lines.map((line, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-[11px] py-1 border-b border-white/5 last:border-0">
                                                    <div className="text-text-secondary flex-1 pr-2">
                                                        <span className="text-text-primary font-mono mr-1.5">{line.qty}x</span>
                                                        {line.name}
                                                    </div>
                                                    <div className="font-mono text-text-primary whitespace-nowrap opacity-60">
                                                        € {line.price.toFixed(0)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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

function VehicleSearch({ onSelect }: { onSelect: (vehicle: string) => void }) {
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
                            onClick={() => onSelect(item.name)}
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
