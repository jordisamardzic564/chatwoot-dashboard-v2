"use client";

import React from 'react';
import { PIPELINE_STAGES } from '../config';

interface PipelineBarProps {
    currentStageId: number | null;
    onStageSelect: (id: number) => void;
}

export default function PipelineBar({ currentStageId, onStageSelect }: PipelineBarProps) {
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
