import React from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Store, ShoppingBag, Percent, Tag, ShieldAlert } from 'lucide-react';
import './admin.css';

export default function ShopManager() {
    const { masterData, updateData } = useStudioStore();
    const shop = masterData.constants || {};

    const handleChange = (key, val) => {
        updateData('constants', key, parseFloat(val) || 0);
    };

    return (
        <div className="editor-container no-sidebar">
            <div className="editor-main">
                <div className="editor-content">
                    <div className="content-header border-b border-yellow-900/30 pb-4">
                        <div className="flex items-center gap-3">
                            <Store size={24} className="text-yellow-500" />
                            <h2 className="font-cinzel text-2xl tracking-[0.2em] text-yellow-100">COMMERCE CONTROL</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-8">
                        <section className="editor-section">
                            <h3 className="section-title text-yellow-400"><Tag size={14}/> Price & Value Scalars</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-yellow-900/20">
                                <div className="editor-field-group">
                                    <label>Global Sell-Back Rate (%)</label>
                                    <input type="number" step="0.01" value={shop.sellBackRate} onChange={e => handleChange('sellBackRate', e.target.value)} />
                                    <p className="text-[9px] text-gray-500 mt-1 italic">Default gold return for players selling items to the Armory.</p>
                                </div>
                                <div className="editor-field-group">
                                    <label>Global Price Multiplier</label>
                                    <input type="number" step="0.1" value={shop.globalGoldMultiplier} onChange={e => handleChange('globalGoldMultiplier', e.target.value)} />
                                </div>
                            </div>
                        </section>

                        <section className="editor-section">
                            <h3 className="section-title text-red-400"><ShieldAlert size={14}/> Purchase Restrictions</h3>
                            <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-red-900/20">
                                <div className="flex items-center justify-between p-3 bg-red-900/10 rounded border border-red-900/30">
                                    <span className="text-xs text-red-200 uppercase font-bold">Enforce Level Reqs</span>
                                    <input type="checkbox" checked={true} readOnly className="accent-red-500" />
                                </div>
                                <div className="p-4 text-[10px] text-gray-500 leading-relaxed italic">
                                    Buy buttons in Armory/Arcanum UIs are automatically disabled if player level is below 'levelReq'.
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}