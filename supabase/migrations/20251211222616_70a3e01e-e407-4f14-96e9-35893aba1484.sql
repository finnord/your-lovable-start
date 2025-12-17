-- Policy per permettere inserimento categorie
CREATE POLICY "Categories can be inserted by everyone"
  ON categories FOR INSERT
  WITH CHECK (true);

-- Policy per permettere eliminazione categorie
CREATE POLICY "Categories can be deleted by everyone"
  ON categories FOR DELETE
  USING (true);