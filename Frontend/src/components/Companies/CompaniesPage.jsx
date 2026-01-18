import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import CompanyModal from './CompanyModal/CompanyModal.jsx'; 
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import "../../styles/ExecutorsPage.css"; 


const getCompanies = () => {
    try {
        const saved = localStorage.getItem('companiesData'); 
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Ошибка при чтении компаний из localStorage:", error);
        return [];
    }
};

const getClients = () => {
    try {
        const saved = localStorage.getItem('clientsData');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Ошибка при чтении клиентов из localStorage:", error);
        return [];
    }
};

const getTransactions = () => {
    try {
        const saved = localStorage.getItem('transactionsData');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Ошибка при чтении транзакций из localStorage:", error);
        return [];
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const CompaniesPage = () => {
    const [companies, setCompanies] = useState(getCompanies());
    const [clients, setClients] = useState(getClients());
    const [transactions, setTransactions] = useState(getTransactions());
    const [modalCompany, setModalCompany] = useState(null); 

    useEffect(() => {
        // setCompanies(getCompanies());
        // setClients(getClients());
        // setTransactions(getTransactions());
    }, []);

    const closeModal = () => setModalCompany(null); 

    const generateId = () => 'comp_' + Date.now() + Math.random().toString(36).substring(2, 9);
    
    // --- Упрощенные функции сохранения/удаления ---
    const handleSaveCompany = (companyData) => {
        let updatedCompanies;
        if (companyData.id) {
            // Редактирование
            updatedCompanies = companies.map(c => 
                c.id === companyData.id ? { ...c, ...companyData } : c
            );
        } else {
            // Создание новой
            const newCompany = { ...companyData, id: generateId(), dateAdded: new Date().toISOString() };
            updatedCompanies = [...companies, newCompany];
        }
        setCompanies(updatedCompanies);
        localStorage.setItem('companiesData', JSON.stringify(updatedCompanies));
        closeModal();
    };
    
    const handleDeleteCompany = (companyToDelete) => {
        const updatedCompanies = companies.filter(c => c.id !== companyToDelete.id);
        setCompanies(updatedCompanies);
        localStorage.setItem('companiesData', JSON.stringify(updatedCompanies));
        closeModal();
    };
    
    // Простая обработка данных
    const processedCompanies = useMemo(() => {
        return companies;
    }, [companies]);

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
                            <button className="add-executor-button" onClick={() => setModalCompany({})}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus">
                                    <path d="M5 12h14" /><path d="M12 5v14" />
                                </svg>
                                Добавить
                            </button>
                        </div>
                    </header>
                    <div className="executors-content">
                        

                        {/* --- Таблица --- */}
                        <div className="executors-table-container">
                            <table className="executors-table">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Телефон</th>
                                        <th>Email</th>
                                        <th>Дата добавления</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="table-spacer-row"><td colSpan={4}></td></tr>
                                    {processedCompanies.map((company) => (
                                        <tr key={company.id} className="executor-row" onClick={() => setModalCompany(company)}>
                                            <td>{company.name || '-'}</td>
                                            <td>{company.phone || '-'}</td>
                                            <td>{company.email || '-'}</td>
                                            <td>{formatDate(company.dateAdded) || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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