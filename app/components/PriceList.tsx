import React from 'react';

export default function PriceList() {
    return (
        <div className="flex flex-col h-full bg-bg-surface p-4 overflow-y-auto">
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
    );
}
