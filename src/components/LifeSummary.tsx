import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LifeStats } from "@/lib/client-data";

interface LegendItem {
  id: number;
  name: string;
  color: string;
}

interface LifeSummaryProps {
  stats: LifeStats;
  totalDays: number;
  expectancyYears: number;
  events: LegendItem[];
}

const number = (value: number): string => value.toLocaleString("en-GB");

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

export default function LifeSummary({
  stats,
  totalDays,
  expectancyYears,
  events,
}: LifeSummaryProps) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-xl">A life in days</CardTitle>
        <CardDescription>
          One dot per day, {number(totalDays)} days for a life expectancy of{" "}
          {expectancyYears.toLocaleString("en-GB")} years.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Lived</dt>
            <dd
              className="text-lg font-semibold tabular-nums"
              data-stat="lived"
            >
              {number(stats.lived)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Remaining</dt>
            <dd
              className="text-lg font-semibold tabular-nums"
              data-stat="remaining"
            >
              {number(stats.remaining)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Progress</dt>
            <dd className="text-lg font-semibold tabular-nums">
              <span data-stat="percent">{stats.percent}</span>&nbsp;%
            </dd>
          </div>
        </dl>
        <ul className="flex flex-wrap gap-2" aria-label="Legend">
          <li>
            <Badge variant="outline">
              <Swatch color="var(--dot-lived)" />
              Lived
            </Badge>
          </li>
          <li>
            <Badge variant="outline">
              <Swatch color="var(--dot-today)" />
              Today
            </Badge>
          </li>
          <li>
            <Badge variant="outline">
              <Swatch color="var(--dot-future)" />
              Not lived yet
            </Badge>
          </li>
          {events.map((event) => (
            <li key={event.id}>
              <Badge variant="outline">
                <Swatch color={event.color} />
                {event.name}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
