import { Portal } from './Portal';

type Props = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmModal({ message, confirmLabel = 'Confirmar', onConfirm, onCancel, danger = false }: Props) {
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <p className="text-sm text-slate-700 mb-6">{message}</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
              Cancelar
            </button>
            <button onClick={onConfirm} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
