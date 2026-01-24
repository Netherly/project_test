/**
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const dateOnly = dateString.split(' ')[0].split('T')[0];
    
    try {
        const parts = dateOnly.split(/[-./]/);
        let day, month, year;
        
        if (parts.length === 3) {
            if (parseInt(parts[0]) > 31) {
                year = parts[0];
                month = parts[1];
                day = parts[2];
            } else if (parseInt(parts[2]) > 31) {
                if (parseInt(parts[1]) > 12) {
                    day = parts[0];
                    month = parts[1];
                    year = parts[2];
                } else {
                    if (parts[2].length === 4) {
                        month = parts[0];
                        day = parts[1];
                        year = parts[2];
                    } else {
                        day = parts[0];
                        month = parts[1];
                        year = parts[2];
                    }
                }
            } else {
                if (parseInt(parts[0]) > 12) {
                    day = parts[0];
                    month = parts[1];
                    year = parts[2];
                } else if (parseInt(parts[1]) > 12) {
                    month = parts[0];
                    day = parts[1];
                    year = parts[2];
                } else {
                    const date = new Date(dateOnly);
                    if (!isNaN(date.getTime())) {
                        day = String(date.getDate()).padStart(2, '0');
                        month = String(date.getMonth() + 1).padStart(2, '0');
                        year = String(date.getFullYear()).slice(-2);
                        return `${day}.${month}.${year}`;
                    }
                }
            }
            
            day = String(day).padStart(2, '0');
            month = String(month).padStart(2, '0');
            year = year.length === 4 ? year.slice(-2) : String(year).padStart(2, '0');
            
            return `${day}.${month}.${year}`;
        }
        
        const date = new Date(dateOnly);
        if (!isNaN(date.getTime())) {
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = String(date.getFullYear()).slice(-2);
            return `${d}.${m}.${y}`;
        }
        
        return dateString;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * @param {string|number} timeString 
 * @returns {string} 
 */
export const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const timeStr = String(timeString);

    if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const num = parseFloat(timeStr);
    if (!isNaN(num)) {
        const hours = Math.floor(num);
        const minutes = Math.round((num - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    return timeStr;
};