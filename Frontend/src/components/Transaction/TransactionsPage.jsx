import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import AddTransactionModal from "./AddTransactionModal";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import ViewEditTransactionModal from "./ViewEditTransactionModal";
import MultiSelectCheckboxDropdown from "../../components/Journal/MultiSelectCheckboxDropdown.jsx";
import "../../styles/TransactionsPage.css";
import "../../components/Journal/JournalPage.css";
import { useTransactions } from "../../context/TransactionsContext";


import { fetchFields, saveFields, withDefaults, serializeForSave, rid } from "../../api/fields";
import { useFields } from "../../context/FieldsContext";

const defaultFilterData = {
  searchGlobal: "",
  searchCategory: [],
  searchSubcategory: [],
  searchAccount: [],
  searchCurrency: [],
  searchOperation: [],
  searchCounterparty: [],
};

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { refreshFields } = useFields();

  const {
    transactions,
    assets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    orders,
    counterparties,
    refreshAll 
  } = useTransactions();

  
  const [localFinanceFields, setLocalFinanceFields] = useState({ articles: [], subarticles: [], subcategory: [] });

 
  const loadFields = async () => {
    try {
        const raw = await fetchFields();
        const norm = withDefaults(raw);
        setLocalFinanceFields(norm.financeFields || { articles: [], subarticles: [], subcategory: [] });
    } catch (e) {
        console.error("Ошибка загрузки полей финансов:", e);
    }
  };

  
  useEffect(() => {
    if (refreshAll) refreshAll();
    loadFields(); 
  }, []);

  
  const handleAddNewField = async (group, fieldName, newValue, extraData = {}) => {
    try {
        const raw = await fetchFields();
        const normalized = withDefaults(raw);
        const list = normalized[group]?.[fieldName] || [];

        let exists = false;
        let newItem = { id: rid(), isDeleted: false };

        if (fieldName === "articles") {
            exists = list.find(item => item.articleValue && item.articleValue.toLowerCase() === newValue.toLowerCase());
            newItem.articleValue = newValue;
        } else if (fieldName === "subarticles") {
            exists = list.find(item => 
                item.subarticleValue && item.subarticleValue.toLowerCase() === newValue.toLowerCase() &&
                item.subarticleInterval === extraData.subarticleInterval
            );
            newItem.subarticleInterval = extraData.subarticleInterval;
            newItem.subarticleValue = newValue;
        }

        if (!exists) {
            list.push(newItem);
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
  // -----------------------------------------------------

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const searchContainerRef = useRef(null);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);

  const parseFiltersFromURL = (params) => {
    const filters = { ...defaultFilterData };
    Object.keys(defaultFilterData).forEach((key) => {
      const value = params.get(key);
      if (value) {
        if (key === "searchGlobal") {
          filters[key] = value;
        } else {
          filters[key] = value.split(",");
        }
      }
    });
    return filters;
  };

  const [filterData, setFilterData] = useState(() => parseFiltersFromURL(searchParams));
  const [tempFilterData, setTempFilterData] = useState(() => parseFiltersFromURL(searchParams));

  useEffect(() => {
    const filtersFromUrl = parseFiltersFromURL(searchParams);
    if (JSON.stringify(filtersFromUrl) !== JSON.stringify(filterData)) {
      setFilterData(filtersFromUrl);
      setTempFilterData(filtersFromUrl);
    }
  }, [searchParams]);

  const formatNumberWithSpaces = (num) => {
    if (num === null || num === undefined || isNaN(Number(num))) {
      return "0.00";
    }
    const fixedNum = Number(num).toFixed(2);
    const parts = fixedNum.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text || "")
      .then(() => alert("Скопировано!"))
      .catch((err) => console.error("Не удалось скопировать: ", err));
  };

  const transactionsWithBalances = useMemo(() => {
    if (!assets || assets.length === 0) {
      return transactions.map((t) => ({ ...t, balanceBefore: 0, balanceAfter: 0 }));
    }

    const runningBalances = new Map();
    assets.forEach((asset) => {
      if (asset.id) runningBalances.set(asset.id, Number(asset.balance) || 0);
      if (asset.accountName) runningBalances.set(asset.accountName, Number(asset.balance) || 0);
    });

    const sortedTransactions = [...transactions];
    sortedTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) return dateB - dateA;
      if (a.operation === "Зачисление" && b.operation !== "Зачисление") return -1;
      if (a.operation !== "Зачисление" && b.operation === "Зачисление") return 1;
      return 0;
    });

    return sortedTransactions.map((transaction) => {
      const accountId =
        transaction.accountId ||
        transaction.account?.id ||
        (typeof transaction.account === "string" ? transaction.account : null);
      const accountName =
        transaction.accountName ||
        transaction.account?.accountName ||
        (typeof transaction.account === "string" ? transaction.account : "");

      const amount = Number(transaction.amount) || 0;
      const commission = Number(transaction.commission) || 0;
      const netDelta =
        transaction.operation === "Зачисление" ? amount - commission : amount + commission;

      const balanceKey = accountId || accountName;
      const balanceAfter = runningBalances.get(balanceKey) ?? 0;
      const balanceBefore =
        transaction.operation === "Зачисление"
          ? balanceAfter - netDelta
          : balanceAfter + netDelta;

      if (balanceKey) runningBalances.set(balanceKey, balanceBefore);
      if (accountName && !runningBalances.has(accountName)) {
        runningBalances.set(accountName, balanceBefore);
      }

      return {
        ...transaction,
        accountId,
        accountName,
        balanceBefore,
        balanceAfter,
      };
    });
  }, [transactions, assets]);

 
  const uniqueCategories = useMemo(() => {
    return localFinanceFields?.articles?.map((a) => a.articleValue).filter(Boolean) || [];
  }, [localFinanceFields]);

  const uniqueSubcategories = useMemo(() => {
    return localFinanceFields?.subarticles?.map((s) => s.subarticleValue).filter(Boolean) || [];
  }, [localFinanceFields]);

  const uniqueAccounts = useMemo(() => {
    return assets?.map((a) => a.accountName).filter(Boolean) || [];
  }, [assets]);

  const uniqueCurrencies = useMemo(() => {
    const curs = assets
      ?.map((a) => (typeof a.currency === "object" ? a.currency.name : a.currency))
      .filter(Boolean);
    return [...new Set(curs)];
  }, [assets]);

  const uniqueOperations = ["Зачисление", "Списание"];

  const uniqueCounterparties = useMemo(() => {
    return counterparties?.map((c) => c.name).filter(Boolean) || [];
  }, [counterparties]);

  const applyFilters = () => {
    const {
      searchGlobal,
      searchCategory,
      searchSubcategory,
      searchAccount,
      searchCurrency,
      searchOperation,
      searchCounterparty,
    } = filterData;

    const filtered = transactionsWithBalances.filter((t) => {
      let matchesGlobal = true;
      if (searchGlobal) {
        const searchLower = searchGlobal.toLowerCase();
        const accountName = t.accountName || t.account?.accountName || t.account || "";
        matchesGlobal =
          String(t.description || "").toLowerCase().includes(searchLower) ||
          String(t.category || "").toLowerCase().includes(searchLower) ||
          String(t.subcategory || "").toLowerCase().includes(searchLower) ||
          String(accountName).toLowerCase().includes(searchLower) ||
          String(t.counterparty || "").toLowerCase().includes(searchLower) ||
          String(t.amount || "").includes(searchLower);
      }

      const matchesCategory = searchCategory.length === 0 || searchCategory.includes(t.category);
      const matchesSubcategory =
        searchSubcategory.length === 0 || searchSubcategory.includes(t.subcategory);
      const matchesAccount =
        searchAccount.length === 0 || searchAccount.includes(t.accountName);
      const matchesCurrency =
        searchCurrency.length === 0 || searchCurrency.includes(t.accountCurrency);
      const matchesOperation =
        searchOperation.length === 0 || searchOperation.includes(t.operation);
      const matchesCounterparty =
        searchCounterparty.length === 0 || searchCounterparty.includes(t.counterparty);

      return (
        matchesGlobal &&
        matchesCategory &&
        matchesSubcategory &&
        matchesAccount &&
        matchesCurrency &&
        matchesOperation &&
        matchesCounterparty
      );
    });

    setDisplayedTransactions(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filterData, transactionsWithBalances]);

  const updateURLWithFilters = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      } else if (!Array.isArray(value) && value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilterData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleGlobalSearchChange = (e) => {
    const value = e.target.value;
    const newFilters = { ...filterData, searchGlobal: value };
    updateURLWithFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const mergedFilters = { ...tempFilterData, searchGlobal: filterData.searchGlobal };
    updateURLWithFilters(mergedFilters);
    setShowAdvancedSearch(false);
  };

  const handleCancelFilters = () => {
    setTempFilterData(filterData);
    setShowAdvancedSearch(false);
  };

  const handleResetSearch = () => {
    setSearchParams({});
  };

  const activeFiltersCount = Object.entries(filterData).filter(([key, value]) => {
    if (key === "searchGlobal") return false;
    return Array.isArray(value) ? value.length > 0 : value !== "";
  }).length;

  const mainSearchPlaceholder =
    activeFiltersCount > 0
      ? `Активно ${activeFiltersCount} фильтров...`
      : "Поиск (описание, сумма, счет...)";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!event.target.classList.contains("journal-main-search-input")) {
          setShowAdvancedSearch(false);
        }
      }
    };
    if (showAdvancedSearch) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdvancedSearch]);

  const selectedTransaction = useMemo(() => {
    if (!transactionId || transactionId === "new") return null;
    return (
      transactionsWithBalances.find((t) => String(t.id) === String(transactionId)) || null
    );
  }, [transactionsWithBalances, transactionId]);

  const isAddMode = transactionId === "new";

  const handleOpenTransaction = (transaction) => {
    navigate(`/list/${transaction.id}`);
  };

  const handleOpenAddModal = () => {
    navigate("/list/new");
  };

  const handleCloseModal = () => {
    navigate("/list");
  };

  const handleAddTransaction = async (data) => {
    await addTransaction(data);
    handleCloseModal();
  };

  const handleUpdateTransaction = async (data) => {
    await updateTransaction(data);
    handleCloseModal();
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransaction(id);
    handleCloseModal();
  };

  const handleDuplicateTransaction = async (id) => {
    await duplicateTransaction(id);
    handleCloseModal();
  };

  return (
    <div className="transactions-page">
      <Sidebar />
      <div className="transactions-page-main-container">
        <header className="transactions-header-container">
          <PageHeaderIcon pageName="Транзакции" />
          <h1 className="transactions-title">Транзакции</h1>

          <div className="journal-search-container" ref={searchContainerRef}>
            <div className="journal-main-search-bar">
              <span className="journal-search-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={mainSearchPlaceholder}
                className="journal-main-search-input"
                value={filterData.searchGlobal}
                onChange={handleGlobalSearchChange}
                onClick={() => {
                  if (!showAdvancedSearch) setShowAdvancedSearch(true);
                }}
              />
              <span
                className="journal-toggle-advanced-search"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                {showAdvancedSearch ? "▲" : "▼"}
              </span>
            </div>

            {showAdvancedSearch && (
              <div className="journal-advanced-search-fields">
                <MultiSelectCheckboxDropdown
                  label="Статья"
                  name="searchCategory"
                  options={uniqueCategories}
                  selectedValues={tempFilterData.searchCategory}
                  onChange={handleFilterChange}
                  placeholder="Выберите статью"
                />

                <MultiSelectCheckboxDropdown
                  label="Подстатья"
                  name="searchSubcategory"
                  options={uniqueSubcategories}
                  selectedValues={tempFilterData.searchSubcategory}
                  onChange={handleFilterChange}
                  placeholder="Выберите подстатью"
                />

                <MultiSelectCheckboxDropdown
                  label="Счет"
                  name="searchAccount"
                  options={uniqueAccounts}
                  selectedValues={tempFilterData.searchAccount}
                  onChange={handleFilterChange}
                  placeholder="Выберите счет"
                />

                <MultiSelectCheckboxDropdown
                  label="Валюта"
                  name="searchCurrency"
                  options={uniqueCurrencies}
                  selectedValues={tempFilterData.searchCurrency}
                  onChange={handleFilterChange}
                  placeholder="Выберите валюту"
                />

                <MultiSelectCheckboxDropdown
                  label="Операция"
                  name="searchOperation"
                  options={uniqueOperations}
                  selectedValues={tempFilterData.searchOperation}
                  onChange={handleFilterChange}
                  placeholder="Выберите операцию"
                />

                <MultiSelectCheckboxDropdown
                  label="Контрагент"
                  name="searchCounterparty"
                  options={uniqueCounterparties}
                  selectedValues={tempFilterData.searchCounterparty}
                  onChange={handleFilterChange}
                  placeholder="Выберите контрагента"
                />

                <div className="journal-search-buttons">
                  <button type="button" className="journal-reset-button" onClick={handleResetSearch}>
                    Сбросить
                  </button>
                  <button type="button" className="journal-cancel-button" onClick={handleCancelFilters}>
                    Отмена
                  </button>
                  <button type="button" className="journal-search-button" onClick={handleApplyFilters}>
                    Фильтровать
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="add-transaction-wrapper">
            <button className="add-transaction-button" onClick={handleOpenAddModal}>
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
          </div>
        </header>

        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Статья</th>
                <th>Подстатья</th>
                <th>Описание</th>
                <th>Счет</th>
                <th>Валюта</th>
                <th>Баланс до</th>
                <th>Операция</th>
                <th>Сумма</th>
                <th>Баланс после</th>
                <th>Контрагент</th>
                <th>Рекв.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-spacer-row">
                <td colSpan={12}></td>
              </tr>
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transaction-row"
                    onClick={() => handleOpenTransaction(transaction)}
                  >
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.category}</td>
                    <td>{transaction.subcategory}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <div className="transaction-account-info">
                        <span className="transaction-account-main-name">
                          {transaction.accountName || transaction.account?.accountName || transaction.account}
                        </span>
                      </div>
                    </td>
                    <td>{transaction.accountCurrency}</td>
                    <td>{formatNumberWithSpaces(transaction.balanceBefore)}</td>
                    <td>{transaction.operation}</td>
                    <td
                      className={
                        transaction.operation === "Зачисление"
                          ? "amount-positive"
                          : "amount-negative"
                      }
                    >
                      {formatNumberWithSpaces(transaction.amount)}
                    </td>
                    <td>{formatNumberWithSpaces(transaction.balanceAfter)}</td>
                    <td>{transaction.counterparty}</td>
                    <td>
                      <div className="copy-button-container">
                        <span
                          className="copy-button-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.counterpartyRequisites);
                          }}
                          title="Копировать реквизиты"
                        ></span>
                        {transaction.counterpartyRequisites}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "20px", color: "#8b95a5" }}>
                    Транзакции не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddMode && (
        <AddTransactionModal
          onAdd={handleAddTransaction}
          onClose={handleCloseModal}
          assets={assets}
          financeFields={localFinanceFields}
          orders={orders}
          counterparties={counterparties}
          onAddNewField={handleAddNewField}
        />
      )}

      {selectedTransaction && (
        <ViewEditTransactionModal
          transaction={selectedTransaction}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
          onDuplicate={handleDuplicateTransaction}
          onClose={handleCloseModal}
          assets={assets}
          financeFields={localFinanceFields}
          orders={orders}
          counterparties={counterparties}
          onAddNewField={handleAddNewField}
        />
      )}
    </div>
  );
};

export default TransactionsPage;