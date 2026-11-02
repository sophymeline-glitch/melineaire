CREATE TABLE public.books (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subtitle text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', creator text NOT NULL DEFAULT 'Melineaire', categories text[] NOT NULL DEFAULT '{}', themes text[] NOT NULL DEFAULT '{}', page_count integer, access text NOT NULL DEFAULT 'free' CHECK (access IN ('free','paid')), status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')), featured boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, cover_path text, preview_paths text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY books_public ON public.books FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY books_admin ON public.books FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TABLE public.book_sections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE, sort_order integer NOT NULL DEFAULT 0, title text NOT NULL, reflection text NOT NULL DEFAULT '', scripture text NOT NULL DEFAULT '', questions text[] NOT NULL DEFAULT '{}', journal_prompt text NOT NULL DEFAULT '', illustration_path text, audio_path text, atmosphere_path text
);
GRANT SELECT ON public.book_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_sections TO authenticated;
GRANT ALL ON public.book_sections TO service_role;
ALTER TABLE public.book_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sections_free ON public.book_sections FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id=book_id AND b.status='published' AND b.access='free'));
CREATE POLICY sections_admin ON public.book_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TABLE public.book_files (book_id uuid PRIMARY KEY REFERENCES public.books(id) ON DELETE CASCADE, pdf_path text);
GRANT SELECT ON public.book_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_files TO authenticated;
GRANT ALL ON public.book_files TO service_role;
ALTER TABLE public.book_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY files_free ON public.book_files FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id=book_id AND b.status='published' AND b.access='free'));
CREATE POLICY files_admin ON public.book_files FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY book_media_admin ON storage.objects FOR ALL TO authenticated USING (bucket_id='book-media' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id='book-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY book_media_published ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id='book-media' AND (EXISTS (SELECT 1 FROM public.books b WHERE b.status='published' AND (b.cover_path=name OR name=ANY(b.preview_paths))) OR EXISTS (SELECT 1 FROM public.book_sections s JOIN public.books b ON b.id=s.book_id WHERE b.status='published' AND b.access='free' AND name IN (s.illustration_path,s.audio_path,s.atmosphere_path)) OR EXISTS (SELECT 1 FROM public.book_files f JOIN public.books b ON b.id=f.book_id WHERE b.status='published' AND b.access='free' AND f.pdf_path=name)));
CREATE FUNCTION public.save_publication(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE bid uuid := (payload->>'id')::uuid; section jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 INSERT INTO public.books(id,title,subtitle,description,creator,categories,themes,page_count,access,status,featured,sort_order,cover_path,preview_paths) VALUES (bid,payload->>'title',payload->>'subtitle',payload->>'description',payload->>'creator',ARRAY(SELECT jsonb_array_elements_text(payload->'categories')),ARRAY(SELECT jsonb_array_elements_text(payload->'themes')),(payload->>'page_count')::integer,payload->>'access',payload->>'status',(payload->>'featured')::boolean,(payload->>'sort_order')::integer,payload->>'cover_path',ARRAY(SELECT jsonb_array_elements_text(payload->'preview_paths'))) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,description=excluded.description,creator=excluded.creator,categories=excluded.categories,themes=excluded.themes,page_count=excluded.page_count,access=excluded.access,status=excluded.status,featured=excluded.featured,sort_order=excluded.sort_order,cover_path=excluded.cover_path,preview_paths=excluded.preview_paths;
 INSERT INTO public.book_files(book_id,pdf_path) VALUES(bid,payload->>'pdf_path') ON CONFLICT(book_id) DO UPDATE SET pdf_path=excluded.pdf_path;
 DELETE FROM public.book_sections WHERE book_id=bid;
 FOR section IN SELECT * FROM jsonb_array_elements(payload->'sections') LOOP
 INSERT INTO public.book_sections(id,book_id,sort_order,title,reflection,scripture,questions,journal_prompt,illustration_path,audio_path,atmosphere_path) VALUES((section->>'id')::uuid,bid,(section->>'sort_order')::integer,section->>'title',section->>'reflection',section->>'scripture',ARRAY(SELECT jsonb_array_elements_text(section->'questions')),section->>'journal_prompt',section->>'illustration_path',section->>'audio_path',section->>'atmosphere_path');
 END LOOP;
 RETURN bid;
END; $$;
REVOKE ALL ON FUNCTION public.save_publication(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_publication(jsonb) TO authenticated, service_role;