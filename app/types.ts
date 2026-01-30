export interface VehicleResult {
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

export interface Order {
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

export interface Lead {
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

  // Technische voertuig data
  x_studio_officile_naam_voertuig?: string;
  x_studio_automerk?: string;
  x_studio_model_1?: string;
  x_studio_generatie?: string;
  x_studio_oem_front?: string;
  x_studio_oem_rear?: string;
  x_studio_steekmaat_1?: string;
  x_studio_naafgat_1?: string;
}

export interface ChatwootData {
  conversationId: number | null;
  accountId: number | null;
  contactId: number | null;
  contactName?: string;
  contactPhone?: string;
}
