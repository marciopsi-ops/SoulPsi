import React, { useState } from "react";
import {
  Percent,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";

interface ReadjustmentEntry {
  id?: string;
  date: string;
  percent: number;
  valueBefore: number;
  valueAfter: number;
  notes: string;
}

interface ReadjustmentHistoryManagerProps {
  userId: string;
  entityId: string;
  entityType: "client" | "company";
  history: ReadjustmentEntry[];
  onHistoryUpdated: (updatedHistory: ReadjustmentEntry[]) => void;
}

export function ReadjustmentHistoryManager({
  userId,
  entityId,
  entityType,
  history = [],
  onHistoryUpdated,
}: ReadjustmentHistoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states for adding/editing
  const [formDate, setFormDate] = useState("");
  const [formPercent, setFormPercent] = useState("");
  const [formValueBefore, setFormValueBefore] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const formatMoney = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  // Helper to calculate final value
  const calculateValueAfter = (before: string, percent: string): number => {
    const b = parseFloat(before) || 0;
    const p = parseFloat(percent) || 0;
    return b * (1 + p / 100);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPercent("");
    setFormValueBefore("");
    setFormNotes("");
  };

  const handleStartEdit = (index: number, entry: ReadjustmentEntry) => {
    setEditingIndex(index);
    setIsAdding(false);
    // Format date string to YYYY-MM-DD
    let formattedDate = entry.date;
    if (entry.date.includes("T")) {
      formattedDate = entry.date.split("T")[0];
    }
    setFormDate(formattedDate);
    setFormPercent(entry.percent.toString());
    setFormValueBefore(entry.valueBefore.toString());
    setFormNotes(entry.notes || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;

    const percentVal = parseFloat(formPercent) || 0;
    const beforeVal = parseFloat(formValueBefore) || 0;
    const afterVal = calculateValueAfter(formValueBefore, formPercent);

    const newEntry: ReadjustmentEntry = {
      id: Date.now().toString(),
      date: formDate,
      percent: percentVal,
      valueBefore: beforeVal,
      valueAfter: parseFloat(afterVal.toFixed(2)),
      notes: formNotes,
    };

    let updatedHistory = [...history];

    if (isAdding) {
      updatedHistory = [newEntry, ...updatedHistory];
    } else if (editingIndex !== null) {
      updatedHistory[editingIndex] = {
        ...updatedHistory[editingIndex],
        date: formDate,
        percent: percentVal,
        valueBefore: beforeVal,
        valueAfter: parseFloat(afterVal.toFixed(2)),
        notes: formNotes,
      };
    }

    try {
      const collectionPath = entityType === "client" ? "clients" : "companies";
      const docRef = doc(db, `profiles/${userId}/${collectionPath}/${entityId}`);
      await updateDoc(docRef, {
        readjustmentHistory: updatedHistory,
      });

      onHistoryUpdated(updatedHistory);
      setIsAdding(false);
      setEditingIndex(null);
    } catch (err) {
      console.error("Erro ao salvar reajuste histórico:", err);
      alert("Ocorreu um erro ao salvar o reajuste. Tente novamente.");
    }
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm("Deseja realmente excluir este reajuste do histórico?")) {
      return;
    }

    const updatedHistory = history.filter((_, idx) => idx !== index);

    try {
      const collectionPath = entityType === "client" ? "clients" : "companies";
      const docRef = doc(db, `profiles/${userId}/${collectionPath}/${entityId}`);
      await updateDoc(docRef, {
        readjustmentHistory: updatedHistory,
      });

      onHistoryUpdated(updatedHistory);
    } catch (err) {
      console.error("Erro ao excluir reajuste histórico:", err);
      alert("Ocorreu um erro ao excluir o reajuste. Tente novamente.");
    }
  };

  const computedAfter = calculateValueAfter(formValueBefore, formPercent);

  return (
    <div className="mb-6 bg-amber-50/20 p-5 rounded-xl border border-amber-100/70 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-500" />
          Histórico de Reajustes Anuais
        </h4>
        {!isAdding && editingIndex === null && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Reajuste
          </button>
        )}
      </div>

      {/* Inline Form for Adding or Editing */}
      {(isAdding || editingIndex !== null) && (
        <form onSubmit={handleSave} className="bg-white border border-amber-200/60 rounded-xl p-4 mb-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h5 className="text-xs font-bold text-slate-800">
              {isAdding ? "Novo Registro de Reajuste" : "Editar Registro de Reajuste"}
            </h5>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingIndex(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Data do Reajuste *
              </label>
              <input
                required
                type="date"
                className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-xs bg-white text-slate-900"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Alíquota (%) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 5.5"
                className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-xs bg-white text-slate-900"
                value={formPercent}
                onChange={(e) => setFormPercent(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Valor Antes do Reajuste (R$) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150.00"
                className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-xs bg-white text-slate-900"
                value={formValueBefore}
                onChange={(e) => setFormValueBefore(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Novo Valor Calculado (R$)
              </label>
              <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-emerald-700 font-mono h-[34px] flex items-center">
                {formatMoney(computedAfter)}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <input
              type="text"
              placeholder="Ex: Reajuste anual acordado conforme IPCA..."
              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-xs bg-white text-slate-900"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingIndex(null);
              }}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              {isAdding ? "Gravar Reajuste" : "Salvar Alterações"}
            </button>
          </div>
        </form>
      )}

      {/* History List */}
      {history && history.length > 0 ? (
        <div className="grid gap-2">
          {history.map((hist: any, index: number) => {
            // Clean up visual date
            let displayDate = hist.date;
            try {
              if (hist.date) {
                // Parse date properly even with timezone issues
                const d = new Date(hist.date + "T12:00:00");
                if (!isNaN(d.getTime())) {
                  displayDate = format(d, "dd/MM/yyyy");
                }
              }
            } catch (err) {
              console.error("Erro ao formatar data:", err);
            }

            // Calculate after value if not already saved explicitly (backwards compatibility)
            const percent = hist.percent || hist.percent === 0 ? hist.percent : (hist.aliquota || 0);
            const valBefore = hist.valueBefore || 0;
            const valAfter = hist.valueAfter || hist.newValue || (valBefore * (1 + percent / 100));

            return (
              <div
                key={hist.id || index}
                className="bg-white border border-amber-100/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-amber-200/80 transition"
              >
                <div className="text-left flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {displayDate}
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md font-sans">
                      {percent}% Reajuste
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700 text-xs font-sans">
                    <div>
                      Valor Anterior: <span className="font-semibold text-slate-800">{formatMoney(valBefore)}</span>
                    </div>
                    <div>
                      Valor Reajustado: <span className="font-bold text-emerald-700 font-mono">{formatMoney(valAfter)}</span>
                    </div>
                  </div>

                  {hist.notes && (
                    <div className="text-slate-500 text-xs mt-1.5 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      <strong className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Obs:</strong>
                      {hist.notes}
                    </div>
                  )}
                </div>

                {editingIndex === null && !isAdding && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(index, {
                        ...hist,
                        percent,
                        valueBefore: valBefore,
                        valueAfter: valAfter,
                      })}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Editar registro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic mt-1 bg-white/50 border border-slate-100 p-3 rounded-lg text-center">
          Nenhum reajuste anual confirmado até o momento.
        </p>
      )}
    </div>
  );
}
