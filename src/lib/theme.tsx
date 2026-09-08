import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "claro" | "escuro";
const CHAVE = "barbearia-tema";

const TemaContext = createContext<{ tema: Tema; alternar: () => void } | undefined>(undefined);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("escuro");

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE) as Tema | null;
    const prefereClaro = window.matchMedia("(prefers-color-scheme: light)").matches;
    setTema(salvo ?? (prefereClaro ? "claro" : "escuro"));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
  }, [tema]);

  return (
    <TemaContext.Provider
      value={{
        tema,
        alternar: () =>
          setTema((atual) => {
            const proximo = atual === "escuro" ? "claro" : "escuro";
            localStorage.setItem(CHAVE, proximo);
            return proximo;
          }),
      }}
    >
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema precisa estar dentro de TemaProvider");
  return ctx;
}
