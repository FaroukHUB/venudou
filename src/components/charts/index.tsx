import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_CATEGORICAL, CHART_GRID, CHART_SINGLE, CHART_TEXT, sequentialTurquoise } from './theme';
import type { CountRow } from '@/lib/stats';

const axisStyle = { fontSize: 12, fill: CHART_TEXT };

/** Barres horizontales, une seule teinte (répartition d'une question). */
export function DistributionBar({ data, height = 260 }: { data: CountRow[]; height?: number }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(height, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }}>
        <CartesianGrid stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" tick={axisStyle} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={axisStyle} width={130} />
        <Tooltip formatter={(v) => [String(v), 'Réponses']} />
        <Bar dataKey="count" name="Réponses" fill={CHART_SINGLE} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Évolution dans le temps — une ou plusieurs séries (max 3 couleurs fixes). */
export function TimeSeries({
  data,
  series,
  height = 260,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  height?: number;
}) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="day" tick={axisStyle} minTickGap={24} />
        <YAxis tick={axisStyle} allowDecimals={false} width={36} />
        <Tooltip />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={series.length === 1 ? CHART_SINGLE : CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Barres groupées (croisements provenance × genre / âge, comparaison magasins). */
export function GroupedBars({
  data,
  series,
  categoryKey,
  height = 280,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  categoryKey: string;
  height?: number;
}) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey={categoryKey} tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={axisStyle} allowDecimals={false} width={36} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]}
            radius={[4, 4, 0, 0]}
            barSize={14}
          >
            {data.map((_, j) => (
              <Cell key={j} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Grille jour × heure (volume de réponses). */
export function DayHourHeatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const hours = [8, 10, 12, 14, 16, 18, 20, 22];
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-xs" aria-label="Volume de réponses par jour et heure">
        <thead>
          <tr>
            <th className="pr-1 text-left font-medium text-navy-400" scope="col">
              Jour
            </th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} scope="col" className="w-5 text-center font-normal text-navy-300">
                {hours.includes(h) ? h : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, d) => (
            <tr key={d}>
              <th scope="row" className="pr-1 text-left font-medium text-navy-500">
                {DAYS[d]}
              </th>
              {row.map((v, h) => (
                <td
                  key={h}
                  className="size-5 rounded-sm"
                  style={{ backgroundColor: v === 0 ? '#F5F7FA' : sequentialTurquoise(v / max) }}
                  title={`${DAYS[d]} ${h}h — ${v} réponse${v > 1 ? 's' : ''}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartEmpty() {
  return (
    <p className="flex h-40 items-center justify-center text-sm text-navy-400">
      Pas encore de données sur cette période.
    </p>
  );
}
