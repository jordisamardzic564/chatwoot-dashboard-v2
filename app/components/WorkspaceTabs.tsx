"use client";

import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    component: React.ReactNode;
}

interface WorkspaceTabsProps {
    tabs: Tab[];
}

export default function WorkspaceTabs({ tabs }: WorkspaceTabsProps) {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    const activeComponent = tabs.find(t => t.id === activeTab)?.component;

    return (
        <div className="flex flex-col h-full bg-bg-surface rounded-lg overflow-hidden border border-border-subtle/50">
            {/* Tab Header */}
            <div className="flex items-center border-b border-border-subtle bg-bg-soft">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-3 text-sm font-medium transition-colors relative
                            ${activeTab === tab.id 
                                ? 'text-text-primary bg-bg-surface' 
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-auto">
                {activeComponent}
            </div>
        </div>
    );
}
