import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Bell, Circle } from "lucide-react";

export default function SVNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">INBOX</div>
          <div className="text-white font-bold text-base">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-16 text-center">
          <Bell size={40} className="text-[#21262d] mx-auto mb-3" />
          <div className="text-[#484f58] text-sm font-medium">No notifications</div>
          <div className="text-[#484f58] text-xs mt-1">You're all caught up.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`bg-[#161b22] border rounded-xl px-4 py-4 cursor-pointer transition-colors ${
                n.is_read
                  ? "border-[#21262d]"
                  : "border-blue-500/30 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  {!n.is_read ? (
                    <Circle size={8} className="text-blue-400 fill-blue-400" />
                  ) : (
                    <Circle size={8} className="text-[#21262d]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${n.is_read ? "text-[#8b949e]" : "text-white"}`}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div className="text-[#484f58] text-xs mt-1 leading-relaxed">{n.message}</div>
                  )}
                  <div className="text-[#484f58] text-xs mt-2">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </div>
                </div>
                {n.type && (
                  <span className="text-[10px] font-bold tracking-widest text-[#484f58] bg-[#21262d] rounded px-2 py-0.5 flex-shrink-0">
                    {n.type.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
