"use client";

import React, { useState } from 'react';
import { Bot, MessageSquare, Send } from 'lucide-react';
import { Lead, ChatwootData } from '../types';
import { ENDPOINTS } from '../config';

interface ActionPanelProps {
    lead: Lead;
    cwData: ChatwootData;
    setStatus: (s: string) => void;
    onLeadUpdate: (l: Lead) => void;
}

export default function ActionPanel({ lead, cwData, setStatus, onLeadUpdate }: ActionPanelProps) {
    const [note, setNote] = useState("");
    const [aiMode, setAiMode] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);

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
        <div className="panel mt-4">
            <div className="panel-title-row">
                <div className="panel-title">AI & Acties</div>
            </div>

            <div className="actions-row mt-2">
                <button className="btn btn-ghost text-accent border-accent-soft" onClick={runAutoFill}>
                    <Bot size={16} /> AI Chat Analyse
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
                <div className="relative mt-2">
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
