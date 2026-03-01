import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import "../../styles/AssetsPage.css";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import AddAssetForm from "./AddAssetForm";
import AssetDetailsModal from "./AssetDetailsModal";
import AssetCard from "./AssetCard";
import { fetchFields, withDefaults, saveFields, serializeForSave, rid } from "../../api/fields";

import {
  fetchAssets,
  createAsset as apiCreateAsset,
  updateAsset as apiUpdateAsset,
  deleteAsset as apiDeleteAsset,
} from "../../api/assets";
import { CreditCard } from "lucide-react";
import { useTransactions } from "../../context/TransactionsContext";
import { useFields } from "../../context/FieldsContext";

const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return "0.00";
  }
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

const AssetsPage = () => {
  const navigate = useNavigate();
  const { assetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions } = useTransactions();
  const { refreshFields } = useFields();

  const defaultAssets = [];
  const [assets, setAssets] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [fields, setFields] = useState({
    generalFields: { currency: [] },
    assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
  });
  const [employees, setEmployees] = useState([]);
  const [cardSize, setCardSize] = useState("medium");

  const viewMode = searchParams.get("view") || "card";
  const setViewMode = (mode) => {
    setSearchParams({ view: mode });
  };

  const selectedAsset = useMemo(() => {
    if (!assetId || assetId === "new") return null;
    return assets.find((a) => String(a.id) === String(assetId)) || null;
  }, [assets, assetId]);

  const showAddForm = assetId === "new";
  const showDetailsModal = !!selectedAsset;

  const handleOpenAsset = (asset) => {
    navigate({
      pathname: `/assets/${asset.id}`,
      search: searchParams.toString(),
    });
  };

  const handleCloseModal = () => {
    navigate({
      pathname: "/assets",
      search: searchParams.toString(),
    });
  };

  const handleOpenAddForm = () => {
    navigate({
      pathname: "/assets/new",
      search: searchParams.toString(),
    });
  };

  useEffect(() => {
    const savedEmployees = localStorage.getItem("employees");
    if (savedEmployees) {
      try {
        const parsedEmployees = JSON.parse(savedEmployees);
        setEmployees(parsedEmployees);
      } catch (e) {
        console.error("Ошибка парсинга сотрудников из localStorage:", e);
      }
    }
  }, []);

  const loadFields = async () => {
    try {
      const rawFields = await fetchFields();
      const allFields = withDefaults(rawFields);
      setFields({
        generalFields: allFields.generalFields,
        assetsFields: allFields.assetsFields,
      });
    } catch (err) {
      console.error("Failed to load fields", err);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);


  const handleAddNewField = async (group, fieldName, newValue) => {
    try {
      const raw = await fetchFields();
      const normalized = withDefaults(raw);
      const list = normalized[group]?.[fieldName] || [];

      const exists = list.find(item => 
        item.value && item.value.toLowerCase() === newValue.toLowerCase()
      );

      if (!exists) {
        list.push({ id: rid(), value: newValue, isDeleted: false });
        normalized[group][fieldName] = list;
        const payload = serializeForSave(normalized);
        await saveFields(payload);
        
        await loadFields(); 
        if (refreshFields) await refreshFields(); 
      }
    } catch (e) {
      console.error("Ошибка при сохранении нового поля в БД:", e);
    }
  };


  useEffect(() => {
    const savedRates = localStorage.getItem("currencyRates_mock");
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
            USD_TO_USDT: latestRates.USD_USD,
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

    return currentAssets.map((asset) => {
      const assetTransactions = allTransactions.filter((t) => {
        const tAccountId = typeof t.account === "object" ? t.account.id : t.account;
        return String(tAccountId) === String(asset.id);
      });

      const totalIncoming = assetTransactions
        .filter((t) => t.operation === "Зачисление")
        .reduce((sum, t) => {
          const commission = Number(t.commission) || 0;
          return sum + (Number(t.amount) - commission);
        }, 0);

      const totalOutgoing = assetTransactions
        .filter((t) => t.operation === "Списание")
        .reduce((sum, t) => {
          const commission = Number(t.commission) || 0;
          return sum + (Number(t.amount) + commission);
        }, 0);

      const newBalance = (
        Number(asset.turnoverStartBalance) +
        totalIncoming -
        totalOutgoing
      ).toFixed(2);

      let newBalanceUAH = 0;
      if (asset.currency === baseCurrency) {
        newBalanceUAH = parseFloat(newBalance);
      } else {
        const rateKey = `${asset.currency}_TO_${baseCurrency}`;
        const rate = rates[rateKey];
        if (rate) {
          newBalanceUAH = parseFloat(newBalance) * rate;
        } else {
          newBalanceUAH = asset.balanceUAH;
        }
      }

      return {
        ...asset,
        balance: parseFloat(newBalance),
        balanceUAH: parseFloat(newBalanceUAH),
        turnoverIncoming: totalIncoming,
        turnoverOutgoing: totalOutgoing,
        turnoverEndBalance: parseFloat(newBalance),
      };
    });
  };

  useEffect(() => {
    if (assets.length > 0) {
      const updatedAssets = calculateRealBalance(assets, transactions, currencyRates);
      if (JSON.stringify(updatedAssets) !== JSON.stringify(assets)) {
        setAssets(updatedAssets);
      }
    }
  }, [transactions, currencyRates, assets.length]);

  useEffect(() => {
    localStorage.setItem("assetsData", JSON.stringify(assets));
  }, [assets]);

  const loadAssets = async () => {
    try {
      const fetchedAssets = await fetchAssets();
      if (transactions.length > 0) {
        const calculated = calculateRealBalance(fetchedAssets, transactions, currencyRates);
        setAssets(calculated);
      } else {
        setAssets(fetchedAssets);
      }
    } catch (err) {
      console.error("Failed to load assets", err);
      const savedAssets = localStorage.getItem("assetsData");
      if (savedAssets) {
        try {
          const parsedAssets = JSON.parse(savedAssets);
          setAssets(parsedAssets);
        } catch (e) {
          console.error("Ошибка парсинга assets из localStorage:", e);
          setAssets(defaultAssets);
        }
      } else {
        setAssets(defaultAssets);
      }
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleAddAsset = async (newAsset) => {
    try {
      await apiCreateAsset(newAsset);
      await loadAssets();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create asset", err);
    }
  };

  const handleDeleteAsset = async (idToDelete) => {
    try {
      await apiDeleteAsset(idToDelete);
      await loadAssets();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to delete asset", err);
      setAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== idToDelete));
      handleCloseModal();
    }
  };

  const handleDuplicateAsset = async (assetToDuplicate) => {
    try {
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
        turnoverIncoming: 0.0,
        turnoverOutgoing: 0.0,
        turnoverEndBalance: 0.0,
        requisites: (assetToDuplicate.requisites || []).map((req) => ({ ...req })),
      };
      setAssets((prevAssets) => [...prevAssets, duplicatedAsset]);
    } catch (err) {
      console.error("Failed to duplicate asset", err);
    }
  };

  const handleCopyRequisites = (e, requisites) => {
    e.stopPropagation();
    if (requisites && requisites.length > 0) {
      const requisitesText = requisites.map((req) => `${req.label}: ${req.value}`).join("\n");
      navigator.clipboard
        .writeText(requisitesText)
        .then(() => {
          alert("Реквизиты скопированы!");
        })
        .catch((err) => {
          console.error("Не удалось скопировать реквизиты: ", err);
          alert("Ошибка при копировании реквизитов.");
        });
    } else {
      alert("Реквизиты отсутствуют.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Скопировано!"))
      .catch((err) => console.error("Не удалось скопировать: ", err));
  };

  const handleRowClick = (asset) => {
    handleOpenAsset(asset);
  };

  const handleSaveAsset = async (updatedAsset) => {
    try {
      await apiUpdateAsset(updatedAsset.id, updatedAsset);
      await loadAssets();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to update asset", err);
      setAssets((prevAssets) =>
        prevAssets.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset))
      );
      handleCloseModal();
    }
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
        totalTurnoverEndBalance: 0,
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
          <h1 className="assets-title">
            <PageHeaderIcon pageName={"Активы"} />
            Активы
          </h1>

          <div className="assets-view-mode-buttons">
            <button
              className={`assets-view-mode-button ${viewMode === "card" ? "active" : ""}`}
              onClick={() => setViewMode("card")}
              title="Карточный вид"
            >
              &#x25A3;
            </button>
            <button
              className={`assets-view-mode-button ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Табличный вид"
            >
              &#x2261;
            </button>
          </div>

          {viewMode === "card" && (
            <div className="card-size-selector">
              <button
                className={`card-size-button ${cardSize === "large" ? "active" : ""}`}
                onClick={() => handleSetCardSize("large")}
              >
                <CreditCard size={25} />
              </button>
              <button
                className={`card-size-button ${cardSize === "medium" ? "active" : ""}`}
                onClick={() => handleSetCardSize("medium")}
              >
                <CreditCard size={19} />
              </button>
              <button
                className={`card-size-button ${cardSize === "small" ? "active" : ""}`}
                onClick={() => handleSetCardSize("small")}
              >
                <CreditCard size={15} />
              </button>
            </div>
          )}

          <button className="add-asset-button" onClick={handleOpenAddForm}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus-icon lucide-plus"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>{" "}
            Добавить
          </button>
        </header>

        <div className="assets-content">
          {viewMode === "table" && (
            <div className="assets-table-container">
              <table className="assets-table assets-table-v2">
                <thead>
                  <tr>
                    <th rowSpan="2">Наименование актива</th>
                    <th rowSpan="2">Валюта</th>
                    <th rowSpan="2">Баланс</th>
                    <th rowSpan="2">Свободный</th>
                    <th rowSpan="2">Рекв.</th>
                    <th rowSpan="2">Сотрудник</th>
                    <th colSpan="5" className="turnover-header">
                      Оборот за текущий месяц
                    </th>
                  </tr>
                  <tr>
                    <th>Лимит оборота</th>
                    <th>Баланс на начал.</th>
                    <th>Зачисления</th>
                    <th>Списания</th>
                    <th>Баланс на конец</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(assetsByCurrency).map(([currency, data]) => (
                    <React.Fragment key={currency}>
                      <tr className="currency-group-header">
                        <td colSpan="2">{currency}</td>
                        <td>{formatNumberWithSpaces(data.totalBalance)}</td>
                        <td>{formatNumberWithSpaces(data.totalBalanceUAH)}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>{formatNumberWithSpaces(data.totalTurnoverStartBalance)}</td>
                        <td>{formatNumberWithSpaces(data.totalTurnoverIncoming)}</td>
                        <td>{formatNumberWithSpaces(data.totalTurnoverOutgoing)}</td>
                        <td>{formatNumberWithSpaces(data.totalTurnoverEndBalance)}</td>
                      </tr>
                      {data.items.map((asset) => (
                        <tr
                          key={asset.id}
                          className="asset-row"
                          onClick={() => handleRowClick(asset)}
                        >
                          <td>
                            <div className="account-info">
                              <span className="account-main-name">{asset.accountName}</span>
                              {asset.id !== asset.accountName && (
                                <span className="account-sub-id">
                                  {String(asset.id).replace(asset.accountName, "").trim()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {typeof asset.currency === "object"
                              ? asset.currency.name
                              : asset.currency}
                          </td>
                          <td>{formatNumberWithSpaces(asset.balance)}</td>
                          <td
                            className={
                              Number(asset.balance.toFixed(2)) ===
                              Number(asset.turnoverEndBalance.toFixed(2))
                                ? "highlight-green"
                                : "highlight-red"
                            }
                          >
                            {formatNumberWithSpaces(asset.balance)}
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
                          <td>{asset.employee || "—"}</td>
                          <td>{asset.limitTurnover ? formatNumberWithSpaces(asset.limitTurnover) : ""}</td>
                          <td>{formatNumberWithSpaces(asset.turnoverStartBalance)}</td>
                          <td>{formatNumberWithSpaces(asset.turnoverIncoming)}</td>
                          <td>{formatNumberWithSpaces(asset.turnoverOutgoing)}</td>
                          <td>{formatNumberWithSpaces(asset.turnoverEndBalance)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "card" && (
            <div className={`assets-cards-container card-size-${cardSize}`}>
              {Object.entries(assetsByCurrency).map(([currency, data]) => (
                <div key={currency} className="currency-card-group">
                  <div className="currency-card-header">
                    <span className="currency-name-card">{currency}</span>
                    <span className="total-in-currency-сard">
                      {formatNumberWithSpaces(data.totalBalance)}
                    </span>
                    <span className="total-from-settings-сard">
                      {formatNumberWithSpaces(data.totalBalanceUAH)}
                    </span>
                  </div>
                  <div className="currency-card-items">
                    {data.items.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        cardDesigns={fields?.assetsFields?.cardDesigns || []}
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
            onClose={handleCloseModal}
            onAdd={handleAddAsset}
            fields={fields}
            employees={employees}
            onAddNewField={handleAddNewField} 
          />
        )}

        {showDetailsModal && selectedAsset && (
          <AssetDetailsModal
            asset={selectedAsset}
            onClose={handleCloseModal}
            onDelete={handleDeleteAsset}
            onDuplicate={handleDuplicateAsset}
            onSave={handleSaveAsset}
            fields={fields}
            employees={employees}
            onAddNewField={handleAddNewField} 
          />
        )}
      </div>
    </div>
  );
};

export default AssetsPage;