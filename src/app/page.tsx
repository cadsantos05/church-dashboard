"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    visitors: 0,
    kidsCheckedIn: 0,
    totalDonationsMonth: 0,
    activeGroups: 0,
  });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecent();
  }, []);

  async function loadStats() {
    const { count: members } = await supabase
      .from("members").select("*", { count: "exact", head: true })
      .eq("church_id", CHURCH_ID).eq("active", true);

    const { count: visitors } = await supabase
      .from("members").select("*", { count: "exact", head: true })
      .eq("church_id", CHURCH_ID).eq("status", "visitor");

    const today = new Date().toISOString().split("T")[0];
    const { count: kidsToday } = await supabase
      .from("checkins").select("*", { count: "exact", head: true })
      .eq("church_id", CHURCH_ID).eq("service_date", today)
      .is("checked_out_at", null);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { data: donationsMonth } = await supabase
      .from("donations").select("amount")
      .eq("church_id", CHURCH_ID)
      .gte("donation_date", startOfMonth.toISOString().split("T")[0]);

    const totalMonth = (donationsMonth ?? []).reduce(
      (sum: number, d: any) => sum + Number(d.amount), 0
    );

    const { count: groups } = await supabase
      .from("groups").select("*", { count: "exact", head: true })
      .eq("church_id", CHURCH_ID).eq("active", true);

    setStats({
      totalMembers: members ?? 0,
      visitors: visitors ?? 0,
      kidsCheckedIn: kidsToday ?? 0,
      totalDonationsMonth: totalMonth,
      activeGroups: groups ?? 0,
    });
  }

  async function loadRecent() {
    const { data: donations } = await supabase
      .from("donations").select("*, members(full_name)")
      .eq("church_id", CHURCH_ID)
      .order("created_at", { ascending: false }).limit(5);
    setRecentDonations(donations ?? []);

    const today = new Date().toISOString().split("T")[0];
    const { data: checkins } = await supabase
      .from("checkins").select("*, children:child_id(full_name, classroom)")
      .eq("church_id", CHURCH_ID).eq("service_date", today)
      .order("checked_in_at", { ascending: false }).limit(5);
    setRecentCheckins(checkins ?? []);
  }

  const cards = [
    { label: "Membros", value: stats.totalMembers, icon: "👥", color: "bg-blue-600" },
    { label: "Visitantes", value: stats.visitors, icon: "🙋", color: "bg-purple-600" },
    { label: "Kids Hoje", value: stats.kidsCheckedIn, icon: "👶", color: "bg-green-600" },
    { label: "Doações (mês)", value: `$${stats.totalDonationsMonth.toLocaleString()}`, icon: "💰", color: "bg-amber-600" },
    { label: "Grupos", value: stats.activeGroups, icon: "🏘️", color: "bg-indigo-600" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da sua igreja</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-2 h-2 rounded-full ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Kids Check-ins */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kids Check-in Hoje</h2>
          {recentCheckins.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum check-in hoje</p>
          ) : (
            <div className="space-y-3">
              {recentCheckins.map((ci: any) => (
                <div key={ci.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ci.children?.full_name}</p>
                    <p className="text-xs text-gray-400">{ci.children?.classroom}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">✓ Check-in</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Últimas Doações</h2>
          {recentDonations.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma doação registrada</p>
          ) : (
            <div className="space-y-3">
              {recentDonations.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.members?.full_name || d.donor_name || "Anônimo"}</p>
                    <p className="text-xs text-gray-400">{new Date(d.donation_date).toLocaleDateString("pt-BR")} • {d.method}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">${Number(d.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
