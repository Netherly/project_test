import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import EmployeeModal from "./EmployeesModal/EmployeeModal";
import NoAccessState from "../ui/NoAccessState.jsx";
import {
  fetchEmployeeById as apiFetchEmployeeById,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  createEmployee as apiCreateEmployee,
  normalizeEmployee,
} from "../../api/employees";
import { isForbiddenError } from "../../utils/isForbiddenError.js";
import { readCacheSnapshot, writeCachedValue } from "../../utils/resourceCache";
import { buildEntityPath } from "../../utils/entityRoutes";
import "../../styles/EmployeesPage.css";

const syncEmployeeListCache = (employee, mode = "upsert") => {
  const normalized = employee ? normalizeEmployee(employee) : null;
  const snapshot = readCacheSnapshot("employees", { fallback: [] });
  const current = Array.isArray(snapshot.data) ? snapshot.data : [];

  let next = current;
  if (mode === "remove") {
    const idToRemove = normalized?.id ?? employee?.id;
    next = current.filter((item) => String(item?.id) !== String(idToRemove));
  } else if (normalized?.id) {
    const exists = current.some((item) => String(item?.id) === String(normalized.id));
    next = exists
      ? current.map((item) =>
          String(item?.id) === String(normalized.id) ? normalized : item
        )
      : [normalized, ...current];
  }

  writeCachedValue("employees", next);
};

export default function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!employeeId || employeeId === "new") {
      const duplicatedData = location.state?.duplicatedData;
      
      if (duplicatedData) {
        const { 
          id, urlId, publicId, userid, 
          login, email, phone, passport, chatLink,
          telegram, telegramId, telegramName, telegramNickname, telegramNick, telegramBindingLink, telegramDateTime,
          balance, cashOnHand,
          requisitesList, requisites, EmployeeRequisite, employeeRequisites,
          ...restData 
        } = duplicatedData;

        
        const cleanRequisites = (requisitesList || []).map(req => {
          const { id, ...reqWithoutId } = req;
          return reqWithoutId;
        });

        
        setEmployee(normalizeEmployee({
          ...restData,
          fullName: restData.fullName ? `${restData.fullName} (Копия)` : "",
          login: "", 
          balance: 0,
          cashOnHand: 0,
          requisitesList: cleanRequisites
        }));
      } else {
        setEmployee(normalizeEmployee({}));
      }
      
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      setForbidden(false);
      try {
        const data = await apiFetchEmployeeById(employeeId);
        if (!mounted) return;
        setEmployee(data);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        if (isForbiddenError(e)) {
          setForbidden(true);
          setError("");
          setEmployee(null);
        } else {
          setError("Не удалось загрузить данные сотрудника");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId, location.state]);

  const handleSaveEmployee = async (formData) => {
    try {
      if (employeeId && employeeId !== "new") {
        const saved = await apiUpdateEmployee(employeeId, formData);
        const normalized = normalizeEmployee(saved);
        setEmployee(normalized);
        syncEmployeeListCache(normalized, "upsert");
        return saved;
      } else {
        const created = await apiCreateEmployee(formData);
        const normalized = normalizeEmployee(created);
        setEmployee(normalized);
        syncEmployeeListCache(normalized, "upsert");
        navigate(buildEntityPath("/employees", normalized), { replace: true });
        return created;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      await apiDeleteEmployee(employeeId);
      syncEmployeeListCache(employee || { id: employeeId }, "remove");
      navigate("/employees");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDuplicateEmployee = () => {
    if (employee) {
      navigate("/employees/new", { state: { duplicatedData: employee } });
    }
  };

  const handleCloseModal = () => {
    navigate("/employees");
  };

  if (loading) {
    return (
      <div className="employees-page">
        <Sidebar />
        <div className="employees-page-main-container">
          <div className="employees-loading">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="employees-page">
        <Sidebar />
        <div className="employees-page-main-container">
          <NoAccessState
            title='Нет доступа к разделу "Сотрудники"'
            description="У вашей учетной записи недостаточно прав для просмотра карточки сотрудника."
            note="Если доступ нужен, обратитесь к администратору."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employees-page">
        <Sidebar />
        <div className="employees-page-main-container">
          <div className="employees-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="employees-page">
      <Sidebar />
      {employee && (
        <EmployeeModal
          employee={employee}
          onClose={handleCloseModal}
          onSave={handleSaveEmployee}
          onDelete={employeeId && employeeId !== "new" ? handleDeleteEmployee : null}
          onDuplicate={employeeId && employeeId !== "new" ? handleDuplicateEmployee : null}
        />
      )}
    </div>
  );
}