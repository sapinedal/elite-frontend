import { useEffect, useState } from 'react';
import { contratacionService, getApiErrorMessage } from '../services/contratacionService';
import type { ContractorContract } from '../types';

interface Result {
  key: string;
  contracts: ContractorContract[];
  error: string | null;
}

/**
 * Contratos del proveedor elegido, consultados al backend cada vez que cambia el proveedor (o el proyecto).
 * Lo usan los formularios que piden proveedor y contrato: cortes, anticipos y cuentas de cobro.
 */
export function useContractorContracts(contractorId: number | null, projectId?: number | null) {
  const key = contractorId ? `${contractorId}:${projectId ?? ''}` : null;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!key || !contractorId) return;
    let cancelled = false;

    contratacionService.getContractsByContractor(contractorId, projectId)
      .then((contracts) => {
        if (!cancelled) setResult({ key, contracts, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, contracts: [], error: getApiErrorMessage(err, 'No se pudieron cargar los contratos del proveedor.') });
      });

    return () => {
      cancelled = true;
    };
  }, [key, contractorId, projectId]);

  // Solo vale el resultado de la consulta actual: al cambiar de proveedor no se muestran los contratos del anterior
  const current = key && result?.key === key ? result : null;

  return {
    contracts: current?.contracts ?? [],
    loading: key !== null && current === null,
    error: current?.error ?? null,
  };
}
