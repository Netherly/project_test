import React from 'react';

const SummaryTab = ({ company }) => (
    <div className="tab-section">
        <p>Сводка по компании {company?.name || ''} (в разработке)</p>
    </div>
);
export default SummaryTab;