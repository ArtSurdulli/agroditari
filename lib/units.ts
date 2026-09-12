// Area unit conversion. Parcels always store area in hectares (areaHa) —
// "ari" (1 ari = 100 m² = 0.01 ha) is only an input/display convenience for
// Kosovar farmers working with small parcels, converted to hectares on save.
export function ariToHectare(ari: number): number {
  return ari * 0.01;
}

export function hectareToAri(hectare: number): number {
  return hectare * 100;
}
