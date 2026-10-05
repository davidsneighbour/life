import tailwindColors from "tailwindcss/colors";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*[\d.\s,/%]+\)$/i;
/** `orange-700`, `bg-orange-700`, `text-orange-700`, or a single-value colour such as `black`. */
const TAILWIND = /^(?:(?:bg|text|fill)-)?([a-z]+)(?:-(\d{2,3}))?$/;

/**
 * Turn a colour from the data file into a CSS colour value.
 * Accepts hex (`#c2410c`), `rgb()`/`rgba()`, or a Tailwind colour name
 * (`orange-700`, optionally prefixed with `bg-`).
 */
export function resolveColor(input: string): string {
  const value = input.trim();
  if (HEX.test(value) || RGB.test(value)) {
    return value;
  }

  const match = TAILWIND.exec(value);
  if (match) {
    const [, name = "", shade] = match;
    const entry: unknown = (tailwindColors as Record<string, unknown>)[name];
    if (
      shade === undefined &&
      typeof entry === "string" &&
      !["inherit", "current", "transparent"].includes(name)
    ) {
      return entry;
    }
    if (shade !== undefined && typeof entry === "object" && entry !== null) {
      const shadeValue: unknown = (entry as Record<string, unknown>)[shade];
      if (typeof shadeValue === "string") {
        return shadeValue;
      }
    }
  }

  throw new Error(
    `Unknown colour "${input}". Use hex (#rrggbb), rgb(), or a Tailwind colour such as "orange-700".`,
  );
}
