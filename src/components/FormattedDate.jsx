
import React from 'react';

const FormattedDate = ({ dateString }) => {
    
    if (!dateString) {
        return null;
    }

    
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    try {
        
        const dateObject = new Date(dateString.replace(' ', 'T'));

        
        const day = dateObject.getDate();
        const month = monthNames[dateObject.getMonth()];
        const year = dateObject.getFullYear();
        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');

        
        const formattedString = `${day} ${month} ${year} ${hours}:${minutes}`;

        return <span>{formattedString}</span>;
    } catch (error) {
        console.error("Error formatting date:", error);
        return <span>{dateString}</span>; 
    }
};

export default FormattedDate;