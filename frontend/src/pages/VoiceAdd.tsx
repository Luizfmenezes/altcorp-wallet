import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mic, MicOff, Loader2, Check, DollarSign,
  CreditCard, FileText, Wallet, RotateCcw, Sparkles,
  ChevronDown, Volume2, CalendarDays, Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import CategoryIcon from '@/components/CategoryIcon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Stage = 'idle' | 'recording' | 'processing' | 'confirm' | 'done';

interface ExtractedData {
  transcricao: string;
  valor: number;
  categoria: string;
  descricao: string;
  metodo_pagamento: string;
  nome_cartao: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Alimentacao', 'Transporte', 'Moradia', 'Lazer',
  'Saude', 'Educacao', 'Compras', 'Servicos', 'Outros',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  'Alimentacao': 'Alimentação', 'Transporte': 'Transporte', 'Moradia': 'Moradia',
  'Lazer': 'Lazer', 'Saude': 'Saúde', 'Educacao': 'Educação',
  'Compras': 'Compras', 'Servicos': 'Serviços', 'Outros': 'Outros',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const VoiceAdd: React.FC = () => {
  const navigate = useNavigate();
  const { cards, addExpense, addInvoiceItem, people } = useFinance();
  const { toast } = useToast();

  const [stage, setStage] = useState<Stage>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  // Editable fields
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [metodo, setMetodo] = useState('avulso');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);

  // Data -- padrao hoje, editavel via calendario nativo
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const owner = people?.[0] || 'Usuario';

  const matchCard = useMemo(() => (name: string) => {
    if (!name) return undefined;
    const lower = name.toLowerCase().trim();
    return cards.find((c) => c.name.toLowerCase().includes(lower));
  }, [cards]);

  useEffect(() => {
    if (!extracted) return;
    setValor(extracted.valor > 0 ? extracted.valor.toFixed(2) : '');
    setDescricao(extracted.descricao);
    // Normaliza categoria vinda da IA para a chave interna
    const catMap: Record<string, string> = {
      'alimentacao': 'Alimentacao', 'alimentação': 'Alimentacao',
      'transporte': 'Transporte', 'moradia': 'Moradia', 'lazer': 'Lazer',
      'saude': 'Saude', 'saúde': 'Saude', 'educacao': 'Educacao', 'educação': 'Educacao',
      'compras': 'Compras', 'servicos': 'Servicos', 'serviços': 'Servicos', 'outros': 'Outros',
    };
    const catKey = catMap[extracted.categoria?.toLowerCase()] ?? 'Outros';
    setCategoria(CATEGORIES.includes(catKey as typeof CATEGORIES[number]) ? catKey : 'Outros');
    const isCard = extracted.metodo_pagamento === 'cartao' || !!extracted.nome_cartao;
    setMetodo(isCard ? 'cartao' : 'avulso');
    setSelectedCardId(matchCard(extracted.nome_cartao)?.id ?? '');
  }, [extracted, matchCard]);

  useEffect(() => {
    if (stage === 'recording') {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ===================== RECORDING =====================
  const startRecording = async () => {
    try {
      setError('');
      setExtracted(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); processAudio(); };
      mr.start(250);
      setStage('recording');
    } catch {
      setError('Nao foi possivel acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStage('processing');
    }
  };

  // ===================== PROCESS =====================
  const processAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const fd = new FormData();
    fd.append('file', blob, 'audio.webm');
    try {
      const res = await fetch('/ai-audio/processar-audio', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(body.detail || `Erro ${res.status}`);
      }
      const data: ExtractedData = await res.json();
      setExtracted(data);
      setStage('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar audio');
      setStage('idle');
    }
  };

  // ===================== SAVE =====================
  const handleSave = async () => {
    const num = Number.parseFloat(valor.replace(',', '.'));
    if (!num || num <= 0) {
      toast({ title: 'Valor invalido', description: 'Informe um valor maior que zero.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      if (metodo === 'cartao' && selectedCardId) {
        await addInvoiceItem(selectedCardId, { description: descricao, amount: num, category: CATEGORY_LABELS[categoria] ?? categoria, date, owner });
      } else {
        await addExpense({ description: descricao, amount: num, category: CATEGORY_LABELS[categoria] ?? categoria, date, owner, isRecurring: false });
      }
      setStage('done');
      toast({ title: 'Gasto registrado!', description: `${descricao} - R$ ${num.toFixed(2)}` });
      setTimeout(() => navigate('/'), 1200);
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStage('idle'); setExtracted(null); setError('');
    setShowCatPicker(false); setShowCardPicker(false);
    setDate(todayStr);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const dateLabel = (() => {
    if (date === todayStr) return 'Hoje';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  })();

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  };
  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const pulse = { animate: { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 1.5 } } };

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 px-4 pt-6 pb-4"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Registro por Voz
          </h1>
        </div>
      </motion.div>

      <div className="px-4 max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {stage === 'idle' && (
            <motion.div key="idle" {...fadeUp} className="flex flex-col items-center gap-6 pt-12">
              <motion.div
                className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 cursor-pointer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
              >
                <Mic className="w-14 h-14 text-white" />
              </motion.div>

              <p className="text-slate-400 text-center text-sm max-w-xs">
                Toque no microfone e diga seu gasto. <br />
                Ex.: <span className="text-violet-300 italic">&quot;Gastei 45 reais no almoco, cartao Nubank&quot;</span>
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 w-full text-center"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RECORDING */}
          {stage === 'recording' && (
            <motion.div key="recording" {...fadeUp} className="flex flex-col items-center gap-6 pt-10">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full bg-red-500/30"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
                />
                <motion.div
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/40 cursor-pointer z-10"
                  {...pulse}
                  onClick={stopRecording}
                >
                  <MicOff className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-red-400 font-semibold animate-pulse text-lg">Gravando...</p>
                <motion.div className="flex items-center gap-2 text-slate-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Volume2 className="w-4 h-4" />
                  <span className="font-mono">{fmt(elapsed)}</span>
                </motion.div>
              </div>
              <p className="text-slate-500 text-xs text-center">Toque para parar a gravacao</p>
            </motion.div>
          )}

          {/* PROCESSING */}
          {stage === 'processing' && (
            <motion.div key="processing" {...fadeUp} className="flex flex-col items-center gap-6 pt-16">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                <Loader2 className="w-14 h-14 text-violet-400" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-violet-300 font-semibold">Processando...</p>
                <p className="text-slate-500 text-xs">Transcrevendo e analisando com IA local</p>
              </div>
            </motion.div>
          )}

          {/* CONFIRM */}
          {stage === 'confirm' && extracted && (
            <motion.div key="confirm" variants={stagger} initial="initial" animate="animate" exit="exit" className="space-y-4">

              {/* Transcricao */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">Transcricao</p>
                <p className="text-slate-300 text-sm italic">"{extracted.transcricao}"</p>
              </motion.div>

              {/* Valor */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-2xl font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="bg-transparent text-3xl font-bold text-white outline-none w-full"
                  />
                </div>
              </motion.div>

              {/* Descrição */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  <FileText className="w-3.5 h-3.5 text-sky-400" /> Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="bg-transparent text-white text-base outline-none w-full"
                  placeholder="Ex: Almoco no restaurante"
                />
              </motion.div>

              {/* Data */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-400" /> Data
                </label>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-medium ${date === todayStr ? 'text-white' : 'text-violet-300'}`}>
                    {dateLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-300 text-xs"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    {date === todayStr ? 'Alterar' : 'Mudar'}
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    max={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  />
                </div>
              </motion.div>

              {/* Categoria */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatPicker(!showCatPicker)}
                  className="flex items-center justify-between w-full text-white text-base"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon category={categoria} size={22} iconSize={13} />
                    {CATEGORY_LABELS[categoria] ?? categoria}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCatPicker ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCatPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setCategoria(cat); setShowCatPicker(false); }}
                            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs transition-all ${
                              categoria === cat
                                ? 'bg-violet-600/40 border border-violet-400/50 text-white'
                                : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            <CategoryIcon category={cat} size={28} iconSize={16} className="mb-0.5" />
                            <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Tipo de Gasto */}
              <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  <Wallet className="w-3.5 h-3.5 text-pink-400" /> Tipo de Gasto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodo('avulso')}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      metodo === 'avulso'
                        ? 'bg-violet-600/40 border border-violet-400/50 text-white'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" /> Gasto Avulso
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('cartao')}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      metodo === 'cartao'
                        ? 'bg-violet-600/40 border border-violet-400/50 text-white'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> No Cartao
                  </button>
                </div>
              </motion.div>

              {/* Cartao */}
              <AnimatePresence>
                {metodo === 'cartao' && (
                  <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-violet-400" /> Cartao
                    </label>
                    {cards.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nenhum cartao cadastrado.</p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowCardPicker(!showCardPicker)}
                          className="flex items-center justify-between w-full text-white text-base"
                        >
                          <span className="flex items-center gap-2">
                            {selectedCard ? (
                              <>
                                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedCard.color }} />
                                {selectedCard.name}
                              </>
                            ) : (
                              <span className="text-slate-400">Selecione o cartao</span>
                            )}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCardPicker ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {showCardPicker && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-3 space-y-1"
                            >
                              {cards.map((card) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => { setSelectedCardId(card.id); setShowCardPicker(false); }}
                                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
                                    selectedCardId === card.id
                                      ? 'bg-violet-600/40 border border-violet-400/50 text-white'
                                      : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                                  <span>{card.name}</span>
                                  <span className="ml-auto text-xs text-slate-500 capitalize">{card.type}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botoes de acao */}
              <motion.div variants={fadeUp} className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all flex-1"
                >
                  <RotateCcw className="w-4 h-4" /> Regravar
                </button>
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all flex-[2] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Registrar
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* DONE */}
          {stage === 'done' && (
            <motion.div key="done" {...fadeUp} className="flex flex-col items-center gap-5 pt-20">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <motion.p
                className="text-xl font-bold text-emerald-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Registrado com sucesso!
              </motion.p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceAdd;