import React, { useState, useEffect } from "react"; 
import Sidebar from "../Sidebar";
import "./AssetsPage.css";
import AddAssetForm from "./AddAssetForm";

const AssetsPage = () => {
    
    const [assets, setAssets] = useState(() => {
        const savedAssets = localStorage.getItem('assetsData');
        return savedAssets ? JSON.parse(savedAssets) : [
            
            {
                id: "ПриватБанк - Ключ к счету",
                accountName: "ПриватБанк - Ключ к счету",
                currency: "UAH",
                type: "Наличные",
                employee: "Иванов И.И.",
                balance: 322.86,
                balanceUAH: 322.86,
                balanceUSD: 0.00,
                balanceRUB: 0.00,
                lastEntryDate: "1 февр. 2025 г.",
                netMoneyUAH: 322.86,
                netMoneyUSD: 0.00,
                netMoneyRUB: 0.00,
                turnoverStartBalance: 322.86,
                turnoverIncoming: 0.00,
                turnoverOutgoing: 0.00,
                turnoverEndBalance: 322.86
            },
            {
                id: "Монобанк - Черная (V) (0574)",
                accountName: "Монобанк - Черная (V) (0574)",
                currency: "UAH",
                type: "Безналичные",
                employee: "Петров П.П.",
                balance: 322.86,
                balanceUAH: 322.86,
                balanceUSD: 0.00,
                balanceRUB: 0.00,
                lastEntryDate: "1 февр. 2025 г.",
                netMoneyUAH: 322.86,
                netMoneyUSD: 0.00,
                netMoneyRUB: 0.00,
                turnoverStartBalance: 322.86,
                turnoverIncoming: 0.00,
                turnoverOutgoing: 0.00,
                turnoverEndBalance: 322.86
            },
            {
                id: "Monobank - |V| (6881)",
                accountName: "Monobank - |V| (6881)",
                currency: "UAH",
                type: "Безналичные",
                employee: "Сидоров С.С.",
                balance: 322.86,
                balanceUAH: 322.86,
                balanceUSD: 0.00,
                balanceRUB: 0.00,
                lastEntryDate: "1 февр. 2025 г.",
                netMoneyUAH: 322.86,
                netMoneyUSD: 0.00,
                netMoneyRUB: 0.00,
                turnoverStartBalance: 322.86,
                turnoverIncoming: 0.00,
                turnoverOutgoing: 0.00,
                turnoverEndBalance: 322.86
            },
            {
                id: "MetaMask - USDT (TRC20)",
                accountName: "MetaMask - USDT (TRC20)",
                currency: "USDT",
                type: "Криптовалюта",
                employee: "Кузнецов К.К.",
                balance: 0.00,
                balanceUAH: 0.00,
                balanceUSD: 0.00,
                balanceRUB: 0.00,
                lastEntryDate: "Invalid date",
                netMoneyUAH: 0.00,
                netMoneyUSD: 0.00,
                netMoneyRUB: 0.00,
                turnoverStartBalance: 0.00,
                turnoverIncoming: 0.00,
                turnoverOutgoing: 0.00,
                turnoverEndBalance: 0.00
            },
            {
                id: "Binance - Спотовый",
                accountName: "Binance - Спотовый",
                currency: "USDT",
                type: "Криптовалюта",
                employee: "Федоров Ф.Ф.",
                balance: 13.46,
                balanceUAH: 565.44, 
                balanceUSD: 13.46, 
                balanceRUB: 0.00,
                lastEntryDate: "15 мая 2024 г.",
                netMoneyUAH: 0.00, 
                netMoneyUSD: 0.00,
                netMoneyRUB: 0.00,
                turnoverStartBalance: 13.46,
                turnoverIncoming: 0.00,
                turnoverOutgoing: 0.00,
                turnoverEndBalance: 13.46
            }
        ];
    });
    const [showAddForm, setShowAddForm] = useState(false);

    
    useEffect(() => {
        localStorage.setItem('assetsData', JSON.stringify(assets));
    }, [assets]);

    const handleAddAsset = (newAsset) => {
        setAssets(prevAssets => [...prevAssets, { 
            id: newAsset.id || Date.now().toString(), 
            ...newAsset,
            balance: 0, balanceUAH: 0, balanceUSD: 0, balanceRUB: 0,
            lastEntryDate: 'N/A', netMoneyUAH: 0, netMoneyUSD: 0, netMoneyRUB: 0,
            turnoverStartBalance: 0, turnoverIncoming: 0, turnoverOutgoing: 0, turnoverEndBalance: 0
        }]);
        setShowAddForm(false);
    };

    return (
        <div className="assets-page">
            
            <Sidebar />
            <div className="assets-page-main-container">
                <header className="assets-header-container">
                    <h1 className="assets-title">Активы</h1>
                    <button className="add-asset-button" onClick={() => setShowAddForm(true)}>
                        ➕ Добавить счет
                    </button>
                </header>

                <div className="assets-table-container">
                    <table className="assets-table">
                        <thead>
                            <tr>
                                <th>Счет</th>
                                <th>Валюта</th>
                                <th>На счету</th>
                                <th>В грн</th>
                                <th>В $</th>
                                <th>В руб</th>
                                <th>Дата последней</th>
                                <th className="net-money-header">Чистые деньги</th>
                                <th>В грн.</th>
                                <th>В $</th>
                                <th>В руб</th>
                                <th>Баланс на начал.</th>
                                <th>Сумма зашло</th>
                                <th>Сумма ушло</th>
                                <th>Баланс на конец</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset, index) => (
                                <tr key={asset.id || index}>
                                    <td>
                                        <div className="account-info">
                                            <span className="account-id">{asset.id}</span>
                                            <span className="account-name">{asset.accountName}</span>
                                        </div>
                                    </td>
                                    <td>{asset.currency}</td>
                                    <td className="editable-field">{asset.balance}</td>
                                    <td className="editable-field">{asset.balanceUAH}</td>
                                    <td className="editable-field">{asset.balanceUSD}</td>
                                    <td className="editable-field">{asset.balanceRUB}</td>
                                    <td>{asset.lastEntryDate}</td>
                                    <td></td>
                                    <td>{asset.netMoneyUAH}</td>
                                    <td>{asset.netMoneyUSD}</td>
                                    <td>{asset.netMoneyRUB}</td>
                                    <td>{asset.turnoverStartBalance}</td>
                                    <td>{asset.turnoverIncoming}</td>
                                    <td>{asset.turnoverOutgoing}</td>
                                    <td>{asset.turnoverEndBalance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddForm && (
                <AddAssetForm onClose={() => setShowAddForm(false)} onAdd={handleAddAsset} />
            )}
        </div>
    );
};

export default AssetsPage;