import React from 'react';

const CompanyEmployeesTab = ({ clients, companyName, companyId }) => {
    const companyClients = clients.filter(c => {
        const matchById = companyId && String(c.company_id) === String(companyId);
        const matchByName = companyName && c.company === companyName;
        return matchById || matchByName;
    });
        
    return (
        <div className="tab-section">
            <div className="tab-content-title">Сотрудники ({companyClients.length})</div>
            {companyClients.length === 0 ? (
                <p style={{ opacity: 0.6 }}>У этой компании пока нет сотрудников.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                    {companyClients.map(client => (
                        <li key={client.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
                            {client.full_name || client.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CompanyEmployeesTab;