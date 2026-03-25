import React, { useEffect, useState } from "react";
import "../../styles/AssetCard.css";
import { X } from "lucide-react";
import { withCacheVersion } from "../../api/http";
import {
  getCardDesignFallback,
  normalizeCardDesignName,
  resolveCardDesignUrl,
} from "../../utils/cardDesigns";

import visaLogo from "../../assets/assets-card/visa.png";
import mastercardLogo from "../../assets/assets-card/mastercard.png";
import mirLogo from "../../assets/assets-card/mir.png";
import cryptoLogo from "../../assets/assets-card/cryptologo.png";
import cardChip from "../../assets/assets-card/cardchip.png";

const AssetCard = ({
  asset,
  onCardClick,
  onDeleteClick,
  onCopyValue,
  onCopyRequisites,
  cardDesigns = [],
  designVersion = "",
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

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
      console.error("Не удалось удалить актив:", error);
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
        normalizeCardDesignName(d?.name) &&
        normalizeCardDesignName(d?.name) === normalizeCardDesignName(designNameValue)
    );

  const designFallback = getCardDesignFallback(
    designObj?.name || asset?.cardDesign?.name || designNameValue || designValue
  );

  const designClass = designFallback
    ? `card-design-${designFallback.key}`
    : "card-design-default";

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
    designVersion;
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
    const ps =
      typeof paymentSystemValue === "object"
        ? paymentSystemValue?.name || paymentSystemValue?.code
        : paymentSystemValue;

    if (ps) {
      switch (ps) {
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
      style={{
        backgroundColor: !designUrl && !designFallback ? "#333" : undefined,
      }}
    >
      <div className="asset-card-inner">
        <div className="asset-card-front" style={designImageStyle}>
          <button
            type="button"
            className="asset-card-delete-button"
            onClick={handleDelete}
            title="Удалить актив"
          >
            <X size={16} />
          </button>

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
