import React from 'react';

const CompanyFinancesTab = ({ transactions, clients, companyName }) => {
    const companyClientIds = companyName
        ? clients.filter(c => c.company === companyName).map(c => c.id)
        : [];
        
    const companyTransactions = transactions.filter(t => 
        companyClientIds.includes(t.clientId)
    );

    return (
        <div className="tab-section">
            <div className="tab-content-title">Журнал операций</div>
            <div className="finances-log-table">
                <div className="finances-log-row header-row">
                    <div className="finances-log-content-wrapper">
                        <div className="finances-log-cell">Дата</div>
                        <div className="finances-log-cell">Операция</div>
                        <div className="finances-log-cell">Сумма</div>
                    </div>
                </div>
                {companyTransactions.length > 0 ? (
                    companyTransactions.map(trx => (
                        <div key={trx.id} className="finances-log-row">
                             <div className="finances-log-content-wrapper">
                                 <div className="finances-log-cell">{trx.date}</div>
                                 <div className="finances-log-cell">{trx.operation}</div>
                                 <div className="finances-log-cell">{trx.amount}</div>
                             </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>Нет операций</div>
                )}
            </div>
        </div>
    );
};
export default CompanyFinancesTab;