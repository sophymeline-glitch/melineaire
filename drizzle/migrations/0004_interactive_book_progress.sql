ALTER TABLE public.book_sections ADD COLUMN group_title text NOT NULL DEFAULT '';
ALTER TABLE public.book_sections ADD COLUMN source_page integer;
ALTER TABLE public.book_sections ADD COLUMN review_note text NOT NULL DEFAULT '';
CREATE TABLE public.book_progress (user_id uuid NOT NULL, book_id uuid NOT NULL, section_id uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,book_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.book_progress TO authenticated;
GRANT ALL ON public.book_progress TO service_role;
ALTER TABLE public.book_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_owner ON public.book_progress FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.reflection_notes (user_id uuid NOT NULL, book_id uuid NOT NULL, section_id uuid NOT NULL, text text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,book_id,section_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.reflection_notes TO authenticated;
GRANT ALL ON public.reflection_notes TO service_role;
ALTER TABLE public.reflection_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_owner ON public.reflection_notes FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE OR REPLACE FUNCTION public.save_publication(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE bid uuid := (payload->>'id')::uuid; section jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 INSERT INTO public.books(id,title,subtitle,description,creator,categories,themes,page_count,access,status,featured,sort_order,cover_path,preview_paths) VALUES (bid,payload->>'title',payload->>'subtitle',payload->>'description',payload->>'creator',ARRAY(SELECT jsonb_array_elements_text(payload->'categories')),ARRAY(SELECT jsonb_array_elements_text(payload->'themes')),(payload->>'page_count')::integer,payload->>'access',payload->>'status',(payload->>'featured')::boolean,(payload->>'sort_order')::integer,payload->>'cover_path',ARRAY(SELECT jsonb_array_elements_text(payload->'preview_paths'))) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,description=excluded.description,creator=excluded.creator,categories=excluded.categories,themes=excluded.themes,page_count=excluded.page_count,access=excluded.access,status=excluded.status,featured=excluded.featured,sort_order=excluded.sort_order,cover_path=excluded.cover_path,preview_paths=excluded.preview_paths;
 INSERT INTO public.book_files(book_id,pdf_path) VALUES(bid,payload->>'pdf_path') ON CONFLICT(book_id) DO UPDATE SET pdf_path=excluded.pdf_path;
 DELETE FROM public.book_sections WHERE book_id=bid;
 FOR section IN SELECT * FROM jsonb_array_elements(payload->'sections') LOOP
 INSERT INTO public.book_sections(id,book_id,sort_order,title,reflection,scripture,questions,journal_prompt,illustration_path,audio_path,atmosphere_path,group_title,source_page,review_note) VALUES((section->>'id')::uuid,bid,(section->>'sort_order')::integer,section->>'title',section->>'reflection',section->>'scripture',ARRAY(SELECT jsonb_array_elements_text(section->'questions')),section->>'journal_prompt',section->>'illustration_path',section->>'audio_path',section->>'atmosphere_path',coalesce(section->>'group_title',''),(section->>'source_page')::integer,coalesce(section->>'review_note',''));
 END LOOP;
 RETURN bid;
END; $$;
REVOKE ALL ON FUNCTION public.save_publication(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_publication(jsonb) TO authenticated,service_role;