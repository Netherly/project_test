import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ClientModal from "../components/Client/ClientModal/ClientModal";
import NoAccessState from "../components/ui/NoAccessState";
import { useFields } from "../context/FieldsContext";
import {
  fetchClients,
  saveClient as saveClientApi,
  deleteClient as deleteClientApi,
} from "../api/clients";
import { fetchEmployees } from "../api/employees";
import { fetchCompanies, createCompany as createCompanyApi } from "../api/companies";
import { isForbiddenError } from "../utils/isForbiddenError";
import { buildEntityPath, matchesEntityRouteParam } from "../utils/entityRoutes";
import "../styles/ClientsPage.css";

const withReferrerNames = (client) => {
  return client;
};

export default function ClientDetailsPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clientCountries = [], currencies = [], clientCategories = [] } = useFields();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [companiesList, setCompaniesList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchEmployees();
        if (!mounted) return;
        const normalized = Array.isArray(data)
          ? data.map((e) => ({
              id: e.id,
              full_name: e.fullName ?? e.full_name ?? "",
            }))
          : [];
        setEmployeesList(normalized);
      } catch (e) {
        console.error("fetchEmployees failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCompanies();
        if (!mounted) return;
        setCompaniesList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("fetchCompanies failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      setForbidden(false);
      try {
        const data = await fetchClients();
        if (!mounted) return;
        
        const normalized = Array.isArray(data) ? data.map(withReferrerNames) : [];
        setClientsList(normalized); 

        if (!clientId || clientId === "new") {
          const duplicatedData = location.state?.duplicatedData;
          
          if (duplicatedData) {
            const { 
              id, urlId, 
              phone, email, telegram,
              ...restData 
            } = duplicatedData;

            setClient({
              ...restData,
              name: restData.name ? `${restData.name} (Копия)` : "",
              full_name: restData.full_name ? `${restData.full_name} (Копия)` : "",
              phone: "",
              email: ""
            });
          } else {
            setClient({});
          }
        } else {
          const found = normalized.find((c) => matchesEntityRouteParam(c, clientId));
          if (found) {
            setClient(found);
          } else {
            setError("Клиент не найден");
          }
        }
      } catch (e) {
        console.error("fetchClients failed:", e);
        if (mounted) {
          if (isForbiddenError(e)) {
            setForbidden(true);
            setError("");
            setClient(null);
          } else {
            setError(e?.message || "Не удалось загрузить клиента");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId, location.state]);

  const handleSaveClient = async (data) => {
    try {
      setError("");
      const saved = withReferrerNames(await saveClientApi(data));
      setCompaniesList((prev) =>
        prev.map((company) =>
          String(company?.id) === String(saved?.company_id)
            ? {
                ...company,
                name: saved.company_name || company.name,
                photo_link: saved.company_photo_link ?? company.photo_link ?? "",
              }
            : company
        )
      );
      setClient(saved);
      if (clientId === "new" && saved?.id) {
        navigate(
          {
            pathname: buildEntityPath("/clients", saved),
            search: location.search,
          },
          { replace: true }
        );
      }
      return saved;
    } catch (e) {
      console.error("saveClient failed:", e);
      setError(e?.message || "Не удалось сохранить клиента");
      throw e;
    }
  };

  const handleDeleteClient = async () => {
    try {
      await deleteClientApi(clientId);
      navigate({
        pathname: "/clients",
        search: location.search,
      });
    } catch (e) {
      console.error("deleteClient failed:", e);
      throw e;
    }
  };

  const handleDuplicateClient = () => {
    if (client) {
      navigate("/clients/new", { state: { duplicatedData: client } });
    }
  };

  const handleAddCompany = async (data) => {
    try {
      const created = await createCompanyApi(data);
      setCompaniesList((prev) => [...prev, created]);
      return created;
    } catch (e) {
      console.error("createCompany failed:", e);
      throw e;
    }
  };

  const handleCloseModal = () => {
    navigate({
      pathname: "/clients",
      search: location.search,
    });
  };

  if (loading) {
    return (
      <div className="clients-page">
        <Sidebar />
        <div className="clients-page-main-container">
          <div className="loading">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="clients-page">
        <Sidebar />
        <div className="clients-page-main-container">
          <NoAccessState
            title='Нет доступа к разделу "Клиенты"'
            description="У вашей учетной записи недостаточно прав для просмотра карточки клиента."
            note="Если доступ нужен, обратитесь к администратору."
          />
        </div>
      </div>
    );
  }

  if (error && clientId !== "new") {
    return (
      <div className="clients-page">
        <Sidebar />
        <div className="clients-page-main-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-page">
      <Sidebar />
      {client !== null && (
        <ClientModal
          client={client}
          companies={companiesList}
          employees={employeesList}
          clients={clientsList}
          countries={clientCountries}
          currencies={currencies}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
          onDelete={clientId && clientId !== "new" ? handleDeleteClient : null}
          onDuplicate={clientId && clientId !== "new" ? handleDuplicateClient : null}
          onAddCompany={handleAddCompany}
        />
      )}
    </div>
  );
}