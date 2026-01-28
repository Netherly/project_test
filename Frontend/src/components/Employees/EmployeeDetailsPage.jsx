import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import EmployeeModal from "./EmployeesModal/EmployeeModal";
import {
  fetchEmployeeById as apiFetchEmployeeById,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  createEmployee as apiCreateEmployee,
  normalizeEmployee,
  serializeEmployee,
} from "../../api/employees";
import "../../styles/EmployeesPage.css";

export default function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employeeId || employeeId === "new") {
      setEmployee(normalizeEmployee({}));
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetchEmployeeById(employeeId);
        if (!mounted) return;
        setEmployee(data);
      } catch (e) {
        console.error("Ошибка загрузки сотрудника:", e);
        if (!mounted) return;
        setError("Не удалось загрузить данные сотрудника");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const handleSaveEmployee = async (formData) => {
    const outgoing = serializeEmployee(formData);
    try {
      if (employeeId && employeeId !== "new") {
        const saved = await apiUpdateEmployee(employeeId, outgoing);
        setEmployee(normalizeEmployee(saved));
        return saved;
      } else {
        const created = await apiCreateEmployee(outgoing);
        setEmployee(normalizeEmployee(created));
        // Перенаправляем на страницу с ID нового сотрудника
        navigate(`/employees/${created.id}`, { replace: true });
        return created;
      }
    } catch (e) {
      console.error("Ошибка сохранения сотрудника:", e);
      throw e;
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      await apiDeleteEmployee(employeeId);
      navigate("/employees");
    } catch (e) {
      console.error("Ошибка удаления сотрудника:", e);
      throw e;
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
        />
      )}
    </div>
  );
}
