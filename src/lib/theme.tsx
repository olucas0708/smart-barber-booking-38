import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "claro" | "escuro";
const CHAVE = "barbearia-tema";

const TemaContext = createContext<{ tema: Tema; alternar: () => void } | undefined>(undefined);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema] = useState<Tema>("escuro");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(CHAVE, "escuro");
  }, []);

  return (
    <TemaContext.Provider
      value={{
        tema,
        alternar: () => undefined,
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
