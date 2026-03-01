import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ClientModal from "../components/Client/ClientModal/ClientModal";
import { useFields } from "../context/FieldsContext";
import {
  fetchClients,
  saveClient as saveClientApi,
  deleteClient as deleteClientApi,
} from "../api/clients";
import { fetchEmployees } from "../api/employees";
import { fetchCompanies, createCompany as createCompanyApi } from "../api/companies";
import "../styles/ClientsPage.css";

const withReferrerNames = (client) => {
  return client;
};

export default function ClientDetailsPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clientCountries = [], currencies = [], clientCategories = [] } = useFields();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companiesList, setCompaniesList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [referrerOptions, setReferrerOptions] = useState([]); 

  
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
      try {
        const data = await fetchClients();
        if (!mounted) return;
        const normalized = Array.isArray(data) ? data.map(withReferrerNames) : [];
        
        
        setReferrerOptions(normalized); 

        if (!clientId || clientId === "new") {
          setClient({});
        } else {
          const found = normalized.find((c) => c.id === clientId);
          if (found) {
            setClient(found);
          } else {
            setError("Клиент не найден");
          }
        }
      } catch (e) {
        console.error("fetchClients failed:", e);
        if (mounted) {
          setError(e?.message || "Не удалось загрузить клиента");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  const handleSaveClient = async (data) => {
    try {
      setError("");
      const saved = withReferrerNames(await saveClientApi(data));
      setClient(saved);
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
      navigate("/clients");
    } catch (e) {
      console.error("deleteClient failed:", e);
      throw e;
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
    navigate("/clients");
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
          referrers={referrerOptions}
          countries={clientCountries}
          currencies={currencies}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
          onDelete={clientId && clientId !== "new" ? handleDeleteClient : null}
          onAddCompany={handleAddCompany}
        />
      )}
    </div>
  );
}