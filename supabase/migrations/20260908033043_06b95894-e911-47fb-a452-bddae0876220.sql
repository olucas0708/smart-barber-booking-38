revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.meu_barbeiro_id() from public, anon, authenticated;
revoke all on function public.atende_cliente(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validar_agendamento() from public, anon, authenticated;
revoke all on function public.registrar_auditoria() from public, anon, authenticated;
revoke all on function public.horarios_disponiveis(uuid, date, int) from public, anon;
grant execute on function public.horarios_disponiveis(uuid, date, int) to authenticated;