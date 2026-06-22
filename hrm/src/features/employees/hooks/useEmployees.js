import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

// UI filter state (must match Filters)
export const emptyFilters = {
  station: "",
  department: "",
  employee_group: "",
  designation: "",
  employee_code: "",
  employee_name: "",
  user_name: "",
  status: "",
  documents_attached: "ALL",
  role_template: "",
  cnic: "",
  flag: "ALL",
  search: "", // 🔍 global search text
};

// Map UI filter keys -> backend query params
function toApiParams(filters, { includeInactive } = {}) {
  const params = {};

  if (filters.station) params.station = filters.station;
  if (filters.department) params.department = filters.department;

  if (filters.employee_code) params.employeeCode = filters.employee_code;
  if (filters.employee_name) params.employeeName = filters.employee_name;
  if (filters.user_name) params.userName = filters.user_name;

  if (filters.status) params.status = filters.status;
  if (filters.cnic) params.cnic = filters.cnic;

  if (filters.search) params.search = filters.search;

  // ✅ only admins will send this; backend also enforces permission
  if (includeInactive) params.include_inactive = 1;

  return params;
}

export default function useEmployees() {
  const { user } = useAuth();
  const role = user?.role;
  const canSeeInactive = role === "admin" || role === "super_admin" || role === "hr";

  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [openExport, setOpenExport] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstItem = useMemo(
    () => (total === 0 ? 0 : (page - 1) * perPage + 1),
    [page, perPage, total]
  );
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage]
  );

  // ✅ Load from backend
  const load = async (filtersToUse) => {
    const params = toApiParams(filtersToUse, { includeInactive: canSeeInactive });

    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/employees", { params });

      const raw = Array.isArray(data) ? data : [];

      const items = raw.map((emp) => ({
        ...emp,
        id: emp.id,

        employee_code: emp.employeeCode ?? emp.Employee_ID ?? "",
        employee_name: emp.name ?? emp.Employee_Name ?? "",
        user_name: emp.userName ?? emp.login_email ?? "",

        station: emp.station ?? emp.Office_Location ?? "",
        department: emp.department ?? emp.Department ?? "",
        designation: emp.designation ?? emp.Designations ?? "",

        cnic: emp.cnic ?? emp.CNIC ?? "",

        // ✅ normalize active
        isActive:
          emp.isActive === true
            ? true
            : emp.isActive === false
              ? false
              : Number(emp.isActive) === 1,
      }));

      setList(items);
      setTotal(items.length);
    } catch (err) {
      console.error("Failed to load employees", err);
      setList([]);
      setTotal(0);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load employees"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, canSeeInactive]);

  // ✅ EXTRA: full-table client-side search
  const visibleList = useMemo(() => {
    const q = (appliedFilters.search || "").trim().toLowerCase();
    if (!q) return list;

    return list.filter((emp) => {
      const valuesToSearch = [
        emp.employee_name,
        emp.employee_code,
        emp.user_name,
        emp.department,
        emp.station,
        emp.designation,
        emp.cnic,
      ];

      return valuesToSearch.some((val) =>
        String(val || "").toLowerCase().includes(q)
      );
    });
  }, [list, appliedFilters.search]);

  // paginate AFTER search
  const rows = useMemo(
    () => visibleList.slice((page - 1) * perPage, page * perPage),
    [visibleList, page, perPage]
  );

  const apply = (nextFilters) => {
    const filtersToApply = nextFilters || filters;
    setFilters(filtersToApply);
    setPage(1);
    setAppliedFilters(filtersToApply);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
    setAppliedFilters(emptyFilters);
  };

  const setFilter = (name, value) =>
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

  const exportData = async () => {
    try {
      const params = toApiParams(appliedFilters, { includeInactive: canSeeInactive });
      const response = await api.get("/employees/export", { params, responseType: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); // cleanup

    } catch (err) {
      console.error("Failed to export employees", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to export employees"
      );
    }
  };

  const refetch = () => {
    load(appliedFilters);
  };

  const uploadExcel = () => {};
  const sendCreds = () => {};
  const addNew = () => {};

  return {
    filters,
    setFilter,
    resetFilters,

    perPage,
    setPerPage,
    page,
    setPage,
    totalPages,
    firstItem,
    rows,
    list,
    total,

    openExport,
    setOpenExport,

    loading,
    error,

    apply,
    exportData,
    uploadExcel,
    sendCreds,
    addNew,
    refetch,
  };
}
