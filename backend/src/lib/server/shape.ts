/**
 * Coerces untrusted JSON to the shape of a template: strings stay strings (trimmed to a length,
 * `javascript:` links dropped), numbers stay numbers, arrays follow their first template element,
 * and unknown keys are discarded. A missing list becomes an empty list: the template's sample
 * element only describes the shape of each item and must never be copied into saved data.
 */
export function shape<T>(template: T, input: unknown, max = 2000): T {
  if (typeof template === "string") {
    const s = typeof input === "string" ? input.slice(0, max) : template;
    return (/^\s*javascript:/i.test(s) ? "" : s) as T;
  }
  if (typeof template === "number") return (Number.isFinite(Number(input)) ? Number(input) : template) as T;
  if (typeof template === "boolean") return (typeof input === "boolean" ? input : template) as T;
  if (Array.isArray(template)) {
    if (!Array.isArray(input)) return [] as T;
    const sample = template[0];
    return (sample === undefined ? [] : input.slice(0, 200).map((x) => shape(sample, x, max))) as T;
  }
  if (template && typeof template === "object") {
    const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) out[k] = shape(v, src[k], max);
    return out as T;
  }
  return template;
}
