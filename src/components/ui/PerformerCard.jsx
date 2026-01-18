import React from 'react';
import './PerformerCard.css';
import avatarPlaceholder from '../../assets/avatar-placeholder.svg'; 

const PerformerCard = ({ performer, onRemove }) => {
    
    return (
        <div className="performer-card">
            <img src={avatarPlaceholder} alt={performer.fullName} className="performer-card-avatar" />
            <div className="performer-card-info">
                <span className="performer-card-login">{performer.login}</span>
                <span className="performer-card-name">{performer.fullName}</span>
            </div>
            <button type="button" className="performer-card-remove-btn" onClick={onRemove}>
                ✖
            </button>
        </div>
    );
};

export default PerformerCard;