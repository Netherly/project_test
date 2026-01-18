import React, { useState, useEffect } from 'react';
import '../../styles/AssetCard.css';
import { FieldsAPI } from '../../api/fields';
import { fileUrl } from '../../api/http';

import visaLogo from '../../assets/assets-card/visa.png';
import mastercardLogo from '../../assets/assets-card/mastercard.png';
import mirLogo from '../../assets/assets-card/mir.png';
import cryptoLogo from '../../assets/assets-card/cryptologo.png';
import cardChip from '../../assets/assets-card/cardchip.png';

const designNameMap = {
    'Монобанк': 'monobank-black',
    'ПриватБанк': 'privatbank-green',
    'Сбербанк': 'sberbank-light-green',
    'Bybit': 'bybit-white',
    'Рубин': 'ruby',
    'Сапфир': 'saphire',
    'Атлас': 'atlas',
    '3Д': '3d',
    'Красный': 'red',
};

const AssetCard = ({ asset, onCardClick, onCopyValue, onCopyRequisites, cardDesigns: propCardDesigns = [] }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [cardDesigns, setCardDesigns] = useState(propCardDesigns);

    useEffect(() => {
        if (propCardDesigns.length === 0) {
            const loadCardDesigns = async () => {
                try {
                    const af = await FieldsAPI.getAssets();
                    setCardDesigns(af.cardDesigns || []);
                } catch (err) {
                    console.error("Failed to load card designs", err);
                }
            };
            loadCardDesigns();
        } else {
            setCardDesigns(propCardDesigns);
        }
    }, [propCardDesigns]);

    const handleFlip = (e) => {
        e.stopPropagation();
        setIsFlipped(!isFlipped);
    };

    const handleCopyClick = (e, value) => {
        e.stopPropagation();
        if (value) {
            onCopyValue(value);
        }
    };

    const cardNumber = asset.requisites?.find(req => req.label === "Номер карты")?.value;
    const cardDate = asset.requisites?.find(req => req.label === "Срок действия")?.value;
    const cardCVV = asset.requisites?.find(req => req.label === "CVV")?.value;

    const handleCopyMainRequisite = (e) => {
        e.stopPropagation();
        if (asset.requisites && asset.requisites.length > 0) {
            const mainRequisite = cardNumber || (asset.requisites[0] ? asset.requisites[0].value : '');
            onCopyValue(mainRequisite);
        }
    };

    const displayAccountName = asset.accountName.includes("Binance")
        ? asset.accountName.replace("Binance", "CRYPTO")
        : asset.accountName;

    const paymentSystemValue = asset.paymentSystemRaw ?? asset.paymentSystem;
    const currencyValue = asset.currencyRaw ?? asset.currency;
    const designValue = asset.designRaw?.id ?? asset.designRaw?.name ?? asset.design ?? '';
    const designNameValue = asset.designRaw?.name ?? asset.design;

    const designObj = cardDesigns.find(
        d =>
            d.id === designValue ||
            d.name === designValue ||
            designNameMap[d.name] === designValue ||
            designNameMap[d.name] === designNameValue
    );
    const designClass = designValue ? `card-design-${designValue}` : 'card-design-default';
    const designUrl = asset.cardDesign?.url ? fileUrl(asset.cardDesign.url) : designObj?.viewUrl;

    const getCardTypeLogo = () => {
        const ps = typeof paymentSystemValue === 'object' ? paymentSystemValue.name || paymentSystemValue.code : paymentSystemValue;
        if (ps) {
            switch (ps) {
                case 'Visa':
                    return <img src={visaLogo} alt="Visa" className="card-type-logo visa" />;
                case 'Mastercard':
                    return <img src={mastercardLogo} alt="Mastercard" className="card-type-logo mastercard" />;
                case 'Мир':
                    return <img src={mirLogo} alt="Мир" className="card-type-logo mir" />;
                case 'Криптовалюта':
                    return <img src={cryptoLogo} alt="Bitcoin" className="card-type-logo crypto" />;
                default:
                    return null;
            }
        }

        if (cardNumber) {
            if (cardNumber.startsWith('4')) {
                return <img src={visaLogo} alt="Visa" className="card-type-logo visa" />;
            } else if (cardNumber.startsWith('5')) {
                return <img src={mastercardLogo} alt="Mastercard" className="card-type-logo mastercard" />;
            }
        }
        
        return null;
    };

    const getCurrencySymbol = (currency) => {
        const curr = typeof currency === 'object' ? currency.code || currency.name : currency;
        switch (curr) {
            case 'UAH': return '₴';
            case 'USD': return '$';
            case 'RUB': return '₽';
            case 'EUR': return '€';
            case 'BTC': return '₿';
            case 'ETH': return 'Ξ';
            case 'USDT': return 'USDT';
            default: return curr;
        }
    };

    const shouldShowCardElements = true; 

    return (
        <div className={`asset-card-wrapper ${isFlipped ? 'flipped' : ''} ${designClass}`} onClick={onCardClick} style={{ backgroundImage: designUrl ? `url(${designUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {asset.cardDesign && (
                <div className="card-design-info">
                    <div>ID: {asset.cardDesign.id}</div>
                    <div>Name: {asset.cardDesign.name}</div>
                    <div>URL: {asset.cardDesign.url}</div>
                    <div>Is Active: {asset.cardDesign.isActive ? 'Yes' : 'No'}</div>
                    <div>Order: {asset.cardDesign.order}</div>
                </div>
            )}
            <div className="asset-card-inner">
                <div className="asset-card-front">
                    <div className="card-top-left-name">
                        <span className="asset-name-top-left">{displayAccountName}</span>
                        <span>{asset.employee}</span>
                    </div>

                    <div className="card-type-logo-container-top-right">
                        {getCardTypeLogo()}
                    </div>

                    {shouldShowCardElements && (
                        <img src={cardChip} alt="Card Chip" className="card-chip-logo-center-right" />
                    )}

                    <div className="card-balance-left-center">
                        <span className="card-balance-value">{getCurrencySymbol(currencyValue)} {asset.balance.toFixed(2)}</span>
                    </div>

                    <div className="card-free-balance-bottom-center">
                        <span className="card-info-label">Свободный</span>
                        <span className="card-info-value">{asset.balance.toFixed(2)}</span>
                    </div>

                    <div className="card-bottom-right-actions">
                        {asset.requisites && asset.requisites.length > 0 && (cardNumber || (asset.requisites[0] && asset.requisites[0].value)) && (
                            <button className="copy-main-requisite-button" onClick={handleCopyMainRequisite} title="Копировать основной реквизит">
                                &#x2398;
                            </button>
                        )}
                        <button className="flip-button" onClick={handleFlip} title="Показать реквизиты">
                            &#x21C6;
                        </button>
                    </div>
                </div>

                <div className="asset-card-back">
                    <div className="magnetic-stripe"></div>

                    <div className="card-back-details">
                        <div className="card-chip-container-back">
                            {shouldShowCardElements && (
                                <img src={cardChip} alt="Card Chip" className="card-chip-back" />
                            )}
                        </div>

                        <div className="card-number-back-container">
                            {cardNumber ? (
                                <span className="card-number-back" onClick={(e) => handleCopyClick(e, cardNumber)}>
                                    {cardNumber}
                                </span>
                            ) : (
                                <span className="card-number-back empty"></span>
                            )}
                        </div>

                        <div className="card-expiry-cvv">
                            <div className="card-expiry">
                                <span className="label">Срок</span>
                                <span className="value">{cardDate || '--/--'}</span>
                            </div>
                            <div className="card-cvv">
                                <span className="label">CVV</span>
                                <span className="value">{cardCVV || '---'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card-bottom-right-actions-back">
                        <button className="flip-button" onClick={handleFlip} title="Вернуться">
                            &#x21C6;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetCard;