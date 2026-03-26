import React, { useEffect, useState } from "react";
import "../../styles/AssetCard.css";
import { Trash2 } from "lucide-react";
import { withCacheVersion } from "../../api/http";
import {
  resolveCardDesignUrl,
} from "../../utils/cardDesigns";
import { useTransactions } from "../../context/TransactionsContext";

import visaLogo from "../../assets/assets-card/visa.png";
import mastercardLogo from "../../assets/assets-card/mastercard.png";
import mirLogo from "../../assets/assets-card/mir.png";
import cryptoLogo from "../../assets/assets-card/cryptologo.png";
import cardChip from "../../assets/assets-card/cardchip.png";

const safeFileUrl = (url, version = "") => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return resolveCardDesignUrl(url); 
};

const AssetCard = ({
  asset,
  onCardClick,
  onDeleteClick,
  onCopyValue,
  onCopyRequisites,
  cardDesigns = [],
  paymentSystems = [],
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { transactions } = useTransactions();

  const hasTransactions = transactions?.some((t) => {
    const tAccountId = typeof t.account === "object" ? t?.account?.id : t?.account;
    return String(tAccountId) === String(asset?.id);
  });

  const handleFlip = (e) => {
    e.stopPropagation();
    setIsFlipped((v) => !v);
  };

  const handleCopyClick = (e, value) => {
    e.stopPropagation();
    if (value) onCopyValue(value);
  };

  const requisites = Array.isArray(asset?.requisites) ? asset.requisites : [];
  const cardNumber = requisites.find((r) => r?.label === "Номер карты")?.value;
  const cardDate = requisites.find((r) => r?.label === "Срок действия")?.value;
  const cardCVV = requisites.find((r) => r?.label === "CVV")?.value;

  const handleCopyMainRequisite = (e) => {
    e.stopPropagation();
    if (!requisites.length) return;
    const main = cardNumber || requisites[0]?.value || "";
    if (main) onCopyValue(main);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!onDeleteClick) return;
    const confirmed = window.confirm(`Удалить актив "${accountName || "Без названия"}"?`);
    if (!confirmed) return;
    try {
      await onDeleteClick();
    } catch (error) {
      console.error(error);
    }
  };

  const accountName = asset?.accountName || "";

  const paymentSystemValue = asset?.paymentSystemRaw ?? asset?.paymentSystem;
  const currencyValue = asset?.currencyRaw ?? asset?.currency;

  const designValue =
    asset?.designRaw?.id ?? asset?.designRaw?.name ?? asset?.design ?? "";
  const designNameValue =
    asset?.designRaw?.name ?? asset?.cardDesign?.name ?? asset?.design ?? "";

  const designObj =
    cardDesigns.find((d) => d?.id && designValue && d.id === designValue) ||
    cardDesigns.find(
      (d) =>
        d?.name &&
        d?.name.toLowerCase() === (designNameValue || "").toLowerCase()
    );

  const designClass = "card-design-default"; 

  const rawDesignUrl = resolveCardDesignUrl(
    designObj?.viewUrl ??
      designObj?.url ??
      asset?.cardDesign?.imageUrl ??
      asset?.cardDesign?.url ??
      ""
  );
  
  const designImageVersion =
    designObj?.imageVersion ??
    asset?.cardDesign?.imageVersion ??
    "";
    
  const versionedDesignUrl = withCacheVersion(rawDesignUrl, designImageVersion);

  const [designUrl, setDesignUrl] = useState("");

  useEffect(() => {
    if (!versionedDesignUrl || typeof window === "undefined") {
      setDesignUrl("");
      return undefined;
    }

    let active = true;
    const image = new window.Image();

    image.onload = () => {
      if (active) setDesignUrl(versionedDesignUrl);
    };
    image.onerror = () => {
      if (active) setDesignUrl("");
    };
    image.src = versionedDesignUrl;

    return () => {
      active = false;
    };
  }, [versionedDesignUrl]);

  const getCardTypeLogo = () => {
    const psNameRaw = typeof paymentSystemValue === "object"
      ? paymentSystemValue?.name || paymentSystemValue?.code
      : paymentSystemValue;

    const psName = String(psNameRaw || "").trim().toLowerCase();

    if (psName) {
      const psObj = paymentSystems.find(ps => 
        String(ps?.name || "").trim().toLowerCase() === psName
      );

      if (psObj && (psObj.viewUrl || psObj.url)) {
        const logoUrl = psObj.viewUrl || psObj.url;
        return (
          <img 
            src={safeFileUrl(logoUrl, psObj.imageVersion)} 
            alt={psObj.name || "Payment System"} 
            className="card-type-logo custom-ps-logo" 
          />
        );
      }

      switch (psNameRaw) {
        case "Visa":
          return <img src={visaLogo} alt="Visa" className="card-type-logo visa" />;
        case "Mastercard":
          return (
            <img
              src={mastercardLogo}
              alt="Mastercard"
              className="card-type-logo mastercard"
            />
          );
        case "Мир":
          return <img src={mirLogo} alt="Мир" className="card-type-logo mir" />;
        case "Криптовалюта":
          return <img src={cryptoLogo} alt="Bitcoin" className="card-type-logo crypto" />;
        default:
          break;
      }
    }

    if (cardNumber) {
      if (cardNumber.startsWith("4")) {
        return <img src={visaLogo} alt="Visa" className="card-type-logo visa" />;
      }
      if (cardNumber.startsWith("5")) {
        return (
          <img
            src={mastercardLogo}
            alt="Mastercard"
            className="card-type-logo mastercard"
          />
        );
      }
    }

    return null;
  };

  const getCurrencySymbol = (currency) => {
    const curr =
      typeof currency === "object" ? currency?.code || currency?.name : currency;

    switch (curr) {
      case "UAH":
        return "₴";
      case "USD":
        return "$";
      case "RUB":
        return "₽";
      case "EUR":
        return "€";
      case "BTC":
        return "₿";
      case "ETH":
        return "Ξ";
      case "USDT":
        return "USDT";
      default:
        return curr || "";
    }
  };

  const balance = Number.isFinite(Number(asset?.balance)) ? Number(asset.balance) : 0;
  const shouldShowCardElements = true;
  
  const designImageStyle = designUrl
    ? {
        backgroundImage: `url(${designUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : undefined;

  return (
    <div
      className={`asset-card-wrapper ${isFlipped ? "flipped" : ""} ${designClass}`}
      onClick={onCardClick}
    >
      <div className="asset-card-inner">
        <div className="asset-card-front" style={designImageStyle}>
          <div className="card-top-left-name">
            <span className="asset-name-top-left">{accountName}</span>
            <span>{asset?.employee}</span>
          </div>

          <div className="card-type-logo-container-top-right">{getCardTypeLogo()}</div>

          {shouldShowCardElements && (
            <img src={cardChip} alt="Card Chip" className="card-chip-logo-center-right" />
          )}

          <div className="card-balance-left-center">
            <span className="card-balance-value">
              {getCurrencySymbol(currencyValue)} {balance.toFixed(2)}
            </span>
          </div>

          <div className="card-free-balance-bottom-center">
            <span className="card-info-label">Свободный</span>
            <span className="card-info-value">{balance.toFixed(2)}</span>
          </div>

          <div className="card-bottom-right-actions">
            {requisites.length > 0 && (cardNumber || requisites[0]?.value) && (
              <button
                className="copy-main-requisite-button"
                onClick={handleCopyMainRequisite}
                title="Копировать основной реквизит"
              >
                &#x2398;
              </button>
            )}

            <button className="flip-button" onClick={handleFlip} title="Показать реквизиты">
              &#x21C6;
            </button>
          </div>
        </div>

        <div className="asset-card-back" style={designImageStyle}>
          <div className="magnetic-stripe"></div>

          <div className="card-back-details">
            <div className="card-chip-container-back">
              {shouldShowCardElements && (
                <img src={cardChip} alt="Card Chip" className="card-chip-back" />
              )}
            </div>


            <div className="card-expiry-cvv">
              <div className="card-expiry">
                <span className="label">Срок</span>
                <span className="value">{cardDate || "--/--"}</span>
              </div>
              <div className="card-cvv">
                <span className="label">CVV</span>
                <span className="value">{cardCVV || "---"}</span>
              </div>
            </div>

            <div className="card-number-back-container">
              {cardNumber ? (
                <span
                  className="card-number-back"
                  onClick={(e) => handleCopyClick(e, cardNumber)}
                >
                  {cardNumber}
                </span>
              ) : (
                <span className="card-number-back empty"></span>
              )}
            </div>


            <div className="card-requisites-scroll-container custom-scrollbar">
              {(requisites || []).filter(r => r.label !== "Номер карты" && r.label !== "Срок действия" && r.label !== "CVV").map((req, index) => (
                <div key={`${req.label}-${index}`} className="card-custom-requisite-item">
                  <span className="card-custom-requisite-label">{req.label}:</span>
                  <span 
                    className="card-custom-requisite-value"
                    onClick={(e) => handleCopyClick(e, req.value)}
                    title="Нажмите, чтобы скопировать"
                  >
                    {req.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!hasTransactions && (
            <button
              type="button"
              className="asset-card-delete-button"
              onClick={handleDelete}
              title="Удалить актив"
            >
              <Trash2 size={16} />
            </button>
          )}

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