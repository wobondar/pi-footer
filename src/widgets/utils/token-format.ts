export function formatCount(value: number) {
  if (value < 1000) return `${value}`;
  if (value < 1000000) return `${trimFixed(value / 1000, 1)}k`;
  return `${trimFixed(value / 1000000, 1)}m`;
}

export function formatPiTokenCount(value: number) {
  if (value < 1000) return `${value}`;
  if (value < 10000) return `${(value / 1000).toFixed(1)}k`;
  if (value < 1000000) return `${Math.round(value / 1000)}k`;
  if (value < 10000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${Math.round(value / 1000000)}M`;
}

function trimFixed(value: number, digits: number) {
  return value.toFixed(digits).replace(/\.0$/, "");
}
const TOKEN_FORMAT_STYLES = {
  default: {
    label: "Default",
    list: "Default",
    format: formatCount,
  },
  compact: {
    label: "Compact",
    list: "Compact",
    format: formatPiTokenCount,
  },
} as const;

export type TokenFormatStyle = keyof typeof TOKEN_FORMAT_STYLES;

const TOKEN_FORMAT_STYLE_VALUES = Object.keys(TOKEN_FORMAT_STYLES) as TokenFormatStyle[];

const TOKEN_FORMAT_CHOICES = TOKEN_FORMAT_STYLE_VALUES.map((style) => ({
  id: style,
  label: TOKEN_FORMAT_STYLES[style].label,
  list: TOKEN_FORMAT_STYLES[style].list,
}));

export function formatTokenCount(value: number, style: TokenFormatStyle) {
  return TOKEN_FORMAT_STYLES[style].format(value);
}

const SPEED_UNITS = {
  "per-minute": {
    label: "Per minute",
    list: "Per minute",
    suffix: "/min",
    perMs: 60_000,
  },
  "per-second": {
    label: "Per second",
    list: "Per second",
    suffix: "/s",
    perMs: 1_000,
  },
} as const;

export type SpeedUnit = keyof typeof SPEED_UNITS;

const SPEED_UNIT_VALUES = Object.keys(SPEED_UNITS) as SpeedUnit[];

const SPEED_UNIT_CHOICES = SPEED_UNIT_VALUES.map((unit) => ({
  id: unit,
  label: SPEED_UNITS[unit].label,
  list: SPEED_UNITS[unit].list,
}));

// Never divide by less than one second of span so a single early sample cannot inflate the rate.
const MIN_SPAN_MS = 1_000;

export function speedUnitSuffix(speedUnit: SpeedUnit) {
  return SPEED_UNITS[speedUnit].suffix;
}

export function formatTokenSpeed(
  tokens: number,
  first: number | undefined,
  last: number | undefined,
  tokenFormatStyle: TokenFormatStyle,
  speedUnit: SpeedUnit = "per-minute",
) {
  const unit = SPEED_UNITS[speedUnit];
  if (
    first === undefined ||
    last === undefined ||
    !Number.isFinite(first) ||
    !Number.isFinite(last) ||
    last <= first
  ) {
    return `0${unit.suffix}`;
  }
  const spanMs = Math.max(last - first, MIN_SPAN_MS);
  const rate = Math.round((tokens * unit.perMs) / spanMs);
  return `${formatTokenCount(rate, tokenFormatStyle)}${unit.suffix}`;
}

export function speedUnitProperty() {
  return {
    id: "speedUnit",
    label: "Speed unit",
    kind: "choice",
    description: "Rate window used for token speed",
    default: "per-minute",
    options: {
      choices: SPEED_UNIT_CHOICES,
      showInWidgets: true,
      showInColors: false,
      listProperty: "rate",
    },
  } as const;
}

export function tokenFormatStyleProperty() {
  return {
    id: "tokenFormatStyle",
    label: "Token format",
    kind: "choice",
    description: "Token display format",
    default: "default",
    options: {
      choices: TOKEN_FORMAT_CHOICES,
      showInWidgets: true,
      showInColors: false,
      listProperty: "format",
    },
  } as const;
}
