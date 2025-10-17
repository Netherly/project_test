import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import './RequisitesTab.css'; 
import { X, Plus } from 'lucide-react';


const CURRENCIES = ['UAH', 'USD', 'EUR', 'USDT'];

export default function RequisitesTab() {
    const { control } = useFormContext();
    const fieldArrayName = 'requisites'; 

    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldArrayName,
    });

    
    const handleTextareaAutoResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <div className="tab-section">
            <div className="requisites-table">
                
                <div className="requisites-row header-row">
                    <div className="requisites-cell">Валюта</div>
                    <div className="requisites-cell">Банк</div>
                    <div className="requisites-cell">Номер карты</div>
                    <div className="requisites-cell">Владелец</div>
                    <div className="requisites-cell action-cell"></div> 
                </div>
                
                
                {fields.map((item, index) => (
                    <div key={item.id} className="requisites-row">
                        <div className="requisites-cell">
                            <Controller
                                name={`${fieldArrayName}[${index}].currency`}
                                control={control}
                                defaultValue={item.currency || 'UAH'}
                                render={({ field }) => (
                                    <select {...field} className="requisite-input">
                                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            />
                        </div>

                      
                        <div className="requisites-cell">
                            <Controller
                                name={`${fieldArrayName}[${index}].bank`}
                                control={control}
                                defaultValue={item.bank || ''}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        placeholder="Банк"
                                        className="requisite-input"
                                        onInput={handleTextareaAutoResize}
                                        rows={1}
                                    />
                                )}
                            />
                        </div>

                        
                        <div className="requisites-cell">
                            <Controller
                                name={`${fieldArrayName}[${index}].card`}
                                control={control}
                                defaultValue={item.card || ''}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        placeholder="Номер карты"
                                        className="requisite-input"
                                        onInput={handleTextareaAutoResize}
                                        rows={1}
                                    />
                                )}
                            />
                        </div>

                        
                        <div className="requisites-cell">
                             <Controller
                                name={`${fieldArrayName}[${index}].owner`}
                                control={control}
                                defaultValue={item.owner || ''}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        placeholder="Владелец"
                                        className="requisite-input"
                                        onInput={handleTextareaAutoResize}
                                        rows={1}
                                    />
                                )}
                            />
                        </div>

                        
                        <div className="requisites-cell action-cell">
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => remove(index)}
                                title="Удалить реквизит"
                            >
                                <X size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                type="button" 
                className="add-btn" 
                onClick={() => append({ currency: 'UAH', bank: '', card: '', owner: '' })}>
                <Plus size={16} /> Добавить реквизит
            </button>
        </div>
    );
}