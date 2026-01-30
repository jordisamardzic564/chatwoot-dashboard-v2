"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ExternalLink, ChevronDown } from 'lucide-react';
import { Order } from '../types';
import { ENDPOINTS } from '../config';

interface OrdersPanelProps {
    leadId: number;
}

export default function OrdersPanel({ leadId }: OrdersPanelProps) {
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
