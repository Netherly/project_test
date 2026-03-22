import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import CompanyModal from './CompanyModal/CompanyModal.jsx'; 
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import "../../styles/ExecutorsPage.css"; 

import { fetchCompanies, createCompany, updateCompany, deleteCompany } from "../../api/companies";
import { fetchClients } from "../../api/clients";
import { fetchTransactions } from "../../api/transactions";
import { buildEntityPath, matchesEntityRouteParam } from "../../utils/entityRoutes";

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const CompaniesPage = () => {
    const navigate = useNavigate();
    const { companyId } = useParams();
    const [companies, setCompanies] = useState([]);
    const [clients, setClients] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [compsData, clientsData, transData] = await Promise.all([
                fetchCompanies().catch(() => []),
                fetchClients().catch(() => []),
                fetchTransactions({ page: 1, pageSize: 1000 }).catch(() => [])
            ]);

            setCompanies(Array.isArray(compsData) ? compsData : []);
            setClients(Array.isArray(clientsData) ? clientsData : []);
            const transList = Array.isArray(transData?.items) ? transData.items : (Array.isArray(transData) ? transData : []);
            setTransactions(transList);
            
        } catch (error) {
            console.error("Ошибка при загрузке данных страницы компаний:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const closeModal = () => navigate("/company");
    const openNewCompany = () => navigate("/company/new");
    const openCompany = (company) => navigate(buildEntityPath("/company", company));
    
    const handleSaveCompany = async (companyData) => {
        try {
            if (companyData.id) {
                try {
                    const updated = await updateCompany(companyData.id, companyData);
                    setCompanies(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
                } catch (apiError) {
                    console.warn("API updateCompany не сработало, обновляем локально", apiError);
                    setCompanies(prev => prev.map(c => c.id === companyData.id ? { ...c, ...companyData } : c));
                }
            } else {
                let created = null;
                try {
                    created = await createCompany(companyData);
                    setCompanies(prev => [...prev, created]);
                } catch (apiError) {
                    console.warn("API createCompany не сработало, создаем локально", apiError);
                    created = { ...companyData, id: `mock_${Date.now()}`, dateAdded: new Date().toISOString() };
                    setCompanies(prev => [...prev, created]);
                }

                if (created?.id && created?.urlId) {
                    navigate(buildEntityPath("/company", created), { replace: true });
                }
            }
            closeModal();
        } catch (error) {
            console.error("Критическая ошибка сохранения:", error);
        }
    };
    
    const handleDeleteCompany = async (companyToDelete) => {
        try {
            try {
                await deleteCompany(companyToDelete.id);
            } catch (apiError) {
                console.warn("API deleteCompany не сработало, удаляем локально", apiError);
            }
            setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id));
            closeModal();
        } catch (error) {
            console.error("Критическая ошибка удаления:", error);
        }
    };
    
    const processedCompanies = useMemo(() => {
        return companies;
    }, [companies]);

    const modalCompany = useMemo(() => {
        if (!companyId) return null;
        if (companyId === "new") return {};
        return processedCompanies.find((company) => matchesEntityRouteParam(company, companyId)) || null;
    }, [companyId, processedCompanies]);

    const companyNotFound = Boolean(companyId && companyId !== "new" && !loading && !modalCompany);

    if (loading) {
        return (
            <div className="executors-page">
                <Sidebar />
                <div className="executors-page-main-container">
                    <div style={{ padding: '20px', color: 'white' }}>Загрузка данных...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="executors-page">
                <Sidebar />
                <div className="executors-page-main-container">
                    <header className="executors-header-container">
                        <h1 className="executors-title">
                            <PageHeaderIcon pageName={'Компании'}/>Компании
                        </h1>
                        
                        <div className="add-executor-wrapper">
                            <button className="add-executor-button" onClick={openNewCompany}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus">
                                    <path d="M5 12h14" /><path d="M12 5v14" />
                                </svg>
                                Добавить
                            </button>
                        </div>
                    </header>
                    <div className="executors-content">
                        <div className="executors-table-container">
                            <table className="executors-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "320px" }}>Название</th>
                                        <th>Телефон</th>
                                        <th>Email</th>
                                        <th>Дата добавления</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="table-spacer-row"><td colSpan={4}></td></tr>
                                    {processedCompanies.map((company) => (
                                        <tr key={company.id} className="executor-row" onClick={() => openCompany(company)}>
                                            <td style={{ width: "320px" }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {company.name || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{company.phone || '-'}</td>
                                            <td>{company.email || '-'}</td>
                                            <td>{formatDate(company.dateAdded || company.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {companyNotFound && (
                            <div style={{ padding: "16px 20px", color: "var(--text-color)", opacity: 0.8 }}>
                                Компания не найдена.
                            </div>
                        )}
                    </div>

                    {modalCompany && (
                        <CompanyModal
                            key={modalCompany.id || 'new-company'}
                            company={modalCompany.id ? modalCompany : null}
                            onSave={handleSaveCompany}
                            onDelete={handleDeleteCompany}
                            onClose={closeModal}
                            clients={clients}
                            transactions={transactions}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default CompaniesPage;
