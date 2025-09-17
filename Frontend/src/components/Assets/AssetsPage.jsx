import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../../styles/AssetsPage.css";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import AddAssetForm from "./AddAssetForm";
import AssetDetailsModal from "./AssetDetailsModal";
import AssetCard from "./AssetCard";


const getPureDateTimestamp = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

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
            turnoverIncoming: 12500.00,
            turnoverOutgoing: 12500.00,
            turnoverEndBalance: 322.86,
            requisites: [
                { label: "Ключ к счету", value: "UA123456789012345678901234567" }
            ],
            design: 'privatbank-green',
            paymentSystem: 'Visa'
        },
        {
            id: "Монобанк - Черная",
            accountName: "Монобанк Черная",
            currency: "UAH",
            type: "Безналичные",
            employee: "Петров П.П.",
            balance: 1000.00,
            balanceUAH: 1000.00,
            balanceUSD: 0.00,
            balanceRUB: 0.00,
            lastEntryDate: "1 февр. 2025 г.",
            netMoneyUAH: 1000.00,
            netMoneyUSD: 0.00,
            netMoneyRUB: 0.00,
            turnoverStartBalance: 0.00,
            turnoverIncoming: 1000.00,
            turnoverOutgoing: 0.00,
            turnoverEndBalance: 1000.00,
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
            turnoverIncoming: 150.00,
            turnoverOutgoing: 150.00,
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
        return savedAssets ? JSON.parse(savedAssets) : defaultAssets;
    });

    const [transactions, setTransactions] = useState([]);
    const [currencyRates, setCurrencyRates] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [fields, setFields] = useState({ currency: [], type: [], paymentSystem: [], cardDesigns: [] });
    const [employees, setEmployees] = useState([]);

    
    const [cardSize, setCardSize] = useState('medium');


     useEffect(() => {
        const savedEmployees = localStorage.getItem('employees');
        if (savedEmployees) {
            try {
                const parsedEmployees = JSON.parse(savedEmployees);
                setEmployees(parsedEmployees);
            } catch (e) {
                console.error("Ошибка парсинга сотрудников из localStorage:", e);
            }
        }
    }, []);


    useEffect(() => {
        const savedFields = localStorage.getItem('fieldsData');
        if (savedFields) {
            try {
                const parsedFields = JSON.parse(savedFields);
                
                if (parsedFields.assetsFields) {
                    setFields(parsedFields.assetsFields);
                }
            } catch (e) {
                console.error("Ошибка парсинга полей из localStorage:", e);
            }
        }
    }, []);
    useEffect(() => {
        const savedTransactions = localStorage.getItem('transactionsData');
        if (savedTransactions) {
            try {
                setTransactions(JSON.parse(savedTransactions));
            } catch (e) {
                console.error("Ошибка парсинга транзакций из localStorage:", e);
                setTransactions([]);
            }
        }
    }, []);

    
    useEffect(() => {
        const savedRates = localStorage.getItem('currencyRates_mock');
        if (savedRates) {
            try {
                const ratesData = JSON.parse(savedRates);
                if (ratesData.length > 0) {
                    
                    const latestRates = ratesData[0];
                    setCurrencyRates({
                        UAH_TO_USD: latestRates.UAH_USD,
                        UAH_TO_RUB: latestRates.UAH_RUB,
                        UAH_TO_USDT: latestRates.UAH_USDT,
                        USD_TO_UAH: latestRates.USD_UAH,
                        USD_TO_RUB: latestRates.USD_RUB,
                        USD_TO_USDT: latestRates.USD_USDT,
                        USDT_TO_UAH: latestRates.USDT_UAH,
                        USDT_TO_USD: latestRates.USDT_USD,
                        USDT_TO_RUB: latestRates.USDT_RUB,
                        RUB_TO_UAH: latestRates.RUB_UAH,
                        RUB_TO_USD: latestRates.RUB_USD,
                        RUB_TO_USDT: latestRates.RUB_USDT,
                    });
                }
            } catch (e) {
                console.error("Ошибка парсинга курсов валют из localStorage:", e);
                setCurrencyRates({});
            }
        }
    }, []);


    const calculateRealBalance = (currentAssets, allTransactions, rates) => {
        const baseCurrency = "UAH";

        return currentAssets.map(asset => {
            const assetTransactions = allTransactions.filter(t => t.account === asset.id);
            const totalIncoming = assetTransactions
                .filter(t => t.operation === 'Зачисление')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const totalOutgoing = assetTransactions
                .filter(t => t.operation === 'Списание')
                .reduce((sum, t) => sum + Number(t.amount), 0);


            const newBalance = (Number(asset.turnoverStartBalance) + totalIncoming - totalOutgoing).toFixed(2);

            let newBalanceUAH = 0;

            if (asset.currency === baseCurrency) {
                newBalanceUAH = parseFloat(newBalance);
            } else {
                const rateKey = `${asset.currency}_TO_${baseCurrency}`;
                const rate = rates[rateKey];
                if (rate) {
                    newBalanceUAH = parseFloat(newBalance) * rate;
                } else {
                    console.warn(`Обменный курс для ${rateKey} не найден. Используется предыдущий баланс в UAH.`);
                    newBalanceUAH = asset.balanceUAH;
                }
            }

            return {
                ...asset,
                balance: parseFloat(newBalance),
                balanceUAH: parseFloat(newBalanceUAH.toFixed(2)),
                turnoverIncoming: totalIncoming,
                turnoverOutgoing: totalOutgoing,
                turnoverEndBalance: parseFloat(newBalance)
            };
        });
    };


    useEffect(() => {
        const updatedAssets = calculateRealBalance(assets, transactions, currencyRates);
        setAssets(updatedAssets);
    }, [transactions, currencyRates]);


    useEffect(() => {
        localStorage.setItem('assetsData', JSON.stringify(assets));
    }, [assets]);

    const handleAddAsset = (newAsset) => {
        const assetWithDefaults = {
            ...newAsset,
            id: newAsset.accountName,
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
            balance: 0,
            balanceUAH: 0,
            balanceUSD: 0,
            balanceRUB: 0,
            turnoverStartBalance: 0,
            turnoverIncoming: 0.00,
            turnoverOutgoing: 0.00,
            turnoverEndBalance: 0.00,
            requisites: assetToDuplicate.requisites.map(req => ({ ...req }))
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

    const handleSaveAsset = (updatedAsset) => {
        setAssets(prevAssets => 
            prevAssets.map(asset => 
                asset.id === updatedAsset.id ? updatedAsset : asset
            )
        );
        handleCloseDetailsModal(); 
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
    
    
    const handleSetCardSize = (size) => {
        setCardSize(size);
    };

    return (
        <div className="assets-page">
            <Sidebar />
            <div className="assets-page-main-container">
                <header className="assets-header-container">
                    <h1 className="assets-title">Активы</h1>
                    
                        
                            <div className="assets-view-mode-buttons">
                                <button
                                    className={`assets-view-mode-button ${viewMode === 'card' ? 'active' : ''}`}
                                    onClick={() => setViewMode('card')}
                                    title="Карточный вид"
                                >
                                    &#x25A3;
                                </button>
                                <button
                                    className={`assets-view-mode-button ${viewMode === 'table' ? 'active' : ''}`}
                                    onClick={() => setViewMode('table')}
                                    title="Табличный вид"
                                >
                                    &#x2261;
                                </button>
                            </div>
                            {viewMode === 'card' && (
                                <div className="card-size-selector">
                                    <span>Размеры карт:</span>
                                    <button
                                        className={`card-size-button ${cardSize === 'large' ? 'active' : ''}`}
                                        onClick={() => handleSetCardSize('large')}
                                    >
                                        Крупно
                                    </button>
                                    <button
                                        className={`card-size-button ${cardSize === 'medium' ? 'active' : ''}`}
                                        onClick={() => handleSetCardSize('medium')}
                                    >
                                        Средне
                                    </button>
                                    <button
                                        className={`card-size-button ${cardSize === 'small' ? 'active' : ''}`}
                                        onClick={() => handleSetCardSize('small')}
                                    >
                                        Мелко
                                    </button>
                                </div>
                            )}
                            <button className="add-asset-button" onClick={() => setShowAddForm(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить актив
                            </button>
                </header>

            
                <div className="assets-content">
                    {viewMode === 'table' && (
                        <div className="assets-table-container">
                            <table className="assets-table assets-table-v2">
                                <thead>
                                    <tr>
                                        <th rowSpan="2">Наименование актива</th>
                                        <th rowSpan="2">Валюта</th>
                                        <th rowSpan="2">Баланс</th>
                                        <th rowSpan="2">Свободный</th>
                                        <th rowSpan="2">Реквизиты</th>
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
                                                <td colSpan="2">{currency}</td>
                                                <td>{data.totalBalance.toFixed(2)}</td>
                                                <td>{data.totalBalanceUAH.toFixed(2)}</td>
                                                <td></td>
                                                <td>{data.totalTurnoverStartBalance.toFixed(2)}</td>
                                                <td>{data.totalTurnoverIncoming.toFixed(2)}</td>
                                                <td>{data.totalTurnoverOutgoing.toFixed(2)}</td>
                                                <td>{data.totalTurnoverEndBalance.toFixed(2)}</td>
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
                                                    <td className={
                                                        Number(asset.balance.toFixed(2)) === Number(asset.turnoverEndBalance.toFixed(2)) 
                                                        ? 'highlight-green' 
                                                        : 'highlight-red'
                                                    }>
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
                        <div className={`assets-cards-container card-size-${cardSize}`}>
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
                </div>

                {showAddForm && (
                    <AddAssetForm
                        onClose={() => setShowAddForm(false)}
                        onAdd={handleAddAsset}
                        fields={fields}
                        employees={employees}
                    />
                )}

                {showDetailsModal && selectedAsset && (
                    <AssetDetailsModal
                        asset={selectedAsset}
                        onClose={handleCloseDetailsModal}
                        onDelete={handleDeleteAsset}
                        onDuplicate={handleDuplicateAsset}
                        onSave={handleSaveAsset}
                        fields={fields}
                        employees={employees}
                    />
                )}
            </div>
        </div>
    );
};

export default AssetsPage;