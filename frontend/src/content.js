// Keep import provenance in the database/documentation, outside reader-facing copy.
export function academicDescription(value) {
  if (
    !value ||
    /prot[oó]tipo|ementa n[aã]o fornecida|dados extra[ií]dos|demonstra[cç][aã]o|n[aã]o confirmada pela institui[cç][aã]o/i.test(
      value,
    )
  )
    return "";
  return value;
}
