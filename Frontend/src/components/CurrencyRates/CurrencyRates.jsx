import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import './CurrencyRates.css';

const CurrencyRates = () => {
  const [rates, setRates] = useState([]);
  const [initialRates, setInitialRates] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  };

  const calculateRates = (usdToUah, rubToUah, usdtToUah) => {
    const C4 = 1;
    const D4 = parseFloat(usdToUah) || 0;
    const E4 = parseFloat(rubToUah) || 0;
    const F4 = parseFloat(usdtToUah) || 0;

    const UAH_RUB_CALC = E4 !== 0 ? C4 / E4 : 0;
    const UAH_USD = D4 !== 0 ? C4 / D4 : 0;
    const UAH_USDT = F4 !== 0 ? C4 / F4 : 0;

    const USD_UAH = C4 !== 0 ? D4 / C4 : 0;
    const USD_RUB = 16.0004;
    const USD_USDT = F4 !== 0 ? D4 / F4 : 0;

    const USDT_UAH = C4 !== 0 ? F4 / C4 : 0;
    const USDT_USD = D4 !== 0 ? F4 / D4 : 0;
    const USDT_RUB = USD_RUB;

    const RUB_UAH = C4 !== 0 ? E4 / C4 : 0;
    const RUB_USD = USD_RUB !== 0 ? 1 / USD_RUB : 0;
    const RUB_USDT = USDT_RUB !== 0 ? 1 / USDT_RUB : 0;

    return {
      UAH: C4,
      USD: D4,
      RUB: E4,
      USDT: F4,
      UAH_RUB: RUB_UAH,
      UAH_USD: UAH_USD,
      UAH_USDT: UAH_USDT,
      USD_UAH: USD_UAH,
      USD_RUB: USD_RUB,
      USD_USDT: USD_USDT,
      USDT_UAH: USDT_UAH,
      USDT_USD: USDT_USD,
      USDT_RUB: USDT_RUB,
      RUB_UAH: RUB_UAH,
      RUB_USD: RUB_USD,
      RUB_USDT: RUB_USDT,
    };
  };

  const addOrUpdateTodayRow = useCallback(() => {
    setRates(prevRates => {
      const todayTimestamp = getTodayDate();
      const existingTodayRowIndex = prevRates.findIndex(row =>
        new Date(row.date).setHours(0,0,0,0) === todayTimestamp
      );

      let updatedPrevRates = [...prevRates];

      if (existingTodayRowIndex !== -1) {
        const existingTodayRow = updatedPrevRates[existingTodayRowIndex];
        const currentUSD = existingTodayRow.USD;
        const currentRUB = existingTodayRow.RUB;
        const currentUSDT = currentUSD;
        const updatedRow = calculateRates(currentUSD, currentRUB, currentUSDT);
        updatedPrevRates[existingTodayRowIndex] = { ...existingTodayRow, ...updatedRow };
      } else {
        const lastKnownRow = prevRates.length > 0 ? prevRates[0] : null;

        const initialUSD = lastKnownRow ? lastKnownRow.USD : 8.0002;
        const initialRUB = lastKnownRow ? lastKnownRow.RUB : 0.5000;
        const initialUSDT = initialUSD;

        const newRow = {
          id: Date.now(),
          date: todayTimestamp,
          UAH: 1,
          USD: initialUSD,
          RUB: initialRUB,
          USDT: initialUSDT,
        };
        const calculatedRow = calculateRates(newRow.USD, newRow.RUB, newRow.USDT);
        updatedPrevRates = [{ ...newRow, ...calculatedRow }, ...prevRates];
      }
      return updatedPrevRates;
    });
  }, []);

  useEffect(() => {
    const savedRates = localStorage.getItem('currencyRates');
    if (savedRates) {
      const parsedRates = JSON.parse(savedRates).map(row => ({
        ...row,
        id: row.id || Date.now() + Math.random(),
      }));
      setRates(parsedRates);
      setInitialRates(parsedRates);
    } else {
      addOrUpdateTodayRow();
    }
  }, [addOrUpdateTodayRow]);

  useEffect(() => {
    localStorage.setItem('currencyRates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      addOrUpdateTodayRow();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [addOrUpdateTodayRow]);

  useEffect(() => {
    setIsDirty(JSON.stringify(rates) !== JSON.stringify(initialRates));
  }, [rates, initialRates]);

  const handleInputChange = (e, rowIndex, currencyKey) => {
    const newValue = parseFloat(e.target.value);
    setRates(prevRates => {
      const updatedRates = [...prevRates];
      const rowToUpdate = { ...updatedRates[rowIndex] };

      rowToUpdate[currencyKey] = newValue;

      if (currencyKey === 'USD') {
        rowToUpdate.USDT = newValue;
      }

      const recalculatedRow = calculateRates(
        rowToUpdate.USD,
        rowToUpdate.RUB,
        rowToUpdate.USDT
      );

      updatedRates[rowIndex] = { ...rowToUpdate, ...recalculatedRow };
      return updatedRates;
    });
  };

  const handleSave = () => {
    setInitialRates(rates);
    setIsDirty(false);
  };

  const handleCancel = () => {
    setRates(initialRates);
    setIsDirty(false);
  };

  return (
    <div className="currency-rates-page">
      <Sidebar />
      <div className="currency-rates-main-container">
        <h2>Курсы валют</h2>
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
                                <td>{row.UAH.toFixed(4)}</td>
                                <td className="currency-rates-editable-cell">
                                    <input
                                    type="number"
                                    step="0.01"
                                    value={row.USD.toFixed(2)}
                                    onChange={(e) => handleInputChange(e, rowIndex, 'USD')}
                                    className="currency-rates-editable-input"
                                    />
                                </td>
                                <td className="currency-rates-editable-cell">
                                    <input
                                    type="number"
                                    step="0.01"
                                    value={row.RUB.toFixed(2)}
                                    onChange={(e) => handleInputChange(e, rowIndex, 'RUB')}
                                    className="currency-rates-editable-input"
                                    />
                                </td>
                                <td>{row.USDT.toFixed(4)}</td>
                                <td>{row.UAH_RUB.toFixed(4)}</td>
                                <td>{row.UAH_USD.toFixed(4)}</td>
                                <td>{row.UAH_USDT.toFixed(4)}</td>
                                <td>{row.USD_UAH.toFixed(4)}</td>
                                <td>{row.USD_RUB.toFixed(4)}</td>
                                <td>{row.USD_USDT.toFixed(4)}</td>
                                <td>{row.USDT_UAH.toFixed(4)}</td>
                                <td>{row.USDT_USD.toFixed(4)}</td>
                                <td>{row.USDT_RUB.toFixed(4)}</td>
                                <td>{row.RUB_UAH.toFixed(4)}</td>
                                <td>{row.RUB_USD.toFixed(4)}</td>
                                <td>{row.RUB_USDT.toFixed(4)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {isDirty && (
          <div className="action-buttons">
            <button
              type="button"
              className="cancel-order-btn"
              onClick={handleCancel}
            >
              Отменить
            </button>
            <button
              type="button"
              className="save-order-btn"
              onClick={handleSave}
            >
              Сохранить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyRates;