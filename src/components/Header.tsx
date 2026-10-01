import { Link, useNavigate } from "@tanstack/react-router";
import { Instagram, LogOut, Scissors, Shield, User } from "lucide-react";
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

const INSTAGRAM = "https://www.instagram.com/romariobarbershop.roosevelt/";

export function Header() {
  const { session, isAdmin, isBarbeiro, perfil, signOut } = useAuth();
  const navigate = useNavigate();

  async function sair() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-8">
        <Marca />
        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <a href="/#servicos">Serviços</a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <a href="/#localizacao">Localização</a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="Instagram da Romario Barber Shop">
              <Instagram aria-hidden="true" /> Instagram
            </a>
          </Button>

          {session ? (
            <>
              <Button asChild variant="default" size="sm">
                <Link to="/agendar"><Scissors aria-hidden="true" /> Agendar</Link>
              </Button>
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
                  <DropdownMenuItem asChild><Link to="/agendar">Agendar horário</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/meus-agendamentos">Meus horários</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/perfil">Meu perfil · Clube Romario</Link></DropdownMenuItem>
                  {isBarbeiro && <DropdownMenuItem asChild><Link to="/barbeiro">Minha agenda</Link></DropdownMenuItem>}
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><Shield aria-hidden="true" /> Painel do dono</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={sair}><LogOut aria-hidden="true" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Entrar para agendar</Link>
            </Button>
          )}

        </nav>
      </div>
    </header>
  );
}
