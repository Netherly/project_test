import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import '../../styles/CurrencyRates.css';

const API_BASE_URL = '/api';

const fetchRates = async () => {
    try {
        console.log('API: Запрос истории курсов...');
        return [];
    } catch (error) {
        console.error('Не удалось загрузить курсы:', error);
        return [];
    }
};

const saveRate = async (latestRate) => {
    try {
        console.log('API: Сохранение курса:', latestRate);
    } catch (error) {
        console.error('Не удалось сохранить курс:', error);
        throw error;
    }
};

const getPureDateTimestamp = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

const CurrencyRates = () => {
    const [rates, setRates] = useState([]);
    const [initialRates, setInitialRates] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    
    const calculateRates = useCallback((usdToUahValue, rubToUahValue) => {
        const uahRate = 1;
        const usdRate = parseFloat(usdToUahValue) || 0;
        const rubRate = parseFloat(rubToUahValue) || 0;
        const usdtRate = usdRate;

        const usdToRubRate = rubRate !== 0 ? usdRate / rubRate : 0;
        
        return {
            UAH: uahRate, USD: usdRate, RUB: rubRate, USDT: usdtRate,
            UAH_RUB: rubRate !== 0 ? uahRate / rubRate : 0,
            UAH_USD: usdRate !== 0 ? uahRate / usdRate : 0,
            UAH_USDT: usdtRate !== 0 ? uahRate / usdtRate : 0,
            USD_UAH: usdRate,
            USD_RUB: usdToRubRate, 
            USD_USDT: usdtRate !== 0 ? usdRate / usdtRate : 0,
            USDT_UAH: usdtRate,
            USDT_USD: usdRate !== 0 ? usdtRate / usdRate : 0,
            USDT_RUB: usdToRubRate,
            RUB_UAH: rubRate,
            RUB_USD: usdToRubRate !== 0 ? 1 / usdToRubRate : 0,
            RUB_USDT: usdToRubRate !== 0 ? 1 / usdToRubRate : 0,
        };
    }, []);

    const addNewDayEntryIfNecessary = useCallback((prevRates) => {
        const todayTimestamp = getPureDateTimestamp(new Date());
        const latestEntry = prevRates.length > 0 ? prevRates[0] : null;
        const isTodayEntryPresent = latestEntry && getPureDateTimestamp(latestEntry.date) === todayTimestamp;

        if (isTodayEntryPresent) {
            return prevRates;
        }
        
        const DEFAULT_RATES = { USD_TO_UAH: 41.7, RUB_TO_UAH: 0.52 };
        const initialUSD = latestEntry ? latestEntry.USD : DEFAULT_RATES.USD_TO_UAH;
        const initialRUB = latestEntry ? latestEntry.RUB : DEFAULT_RATES.RUB_TO_UAH;

        const newRow = {
            id: Date.now(),
            date: todayTimestamp,
            USD: initialUSD,
            RUB: initialRUB,
        };
        const calculatedRow = calculateRates(newRow.USD, newRow.RUB);
        return [{ ...newRow, ...calculatedRow }, ...prevRates];

    }, [calculateRates]);

    useEffect(() => {
        const loadRates = async () => {
            const fetchedRates = await fetchRates();
            const initialData = fetchedRates.map(row => ({
                ...row,
                id: row.id || Date.now() + Math.random(),
                date: getPureDateTimestamp(row.date)
            })).sort((a, b) => b.date - a.date);

            const fullRatesList = addNewDayEntryIfNecessary(initialData);
            setRates(fullRatesList);
            setInitialRates(fullRatesList);
        };

        loadRates();
    }, [addNewDayEntryIfNecessary]);

    const handleSave = async () => {
        if (rates.length === 0) return;
        try {
            await saveRate(rates[0]);
            setInitialRates(rates);
            setIsDirty(false);
        } catch (error) {
            alert('Не удалось сохранить данные. Попробуйте снова.');
        }
    };

    const handleCancel = () => {
        setRates(initialRates);
        setIsDirty(false);
    };

    useEffect(() => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(now.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
            setRates(prevRates => addNewDayEntryIfNecessary(prevRates));
        }, timeUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [addNewDayEntryIfNecessary]);

    useEffect(() => {
        setIsDirty(JSON.stringify(rates) !== JSON.stringify(initialRates));
    }, [rates, initialRates]);

    const handleInputChange = (e, rowIndex, currencyKey) => {
        const newValue = parseFloat(e.target.value);
        setRates(prevRates => {
            const updatedRates = [...prevRates];
            const rowToUpdate = { ...updatedRates[rowIndex] };
            rowToUpdate[currencyKey] = isNaN(newValue) ? '' : newValue;
            
            const recalculatedRow = calculateRates(
                rowToUpdate.USD,
                rowToUpdate.RUB
            );
            
            updatedRates[rowIndex] = { ...rowToUpdate, ...recalculatedRow };
            return updatedRates;
        });
    };
    
    return (
        <div className="currency-rates-page">
            <Sidebar />
            <div className="currency-rates-main-container">
                <header className="currency-rates-header-container">
                    <h2 className='currency-rates-header-title'>Курсы валют</h2>
                </header>
                <div className="currency-rates-table-container">
                    <div className="currency-rates-table-wrapper">
                        <table className="currency-rates-table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>UAH</th>
                                    <th>USD</th>
                                    <th>RUB</th>
                                    <th>USDT</th>
                                    <th>UAH:RUB</th>
                                    <th>UAH:USD</th>
                                    <th>UAH:USDT</th>
                                    <th>USD:UAH</th>
                                    <th>USD:RUB</th>
                                    <th>USD:USDT</th>
                                    <th>USDT:UAH</th>
                                    <th>USDT:USD</th>
                                    <th>USDT:RUB</th>
                                    <th>RUB:UAH</th>
                                    <th>RUB:USD</th>
                                    <th>RUB:USDT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rates.map((row, rowIndex) => (
                                    <tr key={row.id}>
                                        <td>{new Date(row.date).toLocaleDateString()}</td>
                                        <td>{row.UAH?.toFixed(3) || '1.000'}</td>
                                        <td className="currency-rates-editable-cell">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.USD || ''}
                                                onChange={(e) => handleInputChange(e, rowIndex, 'USD')}
                                                className="currency-rates-editable-input"
                                                disabled={rowIndex !== 0}
                                            />
                                        </td>
                                        <td className="currency-rates-editable-cell">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={row.RUB || ''}
                                                onChange={(e) => handleInputChange(e, rowIndex, 'RUB')}
                                                className="currency-rates-editable-input"
                                                disabled={rowIndex !== 0}
                                            />
                                        </td>
                                        <td>{row.USDT?.toFixed(3) || '0.000'}</td>
                                        <td>{row.UAH_RUB?.toFixed(3) || '0.000'}</td>
                                        <td>{row.UAH_USD?.toFixed(3) || '0.000'}</td>
                                        <td>{row.UAH_USDT?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USD_UAH?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USD_RUB?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USD_USDT?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USDT_UAH?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USDT_USD?.toFixed(3) || '0.000'}</td>
                                        <td>{row.USDT_RUB?.toFixed(3) || '0.000'}</td>
                                        <td>{row.RUB_UAH?.toFixed(3) || '0.000'}</td>
                                        <td>{row.RUB_USD?.toFixed(3) || '0.000'}</td>
                                        <td>{row.RUB_USDT?.toFixed(3) || '0.000'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isDirty && (
                    <div className="action-buttons">
                        <button type="button" className="cancel-order-btn" onClick={handleCancel}>
                            Отменить
                        </button>
                        <button type="button" className="save-order-btn" onClick={handleSave}>
                            Сохранить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrencyRates;