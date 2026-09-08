import { supabase } from "@/integrations/supabase/client";

export const FUSO = "America/Sao_Paulo";

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export function moeda(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  });
}

export function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: FUSO,
  });
}

export function dataLonga(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: FUSO,
  });
}

/** Data local (fuso da barbearia) no formato YYYY-MM-DD. */
export function isoData(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function proximosDias(quantidade: number) {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Remove qualquer marcação/controle de texto livre antes de guardar (defesa contra XSS). */
export function textoSeguro(valor: string, max = 500) {
  return valor
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

export function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const csv = linhas
    .map((l) =>
      l
        .map((c) => {
          const s = String(c ?? "");
          return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buscarHorariosDisponiveis(barbeiroId: string, data: string, duracao: number) {
  const { data: slots, error } = await supabase.rpc("horarios_disponiveis", {
    p_barbeiro: barbeiroId,
    p_data: data,
    p_duracao: duracao,
  });
  if (error) throw error;
  return (slots as unknown as string[]) ?? [];
}

export function mensagemErro(erro: unknown) {
  const bruto =
    typeof erro === "object" && erro !== null && "message" in erro
      ? String((erro as { message: unknown }).message)
      : String(erro);
  return bruto.replace(/^.*?(?:ERROR|error):\s*/, "").slice(0, 200);
}
