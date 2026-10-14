import type { SampleId } from "./shared";

// Local storage is untrusted: validate per-format collections, bounds and text limits.
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

export function restoreSample<T extends object>(
  sample: SampleId,
  initial: T,
  raw: unknown,
): T {
  if (!record(raw)) return initial;
  const result: Record<string, unknown> = Object.fromEntries(
    Object.entries(initial),
  );
  for (const [key, fallback] of Object.entries(result)) {
    const value = raw[key];
    if (typeof fallback === "boolean" && typeof value === "boolean")
      result[key] = value;
    if (typeof fallback === "string" && typeof value === "string") {
      if (key === "accent") {
        if (/^#[\da-f]{6}$/i.test(value)) result[key] = value;
      } else if (key === "date") {
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value))
        )
          result[key] = value;
      } else
        result[key] = value.slice(
          0,
          key === "message" ? 1000 : key === "reservation" ? 6000 : 120,
        );
    }
    if (typeof fallback === "number") {
      const [min, max] =
        key === "quantity"
          ? [1, 6]
          : key === "nights"
            ? [1, 30]
            : key === "guests"
              ? [1, 4]
              : [
                  0,
                  ["city", "room", "slot", "ticket", "activity"].includes(key)
                    ? 2
                    : ["exhibition", "object"].includes(key)
                      ? 4
                      : key === "attraction"
                        ? 3
                        : 19,
                ];
      if (integer(value, min, max)) result[key] = value;
    }
    if (key === "favorites" && Array.isArray(value))
      result[key] = [
        ...new Set(
          value.filter((n) =>
            integer(
              n,
              0,
              sample === "travel" ? 2 : sample === "museum" ? 4 : 19,
            ),
          ),
        ),
      ];
    if (key === "stops" && Array.isArray(value))
      result[key] = value
        .filter((x) => typeof x === "string")
        .slice(0, 12)
        .map((x) => x.slice(0, 60));
    if (key === "comments" && Array.isArray(value))
      result[key] = value
        .filter(
          (x) =>
            record(x) &&
            typeof x.id === "string" &&
            integer(x.page, 0, 19) &&
            typeof x.text === "string",
        )
        .slice(-100)
        .map((x) => ({
          id: x.id.slice(0, 80),
          page: x.page,
          text: x.text.slice(0, 500),
        }));
    if (
      ["titles", "bodies", "notes", "captions"].includes(key) &&
      record(value)
    ) {
      result[key] = Object.fromEntries(
        Object.entries(value)
          .filter(
            ([id, text]) =>
              /^(?:[0-9]|1[0-9])$/.test(id) &&
              (key === "bodies" && ["research", "handbook"].includes(sample)
                ? Array.isArray(text) &&
                  text.every((x) => typeof x === "string")
                : typeof text === "string"),
          )
          .map(([id, text]) => [
            id,
            Array.isArray(text)
              ? text.join("\n\n").slice(0, 1600).split("\n\n")
              : (text as string).slice(
                  0,
                  key === "notes"
                    ? 3000
                    : key === "bodies"
                      ? 400
                      : key === "captions"
                        ? 44
                        : 100,
                ),
          ]),
      );
    }
  }
  return result as T;
}
