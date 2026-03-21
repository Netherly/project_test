import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import "../../styles/AssetsPage.css";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import AddAssetForm from "./AddAssetForm";
import AssetDetailsModal from "./AssetDetailsModal";
import AssetCard from "./AssetCard";
import { addFieldOption, fetchFields, withDefaults } from "../../api/fields";
import {
  fetchAssets,
  createAsset as apiCreateAsset,
  updateAsset as apiUpdateAsset,
  deleteAsset as apiDeleteAsset,
} from "../../api/assets";
import { fetchLatestRatesSnapshot } from "../../api/rates";
import { CreditCard } from "lucide-react";
import { useTransactions } from "../../context/TransactionsContext";
import {
  CACHE_TTL,
  RESOURCE_CACHE_EVENT,
  hasDataChanged,
  readCacheSnapshot,
  readCachedValue,
  writeCachedValue,
} from "../../utils/resourceCache";
import {
  convertAmountByRates,
  normalizeCurrencyCode,
  readLatestRatesSnapshot,
  writeLatestRatesSnapshot,
} from "../../utils/exchangeRates";
import { rid } from "../../utils/rid";

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
  const { accountId: assetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions } = useTransactions();

  const defaultAssets = [];
  const [assets, setAssets] = useState(
    () => readCacheSnapshot("assetsData", { fallback: [] }).data || []
  );
  const [currencyRates, setCurrencyRates] = useState(() => readLatestRatesSnapshot() || {});
  const [fields, setFields] = useState(() => {
    const cachedFields = readCachedValue("fieldsData", null);

    if (!cachedFields) {
      return {
        generalFields: { currency: [] },
        assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
      };
    }

    try {
      const allFields = withDefaults(cachedFields);
      return {
        generalFields: allFields.generalFields,
        assetsFields: allFields.assetsFields,
      };
    } catch (_) {
      return {
        generalFields: { currency: [] },
        assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
      };
    }
  });

  const [employees, setEmployees] = useState([]);
  const [cardSize, setCardSize] = useState("medium");
  const cacheWriteStateRef = useRef({ assets: false });

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
      pathname: `/accounts/${asset.id}`,
      search: searchParams.toString(),
    });
  };

  const handleCloseModal = () => {
    navigate({
      pathname: "/accounts",
      search: searchParams.toString(),
    });
  };

  const handleOpenAddForm = () => {
    navigate({
      pathname: "/accounts/new",
      search: searchParams.toString(),
    });
  };

  useEffect(() => {
    const cachedEmployees = readCachedValue("employees", []);
    setEmployees(Array.isArray(cachedEmployees) ? cachedEmployees : []);
  }, []);

  const loadFields = async () => {
    try {
      const rawFields = await fetchFields();
      const allFields = withDefaults(rawFields);

      writeCachedValue("fieldsData", rawFields);

      setFields({
        generalFields: allFields.generalFields,
        assetsFields: allFields.assetsFields,
      });
    } catch (err) {
      console.error("Failed to load fields", err);
    }
  };

  const handleAddNewField = async (group, fieldName, newValue) => {
    try {
      await addFieldOption(group, fieldName, newValue);
      await loadFields();
    } catch (e) {
      console.error("Ошибка при сохранении нового поля в БД:", e);
    }
  };

  useEffect(() => {
    const snapshot = readCacheSnapshot("fieldsData", {
      ttlMs: CACHE_TTL.fields,
    });

    if (snapshot.hasData) {
      try {
        const cachedFields = withDefaults(snapshot.data);
        setFields((prev) => {
          const next = {
            generalFields: cachedFields.generalFields,
            assetsFields: cachedFields.assetsFields,
          };
          return hasDataChanged(prev, next) ? next : prev;
        });
      } catch (_) {
      }
    }

    const handleCacheChange = (event) => {
      if (event?.detail?.key !== "fieldsData") return;
      try {
        const rawFields = event.detail.value;
        const cachedFields = withDefaults(rawFields);
        setFields((prev) => {
          const next = {
            generalFields: cachedFields.generalFields,
            assetsFields: cachedFields.assetsFields,
          };
          return hasDataChanged(prev, next) ? next : prev;
        });
      } catch (_) {}
    };

    window.addEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);

    loadFields();

    return () => {
      window.removeEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const cached = readLatestRatesSnapshot();
    if (cached) {
      setCurrencyRates((prev) => (hasDataChanged(prev, cached) ? cached : prev));
    }

    const loadLatestRates = async () => {
      try {
        const latest = await fetchLatestRatesSnapshot();
        if (!ignore && latest) {
          setCurrencyRates((prev) => (hasDataChanged(prev, latest) ? latest : prev));
          writeLatestRatesSnapshot(latest);
        }
      } catch (error) {
        console.error("Не удалось загрузить актуальные курсы валют для активов:", error);
      }
    };

    loadLatestRates();
    return () => {
      ignore = true;
    };
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

      const assetCurrency = normalizeCurrencyCode(asset.currency);
      const fallbackUah =
        Number.isFinite(Number(asset.balanceUAH)) && Number(asset.balanceUAH) !== 0
          ? Number(asset.balanceUAH)
          : parseFloat(newBalance);
      const newBalanceUAH = convertAmountByRates(
        parseFloat(newBalance),
        assetCurrency || baseCurrency,
        baseCurrency,
        rates,
        fallbackUah
      );

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

  const applyAssetsSnapshot = (incomingAssets) => {
    const safeAssets = Array.isArray(incomingAssets) ? incomingAssets : defaultAssets;
    const nextAssets =
      transactions.length > 0
        ? calculateRealBalance(safeAssets, transactions, currencyRates)
        : safeAssets;

    setAssets((prev) => (hasDataChanged(prev, nextAssets) ? nextAssets : prev));
    return nextAssets;
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
    if (!cacheWriteStateRef.current.assets) {
      cacheWriteStateRef.current.assets = true;
      return;
    }
    writeCachedValue("assetsData", assets);
  }, [assets]);

  const loadAssets = async () => {
    try {
      const fetchedAssets = await fetchAssets();
      const safeFetchedAssets = Array.isArray(fetchedAssets) ? fetchedAssets : [];
      const nextAssets = applyAssetsSnapshot(safeFetchedAssets);
      writeCachedValue("assetsData", nextAssets);
    } catch (err) {
      console.error("Failed to load assets", err);
      const cachedAssets = readCachedValue("assetsData", defaultAssets);
      applyAssetsSnapshot(cachedAssets);
    }
  };

  useEffect(() => {
    const snapshot = readCacheSnapshot("assetsData", {
      fallback: defaultAssets,
      ttlMs: CACHE_TTL.assets,
    });

    if (snapshot.hasData) {
      applyAssetsSnapshot(snapshot.data);
    }

    const handleCacheChange = (event) => {
      if (event?.detail?.key !== "assetsData") return;
      applyAssetsSnapshot(event.detail.value);
    };

    window.addEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);

    loadAssets();

    return () => {
      window.removeEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);
    };
  }, []);
  const handleAddAsset = async (newAsset) => {
    try {
      await apiCreateAsset(newAsset);
      await loadAssets();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create asset", err);
      const selectedEmployee = employees?.find((emp) => emp.id === newAsset.employeeId);
      const assetWithDefaults = {
        ...newAsset,
        id: newAsset.accountName,
        design: newAsset.design || "default-design",
        paymentSystem: newAsset.paymentSystem || null,
        turnoverStartBalance: Number(newAsset.turnoverStartBalance) || 0,
        employeeId: newAsset.employeeId || null,
        employee: newAsset.employeeName || selectedEmployee?.fullName || "",
        employeeName: newAsset.employeeName || selectedEmployee?.fullName || "",
      };
      setAssets((prevAssets) => [...prevAssets, assetWithDefaults]);
      handleCloseModal();
    }
  };

  const handleDeleteAsset = async (idToDelete) => {
    try {
      await apiDeleteAsset(idToDelete);
      await loadAssets();
    } catch (err) {
      console.error("Failed to delete asset", err);
      window.alert(err?.message || "Не удалось удалить актив");
      throw err;
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
      const requisitesText = requisites
        .map((req) => `${req.label}: ${req.value}`)
        .join("\n");

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
        prevAssets.map((asset) =>
          asset.id === updatedAsset.id ? updatedAsset : asset
        )
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
                          <td>
                            {asset.limitTurnover
                              ? formatNumberWithSpaces(asset.limitTurnover)
                              : ""}
                          </td>
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
                        onDeleteClick={() => handleDeleteAsset(asset.id)}
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
