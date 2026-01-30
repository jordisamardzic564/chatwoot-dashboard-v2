"use client";

import React, { useState } from 'react';
import { Car, Check, Edit2, ShieldCheck, ChevronRight } from 'lucide-react';
import { Lead, VehicleResult } from '../types';
import EditableField from './EditableField';
import VehicleSearch from './VehicleSearch';

interface VehicleConfiguratorProps {
    lead: Lead;
    onUpdate: (field: string | Record<string, any>, val?: any) => void;
}

export default function VehicleConfigurator({ lead, onUpdate }: VehicleConfiguratorProps) {
    const [isEditingVehicle, setIsEditingVehicle] = useState(false);

    const hasVehicle = !!lead.x_studio_voertuig_lead;
    
    const handleVehicleSelect = (vehicle: VehicleResult) => {
        const updates = {
            x_studio_voertuig_lead: vehicle.name,
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
        setIsEditingVehicle(false);
    };

    return (
        <div className="flex flex-col h-full bg-bg-surface p-4">
            {/* 1. SELECTION SECTION */}
            <div className="mb-6">
                {!hasVehicle || isEditingVehicle ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                         <div className="flex justify-between items-center mb-2">
                            <div className="text-xs uppercase text-text-secondary font-bold tracking-wider">Zoek Voertuig</div>
                            {hasVehicle && (
                                <button 
                                    onClick={() => setIsEditingVehicle(false)}
                                    className="text-xs text-text-secondary hover:text-text-primary underline"
                                >
                                    Annuleer
                                </button>
                            )}
                         </div>
                         <div className="h-[300px] border border-border-subtle rounded-lg bg-bg-soft overflow-hidden shadow-sm">
                            <VehicleSearch onSelect={handleVehicleSelect} />
                         </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-start justify-between bg-bg-elevated/30 border border-success/20 rounded-lg p-4 relative overflow-hidden group">
                            {/* Background accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
                            
                            <div className="flex gap-4">
                                <div className="p-3 bg-bg-elevated rounded-full text-success border border-success/10 h-fit">
                                    <Car size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-text-primary">
                                            {lead.x_studio_automerk} {lead.x_studio_model_1}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] uppercase font-bold tracking-wider rounded border border-success/20 flex items-center gap-1">
                                            <ShieldCheck size={10} />
                                            Geselecteerd
                                        </span>
                                    </div>
                                    <div className="text-sm text-text-secondary mb-3">
                                        {lead.x_studio_generatie} • {lead.x_studio_officile_naam_voertuig}
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                                        <div className="flex justify-between border-b border-border-subtle/30 pb-1">
                                            <span className="text-text-secondary">Steekmaat</span>
                                            <span className="font-mono text-text-primary">{lead.x_studio_steekmaat_1 || "-"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border-subtle/30 pb-1">
                                            <span className="text-text-secondary">Naafgat</span>
                                            <span className="font-mono text-text-primary">{lead.x_studio_naafgat_1 || "-"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border-subtle/30 pb-1">
                                            <span className="text-text-secondary">OEM Voor</span>
                                            <span className="font-mono text-text-primary truncate max-w-[150px]" title={lead.x_studio_oem_front}>{lead.x_studio_oem_front || "-"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border-subtle/30 pb-1">
                                            <span className="text-text-secondary">OEM Achter</span>
                                            <span className="font-mono text-text-primary truncate max-w-[150px]" title={lead.x_studio_oem_rear}>{lead.x_studio_oem_rear || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsEditingVehicle(true)}
                                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-md transition-colors"
                                title="Wijzig voertuig"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-success/80 px-1">
                            <Check size={12} />
                            <span>Dit voertuig is gekoppeld aan de lead en wordt gebruikt voor offertes.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. CONFIGURATION FIELDS */}
            <div className="mt-auto">
                <div className="text-xs uppercase text-text-secondary font-bold tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                    Wiel Configuratie
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-bg-soft p-3 rounded border border-border-subtle">
                        <div className="label mb-1.5">Velgmodel</div>
                        <EditableField 
                            value={lead.x_studio_velgmodel_lead || ""} 
                            onChange={(v) => onUpdate('x_studio_velgmodel_lead', v)} 
                            className="bg-bg-elevated p-2 rounded border border-border-subtle text-sm font-medium focus-within:border-accent"
                        />
                     </div>
                     <div className="bg-bg-soft p-3 rounded border border-border-subtle">
                        <div className="label mb-1.5">Inchmaat</div>
                        <EditableField 
                            value={lead.x_studio_inchmaat_lead || ""} 
                            onChange={(v) => onUpdate('x_studio_inchmaat_lead', v)} 
                            className="bg-bg-elevated p-2 rounded border border-border-subtle text-sm font-medium focus-within:border-accent"
                        />
                     </div>
                     <div className="bg-bg-soft p-3 rounded border border-border-subtle col-span-2">
                        <div className="label mb-1.5">Kleur & Afwerking</div>
                        <EditableField 
                            value={lead.x_studio_kleur_lead || ""} 
                            onChange={(v) => onUpdate('x_studio_kleur_lead', v)} 
                            className="bg-bg-elevated p-2 rounded border border-border-subtle text-sm font-medium focus-within:border-accent"
                        />
                     </div>
                </div>
            </div>
        </div>
    );
}
