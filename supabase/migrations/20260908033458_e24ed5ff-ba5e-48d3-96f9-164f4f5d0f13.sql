create policy "fotos_leitura_publica" on storage.objects for select to anon, authenticated
  using (bucket_id = 'fotos');

create policy "fotos_perfil_proprio_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'perfis' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "fotos_perfil_proprio_update" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'perfis' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "fotos_perfil_proprio_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'perfis' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "fotos_barbeiros_admin" on storage.objects for all to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'barbeiros' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'barbeiros' and public.has_role(auth.uid(),'admin'));