"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  birth_date: string | null;
  joined_date: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  visitor: { label: "Visitante", color: "bg-yellow-100 text-yellow-700" },
  regular: { label: "Frequentador", color: "bg-blue-100 text-blue-700" },
  member: { label: "Membro", color: "bg-green-100 text-green-700" },
  leader: { label: "Líder", color: "bg-purple-100 text-purple-700" },
};

export default function PessoasPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", status: "visitor" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    let query = supabase.from("members").select("*")
      .eq("church_id", CHURCH_ID).eq("active", true)
      .order("full_name");
    const { data } = await query;
    setMembers(data ?? []);
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    await supabase.from("members").insert({
      church_id: CHURCH_ID,
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ full_name: "", email: "", phone: "", status: "visitor" });
    loadMembers();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover ${name}?`)) return;
    await supabase.from("members").update({ active: false }).eq("id", id);
    loadMembers();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await supabase.from("members").update({ status: newStatus }).eq("id", id);
    loadMembers();
  }

  const filtered = members.filter((m) => {
    const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pessoas</h1>
          <p className="text-gray-500 text-sm mt-1">{members.length} cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nova Pessoa
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Cadastrar Pessoa</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Nome completo *"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="visitor">Visitante</option>
              <option value="regular">Frequentador</option>
              <option value="member">Membro</option>
              <option value="leader">Líder</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="visitor">Visitantes</option>
          <option value="regular">Frequentadores</option>
          <option value="member">Membros</option>
          <option value="leader">Líderes</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contato</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {m.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{m.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-600">{m.email || "—"}</p>
                  <p className="text-xs text-gray-400">{m.phone || ""}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${STATUS_LABELS[m.status]?.color || "bg-gray-100 text-gray-600"}`}
                    value={m.status}
                    onChange={(e) => handleStatusChange(m.id, e.target.value)}
                  >
                    <option value="visitor">Visitante</option>
                    <option value="regular">Frequentador</option>
                    <option value="member">Membro</option>
                    <option value="leader">Líder</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(m.id, m.full_name)}
                    className="text-xs text-red-400 hover:text-red-600">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhuma pessoa encontrada</p>
        )}
      </div>
    </DashboardLayout>
  );
}
