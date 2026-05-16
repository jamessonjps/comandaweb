import React from 'react';
import { Users, Clock, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatElapsedTime } from '@/utils/formatters';

export type MesaStatus = 'livre' | 'ocupada' | 'fechando' | 'reservada';

interface MesaProps {
  numero: number;
  status: MesaStatus;
  capacidade: number;
  setor?: string;
  totalParcial?: number;
  abertaEm?: string;
  onClick: () => void;
}

export const MesaCard = ({ 
  numero, 
  status, 
  capacidade, 
  setor, 
  totalParcial, 
  abertaEm, 
  onClick 
}: MesaProps) => {
  const statusConfig = {
    livre: { variant: 'default' as const, label: 'Livre' },
    ocupada: { variant: 'info' as const, label: 'Ocupada' },
    fechando: { variant: 'warning' as const, label: 'Fechando' },
    reservada: { variant: 'danger' as const, label: 'Reservada' }
  };

  const config = statusConfig[status];

  return (
    <Card 
      onClick={onClick}
      className={`relative flex flex-col gap-4 overflow-hidden ${status === 'fechando' ? 'border-warning/50' : ''}`}
    >
      {/* Setor e Status */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
          {setor || 'Geral'}
        </span>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {/* Numero e Capacidade */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-text-secondary">Mesa</span>
          <span className="text-4xl font-display font-black text-text-primary leading-none">
            {numero.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Users size={14} />
          <span>{capacidade}</span>
        </div>
      </div>

      {/* Info de Ocupação */}
      {status !== 'livre' && (
        <div className="mt-2 pt-4 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-text-secondary">
              <Clock size={12} />
              <span>{abertaEm ? formatElapsedTime(abertaEm) : '--'}</span>
            </div>
            <div className="flex items-center gap-1 text-accent font-bold">
              <Receipt size={12} />
              <span>{formatCurrency(totalParcial || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Glow para status Ocupada/Fechando */}
      {status === 'ocupada' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 blur-3xl rounded-full -mr-12 -mt-12" />
      )}
      {status === 'fechando' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 blur-3xl rounded-full -mr-12 -mt-12 animate-pulse" />
      )}
    </Card>
  );
};
