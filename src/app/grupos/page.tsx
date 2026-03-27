"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Group {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  meeting_day: number | null;
  meeting_time: string | null;
  location: string | null;
  group_type: string;
  active: boolean;
  leader?: { full_name: string } | null;
  member_count?: number;
}

interface Member {
  id: string;
  full_name: string;
}

interface GroupMember {
  id: string;
  member_id: string;
  role: string;
  members: { full_name: string };
}

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", leader_id: "", meeting_day: "",
    meeting_time: "", location: "", group_type: "cell",
  });
  const [saving, setSaving] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [addMemberId, setAddMemberId] = useState("");

  useEffect(() => {
    loadGroups();
    loadMembers();
  }, []);

  async function loadMembers() {
    const { data } = await supabase.from("members").select("id, full_name")
      .eq("church_id", CHURCH_ID).eq("active", true).order("full_name");
    setMembers(data ?? []);
  }

  async function loadGroups() {
    const { data } = await supabase
      .from("groups").select("*, leader:leader_id(full_name)")
      .eq("church_id", CHURCH_ID).order("name");

    if (data) {
      const withCount = await Promise.all(data.map(async (g) => {
        const { count } = await supabase.from("group_members")
          .select("*", { count: "exact", head: true }).eq("group_id", g.id);
        return { ...g, member_count: count ?? 0 };
      }));
      setGroups(withCount);
    }
  }

  async function loadGroupMembers(groupId: string) {
    const { data } = await supabase.from("group_members")
      .select("*, members:member_id(full_name)")
      .eq("group_id", groupId).order("role");
    setGroupMembers((data as any) ?? []);
  }

  async function handleSaveGroup() {
    if (!form.name.trim()) return;
    setSaving(true);
    await supabase.from("groups").insert({
      church_id: CHURCH_ID,
      name: form.name.trim(),
      description: form.description.trim() || null,
      leader_id: form.leader_id || null,
      meeting_day: form.meeting_day !== "" ? parseInt(form.meeting_day) : null,
      meeting_time: form.meeting_time || null,
      location: form.location.trim() || null,
      group_type: form.group_type,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", description: "", leader_id: "", meeting_day: "", meeting_time: "", location: "", group_type: "cell" });
    loadGroups();
  }

  async function handleDeleteGroup(id: string, name: string) {
    if (!confirm(`Remover grupo "${name}"?`)) return;
    await supabase.from("group_members").delete().eq("group_id", id);
    await supabase.from("groups").delete().eq("id", id);
    setSelectedGroup(null);
    loadGroups();
  }

  async function handleAddMember() {
    if (!addMemberId || !selectedGroup) return;
    await supabase.from("group_members").insert({
      group_id: selectedGroup,
      member_id: addMemberId,
    });
    setAddMemberId("");
    loadGroupMembers(selectedGroup);
    loadGroups();
  }

  async function handleRemoveMember(gmId: string) {
    await supabase.from("group_members").delete().eq("id", gmId);
    if (selectedGroup) loadGroupMembers(selectedGroup);
    loadGroups();
  }

  async function handleToggleRole(gmId: string, currentRole: string) {
    const newRole = currentRole === "leader" ? "member" : "leader";
    await supabase.from("group_members").update({ role: newRole }).eq("id", gmId);
    if (selectedGroup) loadGroupMembers(selectedGroup);
  }

  function selectGroup(groupId: string) {
    setSelectedGroup(groupId === selectedGroup ? null : groupId);
    if (groupId !== selectedGroup) loadGroupMembers(groupId);
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos / Células</h1>
          <p className="text-gray-500 text-sm mt-1">{groups.length} grupos ativos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Novo Grupo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Criar Grupo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nome do grupo *"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.group_type} onChange={(e) => setForm({ ...form, group_type: e.target.value })}>
              <option value="cell">Célula</option>
              <option value="study">Estudo Bíblico</option>
              <option value="ministry">Ministério</option>
              <option value="class">Classe</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.leader_id} onChange={(e) => setForm({ ...form, leader_id: e.target.value })}>
              <option value="">Líder (opcional)</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.meeting_day} onChange={(e) => setForm({ ...form, meeting_day: e.target.value })}>
              <option value="">Dia da reunião</option>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="time" placeholder="Horário"
              value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Local"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-4" rows={2}
            placeholder="Descrição (opcional)"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveGroup} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Salvando..." : "Criar Grupo"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* Groups list */}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
              onClick={() => selectGroup(g.id)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
                  {g.group_type === "cell" ? "🏘️" : g.group_type === "study" ? "📖" : g.group_type === "ministry" ? "⛪" : "📚"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">
                    {g.leader?.full_name ? `Líder: ${g.leader.full_name}` : "Sem líder"}
                    {g.meeting_day !== null ? ` • ${DAYS[g.meeting_day]}` : ""}
                    {g.meeting_time ? ` ${g.meeting_time.slice(0, 5)}` : ""}
                    {g.location ? ` • ${g.location}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {g.member_count} membros
                </span>
                <span className="text-gray-300">{selectedGroup === g.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded: members list */}
            {selectedGroup === g.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                {/* Add member */}
                <div className="flex gap-2 mb-4">
                  <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}>
                    <option value="">Adicionar membro...</option>
                    {members
                      .filter((m) => !groupMembers.some((gm) => gm.member_id === m.id))
                      .map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  <button onClick={handleAddMember} disabled={!addMemberId}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30">
                    Adicionar
                  </button>
                  <button onClick={() => handleDeleteGroup(g.id, g.name)}
                    className="text-red-400 hover:text-red-600 px-3 py-2 text-sm">
                    Excluir grupo
                  </button>
                </div>

                {/* Members table */}
                {groupMembers.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhum membro no grupo</p>
                ) : (
                  <div className="space-y-2">
                    {groupMembers.map((gm) => (
                      <div key={gm.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {gm.members.full_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{gm.members.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleRole(gm.id, gm.role)}
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              gm.role === "leader" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
                            }`}>
                            {gm.role === "leader" ? "Líder" : "Membro"}
                          </button>
                          <button onClick={() => handleRemoveMember(gm.id)}
                            className="text-xs text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🏘️</p>
            <h2 className="text-lg font-semibold text-gray-900">Nenhum grupo cadastrado</h2>
            <p className="text-gray-500 text-sm mt-2">Clique em "+ Novo Grupo" para criar o primeiro.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
