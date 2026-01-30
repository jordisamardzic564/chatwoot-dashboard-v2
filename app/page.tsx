"use client";

import React, { useEffect, useState } from 'react';
import { 
  Lead, 
  ChatwootData 
} from './types';
import { 
  ENDPOINTS 
} from './config';

// Components
import DashboardHeader from './components/DashboardHeader';
import PipelineBar from './components/PipelineBar';
import LeadPanel from './components/LeadPanel';
import OrdersPanel from './components/OrdersPanel';
import ActionPanel from './components/ActionPanel';
import QuoteBuilder from './components/QuoteBuilder';
import VehicleConfigurator from './components/VehicleConfigurator';
import WorkspaceTabs from './components/WorkspaceTabs';
import SearchAndLink from './components/SearchAndLink';

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
            // Probeer JSON te parsen, maar faal niet als de response leeg is
            try {
                const text = await res.text();
                if (text) JSON.parse(text);
            } catch (e) {
                console.warn("Geen geldige JSON response, maar request was wel succesvol (200 OK).");
            }

            setLead(null);
            setStatus("Lead ontkoppeld.");
        } else {
            setStatus("Ontkoppelen mislukt (" + res.status + ").");
        }
    } catch (e) {
        console.error("Unlink error:", e);
        setStatus("Server fout (waarschijnlijk CORS in n8n).");
    }
  };

  const updateLeadField = async (field: string | Record<string, any>, value?: any) => {
    if (!lead) return;
    
    // Handle both single field update and bulk update
    let updates: Record<string, any> = {};
    if (typeof field === 'string') {
        updates = { [field]: value };
    } else {
        updates = field;
    }

    // Optimistic update
    const oldLead = { ...lead };
    setLead({ ...lead, ...updates });
    
    try {
        await fetch(ENDPOINTS.UPDATE_LEAD, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lead_id: lead.id, ...updates })
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
    return <SearchAndLink cwData={cwData} status={status} setStatus={setStatus} loadOdoo={loadOdoo} />;
  }

  if (!lead) {
      return <div className="p-4 text-text-secondary text-sm">Wachten op data...</div>;
  }

  // --- TABS CONFIGURATION ---
  const tabs = [
      {
          id: 'config',
          label: 'Configuratie',
          component: <VehicleConfigurator lead={lead} onUpdate={updateLeadField} />
      },
      // Hier kunnen we later 'Timeline', 'Notes' etc. toevoegen
      {
          id: 'actions',
          label: 'Acties & AI',
          component: <ActionPanel lead={lead} cwData={cwData} setStatus={setStatus} onLeadUpdate={(l) => setLead(l)} />
      }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4">
      {status && <div id="status">{status}</div>}
      <div className="shell">
        <div className="surface">
          <DashboardHeader lead={lead} onUnlink={handleUnlink} />
          
          <PipelineBar 
            currentStageId={Array.isArray(lead.stage_id) ? lead.stage_id[0] : null} 
            onStageSelect={(id) => updateLeadField('stage_id', id)}
          />
          
          <div className="grid-layout">
            {/* LINKER KOLOM: KLANT INFO & ORDERS */}
            <div className="flex flex-col gap-4">
                <LeadPanel lead={lead} onUpdate={updateLeadField} />
                <OrdersPanel leadId={lead.id} />
            </div>

            {/* MIDDEN KOLOM: WORKSPACE TABS */}
            <div className="h-full min-h-[500px]">
                <WorkspaceTabs tabs={tabs} />
            </div>

            {/* RECHTER KOLOM: OFFERTES (ActionPanel zit nu ook in Tabs, of splitsen we?) */}
            {/* 
                Ontwerpkeuze: De gebruiker wilde "Tabs in het midden".
                Ik heb ActionPanel (AI & Notities) nu OOK als tab toegevoegd voor de demo.
                Maar QuoteBuilder blijft rechts staan, want dat is de "Checkout/Winkelmand" logica.
            */}
            <div className="flex flex-col gap-4">
                <QuoteBuilder lead={lead} setStatus={setStatus} />
                
                {/* 
                   Optioneel: We kunnen ActionPanel hier ook laten staan als "Quick Actions"
                   of verplaatsen naar Tabs. Gezien de vraag "meer ruimte", heb ik AI/Acties
                   naar de tabs verplaatst (zie regel 130). 
                   Als de rechterkolom te leeg is, kunnen we orders hier ook weer tonen op mobile?
                   Nee, OrdersPanel staat al links.
                   
                   Laten we voor nu QuoteBuilder rechts houden.
                */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
