"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface Donation {
  id: string;
  amount: number;
  donation_date: string;
  method: string;
  donor_name: string | null;
  member_id: string | null;
  members: { full_name: string } | null;
  created_at: string;
}

interface MemberOption {
  id: string;
  full_name: string;
}

export default function FinanceiroPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    member_id: "",
    donor_name: "",
    amount: "",
    method: "transfer",
    donation_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    loadDonations();
    loadMembers();
  }, [period]);

  async function loadMembers() {
    const { data } = await supabase.from("members").select("id, full_name")
      .eq("church_id", CHURCH_ID).eq("active", true).order("full_name");
    setMembers(data ?? []);
  }

  async function loadDonations() {
    const now = new Date();
    let startDate: string;
    if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    }

    const { data } = await supabase
      .from("donations").select("*, members(full_name)")
      .eq("church_id", CHURCH_ID)
      .gte("donation_date", startDate)
      .order("donation_date", { ascending: false });
    setDonations(data ?? []);
  }

  async function handleSave() {
    if (!form.amount) return;
    setSaving(true);
    await supabase.from("donations").insert({
      church_id: CHURCH_ID,
      member_id: form.member_id || null,
      donor_name: form.donor_name.trim() || null,
      amount: parseFloat(form.amount),
      method: form.method,
      donation_date: form.donation_date,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ member_id: "", donor_name: "", amount: "", method: "transfer", donation_date: new Date().toISOString().split("T")[0] });
    loadDonations();
  }

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const count = donations.length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de doações</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Registrar Doação
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nova Doação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value, donor_name: "" })}>
              <option value="">Selecionar membro...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
            {!form.member_id && (
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Ou nome do doador"
                value={form.donor_name}
                onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
            )}
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Valor"
              type="number" step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="transfer">Transferência</option>
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
              <option value="check">Cheque</option>
              <option value="card">Cartão</option>
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              type="date"
              value={form.donation_date}
              onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Salvando..." : "Registrar"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Total no período</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Quantidade</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Média</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${count > 0 ? (total / count).toFixed(2) : "0"}
          </p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "week", label: "Semana" },
          { key: "month", label: "Mês" },
          { key: "year", label: "Ano" },
        ].map((p) => (
          <button key={p.key}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              period === p.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Doador</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Método</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {d.members?.full_name || d.donor_name || "Anônimo"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(d.donation_date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{d.method}</span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  ${Number(d.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donations.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhuma doação no período</p>
        )}
      </div>
    </DashboardLayout>
  );
}
