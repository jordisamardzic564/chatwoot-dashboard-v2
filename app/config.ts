// --- CONFIGURATIE ---
export const API_BASE = "https://n8n.srv865019.hstgr.cloud/webhook";

export const ENDPOINTS = {
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

// --- STAGES CONFIG ---
export const PIPELINE_STAGES = [
    { id: 1, name: "Nieuw" },
    { id: 2, name: "Offerte" },
    { id: 3, name: "Wheel rendering" },
    { id: 4, name: "Onderhandeling" },
    { id: 5, name: "Gewonnen" },
    { id: 6, name: "Lost" }
];
