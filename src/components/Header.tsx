import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LogOut, Moon, Scissors, Shield, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Marca } from "@/components/Marca";
import { useAuth } from "@/lib/auth";
import { useTema } from "@/lib/theme";

export function Header() {
  const { session, isAdmin, isBarbeiro, perfil, signOut } = useAuth();
  const { tema, alternar } = useTema();
  const navigate = useNavigate();

  async function sair() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-6">
        <Marca />
        <nav className="ml-auto flex items-center gap-1">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/agendar">
                  <Scissors aria-hidden="true" /> Agendar
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/meus-agendamentos">
                  <CalendarDays aria-hidden="true" /> Meus horários
                </Link>
              </Button>
              {isBarbeiro && (
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                  <Link to="/barbeiro">Minha agenda</Link>
                </Button>
              )}
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                  <Link to="/admin">
                    <Shield aria-hidden="true" /> Admin
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={alternar}
            aria-label={tema === "escuro" ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {tema === "escuro" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>

          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Minha conta">
                  <User aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="truncate font-medium">{perfil?.nome || "Cliente"}</p>
                  <p className="truncate text-xs text-muted-foreground">{perfil?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/agendar">Agendar horário</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/meus-agendamentos">Meus horários</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/perfil">Meu perfil</Link>
                </DropdownMenuItem>
                {isBarbeiro && (
                  <DropdownMenuItem asChild>
                    <Link to="/barbeiro">Minha agenda</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Painel do dono</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={sair}>
                  <LogOut aria-hidden="true" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
