-- Public bucket for images and files uploaded in the studio's Media library.
-- Files are read publicly by the storefront; only the backend (service role) can write.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 104857600)
on conflict (id) do update set public = excluded.public;
