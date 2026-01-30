"use client";

import React from 'react';
import { Lead, VehicleResult } from '../types';
import EditableField from './EditableField';
import VehicleSearch from './VehicleSearch';

interface VehicleConfiguratorProps {
    lead: Lead;
    onUpdate: (field: string | Record<string, any>, val?: any) => void;
}

export default function VehicleConfigurator({ lead, onUpdate }: VehicleConfiguratorProps) {
    
    const handleVehicleSelect = (vehicle: VehicleResult) => {
        // Map API result to Odoo fields
        const updates = {
            // Bestaande veld
            x_studio_voertuig_lead: vehicle.name,
            
            // Nieuwe Odoo velden
            x_studio_officile_naam_voertuig: vehicle.name,
            x_studio_automerk: vehicle.vehicle_make,
            x_studio_model_1: vehicle.vehicle_model,
            x_studio_generatie: vehicle.vehicle_generation,
            
            x_studio_oem_front: vehicle.oem_front_rim,
            x_studio_oem_rear: vehicle.oem_rear_rim,
            x_studio_steekmaat_1: vehicle.tech_bolt_pattern,
            x_studio_naafgat_1: vehicle.tech_center_bore,
        };
        onUpdate(updates);
    };

    return (
        <div className="panel flex flex-col h-full min-h-[400px]">
            {/* Note: Title is removed here because tabs handle the context */}
            
            <div className="mb-4 flex-1">
                 <div className="text-[10px] uppercase text-text-secondary font-bold tracking-wider mb-2">Zoek Voertuig</div>
                 <div className="h-full min-h-[250px] border border-border-subtle rounded-lg bg-bg-soft overflow-hidden">
                    <VehicleSearch onSelect={handleVehicleSelect} />
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
