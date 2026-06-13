import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [services, setServices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [savings, setSavings] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [sRes, dRes, savRes, gRes] = await Promise.all([
        api.get('/services'),
        api.get('/debts'),
        api.get('/savings'),
        api.get('/goals'),
      ]);
      setServices(sRes.data.services);
      setDebts(dRes.data.debts);
      setSavings(savRes.data.savings);
      setGoals(gRes.data.goals);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Services
  const addService = async (data) => {
    const res = await api.post('/services', data);
    setServices((prev) => [res.data.service, ...prev]);
  };

  const updateService = async (id, data) => {
    const res = await api.put(`/services/${id}`, data);
    setServices((prev) => prev.map((s) => (s.id === id ? res.data.service : s)));
  };

  const removeService = async (id) => {
    await api.delete(`/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Debts
  const addDebt = async (data) => {
    const res = await api.post('/debts', data);
    setDebts((prev) => [...prev, res.data.debt]);
  };

  const updateDebt = async (id, data) => {
    const res = await api.put(`/debts/${id}`, data);
    setDebts((prev) => prev.map((d) => (d.id === id ? res.data.debt : d)));
  };

  const removeDebt = async (id) => {
    await api.delete(`/debts/${id}`);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const pagarCuota = async (id) => {
    const res = await api.post(`/debts/${id}/pagar`);
    if (res.data.liquidada) {
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } else {
      setDebts((prev) => prev.map((d) => (d.id === id ? res.data.debt : d)));
    }
  };

  const abonarDeuda = async (id, monto) => {
    const res = await api.post(`/debts/${id}/abonar`, { monto });
    if (res.data.liquidada) {
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } else {
      setDebts((prev) => prev.map((d) => (d.id === id ? res.data.debt : d)));
    }
    return res.data;
  };

  // Derived calculations
  const totalServicios = services.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
  const totalCuotas = debts.reduce((sum, d) => sum + parseFloat(d.cuota_mensual || 0), 0);
  const totalDeuda = debts.reduce((sum, d) => sum + (parseFloat(d.monto_total || 0) - parseFloat(d.monto_pagado || 0)), 0);

  const calcMesesLibre = (ingreso) => {
    if (!debts.length) return 0;
    const maxMeses = Math.max(...debts.map((d) => {
      const restante = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
      return Math.ceil(restante / parseFloat(d.cuota_mensual));
    }));
    return maxMeses;
  };

  // Savings
  const addSaving = async (data) => {
    const res = await api.post('/savings', data);
    setSavings((prev) => [res.data.saving, ...prev]);
  };
  const updateSaving = async (id, data) => {
    const res = await api.put(`/savings/${id}`, data);
    setSavings((prev) => prev.map((s) => (s.id === id ? res.data.saving : s)));
  };
  const removeSaving = async (id) => {
    await api.delete(`/savings/${id}`);
    setSavings((prev) => prev.filter((s) => s.id !== id));
  };
  const abonarSaving = async (id, monto) => {
    const res = await api.post(`/savings/${id}/abonar`, { monto });
    setSavings((prev) => prev.map((s) => (s.id === id ? res.data.saving : s)));
  };

  // Goals
  const addGoal = async (data) => {
    const res = await api.post('/goals', data);
    setGoals((prev) => [res.data.goal, ...prev]);
  };
  const updateGoal = async (id, data) => {
    const res = await api.put(`/goals/${id}`, data);
    setGoals((prev) => prev.map((g) => (g.id === id ? res.data.goal : g)));
  };
  const removeGoal = async (id) => {
    await api.delete(`/goals/${id}`);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };
  const abonarGoal = async (id, monto) => {
    const res = await api.post(`/goals/${id}/abonar`, { monto });
    setGoals((prev) => prev.map((g) => (g.id === id ? res.data.goal : g)));
  };

  return (
    <FinanceContext.Provider value={{
      services, debts, savings, goals, loadingData,
      fetchAll,
      addService, updateService, removeService,
      addDebt, updateDebt, removeDebt, pagarCuota, abonarDeuda,
      addSaving, updateSaving, removeSaving, abonarSaving,
      addGoal, updateGoal, removeGoal, abonarGoal,
      totalServicios, totalCuotas, totalDeuda,
      calcMesesLibre,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
