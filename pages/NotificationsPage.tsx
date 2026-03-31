
import React, { useState } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, Info, CreditCard,
  Package, FileText, Clock, Check, Trash2, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type NotifCategory = 'all' | 'unread' | 'invoices' | 'payments' | 'system';
type Notif = typeof ALL_NOTIFICATIONS[number];

const ALL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Overdue Invoice',
    message: 'Invoice INV-0042 from Tropical Wood NV is 14 days overdue. Action required.',
    time: '2 hours ago',
    date: 'Today',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    isRead: false,
    category: 'invoices',
    link: '/invoices',
  },
  {
    id: 2,
    title: 'Payment Received',
    message: 'USD 3,450 received from Caribbean Furniture Group for INV-0038.',
    time: '1 day ago',
    date: 'Yesterday',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    isRead: true,
    category: 'payments',
    link: '/payments',
  },
  {
    id: 3,
    title: 'New Estimate Requested',
    message: 'Jiawan Interiors has requested an estimate for Merbau flooring.',
    time: '2 days ago',
    date: 'Yesterday',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isRead: false,
    category: 'invoices',
    link: '/estimates',
  },
  {
    id: 4,
    title: 'Stock Running Low',
    message: 'Cedar planks (4x10cm) have only 12 CBM stock remaining. Reordering recommended.',
    time: '3 dagen geleden',
    date: 'Ma 9 maart',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isRead: true,
    category: 'system',
    link: '/products',
  },
  {
    id: 5,
    title: 'Credit Note Processed',
    message: 'Credit Note CN-0011 for USD 850 has been approved and processed.',
    time: '4 dagen geleden',
    date: 'Ma 9 maart',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    isRead: true,
    category: 'payments',
    link: '/credits',
  },
  {
    id: 6,
    title: 'System Update Complete',
    message: 'Ramzon ERP has been updated to version 2.4.1. New features available.',
    time: '5 dagen geleden',
    date: 'Zo 8 maart',
    icon: Info,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    isRead: true,
    category: 'system',
    link: null,
  },
  {
    id: 7,
    title: 'Invoice Expiring Soon',
    message: 'Invoice INV-0045 from Dinesh Abhelak expires in 3 days (USD 1,200).',
    time: '6 dagen geleden',
    date: 'Za 7 maart',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isRead: true,
    category: 'invoices',
    link: '/invoices',
  },
];

const CATEGORY_TABS: { id: NotifCategory; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'unread',   label: 'Unread' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'system',   label: 'System' },
];

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotifCategory>('all');
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS);

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  const markRead = (id: number) => setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  const dismiss = (id: number) => setNotifications(n => n.filter(x => x.id !== id));

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Group by date
  const grouped = filtered.reduce<Record<string, Notif[]>>((acc, n) => {
    acc[n.date] = acc[n.date] ? [...acc[n.date], n] : [n];
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Notifications</h1>
          <p className="text-slate-500 font-bold italic mt-0.5 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
              ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
          >
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-primary text-white text-[8px] flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
          <Bell size={48} strokeWidth={1.5} />
          <p className="text-sm font-black uppercase tracking-widest">No notifications</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped) as [string, Notif[]][]).map(([date, items]) => (
            <div key={date} className="space-y-2">
              {/* Date label */}
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">{date}</p>

              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
                {items.map(n => (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-4 px-5 py-4 transition-all hover:bg-slate-50 relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    {/* Unread dot */}
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${n.bgColor} ${n.color} mt-0.5`}>
                      <n.icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-black leading-tight ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1">{n.message}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n.link && (
                          <button
                            onClick={() => { markRead(n.id); navigate(n.link!); }}
                            className="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline"
                          >
                            View →
                          </button>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-red-400 ml-auto flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
