ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS trailer_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_trailer_id_fkey'
  ) THEN
    ALTER TABLE public.documents
    ADD CONSTRAINT documents_trailer_id_fkey
    FOREIGN KEY (trailer_id)
    REFERENCES public.trailers(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_trailer_id ON public.documents(trailer_id);