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
        <div className="flex flex-col h-full bg-bg-surface p-4 overflow-y-auto">
            {/* 1. SELECTION SECTION */}
            <div className="mb-6 flex-1 flex flex-col min-h-0">
                {!hasVehicle || isEditingVehicle ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col h-full">
                         <div className="flex justify-between items-center mb-2 shrink-0">
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
                         <div className="flex-1 border border-border-subtle rounded-lg bg-bg-soft overflow-hidden shadow-sm min-h-0">
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
            <div className="mt-auto shrink-0">
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

            {/* 3. PRICE TABLES */}
            <div className="mt-6 shrink-0 pt-4 border-t border-border-subtle">
                <div className="text-xs uppercase text-text-secondary font-bold tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                    Prijslijst (PS)
                </div>
                
                <div className="bg-bg-soft rounded border border-border-subtle overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-elevated border-b border-border-subtle">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Inch</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary uppercase">
                                    Air <span className="text-[10px] opacity-70 block font-normal normal-case">6 weken</span>
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary uppercase">
                                    Trein <span className="text-[10px] opacity-70 block font-normal normal-case">10-12 weken</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/50">
                            {[
                                { size: 18, price: 846 },
                                { size: 19, price: 911 },
                                { size: 20, price: 951 },
                                { size: 21, price: 989 },
                                { size: 22, price: 1040 },
                                { size: 23, price: 1337 },
                                { size: 24, price: 1395 }
                            ].map((item) => (
                                <tr key={item.size} className="hover:bg-bg-elevated/50 transition-colors">
                                    <td className="px-3 py-2 text-text-primary font-medium">{item.size}"</td>
                                    <td className="px-3 py-2 text-right text-text-primary font-mono">€ {item.price}</td>
                                    <td className="px-3 py-2 text-right text-success font-mono">€ {item.price - 162.5}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-2 bg-bg-elevated/30 text-[10px] text-text-secondary text-center border-t border-border-subtle">
                        Trein levering is € 162,50 goedkoper per velg.
                    </div>
                </div>
            </div>
        </div>
    );
}
