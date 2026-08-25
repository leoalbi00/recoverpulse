-- Bucket Supabase Storage per i loghi caricati dal merchant da
-- /dashboard/impostazioni (vedi src/app/api/dashboard/upload-logo/route.ts).
--
-- Pubblico in lettura: il logo deve essere visibile senza autenticazione sia
-- nelle email di dunning (il client email dell'utente finale carica
-- l'immagine da un dominio esterno, senza sessione Supabase) sia nella
-- pagina pubblica /pay/[token]. L'upload avviene solo lato server con la
-- service role key (src/lib/supabase-admin.ts), che bypassa comunque la RLS
-- su storage.objects: nessuna policy anon/authenticated necessaria per
-- scrivere, la lettura pubblica è garantita dal flag `public` sul bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'merchant-logos',
  'merchant-logos',
  true,
  5242880, -- 5MB, stesso limite validato in src/app/api/dashboard/upload-logo/route.ts
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
