import {
  CLIENT_DATA_ID,
  type ClientLifeData,
  lifeStats,
  TODAY_STYLE_ID,
  todayCss,
} from "@/lib/client-data";
import {
  formatIsoDate,
  fromDayNumber,
  localTodayDayNumber,
  MS_PER_DAY,
} from "@/lib/dates";

const OFFSET = 8;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function required<T extends Element>(id: string, type: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) {
    throw new Error(`life-grid: element #${id} is missing.`);
  }
  return element;
}

export function initLifeGrid(): void {
  const grid = required("life-grid", HTMLElement);
  const tooltip = required("life-tooltip", HTMLElement);
  const announcer = required("life-announcer", HTMLElement);
  const todayStyle = required(TODAY_STYLE_ID, HTMLStyleElement);
  const data = JSON.parse(
    required(CLIENT_DATA_ID, HTMLScriptElement).textContent ?? "",
  ) as ClientLifeData;

  const dots = grid.children;
  const dayEvents = new Map(data.days);
  let active = -1;
  let todayIndex = Number.NaN;

  // Today ------------------------------------------------------------------

  function updateToday(): void {
    const index = localTodayDayNumber() - data.birthDay;
    if (index === todayIndex) {
      return;
    }
    todayIndex = index;
    todayStyle.textContent = todayCss(index, data.totalDays);
    const stats = lifeStats(index, data.totalDays);
    for (const element of document.querySelectorAll<HTMLElement>(
      "[data-stat]",
    )) {
      const key = element.getAttribute("data-stat") as keyof typeof stats;
      const value = stats[key];
      element.textContent =
        typeof value === "number" ? value.toLocaleString("en-GB") : value;
    }
  }

  // Tooltip ----------------------------------------------------------------

  function describe(index: number): {
    date: string;
    events: { name: string; color: string }[];
    status: string;
  } {
    const day = data.birthDay + index;
    const date = dateFormat.format(new Date(day * MS_PER_DAY));
    const events = (dayEvents.get(index) ?? []).flatMap(
      (id) => data.events[id] ?? [],
    );
    let status = `Day ${(index + 1).toLocaleString("en-GB")} of ${data.totalDays.toLocaleString("en-GB")}`;
    if (index === todayIndex) {
      status += " · today";
    } else if (index > todayIndex) {
      status += " · not lived yet";
    }
    return { date, events, status };
  }

  function renderTooltip(index: number): void {
    const { date, events, status } = describe(index);
    const iso = formatIsoDate(fromDayNumber(data.birthDay + index));
    tooltip.replaceChildren();

    for (const event of events) {
      const line = document.createElement("div");
      line.className = "flex items-center gap-1.5 font-semibold";
      const swatch = document.createElement("span");
      swatch.className = "size-2 shrink-0 rounded-full";
      swatch.style.background = event.color;
      line.append(swatch, event.name);
      tooltip.append(line);
    }

    const time = document.createElement("time");
    time.dateTime = iso;
    time.className = events.length > 0 ? "block" : "block font-semibold";
    time.textContent = date;
    const meta = document.createElement("div");
    meta.className = "opacity-70";
    meta.textContent = status;
    tooltip.append(time, meta);

    announcer.textContent = [
      ...events.map((event) => event.name),
      date,
      status,
    ].join(", ");
  }

  function positionTooltip(dot: Element): void {
    const rect = dot.getBoundingClientRect();
    const { width, height } = tooltip.getBoundingClientRect();
    const margin = 8;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
    let top = rect.top - height - OFFSET;
    if (top < margin) {
      top = rect.bottom + OFFSET;
    }
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function show(index: number): void {
    const dot = dots[index];
    if (!dot) {
      return;
    }
    if (index !== active) {
      dots[active]?.removeAttribute("data-active");
      dot.setAttribute("data-active", "");
      active = index;
      renderTooltip(index);
    }
    tooltip.hidden = false;
    positionTooltip(dot);
  }

  function hide(): void {
    dots[active]?.removeAttribute("data-active");
    active = -1;
    tooltip.hidden = true;
  }

  function indexOf(target: EventTarget | null): number {
    if (!(target instanceof Element) || target.parentElement !== grid) {
      return -1;
    }
    return Array.prototype.indexOf.call(dots, target);
  }

  // Mouse and pen: hover ---------------------------------------------------

  grid.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") {
      return;
    }
    const index = indexOf(event.target);
    if (index >= 0) {
      show(index);
    }
  });

  grid.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch" && document.activeElement !== grid) {
      hide();
    }
  });

  // Touch: tap a dot to show, tap the same dot or anywhere else to hide ----

  document.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") {
      return;
    }
    const index = indexOf(event.target);
    if (index >= 0 && index !== active) {
      show(index);
    } else {
      hide();
    }
  });

  // Keyboard ---------------------------------------------------------------

  function columns(): number {
    const firstTop = (dots[0] as HTMLElement | undefined)?.offsetTop ?? 0;
    let count = 0;
    while (
      count < dots.length &&
      (dots[count] as HTMLElement).offsetTop === firstTop
    ) {
      count += 1;
    }
    return Math.max(count, 1);
  }

  grid.addEventListener("focus", () => {
    show(
      active >= 0
        ? active
        : Math.min(Math.max(todayIndex, 0), data.totalDays - 1),
    );
  });

  grid.addEventListener("blur", hide);

  grid.addEventListener("keydown", (event) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns(),
      ArrowDown: columns(),
    };
    let next: number | undefined;
    if (event.key in steps) {
      next = active + (steps[event.key] ?? 0);
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = data.totalDays - 1;
    } else if (event.key === "Escape") {
      hide();
      return;
    }
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    show(Math.min(Math.max(next, 0), data.totalDays - 1));
    dots[active]?.scrollIntoView({ block: "nearest" });
  });

  // Keep the tooltip attached while the page moves --------------------------

  const reposition = (): void => {
    const dot = dots[active];
    if (dot && !tooltip.hidden) {
      positionTooltip(dot);
    }
  };
  window.addEventListener("scroll", reposition, { passive: true });
  window.addEventListener("resize", reposition, { passive: true });

  // The page can stay open past midnight, and a static build can be old.
  updateToday();
  setInterval(updateToday, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateToday();
    }
  });
}
