import { formatUrlId } from "./entityRoutes";

const stripQuery = (value) => String(value || "").split("?")[0].split("#")[0];

export const extractFileExtension = (value) => {
  const cleaned = stripQuery(value);
  const idx = cleaned.lastIndexOf(".");
  if (idx === -1) return "";
  return cleaned.slice(idx).toLowerCase();
};

export const buildCompanyPhotoDisplayName = (company, source) => {
  const companyName = String(company?.name || "").trim();
  const formattedUrlId = formatUrlId(company?.urlId);
  const extension = extractFileExtension(source) || ".jpg";

  if (!companyName || !formattedUrlId) {
    return source ? stripQuery(source).split("/").pop() || "image.jpg" : "image.jpg";
  }

  return `${companyName}_${formattedUrlId}${extension}`;
};
