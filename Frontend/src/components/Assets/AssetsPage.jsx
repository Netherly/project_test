import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../../styles/AssetsPage.css";
import AddAssetForm from "./AddAssetForm";
import AssetDetailsModal from "./AssetDetailsModal";
import AssetCard from "./AssetCard";

const AssetsPage = () => {
    const defaultAssets = [
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
            turnoverEndBalance: 322.86,
            requisites: [
                { label: "Ключ к счету", value: "UA123456789012345678901234567" }
            ],
            design: 'privatbank-green',
            paymentSystem: 'Visa'
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
            turnoverEndBalance: 322.86,
            requisites: [
                { label: "Номер карты", value: "5375 **** **** 0574" },
            ],
            design: 'monobank-black',
            paymentSystem: 'Mastercard'
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
            turnoverEndBalance: 322.86,
            requisites: [
                { label: "Номер карты", value: "4444 **** **** 6881" },
            ],
            design: 'monobank-black',
            paymentSystem: 'Visa'
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
            turnoverEndBalance: 0.00,
            requisites: [
                { label: "Адрес кошелька", value: "TRC20_ADRESS_ABCDE12345" }
            ],
            design: 'bybit-white',
            paymentSystem: 'Mastercard'
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
            turnoverEndBalance: 13.46,
            requisites: [
                { label: "Binance ID", value: "BINANCE12345" }
            ],
            design: 'bybit-white',
            paymentSystem: 'Mastercard'
        },
        {
            id: "ГАТАГАТА",
            accountName: "MetaMask - USDT (TRC20)",
            currency: "USDT",
            type: "Криптовалюта",
            employee: "Unknown",
            balance: 0.00,
            balanceUAH: 0.00,
            balanceUSD: 0.00,
            balanceRUB: 0.00,
            lastEntryDate: "N/A",
            netMoneyUAH: 0.00,
            netMoneyUSD: 0.00,
            netMoneyRUB: 0.00,
            turnoverStartBalance: 0.00,
            turnoverIncoming: 0.00,
            turnoverOutgoing: 0.00,
            turnoverEndBalance: 0.00,
            requisites: [
                { label: "Адрес кошелька", value: "ANOTHER_TRC20_ADRESS_9876" }
            ],
            design: 'bybit-white',
            paymentSystem: 'Mastercard'
        }
    ];

    const [assets, setAssets] = useState(() => {
        const savedAssets = localStorage.getItem('assetsData');
        if (savedAssets) {
            try {
                return JSON.parse(savedAssets);
            } catch (e) {
                console.error("Ошибка парсинга localStorage:", e);
                return defaultAssets;
            }
        }
        return defaultAssets;
    });

    const [showAddForm, setShowAddForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        localStorage.setItem('assetsData', JSON.stringify(assets));
        console.log("Assets saved to localStorage:", assets);
    }, [assets]);

    const handleAddAsset = (newAsset) => {
        const assetWithDefaults = {
            ...newAsset,
            design: newAsset.design || 'default-design',
            paymentSystem: newAsset.paymentSystem || null
        };
        setAssets(prevAssets => [...prevAssets, assetWithDefaults]);
        setShowAddForm(false);
    };

    const handleDeleteAsset = (idToDelete) => {
        setAssets(prevAssets => prevAssets.filter(asset => asset.id !== idToDelete));
    };

    const handleDuplicateAsset = (assetToDuplicate) => {
        const newId = `${assetToDuplicate.accountName} (Копия ${Date.now()})`;
        const duplicatedAsset = {
            ...assetToDuplicate,
            id: newId,
            accountName: `${assetToDuplicate.accountName} (Копия)`,
        };
        setAssets(prevAssets => [...prevAssets, duplicatedAsset]);
    };

    const handleCopyRequisites = (e, requisites) => {
        e.stopPropagation();
        if (requisites && requisites.length > 0) {
            const requisitesText = requisites.map(req => `${req.label}: ${req.value}`).join('\n');
            navigator.clipboard.writeText(requisitesText)
                .then(() => {
                    alert('Реквизиты скопированы!');
                })
                .catch(err => {
                    console.error('Не удалось скопировать реквизиты: ', err);
                    alert('Ошибка при копировании реквизитов.');
                });
        } else {
            alert('Реквизиты отсутствуют.');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => alert('Скопировано!'))
            .catch(err => console.error('Не удалось скопировать: ', err));
    };

    const handleRowClick = (asset) => {
        setSelectedAsset(asset);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedAsset(null);
    };

    const handleSaveAsset = (assetId, newRequisites) => {
        setAssets(prevAssets => prevAssets.map(asset => 
            asset.id === assetId ? { ...asset, requisites: newRequisites } : asset
        ));
    };

    const assetsByCurrency = assets.reduce((acc, asset) => {
        if (!acc[asset.currency]) {
            acc[asset.currency] = {
                items: [],
                totalBalance: 0,
                totalBalanceUAH: 0,
                totalTurnoverStartBalance: 0,
                totalTurnoverIncoming: 0,
                totalTurnoverOutgoing: 0,
                totalTurnoverEndBalance: 0
            };
        }
        acc[asset.currency].items.push(asset);
        acc[asset.currency].totalBalance += Number(asset.balance);
        acc[asset.currency].totalBalanceUAH += Number(asset.balanceUAH);
        acc[asset.currency].totalTurnoverStartBalance += Number(asset.turnoverStartBalance);
        acc[asset.currency].totalTurnoverIncoming += Number(asset.turnoverIncoming);
        acc[asset.currency].totalTurnoverOutgoing += Number(asset.turnoverOutgoing);
        acc[asset.currency].totalTurnoverEndBalance += Number(asset.turnoverEndBalance);
        return acc;
    }, {});

    return (
        <div className="assets-page">
            <Sidebar />
            <div className="assets-page-main-container">
                <header className="assets-header-container">
                    <h1 className="assets-title">Активы</h1>
                    <div className="view-mode-buttons">
                        <button
                            className={`view-mode-button ${viewMode === 'card' ? 'active' : ''}`}
                            onClick={() => setViewMode('card')}
                            title="Карточный вид"
                        >
                            &#x25A3;
                        </button>
                        <button
                            className={`view-mode-button ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Табличный вид"
                        >
                            &#x2261;
                        </button>
                    </div>
                    <button className="add-asset-button" onClick={() => setShowAddForm(true)}>
                        ➕ Добавить актив
                    </button>
                </header>

                {viewMode === 'table' && (
                    <div className="assets-table-container">
                        <table className="assets-table assets-table-v2">
                            <thead>
                                <tr>
                                    <th rowSpan="2">Наименование актива</th>
                                    <th rowSpan="2">Валюта</th>
                                    <th rowSpan="2">Баланс</th>
                                    <th rowSpan="2">Свободный</th>
                                    <th rowSpan="2">Copy</th>
                                    <th colSpan="4" className="turnover-header">Оборот за текущий месяц</th>
                                </tr>
                                <tr>
                                    <th>Баланс на начал.</th>
                                    <th>Зачисления</th>
                                    <th>Списания</th>
                                    <th>Баланс на конец</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(assetsByCurrency).map(([currency, data], index) => (
                                    <React.Fragment key={currency}>
                                        <tr className="currency-group-header">
                                            <td colSpan="9">
                                                <span className="currency-name">{currency}</span>
                                                <span className="total-in-currency">{data.totalBalance.toFixed(2)}</span>
                                                <span className="total-from-settings">{data.totalBalanceUAH.toFixed(2)}</span>
                                                <span className="total-turnover-start">{data.totalTurnoverStartBalance.toFixed(2)}</span>
                                                <span className="total-turnover-incoming">{data.totalTurnoverIncoming.toFixed(2)}</span>
                                                <span className="total-turnover-outgoing">{data.totalTurnoverOutgoing.toFixed(2)}</span>
                                                <span className="total-turnover-end">{data.totalTurnoverEndBalance.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                        {data.items.map((asset) => (
                                            <tr key={asset.id} className="asset-row" onClick={() => handleRowClick(asset)}>
                                                <td>
                                                    <div className="account-info">
                                                        <span className="account-main-name">{asset.accountName}</span>
                                                        {asset.id !== asset.accountName && (
                                                            <span className="account-sub-id">
                                                                {asset.id.replace(asset.accountName, '').trim()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{asset.currency}</td>
                                                <td>{asset.balance.toFixed(2)}</td>
                                                <td className={Number(asset.balance) === Number(asset.turnoverEndBalance) ? 'highlight-green' : ''}>
                                                    {asset.balance.toFixed(2)}
                                                </td>
                                                <td>
                                                    <div className="copy-button-container">
                                                        <span
                                                            className="copy-button-icon"
                                                            onClick={(e) => handleCopyRequisites(e, asset.requisites)}
                                                            title="Копировать реквизиты"
                                                        ></span>
                                                    </div>
                                                </td>
                                                <td>{asset.turnoverStartBalance.toFixed(2)}</td>
                                                <td>{asset.turnoverIncoming.toFixed(2)}</td>
                                                <td>{asset.turnoverOutgoing.toFixed(2)}</td>
                                                <td>{asset.turnoverEndBalance.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {index < Object.keys(assetsByCurrency).length - 1 && (
                                            <tr className="table-section-divider">
                                                <td colSpan="9"></td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {viewMode === 'card' && (
                    <div className="assets-cards-container">
                        {Object.entries(assetsByCurrency).map(([currency, data]) => (
                            <div key={currency} className="currency-card-group">
                                <div className="currency-card-header">
                                    <span className="currency-name-card">{currency}</span>
                                    <span className="total-in-currency-сard">{data.totalBalance.toFixed(2)}</span>
                                    <span className="total-from-settings-сard">{data.totalBalanceUAH.toFixed(2)}</span>
                                </div>
                                <div className="currency-card-items">
                                    {data.items.map(asset => (
                                        <AssetCard
                                            key={asset.id}
                                            asset={asset}
                                            onCardClick={() => handleRowClick(asset)}
                                            onCopyValue={copyToClipboard}
                                            onCopyRequisites={(e) => handleCopyRequisites(e, asset.requisites)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showAddForm && (
                    <AddAssetForm onClose={() => setShowAddForm(false)} onAdd={handleAddAsset} />
                )}

                {showDetailsModal && selectedAsset && (
                    <AssetDetailsModal
                        asset={selectedAsset}
                        onClose={handleCloseDetailsModal}
                        onDelete={handleDeleteAsset}
                        onDuplicate={handleDuplicateAsset}
                        onSave={handleSaveAsset}
                    />
                )}
            </div>
        </div>
    );
};

export default AssetsPage;