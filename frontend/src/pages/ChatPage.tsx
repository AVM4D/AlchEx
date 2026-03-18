import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageCircle, Search, Check, CheckCheck, Trash2 } from 'lucide-react';
import { chatApi, transactionsApi } from '../services/dataService';
import { getSocket, connectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../lib/utils';
import type { Transaction, Message } from '../types';

export default function ChatPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [hiddenChats, setHiddenChats] = useState<string[]>([]);
  const [hiddenChatsLoaded, setHiddenChatsLoaded] = useState(false);
  const [hiddenChatsLoadedKey, setHiddenChatsLoadedKey] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hiddenChatsStorageKey = `hiddenChats:${user?.id || 'guest'}`;

  useEffect(() => {
    setHiddenChatsLoaded(false);
    try {
      const raw = localStorage.getItem(hiddenChatsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setHiddenChats(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHiddenChats([]);
    } finally {
      setHiddenChatsLoadedKey(hiddenChatsStorageKey);
      setHiddenChatsLoaded(true);
    }
  }, [hiddenChatsStorageKey]);

  useEffect(() => {
    if (!hiddenChatsLoaded || hiddenChatsLoadedKey !== hiddenChatsStorageKey) return;
    try {
      localStorage.setItem(hiddenChatsStorageKey, JSON.stringify(hiddenChats));
    } catch { }
  }, [hiddenChatsStorageKey, hiddenChats, hiddenChatsLoaded, hiddenChatsLoadedKey]);

  // Fetch conversations (transactions)
  useEffect(() => {
    if (!hiddenChatsLoaded) return;
    (async () => {
      try {
        const res = await transactionsApi.getMyTransactions({ limit: '50' });
        const d = res.data.data;
        const txs = d?.transactions || (Array.isArray(d) ? d : []);
        setTransactions((txs as Transaction[]).filter(tx => !hiddenChats.includes(tx.id)));
      } catch { }
      setLoading(false);
    })();
  }, [hiddenChats, hiddenChatsLoaded]);

  // Fetch messages for selected transaction
  useEffect(() => {
    if (!hiddenChatsLoaded) return;
    if (!transactionId || hiddenChats.includes(transactionId)) { setMessages([]); return; }
    (async () => {
      setMsgLoading(true);
      try {
        const res = await chatApi.getMessages(transactionId, { limit: '100' });
        const d = res.data.data;
        setMessages(d?.messages || (Array.isArray(d) ? d : []));
      } catch { }
      setMsgLoading(false);
    })();
  }, [transactionId, hiddenChats, hiddenChatsLoaded]);

  // If user opens a removed chat URL, redirect back to chat list
  useEffect(() => {
    if (!hiddenChatsLoaded) return;
    if (transactionId && hiddenChats.includes(transactionId)) {
      setMessages([]);
      setNewMsg('');
      navigate('/chat', { replace: true });
    }
  }, [transactionId, hiddenChats, hiddenChatsLoaded, navigate]);

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Socket.IO for real-time messages
  useEffect(() => {
    if (!transactionId || hiddenChats.includes(transactionId)) return;
    connectSocket();
    const socket = getSocket();
    socket.emit('join:transaction', transactionId);
    const onMsg = (msg: Message) => {
      if (msg.transactionId === transactionId) {
        setMessages(prev => {
          // Avoid duplicates (in case REST response already added it)
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };
    socket.on('message:new', onMsg);
    return () => { socket.off('message:new', onMsg); socket.emit('leave:transaction', transactionId); };
  }, [transactionId, hiddenChats]);

  const selectedTx = transactions.find(t => t.id === transactionId);
  const canSendMessages = selectedTx?.status === 'IN_PROGRESS';
  const canRemoveChat = selectedTx?.status === 'CANCELLED'
    || (selectedTx?.status === 'SUCCESSFUL' && !!selectedTx.requesterDone && !!selectedTx.offererDone);
  const showEmptyState = !transactionId || (hiddenChatsLoaded && transactionId && !selectedTx);

  const getDisabledMessage = (status?: string) => {
    if (status === 'SUCCESSFUL') return 'Transaction Completed . Chat Disabled';
    if (status === 'CANCELLED') return 'Transaction Cancelled . Chat Disabled';
    return 'Chat disabled for this transaction';
  };

  const removeCurrentChat = useCallback(() => {
    if (!transactionId) return;
    setHiddenChats(prev => (prev.includes(transactionId) ? prev : [...prev, transactionId]));
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    setMessages([]);
    setNewMsg('');
    navigate('/chat');
  }, [transactionId, navigate]);

  const sendMessage = useCallback(async () => {
    if (!newMsg.trim() || !transactionId || sending || !canSendMessages) return;
    setSending(true);
    try {
      // Send via socket for real-time delivery to both parties
      const socket = getSocket();
      socket.emit('message:send', { transactionId, content: newMsg.trim() });
      setNewMsg('');
      inputRef.current?.focus();
    } catch { }
    setSending(false);
  }, [newMsg, transactionId, sending, canSendMessages]);

  const getOtherUser = (tx: Transaction) =>
    tx.requesterId === user?.id ? tx.offerer : tx.requester;

  // Filter conversations by search query (name or post title)
  const filteredTransactions = transactions.filter(tx => {
    if (!chatSearch.trim()) return true;
    const q = chatSearch.toLowerCase();
    const other = getOtherUser(tx);
    const fullName = `${other.firstName} ${other.lastName}`.toLowerCase();
    const postTitle = (tx.post?.title || '').toLowerCase();
    return fullName.includes(q) || postTitle.includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -mx-5 md:-mx-6 -mb-5 md:-mb-6">
      {/* Conversations sidebar */}
      <div className={`w-full sm:w-72 md:w-80 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 ${showEmptyState ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-display text-lg text-[var(--text)]">Messages</h2>
          <div className="mt-3 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 flex gap-3 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-24" /><div className="skeleton h-3 w-32" /></div>
              </div>
            ))
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={32} className="mx-auto mb-3 text-[var(--text-3)]" />
              <p className="text-sm text-[var(--text-3)]">{chatSearch ? 'No matching conversations' : 'No conversations yet'}</p>
              {chatSearch && (
                <button onClick={() => setChatSearch('')} className="text-xs text-[var(--accent)] mt-2 hover:underline">Clear search</button>
              )}
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const other = getOtherUser(tx);
              const active = tx.id === transactionId;
              return (
                <button key={tx.id} onClick={() => navigate(`/chat/${tx.id}`)}
                  className={`w-full text-left p-4 flex gap-3 border-b border-[var(--border)] transition-colors ${active ? 'bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]' : 'hover:bg-[var(--surface-2)]'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-xs text-[var(--avatar-initials)] font-bold shrink-0">
                    {other.firstName.charAt(0)}{other.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text)] truncate">{other.firstName} {other.lastName}</span>
                      <span className="text-[10px] text-[var(--text-3)]">{formatRelativeTime(tx.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-3)] truncate mt-0.5">{tx.post.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[var(--bg)]">
        {showEmptyState ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-[var(--text-3)]" />
              </div>
              <h3 className="text-display text-lg text-[var(--text)] mb-1">Select a conversation</h3>
              <p className="text-sm text-[var(--text-3)]">Choose from your existing conversations</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl">
              <button onClick={() => navigate('/chat')} className="md:hidden text-[var(--text-2)] hover:text-[var(--text)]">
                <ArrowLeft size={18} />
              </button>
              {selectedTx && (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-xs text-[var(--avatar-initials)] font-bold">
                    {getOtherUser(selectedTx).firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{getOtherUser(selectedTx).firstName} {getOtherUser(selectedTx).lastName}</p>
                    <p className="text-[10px] text-[var(--text-3)] truncate">{selectedTx.post.title}</p>
                  </div>
                  {canRemoveChat && (
                    <button
                      onClick={removeCurrentChat}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                      title="Remove chat"
                      aria-label="Remove chat"
                    >
                      <Trash2 size={11} /> Remove Chat
                    </button>
                  )}
                  <span className={`pill text-[10px] ${selectedTx.status === 'IN_PROGRESS' ? 'text-[var(--accent)] border-[var(--accent)]/20' : selectedTx.status === 'SUCCESSFUL' ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'}`}>
                    {selectedTx.status}
                  </span>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
                    <div className="skeleton h-10 w-48 rounded-xl" />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="text-center text-[var(--text-3)] text-xs py-12">No messages yet. Say hello!</div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isSystem = msg.messageType === 'SYSTEM';
                    if (isSystem) {
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-1">
                          <span className="text-[10px] text-[var(--text-3)] bg-[var(--surface-2)] px-3 py-1 rounded-full">{msg.content}</span>
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] relative group ${isMe ? 'order-2' : ''}`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe
                            ? 'bg-gradient-to-r from-[var(--accent)] to-primary-500 text-black rounded-br-md'
                            : 'bg-[var(--surface-2)] text-[var(--text-1)] rounded-bl-md border border-[var(--border)]'
                            }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className="text-[9px] text-[var(--text-3)]">{formatRelativeTime(msg.createdAt)}</span>
                            {isMe && (msg.isRead ? <CheckCheck size={10} className="text-[var(--accent)]" /> : <Check size={10} className="text-[var(--text-3)]" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl">
              {!canSendMessages && selectedTx && (
                <p className="mb-2 text-[11px] text-[var(--text-3)]">
                  {getDisabledMessage(selectedTx.status)}
                </p>
              )}
              <div className="flex gap-2 items-center">
                <input ref={inputRef} value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && canSendMessages && sendMessage()}
                  placeholder={canSendMessages ? 'Type a message...' : 'Chat disabled for this transaction'}
                  disabled={!canSendMessages}
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
                <button onClick={sendMessage} disabled={!newMsg.trim() || sending || !canSendMessages}
                  className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center hover:bg-[var(--accent)]/90 disabled:opacity-30 transition-all">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
