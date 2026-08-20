// src/index.ts
import { truncateToWidth as truncateToWidth6 } from "@earendil-works/pi-tui";

// src/config.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, postfix) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + postfix;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const isGotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, isGotCR ? index - 1 : index) + prefix + (isGotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var ANSI_UNDERLINE_OFFSET = 20;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var wrapUnderlineAnsi = (code) => `\x1B[58;5;${code < 90 ? code - 30 : code - 90 + 8}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    // Extended underline styles (`SGR 4:x` sub-parameters). Not in upstream `ansi-styles`.
    underlineDouble: ["4:2", 24],
    underlineCurly: ["4:3", 24],
    underlineDotted: ["4:4", 24],
    underlineDashed: ["4:5", 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  },
  // Underline color (`SGR 58`/`59`). Not in upstream `ansi-styles`.
  underlineColor: {
    underlineBlack: ["58;5;0", 59],
    underlineRed: ["58;5;1", 59],
    underlineGreen: ["58;5;2", 59],
    underlineYellow: ["58;5;3", 59],
    underlineBlue: ["58;5;4", 59],
    underlineMagenta: ["58;5;5", 59],
    underlineCyan: ["58;5;6", 59],
    underlineWhite: ["58;5;7", 59],
    // Bright color
    underlineBlackBright: ["58;5;8", 59],
    underlineGray: ["58;5;8", 59],
    // Alias of `underlineBlackBright`
    underlineGrey: ["58;5;8", 59],
    // Alias of `underlineBlackBright`
    underlineRedBright: ["58;5;9", 59],
    underlineGreenBright: ["58;5;10", 59],
    underlineYellowBright: ["58;5;11", 59],
    underlineBlueBright: ["58;5;12", 59],
    underlineMagentaBright: ["58;5;13", 59],
    underlineCyanBright: ["58;5;14", 59],
    underlineWhiteBright: ["58;5;15", 59]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var underlineColorNames = Object.keys(styles.underlineColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(Number.parseInt(style[0], 10), style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.underlineColor.close = "\x1B[59m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  styles.underlineColor.ansi = wrapUnderlineAnsi;
  styles.underlineColor.ansi256 = wrapAnsi256(ANSI_UNDERLINE_OFFSET);
  styles.underlineColor.ansi16m = wrapAnsi16m(ANSI_UNDERLINE_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[\da-f]{6}|[\da-f]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise -- We need the speed */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function hasNumericForceColor() {
  return /^\d+$/.test(env.FORCE_COLOR);
}
function envForceColor() {
  if (!("FORCE_COLOR" in env)) {
    return;
  }
  if (env.FORCE_COLOR === "false") {
    return 0;
  }
  if (env.FORCE_COLOR === "true" || env.FORCE_COLOR.length === 0) {
    return 1;
  }
  if (!hasNumericForceColor()) {
    return;
  }
  return Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if (forceColor !== void 0 && hasNumericForceColor()) {
    return forceColor;
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => key in env)) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(?:9\.0*[1-9]\d*\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".", 1)[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(?:color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = /* @__PURE__ */ Symbol("GENERATOR");
var STYLER = /* @__PURE__ */ Symbol("STYLER");
var IS_EMPTY = /* @__PURE__ */ Symbol("IS_EMPTY");
var LEVEL = /* @__PURE__ */ Symbol("LEVEL");
var styles2 = /* @__PURE__ */ Object.create(null);
var assertValidLevel = (level) => {
  if (!Number.isSafeInteger(level) || level < 0 || level > 3) {
    throw new Error("The `level` should be an integer from 0 to 3");
  }
};
var levelDescriptor = {
  enumerable: true,
  get() {
    return this[LEVEL];
  },
  set(level) {
    assertValidLevel(level);
    this[LEVEL] = level;
  }
};
var applyOptions = (object, options = {}) => {
  if (options.level !== void 0) {
    assertValidLevel(options.level);
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object[LEVEL] = options.level === void 0 ? colorLevel : options.level;
};
var Chalk = class {
  constructor(options) {
    return chalkFactory(options);
  }
};
var chalkFactory = (options) => {
  const chalk3 = (...strings) => strings.join(" ");
  applyOptions(chalk3, options);
  Object.setPrototypeOf(chalk3, createChalk.prototype);
  return chalk3;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var createModelConverters = (model, type) => {
  const style = ansi_styles_default[type];
  if (model === "rgb") {
    const ansi2 = (red, green, blue) => style.ansi(ansi_styles_default.rgbToAnsi(red, green, blue));
    const ansi256 = (red, green, blue) => style.ansi256(ansi_styles_default.rgbToAnsi256(red, green, blue));
    return [ansi2, ansi2, ansi256, style.ansi16m];
  }
  if (model === "hex") {
    const ansi2 = (hex) => style.ansi(ansi_styles_default.hexToAnsi(hex));
    const ansi256 = (hex) => style.ansi256(ansi_styles_default.hexToAnsi256(hex));
    return [ansi2, ansi2, ansi256, (hex) => style.ansi16m(...ansi_styles_default.hexToRgb(hex))];
  }
  const ansi = (code) => style.ansi(ansi_styles_default.ansi256ToAnsi(code));
  return [ansi, ansi, style.ansi256, style.ansi256];
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  const capitalizedModel = model[0].toUpperCase() + model.slice(1);
  for (const [styleName, type] of [
    [model, "color"],
    ["bg" + capitalizedModel, "bgColor"],
    ["underline" + capitalizedModel, "underlineColor"]
  ]) {
    const { close } = ansi_styles_default[type];
    const converters = createModelConverters(model, type);
    styles2[styleName] = {
      get() {
        const styleFunction = function(first, second, third) {
          const open = converters[this.level](first, second, third);
          return createBuilder(this, createStyler(open, close, this[STYLER]), this[IS_EMPTY]);
        };
        Object.defineProperty(this, styleName, { value: styleFunction });
        return styleFunction;
      }
    };
  }
}
var proto = Object.defineProperties(
  () => {
  },
  {
    ...styles2,
    level: {
      enumerable: true,
      get() {
        return this[GENERATOR].level;
      },
      set(level) {
        this[GENERATOR].level = level;
      }
    }
  }
);
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => {
    if (arguments_.length === 1) {
      return applyStyle(builder, "" + arguments_[0]);
    }
    if (arguments_.length === 2) {
      return applyStyle(builder, arguments_[0] + " " + arguments_[1]);
    }
    return applyStyle(builder, arguments_.join(" "));
  };
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self[GENERATOR] ?? self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self[GENERATOR][LEVEL] <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, { ...styles2, level: levelDescriptor });
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });

// src/colors.ts
var chalk2 = {
  level: 2,
  c: new Chalk({ level: 2 })
};
var COLOR_LEVEL_VALUES = ["truecolor", "ansi256", "ansi16", "none"];
var STANDARD_COLORS = [
  { label: "Default", value: "default" },
  { label: "Black", value: "black" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Yellow", value: "yellow" },
  { label: "Blue", value: "blue" },
  { label: "Magenta", value: "magenta" },
  { label: "Cyan", value: "cyan" },
  { label: "White", value: "white" },
  { label: "Bright Black", value: "brightBlack" },
  { label: "Bright Red", value: "brightRed" },
  { label: "Bright Green", value: "brightGreen" },
  { label: "Bright Yellow", value: "brightYellow" },
  { label: "Bright Blue", value: "brightBlue" },
  { label: "Bright Magenta", value: "brightMagenta" },
  { label: "Bright Cyan", value: "brightCyan" },
  { label: "Bright White", value: "brightWhite" }
];
var PI_THEME_COLORS = [
  "accent",
  "border",
  "borderAccent",
  "borderMuted",
  "success",
  "error",
  "warning",
  "muted",
  "dim",
  "text",
  "thinkingText",
  "userMessageText",
  "customMessageText",
  "customMessageLabel",
  "toolTitle",
  "toolOutput",
  "toolDiffAdded",
  "toolDiffRemoved",
  "toolDiffContext",
  "syntaxType",
  "thinkingOff",
  "thinkingMinimal",
  "thinkingLow",
  "thinkingMedium",
  "thinkingHigh",
  "thinkingXhigh",
  "bashMode"
];
var PI_FOREGROUND_COLORS = PI_THEME_COLORS.map((color) => ({
  label: `Pi ${themeColorDisplayName(color)}`,
  value: `pi:${color}`
}));
var FOREGROUND_COLORS = [...STANDARD_COLORS, ...PI_FOREGROUND_COLORS];
var ANSI16_FG = {
  default: [39, 49],
  black: [30, 40],
  red: [31, 41],
  green: [32, 42],
  yellow: [33, 43],
  blue: [34, 44],
  magenta: [35, 45],
  cyan: [36, 46],
  white: [37, 47],
  brightBlack: [90, 100],
  brightRed: [91, 101],
  brightGreen: [92, 102],
  brightYellow: [93, 103],
  brightBlue: [94, 104],
  brightMagenta: [95, 105],
  brightCyan: [96, 106],
  brightWhite: [97, 107]
};
function normalizeColor(value) {
  if (typeof value !== "string") return void 0;
  if (STANDARD_COLORS.some((color) => color.value === value)) return value;
  if (PI_FOREGROUND_COLORS.some((color) => color.value === value)) return value;
  const match = /^ansi256:([0-9]{1,3})$/.exec(value);
  if (!match) return void 0;
  const code = Number(match[1]);
  return Number.isInteger(code) && code >= 0 && code <= 255 ? `ansi256:${code}` : void 0;
}
function colorDisplayName(color) {
  if (!color || color === "default") return "Default";
  if (color.startsWith("ansi256:")) return `ANSI256 ${color.slice("ansi256:".length)}`;
  if (color.startsWith("pi:"))
    return PI_FOREGROUND_COLORS.find((entry) => entry.value === color)?.label ?? color;
  return STANDARD_COLORS.find((entry) => entry.value === color)?.label ?? color;
}
function ansi256Digits(color) {
  return color?.startsWith("ansi256:") ? String(Number(color.slice("ansi256:".length))) : "0";
}
function appendAnsi256Digit(color, digit) {
  const digits = ansi256Digits(color);
  const next = Number(`${digits}${digit}`);
  return `ansi256:${Math.min(255, next)}`;
}
function deleteAnsi256Digit(color) {
  const digits = ansi256Digits(color) || "0";
  const next = digits.slice(0, -1);
  return `ansi256:${next === "" ? 0 : Number(next)}`;
}
function useColorLevel(level) {
  const next = level === "truecolor" ? 3 : level === "ansi256" ? 2 : 1;
  if (chalk2.level === next) return;
  chalk2.level = next;
  chalk2.c = new Chalk({ level: next });
}
function applyColors(text, foreground, background, bold, level, theme) {
  if (level === "none") return text;
  useColorLevel(level);
  let output = text;
  if (foreground && foreground !== "default")
    output = applyOne(output, foreground, false, level, theme);
  if (background && background !== "default") output = applyOne(output, background, true, level);
  if (bold) output = chalk2.c.bold(output);
  return output;
}
function resetAnsi256Colors(options) {
  const next = { ...options };
  if (next.fg?.startsWith("ansi256:")) next.fg = "default";
  if (next.bg?.startsWith("ansi256:")) next.bg = "default";
  if (next.warningFg?.startsWith("ansi256:")) next.warningFg = "default";
  if (next.warningBg?.startsWith("ansi256:")) next.warningBg = "default";
  if (next.dangerFg?.startsWith("ansi256:")) next.dangerFg = "default";
  if (next.dangerBg?.startsWith("ansi256:")) next.dangerBg = "default";
  return next;
}
function themeColorDisplayName(color) {
  return color.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
function applyOne(text, color, background, level, theme) {
  if (color.startsWith("pi:")) {
    if (background || !theme) return text;
    return theme.fg(color.slice("pi:".length), text);
  }
  if (color.startsWith("ansi256:")) {
    const code = Number(color.slice("ansi256:".length));
    if (level === "ansi256" || level === "truecolor") {
      return background ? chalk2.c.bgAnsi256(code)(text) : chalk2.c.ansi256(code)(text);
    }
    return text;
  }
  const codes = ANSI16_FG[color];
  if (!codes || color === "default") return text;
  return `\x1B[${background ? codes[1] : codes[0]}m${text}\x1B[${background ? 49 : 39}m`;
}
var ANSI_ESCAPE_PATTERN = new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, "g");
function stripAnsi(text) {
  return text.replace(ANSI_ESCAPE_PATTERN, "");
}

// src/types.ts
var TERMINAL_WIDTH_MODE_VALUES = ["full", "full-minus-40"];
var ICON_MODE_VALUES = ["emoji", "nerd", "text"];
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

// src/extension-statuses.ts
var EMPTY_STATUS_LABEL = "[Empty status]";
var DEFAULT_EXTENSION_STATUS_ROW = {
  hiddenKeys: [],
  knownKeys: []
};
var EMPTY_EXTENSION_STATUSES = /* @__PURE__ */ new Map();
function extensionStatusEntries(statuses, ownStatusKey) {
  return [...statuses.entries()].filter(([key, value]) => key !== ownStatusKey && value.length > 0).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => ({ key, value, published: true }));
}
function allExtensionStatusEntries(statuses, rowConfig, ownStatusKey) {
  const keys = /* @__PURE__ */ new Set([...statuses.keys(), ...rowConfig.hiddenKeys, ...rowConfig.knownKeys]);
  return [...keys].filter((key) => key.length > 0 && key !== ownStatusKey).sort((left, right) => left.localeCompare(right)).map((key) => {
    const value = statuses.get(key) ?? "";
    return {
      key,
      value: value.length > 0 ? value : EMPTY_STATUS_LABEL,
      published: value.length > 0
    };
  });
}
function visibleExtensionStatusRowEntries(statuses, hiddenKeys, ownStatusKey) {
  const hidden = new Set(hiddenKeys);
  return extensionStatusEntries(statuses, ownStatusKey).filter((entry) => !hidden.has(entry.key));
}
function toggleExtensionStatusRowKey(rowConfig, key) {
  const hidden = new Set(rowConfig.hiddenKeys);
  const known = new Set(rowConfig.knownKeys);
  known.add(key);
  if (hidden.has(key)) hidden.delete(key);
  else hidden.add(key);
  return {
    hiddenKeys: sortedKeys(hidden),
    knownKeys: sortedKeys(known)
  };
}
function normalizeExtensionStatusRow(value) {
  if (!isRecord(value)) return cloneExtensionStatusRow(DEFAULT_EXTENSION_STATUS_ROW);
  return {
    hiddenKeys: normalizeKeyList(value.hiddenKeys),
    knownKeys: normalizeKeyList(value.knownKeys)
  };
}
function cloneExtensionStatusRow(value) {
  return {
    hiddenKeys: [...value.hiddenKeys],
    knownKeys: [...value.knownKeys]
  };
}
function normalizeKeyList(value) {
  if (!Array.isArray(value)) return [];
  return sortedKeys(
    new Set(value.filter((key) => typeof key === "string" && key.length > 0))
  );
}
function sortedKeys(keys) {
  return [...keys].sort((left, right) => left.localeCompare(right));
}

// src/presets.ts
var FULL_WIDTH = { widthMode: "full" };
function widget(type, options = {}) {
  return { type, options };
}
function powerSegment(type, options) {
  return { type, options };
}
function powerlineLine(segments, options = {}) {
  if (segments.length === 0) return [];
  const separator = options.separator ?? "powerline-right-spaced";
  const line = [];
  const first = segments[0];
  if (!first) return [];
  if (options.start) line.push(capWidget(first.options.bg, options.start, "powerline-start"));
  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index];
    if (!current) continue;
    line.push(current);
    const next = segments[index + 1];
    if (!next) continue;
    const transition = options.transition?.({ left: current, right: next, index }) ?? {};
    line.push({
      type: "separator",
      options: {
        separator: transition.separator ?? separator,
        fg: current.options.bg,
        bg: next.options.bg,
        ...transition
      }
    });
  }
  const last = segments.at(-1);
  if (last && options.end) line.push(capWidget(last.options.bg, options.end, "powerline-end"));
  return line;
}
function capWidget(color, cap, defaultSeparator) {
  const options = cap === true ? {} : cap;
  return {
    type: "separator",
    options: {
      separator: options.separator ?? defaultSeparator,
      fg: options.fg ?? color,
      bg: options.bg ?? "default"
    }
  };
}
function demoLabelLine(preset) {
  return [widget("custom-text", { raw: true, fg: "pi:success", text: `Preset '${preset}':` })];
}
function demoEmptyLine() {
  return [widget("custom-text", { raw: true, fg: "pi:success", text: "" })];
}
var BASE_PRESET_DEFINITIONS = {
  default: {
    separator: "dot",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("model-provider"),
        widget("thinking-level"),
        widget("text-verbosity"),
        widget("context-length"),
        widget("git-branch"),
        widget("git-diff", { gitDiffMode: "compact" }),
        widget("cost"),
        widget("total-time")
      ]
    ]
  },
  powerline: {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine([
        powerSegment("model-provider", { fg: "brightWhite", bg: "ansi256:33", bold: true }),
        powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:61", bold: true }),
        powerSegment("tokens", { fg: "brightWhite", bg: "ansi256:64" }),
        powerSegment("context-bar", {
          fg: "ansi256:234",
          bg: "ansi256:136",
          contextBarMode: "medium"
        }),
        powerSegment("output-speed", { fg: "black", bg: "ansi256:37" }),
        powerSegment("total-time", { fg: "brightWhite", bg: "ansi256:236" })
      ])
    ]
  },
  "powerline-bright": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:131", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:220", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:68" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:108",
            raw: true,
            gitDiffMode: "compact"
          }),
          powerSegment("total-time", { fg: "black", bg: "ansi256:176", raw: true })
        ],
        { start: true, end: true }
      ),
      powerlineLine(
        [
          powerSegment("cwd", { fg: "brightWhite", bg: "ansi256:131", segments: 3, icon: "cwd: " }),
          powerSegment("cost", { fg: "black", bg: "ansi256:220", icon: "Cost: " })
        ],
        { start: true, end: true }
      )
    ]
  },
  "powerline-blocks": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:131", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:222", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:67" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:151",
            raw: true,
            gitDiffMode: "compact"
          })
        ],
        { start: true, end: true }
      ),
      powerlineLine(
        [
          powerSegment("input-tokens", { fg: "brightWhite", bg: "ansi256:131", icon: "In: " }),
          powerSegment("output-tokens", { fg: "black", bg: "ansi256:222", icon: "Out: " }),
          powerSegment("cache-read", { fg: "brightWhite", bg: "ansi256:67", icon: "Cached: " }),
          powerSegment("total-tokens", { fg: "black", bg: "ansi256:151", icon: "Total: " })
        ],
        { start: true, end: true }
      ),
      powerlineLine(
        [
          powerSegment("context-bar", {
            fg: "brightWhite",
            bg: "ansi256:131",
            icon: "Ctx ",
            contextBarMode: "medium"
          }),
          powerSegment("total-time", { fg: "brightWhite", bg: "ansi256:131", raw: true })
        ],
        {
          start: true,
          end: true,
          transition: () => ({ separator: "powerline-soft-right" })
        }
      )
    ]
  },
  "powerline-mono": {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      powerlineLine(
        [
          powerSegment("model", { fg: "brightWhite", bg: "ansi256:240", icon: "Model: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:252", icon: "Ctx: " }),
          powerSegment("git-branch", { fg: "brightWhite", bg: "ansi256:233" }),
          powerSegment("git-diff", {
            fg: "black",
            bg: "ansi256:250",
            raw: true,
            gitDiffMode: "compact"
          }),
          powerSegment("cwd-basename", { fg: "brightWhite", bg: "ansi256:236" })
        ],
        { start: true, end: true }
      ),
      powerlineLine(
        [
          powerSegment("output-tokens", { fg: "brightWhite", bg: "ansi256:240", icon: "\u{1F47E} Out: " }),
          powerSegment("cache-read", { fg: "black", bg: "ansi256:252", icon: "\u{1F4B0} Cached: " }),
          powerSegment("total-tokens", { fg: "brightWhite", bg: "ansi256:233", icon: "Total: " }),
          powerSegment("context-length", { fg: "black", bg: "ansi256:250", icon: "Ctx: " })
        ],
        { start: true, end: true }
      )
    ]
  },
  "git-heavy": {
    separator: "dot",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("model-provider"),
        widget("cwd-basename"),
        widget("git-branch"),
        widget("git-sha"),
        widget("git-status"),
        widget("git-diff", { gitDiffMode: "compact" }),
        widget("git-ahead-behind")
      ]
    ]
  },
  compact: {
    separator: "space",
    terminal: { widthMode: "full-minus-40" },
    lines: [
      [
        widget("model"),
        widget("thinking-level"),
        widget("text-verbosity"),
        widget("git-branch"),
        widget("context"),
        widget("cost")
      ]
    ]
  },
  "pi-footer": {
    separator: "none",
    iconMode: "text",
    terminal: FULL_WIDTH,
    lines: [
      [
        widget("cwd", { raw: true, fg: "pi:dim", cwdDisplayStyle: "full-home" }),
        widget("git-branch", {
          icon: " ",
          fg: "pi:dim",
          hideWhenEmpty: true,
          gitBranchDisplayStyle: "round-brackets"
        }),
        widget("session-name", { icon: " \u2022 ", fg: "pi:dim", hideWhenEmpty: true })
      ],
      [
        widget("tokens", { raw: true, fg: "pi:dim", tokenFormatStyle: "compact" }),
        widget("cache-read", {
          icon: " R",
          fg: "pi:dim",
          tokenFormatStyle: "compact",
          hideWhenZero: true
        }),
        widget("cache-write", {
          icon: " W",
          fg: "pi:dim",
          tokenFormatStyle: "compact",
          hideWhenZero: true
        }),
        widget("cache-hit-rate", {
          icon: " CH",
          fg: "pi:dim",
          hideWhenZero: true,
          cacheHitSource: "turn"
        }),
        widget("cost", {
          icon: " ",
          fg: "pi:dim",
          costFormatStyle: "compact",
          showSubscription: true
        }),
        widget("context", {
          icon: " ",
          fg: "pi:dim",
          contextConditionalColors: true,
          warningFg: "pi:warning",
          dangerFg: "pi:error"
        }),
        widget("context-window", {
          icon: "/",
          fg: "pi:dim",
          contextConditionalColors: true,
          warningFg: "pi:warning",
          dangerFg: "pi:error",
          tokenFormatStyle: "compact"
        }),
        widget("flex-separator"),
        widget("model", { raw: true, fg: "pi:dim" }),
        widget("thinking-level", { icon: " \u2022 ", fg: "pi:dim", hideWhenEmpty: true })
      ]
    ]
  }
};
function demoLines(...presets) {
  return presets.flatMap((preset, index) => [
    demoLabelLine(preset),
    ...BASE_PRESET_DEFINITIONS[preset].lines,
    ...index === presets.length - 1 ? [] : [demoEmptyLine()]
  ]);
}
var PRESET_DEFINITIONS = {
  ...BASE_PRESET_DEFINITIONS,
  demo: {
    separator: "none",
    iconMode: "nerd",
    terminal: FULL_WIDTH,
    lines: demoLines(
      "pi-footer",
      "powerline",
      "powerline-bright",
      "powerline-blocks",
      "powerline-mono"
    )
  },
  "demo-standard": {
    separator: "dot",
    terminal: FULL_WIDTH,
    lines: demoLines("default", "compact", "git-heavy")
  }
};

// src/separators.ts
var SEPARATOR_VALUES = [
  "none",
  "dot",
  "pipe",
  "space",
  "powerline",
  "dash",
  "comma"
];
var WIDGET_SEPARATOR_VALUES = [
  ...SEPARATOR_VALUES,
  "powerline-right",
  "powerline-right-spaced",
  "powerline-left",
  "powerline-left-spaced",
  "powerline-soft-right",
  "powerline-soft-left",
  "powerline-start",
  "powerline-end",
  "custom"
];
function separatorText(separator) {
  if (separator === "none") return "";
  if (separator === "space") return " ";
  if (separator === "pipe") return " | ";
  if (separator === "powerline") return " \uE0B1 ";
  if (separator === "dash") return " - ";
  if (separator === "comma") return ", ";
  return " \u2022 ";
}
function widgetSeparatorText(separator, customText) {
  if (separator === "custom") return customText;
  if (separator === "powerline" || separator === "powerline-right-spaced") return "\uE0B0 ";
  if (separator === "powerline-right") return "\uE0B0";
  if (separator === "powerline-left-spaced") return " \uE0B2";
  if (separator === "powerline-left") return "\uE0B2";
  if (separator === "powerline-soft-right") return "\uE0B1";
  if (separator === "powerline-soft-left") return "\uE0B3";
  if (separator === "powerline-start") return "\uE0B2";
  if (separator === "powerline-end") return "\uE0B0";
  return separatorText(separator ?? "pipe");
}

// src/widgets/types.ts
function defineWidget(spec) {
  return spec;
}

// src/widgets/core/active-tools.ts
var ActiveToolsWidget = defineWidget({
  type: "active-tools",
  label: "Active Tools",
  category: "Core",
  description: "Active tool count",
  dependencies: ["activeToolCount"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { hideWhenZero: true },
  properties: [],
  icons: { emoji: "\u{1F6E0}\uFE0F", nerd: "\u{F0493}", text: "tools" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(String(ctx.activeToolCount));
  }
});

// src/widgets/utils/colors.ts
function colorPair(fg, bg) {
  return {
    ...fg === void 0 ? {} : { fg },
    ...bg === void 0 ? {} : { bg }
  };
}

// src/widgets/utils/context.ts
function contextPercent(tokens, maxTokens) {
  if (tokens === void 0 || maxTokens === void 0 || maxTokens <= 0) return void 0;
  return Math.min(100, Math.max(0, tokens / maxTokens * 100));
}
function contextColors(options, contextTokens, contextMaxTokens) {
  if (!options.contextConditionalColors) return colorPair(options.fg, options.bg);
  const percent = contextPercent(contextTokens, contextMaxTokens);
  if (percent === void 0) return colorPair(options.fg, options.bg);
  if (percent >= options.contextDangerPercent) {
    return colorPair(
      normalizeColor(options.dangerFg) ?? options.fg,
      normalizeColor(options.dangerBg) ?? options.bg
    );
  }
  if (percent >= options.contextWarningPercent) {
    return colorPair(
      normalizeColor(options.warningFg) ?? options.fg,
      normalizeColor(options.warningBg) ?? options.bg
    );
  }
  return colorPair(options.fg, options.bg);
}
function contextColorProperties() {
  return [
    {
      id: "contextConditionalColors",
      label: "Conditional colors",
      kind: "boolean",
      description: "Use warning/danger colors based on context usage",
      default: false,
      options: {
        label: "with-colors",
        showInWidgets: true,
        showInColors: true,
        listProperty: ""
      }
    },
    {
      id: "contextWarningPercent",
      label: "Warning zone threshold",
      kind: "number",
      description: "Context usage percentage for warning colors",
      default: 70,
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { min: 0, max: 100, showInWidgets: false, showInColors: false }
    },
    {
      id: "contextDangerPercent",
      label: "Danger zone threshold",
      kind: "number",
      description: "Context usage percentage for danger colors",
      default: 90,
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { min: 0, max: 100, showInWidgets: false, showInColors: false }
    },
    {
      id: "warningFg",
      label: "Warning foreground",
      kind: "text",
      description: "Warning foreground",
      default: "yellow",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false }
    },
    {
      id: "warningBg",
      label: "Warning background",
      kind: "text",
      description: "Warning background",
      default: "default",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false }
    },
    {
      id: "dangerFg",
      label: "Danger foreground",
      kind: "text",
      description: "Danger foreground",
      default: "red",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false }
    },
    {
      id: "dangerBg",
      label: "Danger background",
      kind: "text",
      description: "Danger background",
      default: "default",
      showWhen: { property: "contextConditionalColors", equals: true },
      options: { showInFields: false, showInWidgets: false, showInColors: false }
    }
  ];
}

// src/widgets/utils/token-format.ts
function formatCount(value) {
  if (value < 1e3) return `${value}`;
  if (value < 1e6) return `${trimFixed(value / 1e3, 1)}k`;
  return `${trimFixed(value / 1e6, 1)}m`;
}
function formatPiTokenCount(value) {
  if (value < 1e3) return `${value}`;
  if (value < 1e4) return `${(value / 1e3).toFixed(1)}k`;
  if (value < 1e6) return `${Math.round(value / 1e3)}k`;
  if (value < 1e7) return `${(value / 1e6).toFixed(1)}M`;
  return `${Math.round(value / 1e6)}M`;
}
function trimFixed(value, digits) {
  return value.toFixed(digits).replace(/\.0$/, "");
}
var TOKEN_FORMAT_STYLES = {
  default: {
    label: "Default",
    list: "Default",
    format: formatCount
  },
  compact: {
    label: "Compact",
    list: "Compact",
    format: formatPiTokenCount
  }
};
var TOKEN_FORMAT_STYLE_VALUES = Object.keys(TOKEN_FORMAT_STYLES);
var TOKEN_FORMAT_CHOICES = TOKEN_FORMAT_STYLE_VALUES.map((style) => ({
  id: style,
  label: TOKEN_FORMAT_STYLES[style].label,
  list: TOKEN_FORMAT_STYLES[style].list
}));
function formatTokenCount(value, style) {
  return TOKEN_FORMAT_STYLES[style].format(value);
}
function formatTokenSpeed(tokens, first, last, tokenFormatStyle) {
  if (first === void 0 || last === void 0 || !Number.isFinite(first) || !Number.isFinite(last) || last <= first) {
    return "0/min";
  }
  const minutes = Math.max((last - first) / 6e4, 1 / 60);
  return `${formatTokenCount(Math.round(tokens / minutes), tokenFormatStyle)}/min`;
}
function tokenFormatStyleProperty() {
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
      listProperty: "format"
    }
  };
}

// src/widgets/core/context-window.ts
var ContextWindowWidget = defineWidget({
  type: "context-window",
  label: "Context Window",
  category: "Core",
  description: "Model context window size",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), ...contextColorProperties()],
  icons: { emoji: "\u{1FA9F}", nerd: "\u{F035B}", text: "window" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      ctx.contextMaxTokens ? formatTokenCount(ctx.contextMaxTokens, options.tokenFormatStyle) : "?",
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens)
      }
    );
  }
});

// src/widgets/core/cwd-basename.ts
import { basename } from "node:path";
var CwdBasenameWidget = defineWidget({
  type: "cwd-basename",
  label: "Working Dir Name",
  category: "Core",
  description: "Current directory name",
  dependencies: ["cwd"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F4C2}", nerd: "\uF07B", text: "dir" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(basename(ctx.cwd));
  }
});

// src/widgets/core/cwd.ts
import { basename as basename2, sep } from "node:path";
var CWD_DISPLAY_STYLES = {
  default: {
    label: "Default (last path segments)",
    list: "default"
  },
  "full-home": {
    label: "Full path (~ home)",
    list: "full-path"
  },
  fish: {
    label: "Fish-style abbreviations",
    list: "fish-style"
  }
};
var CWD_DISPLAY_STYLE_VALUES = Object.keys(CWD_DISPLAY_STYLES);
var CwdWidget = defineWidget({
  type: "cwd",
  label: "Working Dir",
  category: "Core",
  description: "Current working directory",
  dependencies: ["cwd"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "cwdDisplayStyle",
      label: "Display style",
      kind: "choice",
      description: "Working directory display style",
      default: "default",
      options: {
        choices: CWD_DISPLAY_STYLE_VALUES.map((style) => ({
          id: style,
          label: CWD_DISPLAY_STYLES[style].label,
          list: CWD_DISPLAY_STYLES[style].list
        })),
        showInWidgets: true,
        showInColors: false,
        listProperty: "display"
      }
    },
    {
      id: "segments",
      label: "Segments",
      kind: "number",
      description: "Number of trailing path segments or fish abbreviation width",
      default: 2,
      options: { min: 1, max: 8, showInWidgets: true, showInColors: false }
    }
  ],
  icons: { emoji: "\u{1F4C1}", nerd: "\uF07C", text: "cwd" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatCwdPath(ctx.cwd, options.cwdDisplayStyle, options.segments) || basename2(ctx.cwd)
    );
  }
});
function formatCwdPath(path, style, segments) {
  if (style === "full-home") return fullHomePath(path);
  if (style === "fish") return fishStylePath(path, segments);
  return shortenPath(path, segments);
}
function shortenPath(path, maxSegments) {
  const normalized = fullHomePath(path);
  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  if (parts.length <= maxSegments) return normalized || sep;
  const prefix = normalized.startsWith("~") ? "~/\u2026" : "\u2026";
  return `${prefix}/${parts.slice(-maxSegments).join("/")}`;
}
function fullHomePath(path) {
  const home = process.env.HOME;
  if (!home || !isPathInsideHome(path, home)) return path;
  return `~${path.slice(home.length)}`;
}
function fishStylePath(path, segmentLength) {
  const normalized = fullHomePath(path);
  const hasHomePrefix = normalized.startsWith("~");
  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  const pathParts = hasHomePrefix ? parts.slice(1) : parts;
  if (pathParts.length <= 1) return normalized || sep;
  const prefix = hasHomePrefix ? "~/" : normalized.startsWith(sep) ? sep : "";
  const abbreviated = pathParts.map(
    (part, index) => index === pathParts.length - 1 ? part : Array.from(part).slice(0, segmentLength).join("") || part
  );
  return `${prefix}${abbreviated.join("/")}`;
}
function isPathInsideHome(path, home) {
  if (path === home) return true;
  const next = path[home.length];
  return path.startsWith(home) && (next === "/" || next === "\\");
}

// src/event-widgets.ts
var UPDATE_EVENT_WIDGET_EVENT = "pi-footer:update-widget";
var EVENT_WIDGET_ID_PREFIX = "event_";
function createEventWidgetId() {
  return `${EVENT_WIDGET_ID_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
}
var EventWidgetValues = class {
  valuesById = /* @__PURE__ */ new Map();
  get values() {
    return this.valuesById;
  }
  update(payload) {
    if (!isUpdatePayload(payload)) return false;
    if (payload.value === null) {
      return this.valuesById.delete(payload.widgetId);
    }
    const previous = this.valuesById.get(payload.widgetId);
    this.valuesById.set(payload.widgetId, payload.value);
    return previous !== payload.value;
  }
};
function isUpdatePayload(value) {
  if (!isRecord(value)) return false;
  return typeof value.widgetId === "string" && value.widgetId.length > 0 && (typeof value.value === "string" || value.value === null);
}

// src/widgets/core/event.ts
var EventValueWidget = defineWidget({
  type: "event",
  label: "Event Value",
  category: "Core",
  description: "Value updated by other extensions through pi.events",
  dependencies: ["eventWidgets"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "widgetId",
      label: "Widget ID",
      kind: "text",
      description: "ID used by pi.events publishers to update this widget",
      default: "",
      options: {
        showInWidgets: true,
        showInColors: false,
        listProperty: "id"
      }
    }
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  createOptionDefaults() {
    return { widgetId: createEventWidgetId() };
  },
  render({ ctx, options, renderWidget }) {
    return renderWidget(ctx.eventWidgets?.get(options.widgetId ?? ""));
  }
});

// src/widgets/core/external-status.ts
var ExtensionStatusWidget = defineWidget({
  type: "external-status",
  label: "Extension Status",
  category: "Core",
  description: "Status value published by another pi extension through ctx.ui.setStatus",
  dependencies: ["getExtensionStatuses"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "externalStatusKey",
      label: "Status key",
      kind: "text",
      description: "Extension status key to render",
      default: "",
      options: {
        showInWidgets: true,
        showInColors: true,
        listProperty: "status",
        editAction: "external-status-key"
      }
    },
    {
      id: "trimValue",
      label: "Trim value",
      kind: "number",
      description: "Leading visible characters to trim from the status value",
      default: 0,
      options: {
        min: 0,
        max: 10,
        showInWidgets: true,
        showInColors: false,
        listProperty: "trim"
      }
    },
    {
      id: "preserveTrimStyles",
      label: "Preserve trim styles",
      kind: "boolean",
      description: "Replay ANSI styles from the trimmed prefix after labels or custom icons",
      default: true,
      options: {
        showInWidgets: false,
        showInColors: false
      }
    }
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const key = options.externalStatusKey.trim();
    const value = key ? ctx.getExtensionStatuses?.()?.get(key) : void 0;
    const rendered = value ? trimLeadingVisibleChars(value, options.trimValue, options.preserveTrimStyles) : { value: "" };
    return renderWidget(rendered.value, {
      ...rendered.preservedTrimStyles ? { preservedTrimStyles: rendered.preservedTrimStyles } : {},
      ...shouldStripIncomingStyles(options) ? { stripIncomingStyles: true } : {}
    });
  }
});
function shouldStripIncomingStyles(options) {
  return options.fg !== void 0 && options.fg !== "default" || options.bg !== void 0 && options.bg !== "default" || options.bold === true;
}
function trimLeadingVisibleChars(text, count, preserveStyles) {
  if (count <= 0) return { value: text };
  let trimmed = 0;
  let index = 0;
  let preservedStyles = "";
  while (index < text.length && trimmed < count) {
    const ansiMatch = /^\x1b\[[0-?]*[ -/]*[@-~]/.exec(text.slice(index));
    if (ansiMatch) {
      if (preserveStyles) preservedStyles += ansiMatch[0];
      index += ansiMatch[0].length;
      continue;
    }
    const codePoint = text.codePointAt(index);
    if (codePoint === void 0) break;
    index += codePoint > 65535 ? 2 : 1;
    trimmed += 1;
  }
  const value = text.slice(index);
  return preservedStyles ? { value, preservedTrimStyles: preservedStyles } : { value };
}

// src/widgets/core/model-provider.ts
var ModelProviderWidget = defineWidget({
  type: "model-provider",
  label: "Provider/Model",
  category: "Core",
  description: "Provider and model together",
  dependencies: ["model", "provider"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F916}", nerd: "\u{F06A9}", text: "model" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    const value = ctx.provider ? `${ctx.provider}/${ctx.model ?? "no-model"}` : ctx.model ?? "no-model";
    return renderWidget(value);
  }
});

// src/widgets/core/model.ts
var ModelWidget = defineWidget({
  type: "model",
  label: "Model",
  category: "Core",
  description: "Active model id",
  dependencies: ["model", "provider"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "showProvider",
      label: "Show provider",
      kind: "boolean",
      description: "Show provider name before the model id",
      default: false,
      options: {
        label: "with-provider",
        showInWidgets: true,
        showInColors: true,
        listProperty: ""
      }
    }
  ],
  icons: { emoji: "\u{1F916}", nerd: "\u{F06A9}", text: "model" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const value = options.showProvider && ctx.provider ? `${ctx.provider}/${ctx.model ?? "no-model"}` : ctx.model ?? "no-model";
    return renderWidget(value);
  }
});

// src/widgets/core/provider.ts
var ProviderWidget = defineWidget({
  type: "provider",
  label: "Provider",
  category: "Core",
  description: "Active model provider",
  dependencies: ["provider"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u2601\uFE0F", nerd: "\u{F048B}", text: "provider" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.provider);
  }
});

// src/widgets/core/session-name.ts
var SessionNameWidget = defineWidget({
  type: "session-name",
  label: "Session Name",
  category: "Core",
  description: "Pi session name",
  dependencies: ["sessionName"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [],
  icons: { emoji: "\u{1F3F7}\uFE0F", nerd: "\u{F0379}", text: "session" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.sessionName);
  }
});

// src/widgets/core/text-verbosity.ts
var TextVerbosityWidget = defineWidget({
  type: "text-verbosity",
  label: "Text Verbosity",
  category: "Core",
  description: "Text verbosity for models/providers that support it",
  dependencies: ["textVerbosity"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F4DD}", nerd: "\u{F027F}", text: "verbosity" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.textVerbosity);
  }
});

// src/widgets/core/thinking-level.ts
var ThinkingLevelWidget = defineWidget({
  type: "thinking-level",
  label: "Thinking Level",
  category: "Core",
  description: "Pi reasoning/thinking level for reasoning-capable models",
  dependencies: ["thinkingLevel"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F9E0}", nerd: "\u{F0208}", text: "thinking" },
  defaultStyle: { fg: "magenta", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.thinkingLevel);
  }
});

// src/widgets/git/ahead-behind.ts
var GitAheadBehindWidget = defineWidget({
  type: "git-ahead-behind",
  label: "Git Ahead/Behind",
  category: "Git",
  description: "Ahead/behind upstream counts",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2195\uFE0F", nerd: "\u{F09BB}", text: "upstream" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.isRepo ? `\u2191${ctx.git.ahead} \u2193${ctx.git.behind}` : "");
  }
});

// src/widgets/git/branch.ts
var GIT_BRANCH_DISPLAY_STYLES = {
  default: {
    label: "Default",
    list: "default"
  },
  "round-brackets": {
    label: "Round brackets",
    list: "brackets"
  },
  custom: {
    label: "Custom surround text",
    list: "custom"
  }
};
var GIT_BRANCH_DISPLAY_STYLE_VALUES = Object.keys(
  GIT_BRANCH_DISPLAY_STYLES
);
var GitBranchWidget = defineWidget({
  type: "git-branch",
  label: "Git Branch",
  category: "Git",
  description: "Current Git branch",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [
    {
      id: "gitBranchDisplayStyle",
      label: "Display style",
      kind: "choice",
      description: "Branch name display style",
      default: "default",
      options: {
        choices: GIT_BRANCH_DISPLAY_STYLE_VALUES.map((style) => ({
          id: style,
          label: GIT_BRANCH_DISPLAY_STYLES[style].label,
          list: GIT_BRANCH_DISPLAY_STYLES[style].list
        })),
        showInWidgets: true,
        showInColors: false,
        listProperty: "display"
      }
    },
    {
      id: "surroundLeft",
      label: "Surround left",
      kind: "text",
      description: "Text before the branch name when custom display is enabled",
      default: "",
      showWhen: { property: "gitBranchDisplayStyle", equals: "custom" },
      options: { showInWidgets: false, showInColors: false }
    },
    {
      id: "surroundRight",
      label: "Surround right",
      kind: "text",
      description: "Text after the branch name when custom display is enabled",
      default: "",
      showWhen: { property: "gitBranchDisplayStyle", equals: "custom" },
      options: { showInWidgets: false, showInColors: false }
    }
  ],
  icons: { emoji: "\u{1F33F}", nerd: "\uE725", text: "git" },
  defaultStyle: { fg: "magenta", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const branch = ctx.git.branch;
    if (!branch) return renderWidget("");
    if (options.gitBranchDisplayStyle === "round-brackets") return renderWidget(`(${branch})`);
    if (options.gitBranchDisplayStyle === "custom") {
      return renderWidget(`${options.surroundLeft}${branch}${options.surroundRight}`);
    }
    return renderWidget(branch);
  }
});

// src/widgets/git/clean.ts
var GitCleanStatusWidget = defineWidget({
  type: "git-clean",
  label: "Git Clean Status",
  category: "Git",
  description: "Clean/dirty state",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2705", nerd: "\u{F012C}", text: "git" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    if (!ctx.git.isRepo) return renderWidget("");
    const changes = ctx.git.staged + ctx.git.unstaged + ctx.git.untracked;
    return renderWidget(changes === 0 ? "clean" : "dirty");
  }
});

// src/widgets/git/deletions.ts
var GitDeletionsWidget = defineWidget({
  type: "git-deletions",
  label: "Git Deletions",
  category: "Git",
  description: "Uncommitted deletion count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2796", nerd: "-", text: "del" },
  defaultStyle: { fg: "red", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.deletions}`);
  }
});

// src/widgets/git/diff.ts
var GitDiffWidget = defineWidget({
  type: "git-diff",
  label: "Git Diff",
  category: "Git",
  description: "Insertion/deletion diff summary",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [
    {
      id: "gitDiffMode",
      label: "Display",
      kind: "choice",
      description: "Git diff display mode",
      default: "plain",
      options: {
        choices: [
          { id: "plain", label: "Plain (+/-)", list: "Plain (+/-)" },
          { id: "compact", label: "Compact (+n,-n)", list: "Compact (+n,-n)" }
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "display"
      }
    }
  ],
  icons: { emoji: "\u{1F4C8}", nerd: "\uE702", text: "diff" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      options.gitDiffMode === "compact" ? `(+${ctx.git.insertions},-${ctx.git.deletions})` : `+${ctx.git.insertions}/-${ctx.git.deletions}`
    );
  }
});

// src/widgets/git/insertions.ts
var GitInsertionsWidget = defineWidget({
  type: "git-insertions",
  label: "Git Insertions",
  category: "Git",
  description: "Uncommitted insertion count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2795", nerd: "+", text: "ins" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.insertions}`);
  }
});

// src/widgets/git/remote.ts
var GitRemoteWidget = defineWidget({
  type: "git-remote",
  label: "Git Remote",
  category: "Git",
  description: "Origin remote",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F310}", nerd: "\u{F02A2}", text: "remote" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.remote ?? "");
  }
});

// src/widgets/git/root.ts
var GitRootDirWidget = defineWidget({
  type: "git-root",
  label: "Git Root Dir",
  category: "Git",
  description: "Repository root directory name",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F4E6}", nerd: "\uE5FB", text: "repo" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.root ?? "");
  }
});

// src/widgets/git/sha.ts
var GitShaWidget = defineWidget({
  type: "git-sha",
  label: "Git SHA",
  category: "Git",
  description: "Short HEAD commit SHA",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F516}", nerd: "\uEAFC", text: "sha" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.git.sha ?? "");
  }
});

// src/widgets/git/staged.ts
var GitStagedWidget = defineWidget({
  type: "git-staged",
  label: "Git Staged Files",
  category: "Git",
  description: "Staged file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2795", nerd: "+", text: "staged" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.staged}`);
  }
});

// src/widgets/git/status.ts
var GitStatusWidget = defineWidget({
  type: "git-status",
  label: "Git Status",
  category: "Git",
  description: "Staged/unstaged/untracked counts",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F500}", nerd: "\uE702", text: "git" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      ctx.git.isRepo ? `+${ctx.git.staged} \xB1${ctx.git.unstaged} ?${ctx.git.untracked}` : ""
    );
  }
});

// src/widgets/git/unstaged.ts
var GitUnstagedWidget = defineWidget({
  type: "git-unstaged",
  label: "Git Unstaged Files",
  category: "Git",
  description: "Unstaged file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F4DD}", nerd: "\xB1", text: "unstaged" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.unstaged}`);
  }
});

// src/widgets/git/untracked.ts
var GitUntrackedWidget = defineWidget({
  type: "git-untracked",
  label: "Git Untracked Files",
  category: "Git",
  description: "Untracked file count",
  dependencies: ["git"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u2753", nerd: "?", text: "untracked" },
  defaultStyle: { fg: "red", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.git.untracked}`);
  }
});

// src/widgets/instance.ts
var WidgetInstance = class {
  constructor(spec, entry) {
    this.spec = spec;
    this.entry = entry;
  }
  spec;
  entry;
  get id() {
    return this.entry.id;
  }
  get type() {
    return this.entry.type;
  }
  get enabled() {
    return this.entry.enabled;
  }
  set enabled(value) {
    this.entry.enabled = value;
  }
  get options() {
    return this.entry.options;
  }
  set options(value) {
    this.entry.options = value;
  }
  // TODO(widget-spec): remove casts once render context and hydrated entries preserve concrete spec types.
  render(ctx) {
    const spec = this.spec;
    return spec.render({
      ctx,
      options: this.options,
      renderWidget: (value, renderOptions) => {
        return renderWidgetValue(this.entry, value, ctx, {
          ...renderOptions,
          icons: renderOptions?.icons ?? this.spec.icons
        });
      }
    });
  }
  toggle(enabled = !this.enabled) {
    this.enabled = enabled;
  }
  update(options) {
    this.options = { ...this.options, ...options };
  }
  toEntry() {
    return {
      id: this.id,
      type: this.type,
      enabled: this.enabled,
      options: { ...this.options }
    };
  }
};
function renderWidgetValue(entry, value, ctx, renderOptions = {}) {
  const options = entry.options;
  if (!entry.enabled) return void 0;
  const rawValue = value ?? "";
  if (rawValue.length === 0 && options.hideWhenEmpty) return void 0;
  if (rawValue === "0" && options.hideWhenZero) return void 0;
  const fallbackValue = rawValue.length === 0 ? options.text ?? "-" : rawValue;
  const displayValue = renderOptions.stripIncomingStyles ? stripAnsi(fallbackValue) : fallbackValue;
  const label = renderOptions.icons?.[ctx.iconMode];
  const unstyled = options.raw === true || ctx.minimalist ? displayValue : options.icon ? `${options.icon}${displayValue}` : label ? `${label} ${displayValue}` : displayValue;
  const styled = renderOptions.preservedTrimStyles && !renderOptions.stripIncomingStyles ? `${renderOptions.preservedTrimStyles}${unstyled}` : unstyled;
  return applyColors(
    styled,
    renderOptions.fg ?? options.fg,
    renderOptions.bg ?? options.bg,
    renderOptions.bold ?? options.bold,
    ctx.colorLevel,
    ctx.theme
  );
}

// src/widgets/layout/custom-text.ts
var CustomTextWidget = defineWidget({
  type: "custom-text",
  label: "Custom Text",
  category: "Custom/Layout",
  description: "User-defined text segment",
  dependencies: [],
  baseOptions: ["text"],
  // Custom text only exposes the shared `text` field, with a widget-specific default.
  baseOptionDefaults: { text: "custom" },
  properties: [],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(options.text);
  }
});

// src/widgets/layout/flex-separator.ts
var FlexSeparatorWidget = defineWidget({
  type: "flex-separator",
  label: "Flex Separator",
  category: "Custom/Layout",
  description: "Push following widgets to the right",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "hideWhenEmpty",
      label: "Hide when empty",
      kind: "boolean",
      description: "Hide empty flex separator output",
      default: true,
      options: {
        // Hidden implementation detail: flex separators are structural and should not render text,
        // while the visible UI remains only Enabled as it was before migration.
        showInFields: false,
        showInWidgets: false,
        showInColors: false
      }
    }
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ renderWidget }) {
    return renderWidget("");
  }
});

// src/widgets/layout/separator.ts
var SeparatorWidget = defineWidget({
  type: "separator",
  label: "Separator",
  category: "Custom/Layout",
  description: "Predefined or custom separator segment",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "hideWhenEmpty",
      label: "Hide when empty",
      kind: "boolean",
      description: "Hide empty separator output",
      default: true,
      options: {
        // Hidden implementation detail: `separator=none` and empty custom text must render no segment,
        // while the visible UI remains only Enabled/Separator/Text as it was before migration.
        showInFields: false,
        showInWidgets: false,
        showInColors: false
      }
    },
    {
      id: "separator",
      label: "Separator",
      kind: "choice",
      description: "Separator style",
      default: "pipe",
      options: {
        choices: WIDGET_SEPARATOR_VALUES.map((id) => ({ id, label: id, list: id })),
        listProperty: "separator",
        showInColors: true
      }
    },
    {
      id: "text",
      label: "Text",
      kind: "text",
      description: "Custom separator text",
      default: "|",
      showWhen: { property: "separator", equals: "custom" },
      options: {
        quoteValue: true,
        showInColors: true
      }
    }
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(widgetSeparatorText(options.separator, options.text));
  }
});

// src/widgets/layout/spacer.ts
var SpacerWidget = defineWidget({
  type: "spacer",
  label: "Spacer",
  category: "Custom/Layout",
  description: "Fixed-width blank spacer",
  dependencies: [],
  baseOptions: [],
  baseOptionDefaults: {},
  properties: [
    {
      id: "width",
      label: "Width",
      kind: "number",
      description: "Spacer width",
      default: 2,
      options: {
        min: 1,
        max: 40,
        listProperty: "width",
        showInColors: true
      }
    }
  ],
  icons: { emoji: "", nerd: "", text: "" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ options, renderWidget }) {
    return renderWidget(" ".repeat(options.width));
  }
});

// src/widgets/options.ts
var SYSTEM_BASE_OPTION_DEFAULTS = {
  raw: false,
  hideWhenEmpty: false,
  hideWhenZero: false,
  text: "-",
  icon: ""
};
function defaultOptionsFromSpec(spec) {
  const base = {};
  for (const option of spec.baseOptions) {
    const optionId = option;
    base[optionId] = SYSTEM_BASE_OPTION_DEFAULTS[option];
  }
  Object.assign(base, spec.baseOptionDefaults ?? {});
  for (const property of spec.properties) {
    base[property.id] = property.default;
  }
  const dynamicDefaults = spec.createOptionDefaults?.();
  if (dynamicDefaults) Object.assign(base, dynamicDefaults);
  if (spec.defaultStyle.fg !== void 0) base.fg = spec.defaultStyle.fg;
  if (spec.defaultStyle.bg !== void 0) base.bg = spec.defaultStyle.bg;
  if (spec.defaultStyle.bold !== void 0) base.bold = spec.defaultStyle.bold;
  return base;
}
function sanitizeOptionsFromSpec(spec, input) {
  const defaults = defaultOptionsFromSpec(spec);
  const merged = { ...defaults, ...input };
  const next = {};
  for (const option of spec.baseOptions) {
    if (!(option in defaults)) continue;
    const optionId = option;
    next[optionId] = sanitizeMetadataValue(merged[optionId], defaults[optionId]);
  }
  const fg = normalizeColor(merged.fg);
  if (fg) next.fg = fg;
  const bg = normalizeColor(merged.bg);
  if (bg) next.bg = bg;
  next.bold = typeof merged.bold === "boolean" ? merged.bold : Boolean(defaults.bold);
  for (const property of spec.properties) {
    next[property.id] = sanitizeWidgetProperty(property, merged[property.id]);
  }
  return next;
}
function sanitizeWidgetProperty(property, value) {
  switch (property.kind) {
    case "boolean":
      return typeof value === "boolean" ? value : property.default;
    case "number":
      return sanitizeMetadataNumber(
        value,
        property.default,
        property.options?.min,
        property.options?.max
      );
    case "text":
      if (property.id === "warningFg" || property.id === "warningBg" || property.id === "dangerFg" || property.id === "dangerBg")
        return normalizeColor(value) ?? property.default;
      return typeof value === "string" ? value : property.default;
    case "choice": {
      const choices = property.options?.choices ?? [];
      return typeof value === "string" && choices.some((choice) => choice.id === value) ? value : property.default;
    }
  }
}
function sanitizeMetadataValue(value, defaultValue) {
  if (typeof defaultValue === "boolean") return typeof value === "boolean" ? value : defaultValue;
  if (typeof defaultValue === "number")
    return typeof value === "number" && Number.isInteger(value) ? value : defaultValue;
  if (typeof defaultValue === "string") return typeof value === "string" ? value : defaultValue;
  return defaultValue;
}
function sanitizeMetadataNumber(value, defaultValue, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const numberValue = typeof value === "number" && Number.isInteger(value) ? value : defaultValue;
  const safeNumber = typeof numberValue === "number" ? numberValue : 0;
  return Math.min(max, Math.max(min, safeNumber));
}

// src/widgets/project/runtime.ts
import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";

// src/cache.ts
var CACHE_NAMESPACES = { runtime: "runtime", git: "git" };
var AsyncCache = class {
  entries = /* @__PURE__ */ new Map();
  maxEntries;
  now;
  constructor(maxEntries = 200, now = () => Date.now()) {
    this.maxEntries = maxEntries;
    this.now = now;
  }
  get(ns, key, ttlMs, filter, fetcher, onRefresh) {
    const cacheKey = this.cacheKey(ns, key);
    const entry = this.entryFor(cacheKey);
    if (this.isFresh(entry, ttlMs)) return entry.value;
    this.addListener(entry, onRefresh);
    if (!entry.pending) entry.pending = this.refresh(entry, filter, fetcher);
    return entry.value;
  }
  clear() {
    this.entries.clear();
  }
  entryFor(cacheKey) {
    const cached = this.entries.get(cacheKey);
    if (cached) return cached;
    const entry = {
      value: null,
      updatedAt: null,
      pending: null,
      listeners: /* @__PURE__ */ new Set()
    };
    this.entries.set(cacheKey, entry);
    this.evictOldestEntry();
    return entry;
  }
  isFresh(entry, ttlMs) {
    return entry.updatedAt !== null && this.now() - entry.updatedAt < ttlMs;
  }
  addListener(entry, listener) {
    if (listener) entry.listeners.add(listener);
  }
  async refresh(entry, filter, fetcher) {
    try {
      entry.value = await fetcher(filter);
    } catch {
      entry.value = null;
    } finally {
      entry.updatedAt = this.now();
      entry.pending = null;
      this.notify(entry);
    }
  }
  notify(entry) {
    const listeners = [...entry.listeners];
    entry.listeners.clear();
    for (const listener of listeners) {
      try {
        listener();
      } catch {
      }
    }
  }
  evictOldestEntry() {
    if (this.entries.size <= this.maxEntries) return;
    const oldestKey = this.entries.keys().next().value;
    if (oldestKey !== void 0) this.entries.delete(oldestKey);
  }
  cacheKey(ns, key) {
    return `${ns}:${String(key)}`;
  }
};
var asyncCache = new AsyncCache();

// src/widgets/project/runtime.ts
var VERSION_TIMEOUT_MS = 1e3;
var RUNTIME_CACHE_TTL_MS = 1e4;
var RUNTIME_DEFINITIONS = [
  {
    name: "bun",
    files: ["bun.lock", "bun.lockb"],
    versionCommands: [
      {
        command: "bun",
        args: ["--version"],
        parse: (output) => /\bv?([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F95F}", nerd: "\uE76F", text: "" },
    color: "pi:warning"
  },
  {
    name: "deno",
    files: ["deno.json", "deno.jsonc", "deno.lock"],
    versionCommands: [
      {
        command: "deno",
        args: ["--version"],
        parse: (output) => /deno\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F995}", nerd: "\uE7C0", text: "" },
    color: "pi:syntaxType"
  },
  {
    name: "lua",
    files: ["stylua.toml", ".stylua.toml", ".luarc.json", ".luarc.jsonc", "init.lua"],
    matchesEntry: (entry) => entry.name === "lua" || entry.isFile && entry.name.endsWith(".lua"),
    versionCommands: [
      { command: "lua", args: ["-v"], parse: (output) => /Lua\s+([0-9][^\s]*)/i.exec(output)?.[1] },
      {
        command: "luajit",
        args: ["-v"],
        parse: (output) => /LuaJIT\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F319}", nerd: "\uE620", text: "" },
    color: "pi:accent"
  },
  {
    name: "node",
    files: ["package.json", ".nvmrc", ".node-version"],
    versionCommands: [
      {
        command: "node",
        args: ["--version"],
        parse: (output) => /\bv?([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u2B22", nerd: "\uE718", text: "" },
    color: "pi:success"
  },
  {
    name: "python",
    files: [
      "pyproject.toml",
      "requirements.txt",
      "setup.py",
      "setup.cfg",
      "Pipfile",
      ".python-version"
    ],
    versionCommands: [
      {
        command: "python3",
        args: ["--version"],
        parse: (output) => /Python\s+([0-9][^\s]*)/i.exec(output)?.[1]
      },
      {
        command: "python",
        args: ["--version"],
        parse: (output) => /Python\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F40D}", nerd: "\uE73C", text: "" },
    color: "pi:warning"
  },
  {
    name: "go",
    files: ["go.mod"],
    versionCommands: [
      {
        command: "go",
        args: ["version"],
        parse: (output) => /go version go([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F439}", nerd: "\uE627", text: "" },
    color: "pi:syntaxType"
  },
  {
    name: "rust",
    files: ["Cargo.toml"],
    versionCommands: [
      {
        command: "rustc",
        args: ["--version"],
        parse: (output) => /rustc\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F980}", nerd: "\uE7A8", text: "" },
    color: "pi:error"
  },
  {
    name: "java",
    files: ["pom.xml", "build.gradle", "build.gradle.kts"],
    versionCommands: [
      {
        command: "java",
        args: ["-version"],
        parse: (output) => /(?:openjdk|java)\s+version\s+"?([0-9][^"\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u2615", nerd: "\uE738", text: "" },
    color: "pi:warning"
  },
  {
    name: "ruby",
    files: ["Gemfile", ".ruby-version"],
    versionCommands: [
      {
        command: "ruby",
        args: ["--version"],
        parse: (output) => /ruby\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F48E}", nerd: "\uE791", text: "" },
    color: "pi:error"
  },
  {
    name: "php",
    files: ["composer.json"],
    versionCommands: [
      {
        command: "php",
        args: ["--version"],
        parse: (output) => /PHP\s+([0-9][^\s]*)/i.exec(output)?.[1]
      }
    ],
    icons: { emoji: "\u{1F418}", nerd: "\uE608", text: "" },
    color: "pi:accent"
  }
];
var RuntimeWidget = defineWidget({
  type: "runtime",
  label: "Runtime",
  category: "Project",
  description: "Current project runtime (e.g. Bun, Python, Go, Rust)",
  dependencies: ["cwd"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { hideWhenEmpty: true },
  properties: [
    {
      id: "style",
      label: "Style",
      kind: "choice",
      description: "Display style",
      default: "compact",
      options: {
        choices: [
          { id: "default", label: "Default", list: "default" },
          { id: "compact", label: "Compact", list: "compact" }
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "style"
      }
    },
    {
      id: "displayVersion",
      label: "Display version",
      kind: "boolean",
      description: "Show runtime version",
      default: true,
      options: {
        label: "with-version",
        showInWidgets: true,
        showInColors: true,
        listProperty: ""
      }
    }
  ],
  icons: { emoji: "\u2699\uFE0F", nerd: "\uE795", text: "runtime" },
  defaultStyle: { fg: "default", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const cwd = ctx.cwd;
    if (cwd.length === 0) return renderWidget("");
    const info = asyncCache.get(
      CACHE_NAMESPACES.runtime,
      `${cwd}:${options.displayVersion ? "version" : "no-version"}`,
      RUNTIME_CACHE_TTL_MS,
      { cwd, displayVersion: options.displayVersion },
      detectRuntime,
      ctx.requestRender
    );
    if (!info) return renderWidget("", { icons: { emoji: "", nerd: "", text: "" } });
    return renderWidget(renderRuntimeValue(info, options.displayVersion, options.style), {
      icons: info.icons,
      fg: options.fg && options.fg !== "default" ? options.fg : info.color
    });
  }
});
function renderRuntimeValue(info, displayVersion, style) {
  if (!displayVersion || !info.version) return info.name;
  if (style === "compact") return compactRuntimeVersion(info.name, info.version);
  return `${info.name} ${info.version}`;
}
function prefixRuntimeVersion(version) {
  const trimmed = version.trim();
  if (!trimmed) return trimmed;
  return trimmed.toLowerCase().startsWith("v") ? trimmed : `v${trimmed}`;
}
function compactRuntimeVersion(name, version) {
  const prefixed = prefixRuntimeVersion(version);
  const match = /^v([0-9]+)(?:\.([0-9]+))?/i.exec(prefixed);
  if (!match) return prefixed;
  const major = match[1] ?? "";
  const minor = match[2];
  if ((name === "python" || name === "go" || name === "bun") && minor !== void 0)
    return `v${major}.${minor}`;
  return `v${major}`;
}
async function detectRuntime({
  cwd,
  displayVersion
}) {
  const entries = await readCwdEntries(cwd);
  if (!entries) return null;
  for (const definition of RUNTIME_DEFINITIONS) {
    if (!matchesRuntime(definition, entries)) continue;
    const version = displayVersion ? await detectVersion(definition) : void 0;
    return version ? {
      name: definition.name,
      version,
      icons: definition.icons,
      color: definition.color
    } : {
      name: definition.name,
      icons: definition.icons,
      color: definition.color
    };
  }
  return null;
}
async function readCwdEntries(cwd) {
  try {
    const entries = await readdir(cwd, { withFileTypes: true });
    return entries.map((entry) => ({ name: entry.name, isFile: entry.isFile() }));
  } catch {
    return void 0;
  }
}
function matchesRuntime(definition, entries) {
  if (hasAnyFile(entries, definition.files)) return true;
  return definition.matchesEntry ? entries.some((entry) => definition.matchesEntry?.(entry) === true) : false;
}
function hasAnyFile(entries, files) {
  const fileNames = new Set(entries.filter((entry) => entry.isFile).map((entry) => entry.name));
  return files.some((file) => fileNames.has(file));
}
async function detectVersion(definition) {
  for (const command of definition.versionCommands) {
    const version = await runVersion(command);
    if (version) return version;
  }
  return void 0;
}
async function runVersion(versionCommand) {
  return new Promise((resolve) => {
    execFile(
      versionCommand.command,
      [...versionCommand.args],
      { encoding: "utf8", timeout: VERSION_TIMEOUT_MS, windowsHide: true },
      (error, stdout, stderr) => {
        const output = `${stringOutput(stdout)}
${stringOutput(stderr)}`;
        if (error && output.trim().length === 0) {
          resolve(void 0);
          return;
        }
        const parsed = versionCommand.parse(output);
        resolve(parsed ? prefixRuntimeVersion(parsed) : void 0);
      }
    );
  });
}
function stringOutput(value) {
  return typeof value === "string" ? value : value.toString("utf8");
}

// src/widgets/session/assistant-messages.ts
var AssistantMessagesWidget = defineWidget({
  type: "assistant-messages",
  label: "Assistant Messages",
  category: "Session",
  description: "Assistant message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F916}", nerd: "\u{F06A9}", text: "assistant" },
  defaultStyle: { fg: "white", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.assistantMessages}`);
  }
});

// src/widgets/session/compactions.ts
var CompactionsWidget = defineWidget({
  type: "compactions",
  label: "Compactions",
  category: "Session",
  description: "Compaction summary count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F5DC}\uFE0F", nerd: "\u{F0068}", text: "compactions" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.compactions}`);
  }
});

// src/widgets/utils/session.ts
function formatTime(timestamp) {
  if (timestamp === void 0) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const totalMinutes = Math.max(1, Math.floor(ms / 6e4));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
function formatElapsed(first, last) {
  if (first === void 0) return "0m";
  const end = last === void 0 || last < first ? Date.now() : last;
  return formatDuration(end - first);
}

// src/widgets/session/elapsed.ts
var ElapsedWidget = defineWidget({
  type: "elapsed",
  label: "Transcript Span",
  category: "Session",
  description: "Time between first and last recorded session entry",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u23F1\uFE0F", nerd: "\u{F13AB}", text: "span" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatElapsed(ctx.metrics.firstTimestampMs, ctx.metrics.lastTimestampMs));
  }
});

// src/widgets/session/last-activity.ts
var LastActivityWidget = defineWidget({
  type: "last-activity",
  label: "Last Activity",
  category: "Session",
  description: "Most recent session entry time",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F558}", nerd: "\u{F1443}", text: "last" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatTime(ctx.metrics.lastTimestampMs));
  }
});

// src/widgets/session/messages.ts
var MessagesWidget = defineWidget({
  type: "messages",
  label: "Message Counts",
  category: "Session",
  description: "User/assistant/tool message counts",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F4AC}", nerd: "\u{F0B7B}", text: "msg" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      `${ctx.metrics.userMessages}u/${ctx.metrics.assistantMessages}a/${ctx.metrics.toolResults}t`
    );
  }
});

// src/widgets/session/session-id.ts
var SessionIdWidget = defineWidget({
  type: "session-id",
  label: "Session ID",
  category: "Session",
  description: "Current pi session id",
  dependencies: ["sessionId"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F194}", nerd: "\u{F0219}", text: "session id" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(ctx.sessionId);
  }
});

// src/widgets/session/session-start.ts
var SessionStartWidget = defineWidget({
  type: "session-start",
  label: "Session Start",
  category: "Session",
  description: "First session entry time",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [],
  icons: { emoji: "\u{1F680}", nerd: "\u{F1442}", text: "started" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatTime(ctx.metrics.firstTimestampMs));
  }
});

// src/widgets/session/tool-results.ts
var ToolResultsWidget = defineWidget({
  type: "tool-results",
  label: "Tool Results",
  category: "Session",
  description: "Tool result count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F6E0}\uFE0F", nerd: "\u{F0493}", text: "tools" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.toolResults}`);
  }
});

// src/widgets/session/total-messages.ts
var TotalMessagesWidget = defineWidget({
  type: "total-messages",
  label: "Total Messages",
  category: "Session",
  description: "Total message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F4AC}", nerd: "\u{F0B7B}", text: "messages" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(
      `${ctx.metrics.userMessages + ctx.metrics.assistantMessages + ctx.metrics.toolResults}`
    );
  }
});

// src/widgets/session/total-time.ts
var TotalTimeWidget = defineWidget({
  type: "total-time",
  label: "Session Total Time",
  category: "Session",
  description: "Live wall-clock time since first session entry",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u23F3", nerd: "\u{F13AB}", text: "total" },
  defaultStyle: { fg: "yellow", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(formatElapsed(ctx.metrics.firstTimestampMs, Date.now()));
  }
});

// src/widgets/session/user-messages.ts
var UserMessagesWidget = defineWidget({
  type: "user-messages",
  label: "User Messages",
  category: "Session",
  description: "User message count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon", "text"],
  baseOptionDefaults: {},
  properties: [],
  icons: { emoji: "\u{1F464}", nerd: "\uF007", text: "user" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, renderWidget }) {
    return renderWidget(`${ctx.metrics.userMessages}`);
  }
});

// src/widgets/tokens/cache-hit-rate.ts
var CacheHitRateWidget = defineWidget({
  type: "cache-hit-rate",
  label: "Cache Hit Rate",
  category: "Tokens",
  description: "Session or latest turn cache hit percentage",
  dependencies: ["metrics", "turnMetrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "cacheHitSource",
      label: "Source",
      kind: "choice",
      description: "Cache hit rate source",
      default: "session",
      options: {
        choices: [
          { id: "session", label: "Session", list: "Session" },
          { id: "turn", label: "Last Turn", list: "Turn" }
        ],
        showInWidgets: true,
        showInColors: true,
        listProperty: "source"
      }
    },
    {
      id: "style",
      label: "Style",
      kind: "choice",
      description: "Display style",
      default: "default",
      options: {
        choices: [
          { id: "default", label: "Default", list: "default" },
          { id: "compact", label: "Compact", list: "compact" }
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "style"
      }
    }
  ],
  icons: { emoji: "\u{1F3AF}", nerd: "\u{F04CE}", text: "cache hit" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const source = options.cacheHitSource === "turn" ? ctx.turnMetrics : ctx.metrics;
    const { inputTokens, cacheReadTokens, cacheWriteTokens } = source;
    const promptTokens = inputTokens + cacheReadTokens + cacheWriteTokens;
    const hitRate = promptTokens > 0 ? cacheReadTokens / promptTokens * 100 : 0;
    if (hitRate === 0 && options.hideWhenZero) return void 0;
    return renderWidget(`${hitRate.toFixed(options.style === "compact" ? 0 : 1)}%`);
  }
});

// src/widgets/tokens/cache-read.ts
var CacheReadWidget = defineWidget({
  type: "cache-read",
  label: "Cache Read",
  category: "Tokens",
  description: "Cache read token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u{1F4D6}", nerd: "\u{F01BC}", text: "cache read" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.cacheReadTokens, options.tokenFormatStyle));
  }
});

// src/widgets/tokens/cache-write.ts
var CacheWriteWidget = defineWidget({
  type: "cache-write",
  label: "Cache Write",
  category: "Tokens",
  description: "Cache write token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u270D\uFE0F", nerd: "\u{F01BC}", text: "cache write" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.cacheWriteTokens, options.tokenFormatStyle));
  }
});

// src/widgets/tokens/context-bar.ts
var CONTEXT_BAR_MODES = {
  default: {
    label: "Default bar",
    list: "Default bar",
    width: 32,
    filled: "\u2588",
    empty: "\u2591",
    bracketed: true,
    showUsage: true
  },
  short: {
    label: "Short bar",
    list: "Short bar",
    width: 10,
    filled: "\u2593",
    empty: "\u2591",
    bracketed: false,
    showUsage: true
  },
  "short-only": {
    label: "Short bar only",
    list: "Short bar only",
    width: 10,
    filled: "\u2593",
    empty: "\u2591",
    bracketed: false,
    showUsage: false
  },
  medium: {
    label: "Medium bar",
    list: "Medium bar",
    width: 16,
    filled: "\u2588",
    empty: "\u2591",
    bracketed: true,
    showUsage: true
  }
};
var CONTEXT_BAR_MODE_VALUES = Object.keys(CONTEXT_BAR_MODES);
var contextBarModeProperty = {
  id: "contextBarMode",
  label: "Display",
  kind: "choice",
  description: "Context bar display mode",
  default: "default",
  options: {
    choices: CONTEXT_BAR_MODE_VALUES.map((mode) => ({
      id: mode,
      label: CONTEXT_BAR_MODES[mode].label,
      list: CONTEXT_BAR_MODES[mode].list
    })),
    showInWidgets: true,
    showInColors: false,
    listProperty: "display"
  }
};
var ContextBarWidget = defineWidget({
  type: "context-bar",
  label: "Context Bar",
  category: "Tokens",
  description: "Progress bar for context usage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenEmpty", "icon", "text"],
  baseOptionDefaults: { text: "" },
  properties: [tokenFormatStyleProperty(), contextBarModeProperty, ...contextColorProperties()],
  icons: { emoji: "\u{1F4CA}", nerd: "\u{F035B}", text: "Context:" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const { contextBarMode, tokenFormatStyle } = options;
    return renderWidget(
      contextBar(ctx.contextTokens, ctx.contextMaxTokens, contextBarMode, tokenFormatStyle),
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens)
      }
    );
  }
});
function contextBar(tokens, maxTokens, contextBarMode, tokenFormatStyle) {
  const percent = contextPercent(tokens, maxTokens);
  if (tokens === void 0 || maxTokens === void 0 || percent === void 0) return "?";
  const usage = `${formatTokenCount(tokens, tokenFormatStyle)}/${formatTokenCount(maxTokens, tokenFormatStyle)} (${Math.round(percent)}%)`;
  const mode = CONTEXT_BAR_MODES[contextBarMode];
  const filledWidth = Math.round(percent / 100 * mode.width);
  const meter = `${mode.filled.repeat(filledWidth)}${mode.empty.repeat(Math.max(0, mode.width - filledWidth))}`;
  const bar = mode.bracketed ? `[${meter}]` : meter;
  return mode.showUsage ? `${bar} ${usage}` : bar;
}

// src/widgets/tokens/context-length.ts
var ContextLengthWidget = defineWidget({
  type: "context-length",
  label: "Context Length",
  category: "Tokens",
  description: "Current context token count",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty(), ...contextColorProperties()],
  icons: { emoji: "\u{1F4CF}", nerd: "\u{F035B}", text: "ctx len" },
  defaultStyle: { fg: "brightBlack", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      ctx.contextTokens === void 0 ? "?" : formatTokenCount(ctx.contextTokens, options.tokenFormatStyle),
      {
        ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens)
      }
    );
  }
});

// src/widgets/tokens/context-remaining.ts
var ContextRemainingWidget = defineWidget({
  type: "context-remaining",
  label: "Context Remaining",
  category: "Tokens",
  description: "Remaining context percentage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: contextColorProperties(),
  icons: { emoji: "\u{1F9E9}", nerd: "\u{F035B}", text: "ctx left" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(contextRemaining(ctx.contextTokens, ctx.contextMaxTokens), {
      ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens)
    });
  }
});
function contextRemaining(tokens, maxTokens) {
  if (tokens === void 0) return "?";
  if (maxTokens === void 0 || maxTokens <= 0) return `${formatCount(tokens)} ctx`;
  const percent = 100 - (contextPercent(tokens, maxTokens) ?? 0);
  return `${percent.toFixed(1).replace(/\.0$/, "")}%`;
}

// src/widgets/tokens/context.ts
var ContextWidget = defineWidget({
  type: "context",
  label: "Context %",
  category: "Tokens",
  description: "Current context usage percentage",
  dependencies: ["contextTokens", "contextMaxTokens"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: contextColorProperties(),
  icons: { emoji: "\u{1F9E9}", nerd: "\u{F035B}", text: "ctx" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(contextUsage(ctx.contextTokens, ctx.contextMaxTokens), {
      ...contextColors(options, ctx.contextTokens, ctx.contextMaxTokens)
    });
  }
});
function contextUsage(tokens, maxTokens) {
  if (tokens === void 0) return "?";
  if (maxTokens === void 0 || maxTokens <= 0) return `${formatCount(tokens)} ctx`;
  const percent = contextPercent(tokens, maxTokens) ?? 0;
  return `${percent.toFixed(1).replace(/\.0$/, "")}%`;
}

// src/widgets/tokens/cost.ts
var CostWidget = defineWidget({
  type: "cost",
  label: "Session Cost",
  category: "Tokens",
  description: "Estimated session cost",
  dependencies: ["metrics", "usingSubscription", "provider"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [
    {
      id: "costFormatStyle",
      label: "Cost format",
      kind: "choice",
      description: "Session cost display format",
      default: "default",
      options: {
        choices: [
          { id: "default", label: "Default", list: "Default" },
          { id: "compact", label: "Compact", list: "Compact" }
        ],
        showInWidgets: true,
        showInColors: false,
        listProperty: "format"
      }
    },
    {
      id: "showSubscription",
      label: "Show subscription",
      kind: "boolean",
      description: "Append subscription marker when subscription usage is active",
      default: false,
      options: {
        label: "show-sub",
        showInWidgets: true,
        showInColors: false
      }
    },
    {
      id: "hideForProviders",
      label: "Hide for providers",
      kind: "text",
      description: "Comma-separated provider IDs that hide the session cost",
      default: "",
      options: {
        showInWidgets: true,
        showInColors: false,
        listProperty: "hide-for",
        quoteValue: true
      }
    }
  ],
  icons: { emoji: "\u{1F4B8}", nerd: "\u{F140B}", text: "cost" },
  defaultStyle: { fg: "green", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    const hiddenProviders = options.hideForProviders.split(",").map((provider) => provider.trim()).filter(Boolean);
    if (ctx.provider && hiddenProviders.includes(ctx.provider)) return void 0;
    const cost = options.costFormatStyle === "compact" ? `$${ctx.metrics.costUsd.toFixed(3)}` : `$${ctx.metrics.costUsd.toFixed(ctx.metrics.costUsd < 1 ? 4 : 2)}`;
    const suffix = options.showSubscription && ctx.usingSubscription ? " (sub)" : "";
    return renderWidget(`${cost}${suffix}`);
  }
});

// src/widgets/tokens/input-speed.ts
var InputSpeedWidget = defineWidget({
  type: "input-speed",
  label: "Input Speed",
  category: "Tokens",
  description: "Average input tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u23EB", nerd: "\uEAF4", text: "in/min" },
  defaultStyle: { fg: "brightMagenta", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.inputTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle
      )
    );
  }
});

// src/widgets/tokens/input-tokens.ts
var InputTokensWidget = defineWidget({
  type: "input-tokens",
  label: "Input Tokens",
  category: "Tokens",
  description: "Input token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u2B06\uFE0F", nerd: "\u{F030C}", text: "in" },
  defaultStyle: { fg: "blue", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.inputTokens, options.tokenFormatStyle));
  }
});

// src/widgets/tokens/output-speed.ts
var OutputSpeedWidget = defineWidget({
  type: "output-speed",
  label: "Output Speed",
  category: "Tokens",
  description: "Average output tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u23EC", nerd: "\uEAF3", text: "out/min" },
  defaultStyle: { fg: "brightCyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.outputTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle
      )
    );
  }
});

// src/widgets/tokens/output-tokens.ts
var OutputTokensWidget = defineWidget({
  type: "output-tokens",
  label: "Output Tokens",
  category: "Tokens",
  description: "Output token total",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u2B07\uFE0F", nerd: "\u{F09DA}", text: "out" },
  defaultStyle: { fg: "white", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.outputTokens, options.tokenFormatStyle));
  }
});

// src/widgets/tokens/tokens.ts
var TokensWidget = defineWidget({
  type: "tokens",
  label: "Input/Output Tokens",
  category: "Tokens",
  description: "Input and output token totals",
  dependencies: ["metrics"],
  baseOptions: ["raw", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u{1F522}", nerd: "\u{F04F9}", text: "tok" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      `\u2191${formatTokenCount(ctx.metrics.inputTokens, options.tokenFormatStyle)} \u2193${formatTokenCount(ctx.metrics.outputTokens, options.tokenFormatStyle)}`
    );
  }
});

// src/widgets/tokens/total-speed.ts
var TotalSpeedWidget = defineWidget({
  type: "total-speed",
  label: "Total Speed",
  category: "Tokens",
  description: "Average total tokens per minute",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u26A1", nerd: "\u2195", text: "tok/min" },
  defaultStyle: { fg: "brightGreen", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(
      formatTokenSpeed(
        ctx.metrics.totalTokens,
        ctx.metrics.firstTimestampMs,
        ctx.metrics.lastTimestampMs,
        options.tokenFormatStyle
      )
    );
  }
});

// src/widgets/tokens/total-tokens.ts
var TotalTokensWidget = defineWidget({
  type: "total-tokens",
  label: "Total Tokens",
  category: "Tokens",
  description: "Total token count",
  dependencies: ["metrics"],
  baseOptions: ["raw", "hideWhenZero", "icon"],
  baseOptionDefaults: {},
  properties: [tokenFormatStyleProperty()],
  icons: { emoji: "\u{1F522}", nerd: "\u{F04F9}", text: "tok" },
  defaultStyle: { fg: "cyan", bg: "default", bold: false },
  render({ ctx, options, renderWidget }) {
    return renderWidget(formatTokenCount(ctx.metrics.totalTokens, options.tokenFormatStyle));
  }
});

// src/widgets/registry.ts
var WIDGETS = [
  ModelWidget,
  ProviderWidget,
  ModelProviderWidget,
  ThinkingLevelWidget,
  TextVerbosityWidget,
  ContextWindowWidget,
  ActiveToolsWidget,
  SessionNameWidget,
  CwdWidget,
  CwdBasenameWidget,
  EventValueWidget,
  ExtensionStatusWidget,
  CustomTextWidget,
  SeparatorWidget,
  SpacerWidget,
  FlexSeparatorWidget,
  RuntimeWidget,
  AssistantMessagesWidget,
  CompactionsWidget,
  ElapsedWidget,
  LastActivityWidget,
  MessagesWidget,
  SessionIdWidget,
  SessionStartWidget,
  ToolResultsWidget,
  TotalMessagesWidget,
  TotalTimeWidget,
  UserMessagesWidget,
  GitAheadBehindWidget,
  GitBranchWidget,
  GitCleanStatusWidget,
  GitDeletionsWidget,
  GitDiffWidget,
  GitInsertionsWidget,
  GitRemoteWidget,
  GitRootDirWidget,
  GitShaWidget,
  GitStagedWidget,
  GitStatusWidget,
  GitUnstagedWidget,
  GitUntrackedWidget,
  ContextBarWidget,
  ContextLengthWidget,
  ContextWidget,
  ContextRemainingWidget,
  CostWidget,
  CacheReadWidget,
  CacheWriteWidget,
  CacheHitRateWidget,
  TokensWidget,
  InputTokensWidget,
  OutputTokensWidget,
  TotalTokensWidget,
  InputSpeedWidget,
  OutputSpeedWidget,
  TotalSpeedWidget
];
function createWidgetRegistry(widgets) {
  const specs = [...widgets];
  const specsByType = new Map(
    specs.map((spec) => [spec.type, spec])
  );
  const definitions = specs.map(definitionFromWidgetSpec);
  const types = definitions.map((definition) => definition.type);
  const typeSet = new Set(types);
  const specFor = (type) => {
    const spec = specsByType.get(type);
    if (!spec) throw new Error(`Unsupported widget type: ${type}`);
    return spec;
  };
  const buildEntry = (type, options = {}, enabled = true) => ({
    id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    enabled,
    options: sanitizeOptionsFromSpec(specFor(type), options)
  });
  return {
    specs,
    definitions,
    types,
    typeSet,
    spec(type) {
      return specFor(type);
    },
    maybeSpec(type) {
      return specsByType.get(type);
    },
    createEntry(type, options = {}) {
      return buildEntry(type, options);
    },
    normalizeOptions(type, input) {
      return sanitizeOptionsFromSpec(specFor(type), input);
    },
    cloneEntry(entry) {
      return buildEntry(entry.type, entry.options, entry.enabled);
    },
    createWidget(type, options = {}) {
      return new WidgetInstance(specFor(type), buildEntry(type, options));
    },
    cloneWidget(widget2) {
      return new WidgetInstance(
        specFor(widget2.type),
        buildEntry(widget2.type, widget2.options, widget2.enabled)
      );
    },
    hydrateWidget(entry) {
      return new WidgetInstance(specFor(entry.type), {
        id: entry.id,
        type: entry.type,
        enabled: entry.enabled,
        options: { ...entry.options }
      });
    }
  };
}
function definitionFromWidgetSpec(spec) {
  return {
    type: spec.type,
    label: spec.label,
    category: spec.category,
    description: spec.description
  };
}
var registry = createWidgetRegistry(WIDGETS);

// src/config.ts
var STATUS_KEY = "pi-footer";
var CONFIG_ENV = "PI_FOOTER_CONFIG";
var DEFAULT_CONFIG_PATH = join(getAgentDir(), "extensions", "pi-footer.json");
var SEPARATORS = new Set(SEPARATOR_VALUES);
var DEFAULT_TERMINAL_OPTIONS = {
  widthMode: "full",
  colorLevel: "ansi256"
};
var DEFAULT_CONFIG = {
  version: 1,
  enabled: true,
  preset: "default",
  lines: linesForPreset("default"),
  separator: "dot",
  separatorFg: "default",
  separatorBg: "default",
  iconMode: "emoji",
  minimalist: false,
  terminal: DEFAULT_TERMINAL_OPTIONS,
  extensionStatusRow: DEFAULT_EXTENSION_STATUS_ROW
};
function getConfigPath() {
  return process.env[CONFIG_ENV] ?? DEFAULT_CONFIG_PATH;
}
function linesForPreset(preset) {
  return PRESET_DEFINITIONS[preset].lines.map((line) => widgetsFromPresetLine(line));
}
function configWithPreset(config, preset) {
  const definition = PRESET_DEFINITIONS[preset];
  return {
    ...config,
    preset,
    lines: linesForPreset(preset),
    separator: definition.separator ?? config.separator,
    iconMode: definition.iconMode ?? config.iconMode,
    terminal: { ...config.terminal, ...definition.terminal }
  };
}
function widgetsFromPresetLine(line) {
  return line.map((widget2) => registry.createEntry(widget2.type, widget2.options));
}
function normalizeConfig(input) {
  if (!isRecord(input)) return cloneConfig(DEFAULT_CONFIG);
  const preset = isPreset(input.preset) ? input.preset : DEFAULT_CONFIG.preset;
  const lines = normalizeLines(input.lines, preset);
  return {
    version: 1,
    enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_CONFIG.enabled,
    preset,
    lines,
    separator: isSeparatorStyle(input.separator) ? input.separator : PRESET_DEFINITIONS[preset].separator ?? DEFAULT_CONFIG.separator,
    separatorFg: normalizeColor(input.separatorFg) ?? DEFAULT_CONFIG.separatorFg,
    separatorBg: normalizeColor(input.separatorBg) ?? DEFAULT_CONFIG.separatorBg,
    iconMode: isIconMode(input.iconMode) ? input.iconMode : DEFAULT_CONFIG.iconMode,
    minimalist: typeof input.minimalist === "boolean" ? input.minimalist : DEFAULT_CONFIG.minimalist,
    terminal: normalizeTerminalOptions(input.terminal, PRESET_DEFINITIONS[preset].terminal),
    extensionStatusRow: normalizeExtensionStatusRow(input.extensionStatusRow)
  };
}
function cloneSettings(settings) {
  return {
    ...settings,
    terminal: { ...settings.terminal },
    extensionStatusRow: cloneExtensionStatusRow(settings.extensionStatusRow)
  };
}
function cloneConfig(config) {
  return {
    ...cloneSettings(config),
    lines: config.lines.map(
      (line) => line.map((widget2) => ({ ...widget2, options: { ...widget2.options } }))
    )
  };
}
async function loadConfig(path = getConfigPath()) {
  try {
    const raw = await readFile(path, "utf8");
    return normalizeConfig(JSON.parse(raw));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return cloneConfig(DEFAULT_CONFIG);
    }
    throw error;
  }
}
async function saveConfig(config, path = getConfigPath()) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(normalizeConfig(config), null, 2)}
`, "utf8");
}
function normalizeLines(linesValue, preset) {
  if (!Array.isArray(linesValue)) return linesForPreset(preset);
  return linesValue.map((line) => normalizeWidgets(line));
}
function normalizeWidgets(value) {
  if (!Array.isArray(value)) return [];
  const widgets = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.type !== "string") continue;
    const spec = registry.maybeSpec(item.type);
    if (!spec) continue;
    widgets.push({
      id: typeof item.id === "string" && item.id.length > 0 ? item.id : registry.createEntry(spec.type).id,
      type: spec.type,
      enabled: typeof item.enabled === "boolean" ? item.enabled : true,
      options: registry.normalizeOptions(
        spec.type,
        isRecord(item.options) ? item.options : {}
      )
    });
  }
  return widgets;
}
function normalizeTerminalOptions(value, defaults = {}) {
  const base = { ...DEFAULT_TERMINAL_OPTIONS, ...defaults };
  if (!isRecord(value)) return base;
  return {
    widthMode: typeof value.widthMode === "string" && TERMINAL_WIDTH_MODE_VALUES.includes(value.widthMode) ? value.widthMode : base.widthMode,
    colorLevel: typeof value.colorLevel === "string" && COLOR_LEVEL_VALUES.includes(value.colorLevel) ? value.colorLevel : base.colorLevel
  };
}
function isPreset(value) {
  return typeof value === "string" && Object.hasOwn(PRESET_DEFINITIONS, value);
}
function isSeparatorStyle(value) {
  return typeof value === "string" && SEPARATORS.has(value);
}
function isIconMode(value) {
  return typeof value === "string" && ICON_MODE_VALUES.includes(value);
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

// src/git.ts
import { basename as basename3 } from "node:path";
var CACHE_TTL_MS = 2e3;
var EMPTY_GIT_INFO = {
  branch: null,
  sha: null,
  root: null,
  staged: 0,
  unstaged: 0,
  untracked: 0,
  insertions: 0,
  deletions: 0,
  ahead: 0,
  behind: 0,
  remote: null,
  isRepo: false
};
function getGitInfo(pi, cwd, branchHint, requestRender) {
  return asyncCache.get(
    CACHE_NAMESPACES.git,
    `${cwd}:${branchHint ?? ""}`,
    CACHE_TTL_MS,
    { pi, cwd, branchHint },
    fetchGitInfo,
    requestRender
  ) ?? EMPTY_GIT_INFO;
}
function loadGitInfo(pi, cwd, branchHint) {
  return fetchGitInfo({ pi, cwd, branchHint }).then((info) => info ?? EMPTY_GIT_INFO);
}
async function fetchGitInfo({ pi, cwd, branchHint }) {
  const rootPath = await git(pi, cwd, ["rev-parse", "--show-toplevel"]);
  if (!rootPath) return EMPTY_GIT_INFO;
  const [branch, sha, porcelain, shortstat, aheadBehind, remote] = await Promise.all([
    branchHint ? Promise.resolve(branchHint) : git(pi, cwd, ["rev-parse", "--abbrev-ref", "HEAD"]),
    git(pi, cwd, ["rev-parse", "--short", "HEAD"]),
    git(pi, cwd, ["status", "--porcelain=v1"]),
    git(pi, cwd, ["diff", "--shortstat", "HEAD"]),
    git(pi, cwd, ["rev-list", "--left-right", "--count", "@{upstream}...HEAD"]),
    git(pi, cwd, ["remote", "get-url", "origin"])
  ]);
  return {
    branch,
    sha,
    root: basename3(rootPath),
    ...parsePorcelain(porcelain),
    ...parseShortstat(shortstat),
    ...parseAheadBehind(aheadBehind),
    remote,
    isRepo: true
  };
}
async function git(pi, cwd, args) {
  const { stdout, code, killed } = await pi.exec("git", args, { cwd, timeout: 500 });
  return code !== 0 || killed ? null : stdout.trimEnd() || null;
}
function parsePorcelain(output) {
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;
  for (const line of output?.split("\n") ?? []) {
    if (line.length < 2) continue;
    const x = line[0];
    const y = line[1];
    if (x === "?" && y === "?") {
      untracked += 1;
      continue;
    }
    if (x !== " " && x !== void 0) staged += 1;
    if (y !== " " && y !== void 0) unstaged += 1;
  }
  return { staged, unstaged, untracked };
}
function parseShortstat(output) {
  const insertions = /([0-9]+) insertion/.exec(output ?? "")?.[1];
  const deletions = /([0-9]+) deletion/.exec(output ?? "")?.[1];
  return {
    insertions: insertions ? Number(insertions) : 0,
    deletions: deletions ? Number(deletions) : 0
  };
}
function parseAheadBehind(output) {
  const [behind, ahead] = output?.split(/\s+/).map(Number) ?? [];
  return {
    ahead: Number.isFinite(ahead) ? ahead ?? 0 : 0,
    behind: Number.isFinite(behind) ? behind ?? 0 : 0
  };
}
function hasEnabledGitWidgets(config) {
  return config.lines.some(
    (line) => line.some((widget2) => widget2.enabled && widget2.type.startsWith("git-"))
  );
}

// src/metrics.ts
function collectSessionMetrics(entries) {
  const metrics = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolResults: 0,
    firstTimestampMs: void 0,
    lastTimestampMs: void 0,
    compactions: 0
  };
  for (const entry of entries) {
    const message = getMessage(entry);
    if (!message) continue;
    const timestampMs = normalizeTimestamp(message.timestamp ?? getEntryTimestamp(entry));
    if (timestampMs !== void 0) {
      metrics.firstTimestampMs = metrics.firstTimestampMs === void 0 ? timestampMs : Math.min(metrics.firstTimestampMs, timestampMs);
      metrics.lastTimestampMs = metrics.lastTimestampMs === void 0 ? timestampMs : Math.max(metrics.lastTimestampMs, timestampMs);
    }
    if (message.role === "user") metrics.userMessages += 1;
    if (message.role === "toolResult") metrics.toolResults += 1;
    if (message.role === "compactionSummary") metrics.compactions += 1;
    if (message.role !== "assistant") continue;
    metrics.assistantMessages += 1;
    const usage = getUsage(message.usage);
    if (!usage) continue;
    const input = numberOrZero(usage.input);
    const output = numberOrZero(usage.output);
    const cacheRead = numberOrZero(usage.cacheRead);
    const cacheWrite = numberOrZero(usage.cacheWrite);
    metrics.inputTokens += input;
    metrics.outputTokens += output;
    metrics.cacheReadTokens += cacheRead;
    metrics.cacheWriteTokens += cacheWrite;
    metrics.totalTokens += numberOrZero(usage.totalTokens) || input + output + cacheRead + cacheWrite;
    metrics.costUsd += numberOrZero(usage.cost?.total);
  }
  return metrics;
}
function collectTurnMetrics(entries) {
  const metrics = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    costUsd: 0
  };
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const message = getMessage(entries[index]);
    if (message?.role !== "assistant") continue;
    const usage = getUsage(message.usage);
    if (!usage) continue;
    const input = numberOrZero(usage.input);
    const output = numberOrZero(usage.output);
    const cacheRead = numberOrZero(usage.cacheRead);
    const cacheWrite = numberOrZero(usage.cacheWrite);
    metrics.inputTokens = input;
    metrics.outputTokens = output;
    metrics.cacheReadTokens = cacheRead;
    metrics.cacheWriteTokens = cacheWrite;
    metrics.totalTokens = numberOrZero(usage.totalTokens) || input + output + cacheRead + cacheWrite;
    metrics.costUsd = numberOrZero(usage.cost?.total);
    return metrics;
  }
  return metrics;
}
function getMessage(entry) {
  if (!isRecord(entry)) return void 0;
  const message = entry.message;
  return isRecord(message) ? message : void 0;
}
function getEntryTimestamp(entry) {
  return isRecord(entry) ? entry.timestamp : void 0;
}
function getUsage(value) {
  return isRecord(value) ? value : void 0;
}
function normalizeTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return void 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function numberOrZero(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// src/render.ts
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// src/widgets/context.ts
function contextForDependencies(baseCtx, dependencies, data, options) {
  const source = {
    ...data,
    getExtensionStatuses: options.getExtensionStatuses
  };
  const output = { ...baseCtx };
  const writableOutput = output;
  for (const dependency of dependencies) {
    writableOutput[dependency] = source[dependency];
  }
  return output;
}

// src/render.ts
function renderStatuslines(store, data, width, options = {}) {
  const settings = store.settings;
  if (!settings.enabled || width <= 0) return [];
  const baseCtx = {
    iconMode: settings.iconMode,
    minimalist: settings.minimalist,
    colorLevel: settings.terminal.colorLevel,
    ...options.theme ? { theme: options.theme } : {},
    ...options.requestRender ? { requestRender: options.requestRender } : {}
  };
  const lineWidth = effectiveWidth(settings, width);
  return store.lines.map((line) => renderLine(line, settings, lineWidth, { baseCtx, data, options })).filter((line) => line.trim().length > 0);
}
function padRight(left, right, width) {
  const spaces = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
  return truncateToWidth(`${left}${" ".repeat(spaces)}${right}`, width, "\u2026");
}
function renderLine(line, settings, width, ctx) {
  const rendered = line.filter((widget2) => widget2.enabled).map((widget2) => ({
    widget: widget2,
    segment: widget2.render(
      contextForDependencies(
        ctx.baseCtx,
        registry.spec(widget2.type).dependencies,
        ctx.data,
        ctx.options
      )
    ) ?? ""
  }));
  const flexIndex = rendered.findIndex((entry) => entry.widget.type === "flex-separator");
  if (flexIndex === -1) {
    return truncateToWidth(joinSegments(rendered, settings), width, "\u2026");
  }
  const left = joinSegments(rendered.slice(0, flexIndex), settings);
  const right = joinSegments(rendered.slice(flexIndex + 1), settings);
  return right ? padRight(left, right, width) : truncateToWidth(left, width, "\u2026");
}
function effectiveWidth(settings, width) {
  if (settings.terminal.widthMode === "full-minus-40") return Math.max(1, width - 40);
  return width;
}
function joinSegments(entries, settings) {
  const segments = entries.filter((entry) => entry.segment.length > 0);
  if (segments.length === 0) return "";
  let output = segments[0]?.segment ?? "";
  for (let index = 1; index < segments.length; index += 1) {
    const previous = segments[index - 1];
    const current = segments[index];
    if (!previous || !current) continue;
    if (previous.widget.type !== "separator" && current.widget.type !== "separator") {
      output += applyColors(
        separatorText(settings.separator),
        settings.separatorFg,
        settings.separatorBg,
        false,
        settings.terminal.colorLevel
      );
    }
    output += current.segment;
  }
  return output;
}

// src/ui/config-lifecycle.ts
var ConfigLifecycle = class {
  savedConfig;
  configState = "clean";
  constructor(config) {
    this.savedConfig = cloneConfig(config);
  }
  get dirty() {
    return this.configState === "dirty" || this.configState === "error";
  }
  get state() {
    return this.configState;
  }
  get label() {
    if (this.configState === "dirty") return "Unsaved";
    if (this.configState === "saving") return "Saving\u2026";
    if (this.configState === "saved") return "Saved";
    if (this.configState === "error") return "Save failed";
    return void 0;
  }
  markChanged() {
    this.configState = "dirty";
  }
  beginSave() {
    this.configState = "saving";
  }
  markSaved(config) {
    this.savedConfig = cloneConfig(config);
    this.configState = "saved";
  }
  markSaveFailed() {
    this.configState = "error";
  }
  closeResult(saved) {
    return {
      config: cloneConfig(this.savedConfig),
      saved
    };
  }
};

// src/ui/model.ts
var CONFIG_UI_HEIGHT_RATIO = 1;
var WIDTH_MODE_LABELS = {
  full: "Full width always",
  "full-minus-40": "Full width minus 40"
};
var COLOR_LEVEL_LABELS = {
  truecolor: "Truecolor",
  ansi256: "256 Color",
  ansi16: "Basic (Standard 16-color)",
  none: "No Color"
};
var ICON_MODE_LABELS = {
  emoji: "Emoji",
  nerd: "Nerd Font icons",
  text: "Text labels"
};

// src/ui/screen.ts
import { Key as Key11, matchesKey as matchesKey11 } from "@earendil-works/pi-tui";

// src/widgets/store.ts
var WidgetStore = class _WidgetStore {
  constructor(settings, lines) {
    this.settings = settings;
    this.lines = lines;
  }
  settings;
  lines;
  static fromConfig(config) {
    const { lines, ...settings } = config;
    return new _WidgetStore(
      cloneSettings(settings),
      lines.map((line) => line.map((entry) => registry.hydrateWidget(entry)))
    );
  }
  toConfig() {
    return {
      ...cloneSettings(this.settings),
      lines: this.lines.map((line) => line.map((widget2) => widget2.toEntry()))
    };
  }
};

// src/ui/helpers.ts
function escapeTarget(view) {
  if (view === "main") return "close";
  if (view === "line-list" || view === "color-line-list" || view === "terminal" || view === "global" || view === "extension-status-row")
    return "main";
  if (view === "widget-list") return "line-list";
  if (view === "color-widget-list") return "color-line-list";
  if (view === "edit-colors") return "color-widget-list";
  if (view === "add-widget" || view === "edit-widget") return "widget-list";
  if (view === "confirm-color-level") return "terminal";
  if (view === "confirm-exit") return "main";
  return "main";
}
function cycle(values, current, delta) {
  const index = values.indexOf(current);
  return values[(index + delta + values.length) % values.length] ?? current;
}
function adjustAnsi(current, delta) {
  const currentCode = current?.startsWith("ansi256:") ? Number(current.slice(8)) : 0;
  return `ansi256:${wrap(currentCode + delta, 256)}`;
}
function wrap(value, length) {
  if (length <= 0) return 0;
  return (value + length) % length;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function isPrintable(data) {
  return data.length === 1 && data.charCodeAt(0) >= 32 && data.charCodeAt(0) !== 127;
}

// src/ui/layout.ts
var CONFIG_UI_RESERVED_ROWS = 8;
var MIN_VISIBLE_ROW_COUNT = 4;
function activeLineCount(lines) {
  return lines.filter((line) => line.length > 0).length;
}
function visibleRowCount(terminalRows, heightRatio, activeLines) {
  return Math.max(
    MIN_VISIBLE_ROW_COUNT,
    Math.floor(terminalRows * heightRatio) - CONFIG_UI_RESERVED_ROWS - activeLines
  );
}

// src/ui/title-bar.ts
import { truncateToWidth as truncateToWidth2, visibleWidth as visibleWidth2 } from "@earendil-works/pi-tui";

// package.json
var package_default = {
  name: "pi-footer",
  version: "0.5.1",
  description: "Configurable, Ultimate multi-line footer/statusline extension for pi",
  type: "module",
  keywords: [
    "pi-package",
    "pi-extension",
    "statusline",
    "pi-statusline",
    "pi-footer",
    "footer",
    "tui"
  ],
  pi: {
    extensions: [
      "./dist/index.js"
    ],
    video: "https://raw.githubusercontent.com/wobondar/pi-footer/main/assets/demo-video.mp4",
    image: "https://raw.githubusercontent.com/wobondar/pi-footer/main/assets/demo-teaser.gif"
  },
  files: [
    "dist/",
    "src/",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  homepage: "https://github.com/wobondar/pi-footer#readme",
  bugs: {
    url: "https://github.com/wobondar/pi-footer/issues"
  },
  license: "MIT",
  author: "wobondar",
  repository: {
    type: "git",
    url: "git+https://github.com/wobondar/pi-footer.git"
  },
  publishConfig: {
    access: "public"
  },
  scripts: {
    lint: "oxlint -f default",
    "lint:check": "oxlint",
    "lint:fix": "oxlint --fix",
    fmt: "oxfmt",
    "fmt:check": "oxfmt --check",
    typecheck: "tsc --noEmit",
    build: "esbuild src/index.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:@earendil-works/pi-coding-agent --external:@earendil-works/pi-tui",
    "build:check": "npm run build && git diff --exit-code -- dist/index.js",
    test: "vitest run",
    coverage: "vitest run --coverage",
    prepublishOnly: "npm run typecheck && npm run fmt:check && npm run lint && npm run test && npm run build"
  },
  peerDependencies: {
    "@earendil-works/pi-coding-agent": "*",
    "@earendil-works/pi-tui": "*"
  },
  devDependencies: {
    "@types/node": "^26.0.0",
    "@vitest/coverage-v8": "^4.1.5",
    esbuild: "^0.28.2",
    oxfmt: "^0.63.0",
    oxlint: "^1.62.0",
    "oxlint-tsgolint": "^7.0.2001",
    typescript: "^7.0.2",
    vitest: "^4.1.5"
  },
  dependencies: {
    chalk: "^6.0.0"
  }
};

// src/ui/title-bar.ts
var CONFIG_TITLE_TEXT = " pi-footer configuration ";
var VERSION = package_default.version;
function previewTitleParts(innerWidth) {
  const title = truncateToWidth2(" Preview ", innerWidth, "\u2026");
  return {
    title,
    rightPad: Math.max(0, innerWidth - visibleWidth2(title))
  };
}
function configTitleBarParts(innerWidth, dim, now = Date.now(), status = "", border = (text) => text) {
  const titleWidth = Math.max(1, innerWidth - 1);
  const decoratedStatus = status ? ` ${status} ` : "";
  const statusWidth = visibleWidth2(decoratedStatus);
  const contentWidth = statusWidth > 0 ? Math.max(1, titleWidth - 1) : titleWidth;
  const reserveForStatus = statusWidth > 0 ? statusWidth + 1 : 0;
  const leftWidth = Math.max(1, contentWidth - reserveForStatus);
  const suffixWidth = Math.max(0, leftWidth - visibleWidth2(CONFIG_TITLE_TEXT));
  const suffix = suffixWidth > 0 ? dim(truncateToWidth2(`| v${VERSION} `, suffixWidth, "\u2026")) : "";
  const left = truncateToWidth2(retroText(CONFIG_TITLE_TEXT, now) + suffix, leftWidth, "\u2026");
  if (statusWidth === 0) {
    return {
      title: left,
      rightPad: Math.max(0, titleWidth - visibleWidth2(left))
    };
  }
  const separator = border(
    "\u2500".repeat(Math.max(1, contentWidth - visibleWidth2(left) - statusWidth))
  );
  return {
    title: `${left}${separator}${decoratedStatus}`,
    rightPad: 1
  };
}
var RETRO_GRADIENT = [
  [63, 81, 177],
  [90, 85, 174],
  [123, 95, 172],
  [143, 106, 174],
  [168, 106, 164],
  [204, 107, 142],
  [241, 130, 113],
  [243, 164, 105],
  [247, 201, 120]
];
var RETRO_FRAME_INTERVAL_MS = 140;
var RETRO_CYCLE_MS = 5e3;
function retroText(text, now = Date.now()) {
  return gradientText(text, RETRO_GRADIENT, now / RETRO_CYCLE_MS % 1);
}
function gradientText(text, stops, phase) {
  const chars = Array.from(text);
  if (chars.length === 0) return "";
  return chars.map((char, index) => {
    const position = chars.length === 1 ? phase : index / (chars.length - 1) + phase;
    const [r, g, b] = sampleLoopingGradient(stops, position);
    return `\x1B[1;38;2;${r};${g};${b}m${char}\x1B[0m`;
  }).join("");
}
function sampleLoopingGradient(stops, t) {
  if (stops.length === 0) return [255, 255, 255];
  if (stops.length === 1) return stops[0] ?? [255, 255, 255];
  const wrapped = (t % 1 + 1) % 1;
  const scaled = wrapped * stops.length;
  const index = Math.floor(scaled) % stops.length;
  const mix = scaled - Math.floor(scaled);
  const left = stops[index] ?? stops[0] ?? [255, 255, 255];
  const right = stops[(index + 1) % stops.length] ?? left;
  return [
    Math.round(left[0] + (right[0] - left[0]) * mix),
    Math.round(left[1] + (right[1] - left[1]) * mix),
    Math.round(left[2] + (right[2] - left[2]) * mix)
  ];
}

// src/ui/overlay-render.ts
var OverlayRender = class {
  constructor(theme, screenRender) {
    this.theme = theme;
    this.screenRender = screenRender;
  }
  theme;
  screenRender;
  render(options) {
    const layout = this.layout(options);
    const lines = [
      this.previewTitleLine(layout),
      ...this.previewLines(options),
      this.previewBottomLine(layout),
      this.blankSeparator(options.width),
      this.configTitleLine(options, layout),
      ...options.body
    ];
    this.fillToTerminal(lines, options);
    lines.push(this.bottomBorder(layout));
    return lines;
  }
  layout(options) {
    return { innerWidth: Math.max(1, options.width - 2) };
  }
  previewTitleLine(layout) {
    const previewTitle = previewTitleParts(layout.innerWidth);
    return this.theme.border("\u2500") + this.theme.previewTitle(previewTitle.title) + this.theme.border(`${"\u2500".repeat(previewTitle.rightPad)}\u2500`);
  }
  previewLines(options) {
    return renderStatuslines(options.store, options.previewData, Math.max(20, options.width), {
      getExtensionStatuses: options.getExtensionStatuses,
      theme: options.theme,
      ...options.requestRender ? { requestRender: options.requestRender } : {}
    }).map((line) => this.screenRender.lineW(line, options.width));
  }
  previewBottomLine(layout) {
    return this.theme.border(`\u2500${"\u2500".repeat(layout.innerWidth)}\u2500`);
  }
  blankSeparator(width) {
    return " " + this.screenRender.padLine(width, "", "") + " ";
  }
  configTitleLine(options, layout) {
    const title = configTitleBarParts(
      layout.innerWidth,
      (text) => this.theme.dim(text),
      Date.now(),
      options.configStateText,
      (text) => this.theme.border(text)
    );
    return this.theme.border("\u256D\u2500") + title.title + this.theme.border(`${"\u2500".repeat(title.rightPad)}\u256E`);
  }
  fillToTerminal(lines, options) {
    const neededToFillScreen = options.terminalRows - lines.length - 1;
    if (neededToFillScreen > 0) {
      lines.push(...Array(neededToFillScreen).fill(this.screenRender.line("", options.width)));
    }
  }
  bottomBorder(layout) {
    return this.theme.border(`\u2570${"\u2500".repeat(layout.innerWidth)}\u256F`);
  }
};

// src/ui/screen-controller.ts
var ScreenController = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  screens = /* @__PURE__ */ new Map();
  register(view, screen) {
    this.screens.set(view, screen);
  }
  renderScreen(width) {
    return this.currentScreen().renderScreen(width);
  }
  handleInput(data) {
    this.currentScreen().handleInput(data);
  }
  currentScreen() {
    const screen = this.screens.get(this.ctx.state.view);
    if (!screen) throw new Error(`No screen registered for view: ${this.ctx.state.view}`);
    return screen;
  }
};

// src/ui/screen-render.ts
import { truncateToWidth as truncateToWidth3, visibleWidth as visibleWidth3 } from "@earendil-works/pi-tui";
var ScreenRender = class {
  constructor(theme) {
    this.theme = theme;
  }
  theme;
  menuTitle(title, description = "") {
    if (description.length === 0) return this.theme.accent(title);
    return this.theme.success(`\u2022${title}`) + " " + this.theme.dim(description);
  }
  padLine(width, content, ellipsis = "\u2026") {
    return truncateToWidth3(content, Math.max(1, width - 2), ellipsis, true);
  }
  lineW(content, width) {
    const clipped = truncateToWidth3(content, Math.max(0, width), "\u2026");
    return `${clipped}${" ".repeat(Math.max(0, width - visibleWidth3(clipped)))}`;
  }
  line(content, width) {
    return this.theme.border("\u2502") + this.padLine(width, content) + this.theme.border("\u2502");
  }
  menuLine(selected, content, width) {
    const text = `${selected ? "\u203A" : " "}  ${content}`;
    return this.line(selected ? this.theme.selected(text) : text, width);
  }
};

// src/ui/screen-state.ts
function createScreenState(store) {
  return {
    store,
    view: "main",
    viewBeforeConfirmExit: "main",
    selectedLine: 0,
    selectedWidget: 0
  };
}

// src/ui/screens/add-widget.ts
import { Key, matchesKey } from "@earendil-works/pi-tui";

// src/ui/navigation.ts
function pageSelection(selected, total, visibleCount, direction) {
  if (total <= 0) return 0;
  return clamp(selected + direction * visibleCount, 0, total - 1);
}
function scrollWindow(total, selected, visibleCount) {
  const start = clamp(
    selected - Math.floor(visibleCount / 2),
    0,
    Math.max(0, total - visibleCount)
  );
  return { start, end: Math.min(total, start + visibleCount) };
}

// src/ui/screens/controller.ts
var Controller = class {
  constructor(ctx, render) {
    this.ctx = ctx;
    this.render = render;
  }
  ctx;
  render;
};

// src/ui/screens/add-widget.ts
var AddWidgetScreen = class extends Controller {
  selected = 0;
  filter = "";
  renderScreen(width) {
    const items = this.filterWidgets();
    const visibleCount = this.ctx.visibleRowCount();
    const start = clamp(
      this.selected - Math.floor(visibleCount / 2),
      0,
      Math.max(0, items.length - visibleCount)
    );
    const visible = items.slice(start, start + visibleCount);
    const lines = [
      this.render.line(
        this.render.menuTitle("Add Widget", "Search or select a widget to add"),
        width
      ),
      this.render.line(this.ctx.theme.dim(this.hint()), width),
      this.render.line(
        this.ctx.theme.dim(this.countLabel(items.length, start, visible.length)),
        width
      )
    ];
    visible.forEach((definition, offset) => {
      const index = start + offset;
      const text = this.itemLabel(definition);
      lines.push(this.render.menuLine(index === this.selected, text, width));
    });
    return lines;
  }
  handleInput(data) {
    const items = this.filterWidgets();
    if (matchesKey(data, Key.up))
      this.selected = wrap(this.selected - 1, Math.max(1, items.length));
    else if (matchesKey(data, Key.down))
      this.selected = wrap(this.selected + 1, Math.max(1, items.length));
    else if (matchesKey(data, Key.pageUp)) this.page(items.length, -1);
    else if (matchesKey(data, Key.pageDown)) this.page(items.length, 1);
    else if (matchesKey(data, Key.backspace)) {
      this.filter = this.filter.slice(0, -1);
      this.selected = 0;
    } else if (matchesKey(data, Key.enter)) {
      const definition = items[this.selected];
      if (!definition) return;
      this.ctx.currentLine().splice(this.ctx.state.selectedWidget + 1, 0, registry.createWidget(definition.type));
      this.ctx.state.selectedWidget += 1;
      this.ctx.show("widget-list");
      this.ctx.emitChange();
    } else if (isPrintable(data)) {
      this.filter += data.toLowerCase();
      this.selected = 0;
    }
  }
  hint() {
    return `type to filter \u2022 \u2191/\u2193 select \u2022 pgup/pgdn jump \u2022 enter add \u2022 esc back \u2022 filter: ${this.filter || "(none)"}`;
  }
  countLabel(total, start, visibleLength) {
    const range = total === 0 ? "0-0" : `${start + 1}-${Math.min(total, start + visibleLength)}`;
    return `${total} result(s), showing ${range}`;
  }
  filterWidgets() {
    const filter = this.filter.trim();
    if (!filter) return [...registry.definitions];
    return registry.definitions.filter(
      (definition) => `${definition.category} ${definition.label} ${definition.type}`.toLowerCase().includes(filter.toLowerCase())
    );
  }
  itemLabel(definition) {
    return `${definition.category} / ${definition.label} ${this.ctx.theme.dim(definition.description)}`;
  }
  page(length, delta) {
    this.selected = pageSelection(this.selected, length, this.ctx.visibleRowCount(), delta);
  }
};

// src/ui/screens/confirm-exit.ts
import { Key as Key2, matchesKey as matchesKey2 } from "@earendil-works/pi-tui";
var ITEMS = ["Save & Exit", "Exit without saving", "Return to config UI"];
var HINT = "\u2191/\u2193 select \u2022 enter confirm \u2022 s save \u2022 x discard \u2022 esc/r back";
var ConfirmExitScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    return [
      this.render.line(
        this.render.menuTitle("Unsaved changes", "Choose how to close configuration"),
        width
      ),
      this.render.line(this.ctx.theme.dim(HINT), width),
      this.render.line(
        this.ctx.theme.warning("You have unsaved pi-footer configuration changes."),
        width
      ),
      ...ITEMS.map((item, index) => this.render.menuLine(index === this.selected, item, width))
    ];
  }
  handleInput(data) {
    if (matchesKey2(data, Key2.escape)) this.returnToConfigUi();
    else if (matchesKey2(data, Key2.up) || matchesKey2(data, Key2.left))
      this.selected = wrap(this.selected - 1, ITEMS.length);
    else if (matchesKey2(data, Key2.down) || matchesKey2(data, Key2.right))
      this.selected = wrap(this.selected + 1, ITEMS.length);
    else if (matchesKey2(data, Key2.enter)) this.selectedAction();
    else this.shortcutAction(data);
  }
  selectedAction() {
    if (this.selected === 0) return this.ctx.save(true);
    if (this.selected === 1) return this.ctx.exitWithoutSaving();
    return this.returnToConfigUi();
  }
  shortcutAction(data) {
    if (data === "s") return this.ctx.save(true);
    if (data === "x") return this.ctx.exitWithoutSaving();
    if (data === "r") return this.returnToConfigUi();
  }
  returnToConfigUi() {
    this.ctx.show(this.ctx.state.viewBeforeConfirmExit);
  }
};

// src/ui/screens/edit-colors.ts
import { Key as Key3, matchesKey as matchesKey3 } from "@earendil-works/pi-tui";

// src/ui/color-options.ts
var EDIT_COLORS_HINT = "\u2191/\u2193 field \u2022 \u2190/\u2192 cycle/change \u2022 enter toggle \u2022 type digits for ANSI256 \u2022 backspace delete \u2022 esc back";
function hasCustomAnsiColors(lines) {
  return lines.some(
    (line) => line.some(
      (widget2) => colorOption(widget2, "fg")?.startsWith("ansi256:") || colorOption(widget2, "bg")?.startsWith("ansi256:") || colorOption(widget2, "warningFg")?.startsWith("ansi256:") || colorOption(widget2, "warningBg")?.startsWith("ansi256:") || colorOption(widget2, "dangerFg")?.startsWith("ansi256:") || colorOption(widget2, "dangerBg")?.startsWith("ansi256:")
    )
  );
}
function resetCustomAnsiColors(lines) {
  for (const line of lines) {
    for (const widget2 of line) {
      widget2.update(resetAnsi256Colors(widget2.options));
    }
  }
}
function applyColorDigit(widget2, field, digit) {
  if (!/^\d$/.test(digit)) return false;
  if (field.id === "fgAnsi")
    return updateColorOption(widget2, "fg", appendAnsi256Digit(colorOption(widget2, "fg"), digit));
  if (field.id === "bgAnsi")
    return updateColorOption(widget2, "bg", appendAnsi256Digit(colorOption(widget2, "bg"), digit));
  if (field.id === "warningFgAnsi")
    return updateColorOption(
      widget2,
      "warningFg",
      appendAnsi256Digit(colorOption(widget2, "warningFg"), digit)
    );
  if (field.id === "warningBgAnsi")
    return updateColorOption(
      widget2,
      "warningBg",
      appendAnsi256Digit(colorOption(widget2, "warningBg"), digit)
    );
  if (field.id === "dangerFgAnsi")
    return updateColorOption(
      widget2,
      "dangerFg",
      appendAnsi256Digit(colorOption(widget2, "dangerFg"), digit)
    );
  if (field.id === "dangerBgAnsi")
    return updateColorOption(
      widget2,
      "dangerBg",
      appendAnsi256Digit(colorOption(widget2, "dangerBg"), digit)
    );
  return false;
}
function deleteColorDigit(widget2, field) {
  if (field.id === "fgAnsi")
    return updateColorOption(widget2, "fg", deleteAnsi256Digit(colorOption(widget2, "fg")));
  if (field.id === "bgAnsi")
    return updateColorOption(widget2, "bg", deleteAnsi256Digit(colorOption(widget2, "bg")));
  if (field.id === "warningFgAnsi")
    return updateColorOption(
      widget2,
      "warningFg",
      deleteAnsi256Digit(colorOption(widget2, "warningFg"))
    );
  if (field.id === "warningBgAnsi")
    return updateColorOption(
      widget2,
      "warningBg",
      deleteAnsi256Digit(colorOption(widget2, "warningBg"))
    );
  if (field.id === "dangerFgAnsi")
    return updateColorOption(
      widget2,
      "dangerFg",
      deleteAnsi256Digit(colorOption(widget2, "dangerFg"))
    );
  if (field.id === "dangerBgAnsi")
    return updateColorOption(
      widget2,
      "dangerBg",
      deleteAnsi256Digit(colorOption(widget2, "dangerBg"))
    );
  return false;
}
function applyColorOptionField(widget2, field, delta) {
  if (field.id === "bold") widget2.update({ bold: !widget2.options.bold });
  else if (field.id === "fg")
    updateColorOption(
      widget2,
      "fg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        widget2.options.fg ?? "default",
        delta
      )
    );
  else if (field.id === "bg")
    updateColorOption(
      widget2,
      "bg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        widget2.options.bg ?? "default",
        delta
      )
    );
  else if (field.id === "warningFg")
    updateColorOption(
      widget2,
      "warningFg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        colorOption(widget2, "warningFg") ?? "default",
        delta
      )
    );
  else if (field.id === "warningBg")
    updateColorOption(
      widget2,
      "warningBg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        colorOption(widget2, "warningBg") ?? "default",
        delta
      )
    );
  else if (field.id === "dangerFg")
    updateColorOption(
      widget2,
      "dangerFg",
      cycle(
        FOREGROUND_COLORS.map((color) => color.value),
        colorOption(widget2, "dangerFg") ?? "default",
        delta
      )
    );
  else if (field.id === "dangerBg")
    updateColorOption(
      widget2,
      "dangerBg",
      cycle(
        STANDARD_COLORS.map((color) => color.value),
        colorOption(widget2, "dangerBg") ?? "default",
        delta
      )
    );
  else if (field.id === "fgAnsi")
    updateColorOption(widget2, "fg", adjustAnsi(colorOption(widget2, "fg"), delta));
  else if (field.id === "bgAnsi")
    updateColorOption(widget2, "bg", adjustAnsi(colorOption(widget2, "bg"), delta));
  else if (field.id === "warningFgAnsi")
    updateColorOption(widget2, "warningFg", adjustAnsi(colorOption(widget2, "warningFg"), delta));
  else if (field.id === "warningBgAnsi")
    updateColorOption(widget2, "warningBg", adjustAnsi(colorOption(widget2, "warningBg"), delta));
  else if (field.id === "dangerFgAnsi")
    updateColorOption(widget2, "dangerFg", adjustAnsi(colorOption(widget2, "dangerFg"), delta));
  else if (field.id === "dangerBgAnsi")
    updateColorOption(widget2, "dangerBg", adjustAnsi(colorOption(widget2, "dangerBg"), delta));
}
function colorOption(widget2, key) {
  return normalizeColor(widget2.options[key]);
}
function updateColorOption(widget2, key, value) {
  widget2.update({ [key]: value });
  return true;
}

// src/ui/fields.ts
function fieldsForWidget(widget2) {
  const spec = registry.spec(widget2.type);
  const properties = spec.properties;
  const fields = [{ id: "enabled", label: "Enabled", kind: "boolean" }];
  for (const option of spec.baseOptions) {
    if (option === "raw") fields.push({ id: "raw", label: "Raw value only", kind: "boolean" });
    if (option === "hideWhenEmpty")
      fields.push({ id: "hideWhenEmpty", label: "Hide when empty", kind: "boolean" });
    if (option === "hideWhenZero")
      fields.push({ id: "hideWhenZero", label: "Hide when zero", kind: "boolean" });
    if (option === "icon") fields.push({ id: "icon", label: "Custom icon", kind: "text" });
    if (option === "text" && !widget2.options.hideWhenEmpty)
      fields.push({ id: "text", label: "Text when empty", kind: "text" });
  }
  for (const property of properties) {
    if (property.options?.showInFields === false) continue;
    if (!isMetadataPropertyVisible(property, widget2.options)) continue;
    fields.push(metadataField(property));
  }
  return fields;
}
function colorFields(widget2) {
  const fields = [
    { id: "fg", label: "Foreground", kind: "color" },
    { id: "bg", label: "Background", kind: "color" },
    { id: "bold", label: "Bold", kind: "boolean" },
    { id: "fgAnsi", label: "Custom ANSI256 foreground", kind: "ansi" },
    { id: "bgAnsi", label: "Custom ANSI256 background", kind: "ansi" }
  ];
  if (widget2 && registry.spec(widget2.type).properties.find((property) => property.id === "contextConditionalColors") && widget2.options.contextConditionalColors) {
    fields.push(
      { id: "warningFg", label: "Warning foreground", kind: "color" },
      { id: "warningBg", label: "Warning background", kind: "color" },
      { id: "warningFgAnsi", label: "Custom ANSI256 warning foreground", kind: "ansi" },
      { id: "warningBgAnsi", label: "Custom ANSI256 warning background", kind: "ansi" },
      { id: "dangerFg", label: "Danger foreground", kind: "color" },
      { id: "dangerBg", label: "Danger background", kind: "color" },
      { id: "dangerFgAnsi", label: "Custom ANSI256 danger foreground", kind: "ansi" },
      { id: "dangerBgAnsi", label: "Custom ANSI256 danger background", kind: "ansi" }
    );
  }
  return fields;
}
function fieldValue(widget2, field) {
  if (field.id === "enabled") return widget2.enabled ? "on" : "off";
  if (field.kind === "boolean") return getBooleanField(widget2, field.id) ? "on" : "off";
  if (field.kind === "number") return String(getNumberField(widget2, field.id) ?? "");
  if (field.kind === "choice") {
    const value = getTextField(widget2, field.id);
    return field.choices?.find((choice) => choice.id === value)?.label ?? value;
  }
  return getTextField(widget2, field.id) || "(empty)";
}
function colorFieldValue(widget2, field) {
  if (field.id === "bold") return widget2.options.bold ? "on" : "off";
  if (field.id === "fg") return colorDisplayName(widget2.options.fg);
  if (field.id === "bg") return colorDisplayName(widget2.options.bg);
  if (field.id === "warningFg") return colorDisplayName(colorOption2(widget2, "warningFg"));
  if (field.id === "warningBg") return colorDisplayName(colorOption2(widget2, "warningBg"));
  if (field.id === "dangerFg") return colorDisplayName(colorOption2(widget2, "dangerFg"));
  if (field.id === "dangerBg") return colorDisplayName(colorOption2(widget2, "dangerBg"));
  if (field.id === "fgAnsi")
    return widget2.options.fg?.startsWith("ansi256:") ? widget2.options.fg.slice(8) : "0";
  if (field.id === "bgAnsi")
    return widget2.options.bg?.startsWith("ansi256:") ? widget2.options.bg.slice(8) : "0";
  if (field.id === "warningFgAnsi") {
    const color = colorOption2(widget2, "warningFg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "warningBgAnsi") {
    const color = colorOption2(widget2, "warningBg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "dangerFgAnsi") {
    const color = colorOption2(widget2, "dangerFg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  if (field.id === "dangerBgAnsi") {
    const color = colorOption2(widget2, "dangerBg");
    return color?.startsWith("ansi256:") ? color.slice(8) : "0";
  }
  return "";
}
function getBooleanField(widget2, id) {
  const spec = registry.spec(widget2.type);
  const property = spec.properties.find((item) => item.id === id);
  if (property?.kind === "boolean") return Boolean(widget2.options[id] ?? property.default);
  if (spec.baseOptions.some((option) => option === id)) {
    if (id === "raw") return widget2.options.raw ?? false;
    if (id === "hideWhenEmpty") return widget2.options.hideWhenEmpty ?? false;
    if (id === "hideWhenZero") return widget2.options.hideWhenZero ?? false;
  }
  return false;
}
function getNumberField(widget2, id) {
  const property = registry.spec(widget2.type).properties.find((item) => item.id === id);
  if (property?.kind === "number") {
    const value = widget2.options[id];
    return typeof value === "number" ? value : Number(property.default);
  }
  return void 0;
}
function getTextField(widget2, id) {
  const spec = registry.spec(widget2.type);
  const property = spec.properties.find((item) => item.id === id);
  if (property && (property.kind === "text" || property.kind === "choice")) {
    const value = widget2.options[id];
    return typeof value === "string" ? value : String(property.default);
  }
  if (spec.baseOptions.some((option) => option === id)) {
    if (id === "icon") return widget2.options.icon ?? "";
    if (id === "text") return widget2.options.text ?? "";
  }
  return "";
}
function formatWidgetOptions(widget2) {
  const spec = registry.spec(widget2.type);
  const properties = spec.properties;
  const parts = baseSummaryParts(widget2);
  if (spec.baseOptions.some((option) => option === "hideWhenZero") && widget2.options.hideWhenZero)
    parts.push("hide-zero");
  if (spec.baseOptions.some((option) => option === "text") && !widget2.options.hideWhenEmpty && widget2.options.text)
    parts.push(`text='${widget2.options.text}'`);
  for (const property of properties) {
    if (!isMetadataPropertyVisible(property, widget2.options)) continue;
    if (property.options?.showInWidgets === false) continue;
    addMetadataSummaryPart(parts, widget2, property);
  }
  return parts.join(" \u2022 ");
}
function formatWidgetColorOptions(widget2) {
  const summary = formatMetadataWidgetColorOptions(widget2);
  const colorSummary = formatColorStyleSummary(widget2);
  if (!summary) return colorSummary;
  if (!colorSummary) return summary;
  return `${summary} \u2022 ${colorSummary}`;
}
function isMetadataPropertyVisible(property, options) {
  const condition = property.showWhen;
  if (!condition) return true;
  return options[condition.property] === condition.equals;
}
function colorOption2(widget2, key) {
  return normalizeColor(widget2.options[key]);
}
function formatMetadataWidgetColorOptions(widget2) {
  const spec = registry.spec(widget2.type);
  const properties = spec.properties;
  const parts = baseSummaryParts(widget2);
  if (spec.baseOptions.some((option) => option === "text") && !widget2.options.hideWhenEmpty && widget2.options.text)
    parts.push(`text='${widget2.options.text}'`);
  for (const property of properties) {
    if (!isMetadataPropertyVisible(property, widget2.options)) continue;
    if (!property.options?.showInColors) continue;
    addMetadataSummaryPart(parts, widget2, property);
  }
  return parts.join(" \u2022 ");
}
function metadataField(property) {
  const field = {
    id: property.id,
    label: property.label,
    kind: property.kind
  };
  if (property.options?.min !== void 0) field.min = property.options.min;
  if (property.options?.max !== void 0) field.max = property.options.max;
  if (property.options?.choices !== void 0) field.choices = property.options.choices;
  if (property.options?.editAction !== void 0) field.editAction = property.options.editAction;
  return field;
}
function addMetadataSummaryPart(parts, widget2, property) {
  const value = widget2.options[property.id] ?? property.default;
  if (property.kind === "boolean") {
    if (value === true) parts.push(property.options?.label ?? property.id);
    return;
  }
  if (property.kind === "choice") {
    if (value === property.default) return;
    const choice = property.options?.choices?.find((item) => item.id === value);
    const label = choice?.list ?? String(value);
    const prefix = property.options?.listProperty || property.id;
    if (prefix) parts.push(`${prefix}=${label}`);
    else parts.push(label);
    return;
  }
  if (property.kind === "number" || property.kind === "text") {
    const prefix = property.options?.listProperty || property.id;
    const renderedValue = property.options?.quoteValue ? `'${String(value)}'` : String(value);
    if (value !== void 0 && value !== "") parts.push(`${prefix}=${renderedValue}`);
  }
}
function baseSummaryParts(widget2) {
  const { options } = widget2;
  const spec = registry.spec(widget2.type);
  const parts = [];
  if (spec.baseOptions.some((option) => option === "raw") && options.raw) parts.push("raw");
  if (spec.baseOptions.some((option) => option === "hideWhenEmpty") && options.hideWhenEmpty)
    parts.push("hide-empty");
  if (spec.baseOptions.some((option) => option === "icon") && options.icon)
    parts.push(`icon='${options.icon}'`);
  return parts;
}
function formatColorStyleSummary(widget2) {
  const { options } = widget2;
  const defaultFg = registry.spec(widget2.type).defaultStyle.fg ?? "default";
  const parts = [];
  if (options.fg && options.fg !== defaultFg) parts.push(`fg=${colorDisplayName(options.fg)}`);
  if (options.bg && options.bg !== "default") parts.push(`bg=${colorDisplayName(options.bg)}`);
  if (options.bold) parts.push("bold");
  return parts.join(" \u2022 ");
}

// src/ui/edit-colors.ts
var EDIT_COLORS_TITLE_PREFIX = "Colors /";
function editColorsTitle(widget2) {
  return `${EDIT_COLORS_TITLE_PREFIX} ${registry.spec(widget2.type).label}`;
}
function editColorsFieldRows(widget2) {
  return colorFields(widget2).map((field) => `${field.label}: ${colorFieldValue(widget2, field)}`);
}

// src/ui/screens/edit-colors.ts
var EditColorsScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    const widget2 = this.ctx.currentWidget();
    if (!widget2) return [this.render.line(this.ctx.theme.warning("No widget selected"), width)];
    const fields = editColorsFieldRows(widget2);
    this.clampSelection(fields.length);
    return [
      this.render.line(
        this.render.menuTitle(editColorsTitle(widget2), "Select a field to edit its colors"),
        width
      ),
      this.render.line(this.ctx.theme.dim(EDIT_COLORS_HINT), width),
      ...fields.map((field, index) => this.render.menuLine(index === this.selected, field, width))
    ];
  }
  handleInput(data) {
    const widget2 = this.ctx.currentWidget();
    if (!widget2) return;
    const fields = colorFields(widget2);
    this.clampSelection(fields.length);
    const field = fields[this.selected];
    if (!field) return;
    if (matchesKey3(data, Key3.up)) this.selected = wrap(this.selected - 1, fields.length);
    else if (matchesKey3(data, Key3.down)) this.selected = wrap(this.selected + 1, fields.length);
    else if (matchesKey3(data, Key3.left)) this.adjustColorField(widget2, field, -1);
    else if (matchesKey3(data, Key3.right) || matchesKey3(data, Key3.enter))
      this.adjustColorField(widget2, field, 1);
    else if (matchesKey3(data, Key3.backspace)) this.deleteColorDigit(widget2, field);
    else if (isPrintable(data)) this.applyColorDigit(widget2, field, data);
  }
  clampSelection(fieldCount) {
    this.selected = Math.min(Math.max(this.selected, 0), Math.max(0, fieldCount - 1));
  }
  applyColorDigit(widget2, field, digit) {
    if (!applyColorDigit(widget2, field, digit)) return;
    this.ctx.emitChange();
  }
  deleteColorDigit(widget2, field) {
    if (!deleteColorDigit(widget2, field)) return;
    this.ctx.emitChange();
  }
  adjustColorField(widget2, field, delta) {
    applyColorOptionField(widget2, field, delta);
    this.ctx.emitChange();
  }
};

// src/ui/screens/edit-widget.ts
import { Key as Key4, matchesKey as matchesKey4 } from "@earendil-works/pi-tui";

// src/ui/events.ts
import { highlightCode } from "@earendil-works/pi-coding-agent";
function eventWidgetUsageLines(widget2, width, line, dim) {
  return [
    line("", width),
    line(dim("Send events with a value:"), width),
    line(eventWidgetUsageCode(widgetId(widget2), "Value"), width),
    line("", width),
    line(dim("Send events to remove status:"), width),
    line(eventWidgetUsageCode(widgetId(widget2), "NULL"), width)
  ];
}
function widgetId(widget2) {
  const value = widget2.options.widgetId;
  return typeof value === "string" ? value : "";
}
function eventWidgetUsageCode(widgetId2, value) {
  const v = value === "NULL" ? "null" : `"${value}"`;
  return highlightCode(
    `pi.events.emit(${JSON.stringify(UPDATE_EVENT_WIDGET_EVENT)}, { "widgetId": ${JSON.stringify(widgetId2)}, "value": ${v} });`,
    "typescript"
  )[0] ?? "";
}

// src/ui/extension-status-picker.ts
import { truncateToWidth as truncateToWidth4 } from "@earendil-works/pi-tui";
function statusKeyPickerLines(getExtensionStatuses, rowConfig, width, line, dim) {
  const entries = allExtensionStatusEntries(getExtensionStatuses(), rowConfig, STATUS_KEY);
  const lines = [line("", width), line(dim("Available extension statuses:"), width)];
  if (entries.length === 0) {
    lines.push(
      line(dim("No extension statuses are currently available. Type a key manually."), width)
    );
    return lines;
  }
  for (const entry of entries) {
    lines.push(
      line(
        `${dim(entry.key)} ${truncateToWidth4(entry.value, Math.max(1, width - entry.key.length - 4), "\u2026")}`,
        width
      )
    );
  }
  return lines;
}
function cycleExternalStatusKey(widget2, getExtensionStatuses, rowConfig, delta) {
  const keys = allExtensionStatusEntries(getExtensionStatuses(), rowConfig, STATUS_KEY).map(
    (entry) => entry.key
  );
  if (keys.length === 0) return false;
  const currentValue = widget2.options.externalStatusKey;
  const current = typeof currentValue === "string" ? currentValue : "";
  const currentIndex = keys.indexOf(current);
  const nextIndex = currentIndex === -1 ? delta > 0 ? 0 : keys.length - 1 : (currentIndex + delta + keys.length) % keys.length;
  widget2.update({ externalStatusKey: keys[nextIndex] ?? current });
  return true;
}

// src/ui/option-edit.ts
function applyOptionFieldEdit(widget2, field, edit) {
  if (field.kind !== "text") return "unchanged";
  if (edit.kind === "appendText") {
    widget2.update({ [field.id]: getTextField(widget2, field.id) + edit.text });
    return "changed";
  }
  widget2.update({ [field.id]: getTextField(widget2, field.id).slice(0, -1) });
  return "changed";
}
function applyOptionField(widget2, field, delta) {
  if (field.id === "enabled") {
    widget2.toggle();
    return "changed";
  }
  if (field.editAction) return field.editAction;
  const properties = registry.spec(widget2.type).properties;
  const property = properties.find((item) => item.id === field.id);
  if (property?.options?.editAction) return property.options.editAction;
  if (field.kind === "boolean" && isMetadataBooleanField(widget2, field.id)) {
    metadataSetBooleanField(widget2, field.id, !getBooleanField(widget2, field.id));
    return "changed";
  }
  if (field.kind === "number") {
    if (property?.kind !== "number") return "unchanged";
    const min = field.min ?? property.options?.min ?? 1;
    const max = field.max ?? property.options?.max ?? 99;
    const current = getNumberField(widget2, field.id) ?? min;
    metadataSetNumberField(widget2, field.id, Math.min(max, Math.max(min, current + delta)));
    return "changed";
  }
  if (field.kind === "choice") {
    if (property?.kind !== "choice") return "unchanged";
    const choices = field.choices ?? property.options?.choices;
    const choiceIds = choices?.map((choice) => choice.id) ?? [];
    if (choiceIds.length === 0) return "unchanged";
    const current = getTextField(widget2, field.id) || (choiceIds[0] ?? "");
    widget2.update({ [field.id]: cycle(choiceIds, current, delta) });
    return "changed";
  }
  return "unchanged";
}
function metadataSetBooleanField(widget2, id, value) {
  const spec = registry.spec(widget2.type);
  const properties = spec.properties;
  const property = properties.find((item) => item.id === id);
  if (property?.kind === "boolean") {
    widget2.update({ [id]: value });
    return;
  }
  if (!spec.baseOptions.some((option) => option === id)) return;
  if (id === "raw") widget2.update({ raw: value });
  if (id === "hideWhenEmpty") widget2.update({ hideWhenEmpty: value });
  if (id === "hideWhenZero") widget2.update({ hideWhenZero: value });
}
function metadataSetNumberField(widget2, id, value) {
  const properties = registry.spec(widget2.type).properties;
  const property = properties.find((item) => item.id === id);
  if (property?.kind === "number") widget2.update({ [id]: value });
}
function isMetadataBooleanField(widget2, id) {
  const spec = registry.spec(widget2.type);
  const properties = spec.properties;
  const property = properties.find((item) => item.id === id);
  if (property?.kind === "boolean") return true;
  return spec.baseOptions.some((option) => option === id) && (id === "raw" || id === "hideWhenEmpty" || id === "hideWhenZero");
}

// src/ui/screens/edit-widget.ts
var HINT2 = "\u2191/\u2193 field \u2022 \u2190/\u2192 change \u2022 type text \u2022 backspace delete \u2022 esc back";
var EditWidgetScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    const widget2 = this.ctx.currentWidget();
    if (!widget2) return [this.render.line(this.ctx.theme.warning("No widget selected"), width)];
    const fields = fieldsForWidget(widget2);
    this.clampSelection(fields.length);
    const selectedField = fields[this.selected];
    const lines = [
      this.render.line(
        this.render.menuTitle(this.widgetTitle(widget2), "Select a field to edit its options"),
        width
      ),
      this.render.line(this.ctx.theme.dim(HINT2), width),
      ...fields.map(
        (field, index) => this.render.menuLine(
          index === this.selected,
          `${field.label}: ${fieldValue(widget2, field)}`,
          width
        )
      )
    ];
    if (selectedField?.editAction === "external-status-key") {
      lines.push(
        ...statusKeyPickerLines(
          this.ctx.getExtensionStatuses,
          this.ctx.state.store.settings.extensionStatusRow,
          width,
          (content, lineWidth) => this.render.line(content, lineWidth),
          (value) => this.ctx.theme.dim(value)
        )
      );
    }
    if (widget2.type === "event") {
      lines.push(
        ...eventWidgetUsageLines(
          widget2,
          width,
          (content, lineWidth) => this.render.line(content, lineWidth),
          (value) => this.ctx.theme.dim(value)
        )
      );
    }
    return lines;
  }
  handleInput(data) {
    const widget2 = this.ctx.currentWidget();
    if (!widget2) return;
    const fields = fieldsForWidget(widget2);
    this.clampSelection(fields.length);
    const field = fields[this.selected];
    if (!field) return;
    if (matchesKey4(data, Key4.up)) this.selected = wrap(this.selected - 1, fields.length);
    else if (matchesKey4(data, Key4.down)) this.selected = wrap(this.selected + 1, fields.length);
    else if (matchesKey4(data, Key4.left)) this.adjustField(widget2, field, -1);
    else if (matchesKey4(data, Key4.right) || matchesKey4(data, Key4.enter))
      this.adjustField(widget2, field, 1);
    else if (matchesKey4(data, Key4.backspace) && field.kind === "text")
      this.applyTextFieldEdit(widget2, field, { kind: "deleteText" });
    else if (isPrintable(data) && field.kind === "text")
      this.applyTextFieldEdit(widget2, field, { kind: "appendText", text: data });
  }
  widgetTitle(widget2) {
    return `Edit ${registry.spec(widget2.type).label}`;
  }
  clampSelection(fieldCount) {
    this.selected = Math.min(Math.max(this.selected, 0), Math.max(0, fieldCount - 1));
  }
  applyTextFieldEdit(widget2, field, edit) {
    if (applyOptionFieldEdit(widget2, field, edit) !== "changed") return;
    this.ctx.emitChange();
  }
  adjustField(widget2, field, delta) {
    const result = applyOptionField(widget2, field, delta);
    if (result === "external-status-key") {
      if (!cycleExternalStatusKey(
        widget2,
        this.ctx.getExtensionStatuses,
        this.ctx.state.store.settings.extensionStatusRow,
        delta
      ))
        return;
    } else if (result === "unchanged") return;
    this.ctx.emitChange();
  }
};

// src/ui/screens/extension-status-row.ts
import { Key as Key5, matchesKey as matchesKey5 } from "@earendil-works/pi-tui";

// src/ui/extension-statuses.ts
import { truncateToWidth as truncateToWidth5 } from "@earendil-works/pi-tui";
function extensionStatusRowLines(config, getExtensionStatuses, selected, width, menuTitle, line, menuLine, dim, success, warning) {
  const entries = allExtensionStatusEntries(
    getExtensionStatuses(),
    config.extensionStatusRow,
    STATUS_KEY
  );
  const hidden = new Set(config.extensionStatusRow.hiddenKeys);
  const lines = [
    line(
      menuTitle("Pi extensions", "Published statuses and extension status row visibility"),
      width
    ),
    line(dim("\u2191/\u2193 select \u2022 pgup/pgdn jump \u2022 \u2190/\u2192 or enter toggle \u2022 esc back"), width)
  ];
  if (entries.length === 0) {
    lines.push(line(warning("No extension statuses are currently available."), width));
    return lines;
  }
  entries.forEach((entry, index) => {
    const state = hidden.has(entry.key) ? dim("off") : success("on ");
    const key = dim(entry.key);
    const maxValueWidth = Math.max(1, width - entry.key.length - 8);
    const value = truncateToWidth5(entry.value, maxValueWidth, "\u2026");
    lines.push(menuLine(index === selected, `${state} ${key} ${value}`, width));
  });
  return lines;
}
function toggleExtensionStatusRowSelection(config, getExtensionStatuses, selected) {
  const entry = allExtensionStatusEntries(
    getExtensionStatuses(),
    config.extensionStatusRow,
    STATUS_KEY
  )[selected];
  if (!entry) return false;
  config.extensionStatusRow = toggleExtensionStatusRowKey(config.extensionStatusRow, entry.key);
  return true;
}
function extensionStatusRowCount(config, getExtensionStatuses) {
  return allExtensionStatusEntries(getExtensionStatuses(), config.extensionStatusRow, STATUS_KEY).length;
}

// src/ui/screens/extension-status-row.ts
var ExtensionStatusRowScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    return extensionStatusRowLines(
      this.ctx.state.store.settings,
      this.ctx.getExtensionStatuses,
      this.selected,
      width,
      (title, subtitle) => this.render.menuTitle(title, subtitle),
      (content, lineWidth) => this.render.line(content, lineWidth),
      (selected, content, lineWidth) => this.render.menuLine(selected, content, lineWidth),
      (value) => this.ctx.theme.dim(value),
      (value) => this.ctx.theme.success(value),
      (value) => this.ctx.theme.warning(value)
    );
  }
  handleInput(data) {
    const count = extensionStatusRowCount(
      this.ctx.state.store.settings,
      this.ctx.getExtensionStatuses
    );
    if (matchesKey5(data, Key5.up)) this.selected = wrap(this.selected - 1, Math.max(1, count));
    else if (matchesKey5(data, Key5.down))
      this.selected = wrap(this.selected + 1, Math.max(1, count));
    else if (matchesKey5(data, Key5.pageUp)) this.page(count, -1);
    else if (matchesKey5(data, Key5.pageDown)) this.page(count, 1);
    else if (matchesKey5(data, Key5.space) || matchesKey5(data, Key5.left) || matchesKey5(data, Key5.right) || matchesKey5(data, Key5.enter)) {
      if (toggleExtensionStatusRowSelection(
        this.ctx.state.store.settings,
        this.ctx.getExtensionStatuses,
        this.selected
      )) {
        this.ctx.emitChange();
      }
    }
  }
  page(count, delta) {
    this.selected = pageSelection(this.selected, count, this.ctx.visibleRowCount(), delta);
  }
};

// src/ui/screens/global.ts
import { Key as Key6, matchesKey as matchesKey6 } from "@earendil-works/pi-tui";

// src/ui/global-menu.ts
var GLOBAL_MENU_ACTIONS = [
  "toggle-enabled",
  "preset",
  "separator",
  "separator-fg",
  "separator-bg",
  "separator-fg-ansi",
  "separator-bg-ansi",
  "icon-mode",
  "minimalist",
  "reset"
];
var GLOBAL_MENU_HINT = "\u2191/\u2193 option \u2022 \u2190/\u2192 or enter change \u2022 type digits for ANSI256 \u2022 backspace delete \u2022 esc back";
function globalMenuFields(config) {
  return [
    `Enabled: ${config.enabled ? "on" : "off"}`,
    `Preset: ${config.preset}`,
    `Separator: ${config.separator}`,
    `Separator foreground: ${colorDisplayName(config.separatorFg)}`,
    `Separator background: ${colorDisplayName(config.separatorBg)}`,
    `Custom ANSI256 separator foreground: ${ansi256Digits(config.separatorFg)}`,
    `Custom ANSI256 separator background: ${ansi256Digits(config.separatorBg)}`,
    `Icons: ${ICON_MODE_LABELS[config.iconMode]}`,
    `Minimalist mode: ${config.minimalist ? "on" : "off"}`,
    "Reset to defaults"
  ];
}
function globalMenuAction(index) {
  return GLOBAL_MENU_ACTIONS[index] ?? "reset";
}
function applyGlobalMenuAction(config, action, delta) {
  if (action === "preset")
    return configWithPreset(
      config,
      cycle(Object.keys(PRESET_DEFINITIONS), config.preset, delta)
    );
  if (action === "reset") return cloneConfig(DEFAULT_CONFIG);
  const next = { ...config };
  applyGlobalSettingsAction(next, action, delta);
  return next;
}
function applyGlobalSettingsAction(settings, action, delta) {
  if (action === "toggle-enabled") settings.enabled = !settings.enabled;
  else if (action === "separator")
    settings.separator = cycle(SEPARATOR_VALUES, settings.separator, delta);
  else if (action === "separator-fg")
    settings.separatorFg = cycleStandardColor(settings.separatorFg, delta);
  else if (action === "separator-bg")
    settings.separatorBg = cycleStandardColor(settings.separatorBg, delta);
  else if (action === "separator-fg-ansi")
    settings.separatorFg = adjustAnsi(settings.separatorFg, delta);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = adjustAnsi(settings.separatorBg, delta);
  else if (action === "icon-mode")
    settings.iconMode = cycle(ICON_MODE_VALUES, settings.iconMode, delta);
  else if (action === "minimalist") settings.minimalist = !settings.minimalist;
  else return false;
  return true;
}
function applyGlobalSettingsTextInput(settings, action, data) {
  if (!/^\d$/.test(data)) return false;
  if (action === "separator-fg-ansi")
    settings.separatorFg = appendAnsi256Digit(settings.separatorFg, data);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = appendAnsi256Digit(settings.separatorBg, data);
  else return false;
  return true;
}
function applyGlobalSettingsBackspace(settings, action) {
  if (action === "separator-fg-ansi")
    settings.separatorFg = deleteAnsi256Digit(settings.separatorFg);
  else if (action === "separator-bg-ansi")
    settings.separatorBg = deleteAnsi256Digit(settings.separatorBg);
  else return false;
  return true;
}
function cycleStandardColor(current, delta) {
  return cycle(
    STANDARD_COLORS.map((color) => color.value),
    current,
    delta
  );
}

// src/ui/screens/global.ts
var GlobalScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    const fields = globalMenuFields(this.ctx.state.store.settings);
    return [
      this.render.line(
        this.render.menuTitle("Global Overrides", "Configure global settings for the pi-footer"),
        width
      ),
      this.render.line(this.ctx.theme.dim(GLOBAL_MENU_HINT), width),
      ...fields.map((field, index) => this.render.menuLine(index === this.selected, field, width))
    ];
  }
  handleInput(data) {
    if (matchesKey6(data, Key6.up))
      this.selected = wrap(this.selected - 1, GLOBAL_MENU_ACTIONS.length);
    else if (matchesKey6(data, Key6.down))
      this.selected = wrap(this.selected + 1, GLOBAL_MENU_ACTIONS.length);
    else if (matchesKey6(data, Key6.left)) this.adjust(-1);
    else if (matchesKey6(data, Key6.right) || matchesKey6(data, Key6.enter)) this.adjust(1);
    else if (matchesKey6(data, Key6.backspace)) this.applyBackspace();
    else if (isPrintable(data)) this.applyTextInput(data);
  }
  adjust(delta) {
    const action = globalMenuAction(this.selected);
    const settings = this.ctx.state.store.settings;
    if (!applyGlobalSettingsAction(settings, action, delta)) {
      this.ctx.state.store = WidgetStore.fromConfig(
        applyGlobalMenuAction(this.ctx.state.store.toConfig(), action, delta)
      );
    }
    this.ctx.emitChange();
  }
  applyTextInput(data) {
    if (!applyGlobalSettingsTextInput(
      this.ctx.state.store.settings,
      globalMenuAction(this.selected),
      data
    ))
      return;
    this.ctx.emitChange();
  }
  applyBackspace() {
    if (!applyGlobalSettingsBackspace(this.ctx.state.store.settings, globalMenuAction(this.selected)))
      return;
    this.ctx.emitChange();
  }
};

// src/ui/screens/line-list.ts
import { Key as Key7, matchesKey as matchesKey7 } from "@earendil-works/pi-tui";

// src/ui/line-list.ts
var LINE_LIST_HINT = "\u2191/\u2193 select \u2022 pgup/pgdn jump \u2022 enter edit \u2022 a add \u2022 c clone \u2022 w/s move \u2022 d delete \u2022 esc back";
function lineListCountLabel(total, start, end) {
  return `${total} line(s), showing ${rangeLabel(start, end, total)}`;
}
function lineListItemLabel(index, widgetCount, dim) {
  return `\u2630 Line ${index + 1} ${dim(`(${widgetCount} widget${widgetCount === 1 ? "" : "s"})`)}`;
}
function rangeLabel(start, end, total) {
  if (total === 0) return "0-0";
  return `${start + 1}-${end}`;
}

// src/ui/widget-actions.ts
function addLineAfter(lines, selectedLine) {
  lines.splice(selectedLine + 1, 0, []);
  return selectedLine + 1;
}
function cloneLineAfter(lines, selectedLine, cloneWidget = (widget2) => registry.cloneWidget(widget2)) {
  const line = lines[selectedLine] ?? [];
  lines.splice(selectedLine + 1, 0, line.map(cloneWidget));
  return selectedLine + 1;
}
function deleteLine(lines, selectedLine) {
  if (lines.length <= 1) return selectedLine;
  lines.splice(selectedLine, 1);
  return Math.min(selectedLine, lines.length - 1);
}
function moveLine(lines, selectedLine, delta) {
  const next = selectedLine + delta;
  if (next < 0 || next >= lines.length) return selectedLine;
  const [line] = lines.splice(selectedLine, 1);
  if (!line) return selectedLine;
  lines.splice(next, 0, line);
  return next;
}
function moveWidget(line, selectedWidget, delta) {
  const next = selectedWidget + delta;
  if (next < 0 || next >= line.length) return selectedWidget;
  const [widget2] = line.splice(selectedWidget, 1);
  if (!widget2) return selectedWidget;
  line.splice(next, 0, widget2);
  return next;
}
function cloneSelectedWidget(line, selectedWidget, cloneWidget = (widget2) => registry.cloneWidget(widget2)) {
  const widget2 = line[selectedWidget];
  if (!widget2) return selectedWidget;
  line.splice(selectedWidget + 1, 0, cloneWidget(widget2));
  return selectedWidget + 1;
}
function deleteSelectedWidget(line, selectedWidget) {
  if (line.length === 0) return selectedWidget;
  line.splice(selectedWidget, 1);
  return Math.max(0, Math.min(selectedWidget, line.length - 1));
}
function toggleWidgetEnabled(widget2) {
  if (!widget2) return false;
  widget2.toggle();
  return true;
}
function toggleWidgetRaw(widget2) {
  if (!widget2 || isLayoutWidgetType(widget2.type)) return false;
  widget2.update({ raw: !(widget2.options.raw ?? false) });
  return true;
}
function isLayoutWidgetType(type) {
  return type === "custom-text" || type === "separator" || type === "spacer" || type === "flex-separator";
}

// src/ui/screens/line-list.ts
var LineListScreen = class extends Controller {
  constructor(ctx, render, title, nextView) {
    super(ctx, render);
    this.title = title;
    this.nextView = nextView;
  }
  title;
  nextView;
  renderScreen(width) {
    const visibleCount = this.ctx.visibleRowCount();
    const { start, end } = scrollWindow(
      this.ctx.state.store.lines.length,
      this.ctx.state.selectedLine,
      visibleCount
    );
    const visible = this.ctx.state.store.lines.slice(start, end);
    const lines = [
      this.render.line(
        this.render.menuTitle(this.title, "Choose which status line to configure"),
        width
      ),
      this.render.line(this.ctx.theme.dim(LINE_LIST_HINT), width),
      this.render.line(
        this.ctx.theme.dim(lineListCountLabel(this.ctx.state.store.lines.length, start, end)),
        width
      )
    ];
    visible.forEach((line, offset) => {
      const index = start + offset;
      const text = lineListItemLabel(index, line.length, (value) => this.ctx.theme.dim(value));
      lines.push(this.render.menuLine(index === this.ctx.state.selectedLine, text, width));
    });
    return lines;
  }
  handleInput(data) {
    if (matchesKey7(data, Key7.up))
      this.ctx.state.selectedLine = wrap(
        this.ctx.state.selectedLine - 1,
        this.ctx.state.store.lines.length
      );
    else if (matchesKey7(data, Key7.down))
      this.ctx.state.selectedLine = wrap(
        this.ctx.state.selectedLine + 1,
        this.ctx.state.store.lines.length
      );
    else if (matchesKey7(data, Key7.pageUp)) this.page(-1);
    else if (matchesKey7(data, Key7.pageDown)) this.page(1);
    else if (matchesKey7(data, Key7.enter)) {
      this.ctx.state.selectedWidget = 0;
      this.ctx.show(this.nextView);
    } else if (data === "a") {
      this.ctx.state.selectedLine = addLineAfter(
        this.ctx.state.store.lines,
        this.ctx.state.selectedLine
      );
      this.ctx.emitChange();
    } else if (data === "c") {
      this.ctx.state.selectedLine = cloneLineAfter(
        this.ctx.state.store.lines,
        this.ctx.state.selectedLine,
        (widget2) => registry.cloneWidget(widget2)
      );
      this.ctx.emitChange();
    } else if (data === "w") this.move(-1);
    else if (data === "s") this.move(1);
    else if (data === "d") this.delete();
  }
  page(delta) {
    this.ctx.state.selectedLine = pageSelection(
      this.ctx.state.selectedLine,
      this.ctx.state.store.lines.length,
      this.ctx.visibleRowCount(),
      delta
    );
  }
  move(delta) {
    const next = moveLine(this.ctx.state.store.lines, this.ctx.state.selectedLine, delta);
    if (next === this.ctx.state.selectedLine) return;
    this.ctx.state.selectedLine = next;
    this.ctx.emitChange();
  }
  delete() {
    const previousLength = this.ctx.state.store.lines.length;
    this.ctx.state.selectedLine = deleteLine(
      this.ctx.state.store.lines,
      this.ctx.state.selectedLine
    );
    if (this.ctx.state.store.lines.length !== previousLength) this.ctx.emitChange();
  }
};

// src/ui/screens/main.ts
import { Key as Key8, matchesKey as matchesKey8 } from "@earendil-works/pi-tui";
var HINT3 = "\u2191/\u2193 select \u2022 enter option \u2022 ctrl+s save \u2022 esc exit";
var ITEMS2 = [
  {
    label: "Edit lines",
    description: "Manage status lines and line widgets",
    action: { type: "view", view: "line-list" }
  },
  {
    label: "Edit colors",
    description: "Configure per-widget foreground/background/bold",
    action: { type: "view", view: "color-line-list" }
  },
  {
    label: "Terminal Options",
    description: "Terminal width and color level",
    action: { type: "view", view: "terminal" }
  },
  {
    label: "Global Overrides",
    description: "Global presets, separators, icons, minimalist mode",
    action: { type: "view", view: "global" }
  },
  {
    label: "Pi extensions",
    description: "Published statuses and extension status row visibility",
    action: { type: "view", view: "extension-status-row" }
  },
  {
    label: "Save & Exit",
    description: "Persist changes and close the configuration UI",
    action: { type: "save-exit" }
  },
  {
    label: "Exit without saving",
    description: "Discard unsaved changes and close immediately",
    action: { type: "discard-exit" }
  }
];
var MainScreen = class extends Controller {
  selected = 0;
  renderScreen(width) {
    return [
      this.render.line(
        this.render.menuTitle(
          "Main Menu",
          "Configure any number of status lines with various widgets"
        ),
        width
      ),
      this.render.line(this.ctx.theme.dim(HINT3), width),
      ...ITEMS2.map(
        (item, index) => this.render.menuLine(
          index === this.selected,
          `${item.label} ${this.ctx.theme.dim(item.description)}`,
          width
        )
      )
    ];
  }
  handleInput(data) {
    if (matchesKey8(data, Key8.up)) this.selected = wrap(this.selected - 1, ITEMS2.length);
    else if (matchesKey8(data, Key8.down)) this.selected = wrap(this.selected + 1, ITEMS2.length);
    else if (matchesKey8(data, Key8.enter)) this.applySelectedAction();
  }
  menuAction(index) {
    return ITEMS2[index]?.action;
  }
  applySelectedAction() {
    const action = this.menuAction(this.selected);
    if (!action) return;
    if (action.type === "view") this.ctx.show(action.view);
    else if (action.type === "save-exit") this.ctx.save(true);
    else this.ctx.exitWithoutSaving();
  }
};

// src/ui/screens/terminal.ts
import { Key as Key9, matchesKey as matchesKey9 } from "@earendil-works/pi-tui";

// src/ui/color-level-confirm.ts
var COLOR_LEVEL_CONFIRM_HINT = "Press enter/y to proceed, esc/n to go back.";
var COLOR_LEVEL_CONFIRM_WARNING = "Changing color level will reset all custom ANSI256 widget colors.";
function colorLevelConfirmValueLabel(colorLevel) {
  return `New color level: ${colorLevel ? COLOR_LEVEL_LABELS[colorLevel] : "unknown"}`;
}
function colorLevelConfirmAction(data, isEscape, isEnter) {
  if (isEscape || data === "n") return "cancel";
  if (isEnter || data === "y") return "confirm";
  return void 0;
}

// src/ui/terminal-menu.ts
var TERMINAL_MENU_ACTIONS = ["width-mode", "color-level"];
var TERMINAL_MENU_HINT = "\u2191/\u2193 option \u2022 \u2190/\u2192 change \u2022 esc back";
function terminalMenuFields(config) {
  return [
    `Terminal Width: ${WIDTH_MODE_LABELS[config.terminal.widthMode]}`,
    `Color Level: ${COLOR_LEVEL_LABELS[config.terminal.colorLevel]}`
  ];
}
function terminalMenuAction(index) {
  return TERMINAL_MENU_ACTIONS[index] ?? "color-level";
}
function nextTerminalWidthMode(config, delta) {
  return cycle(TERMINAL_WIDTH_MODE_VALUES, config.terminal.widthMode, delta);
}
function nextTerminalColorLevel(config, delta) {
  return cycle(COLOR_LEVEL_VALUES, config.terminal.colorLevel, delta);
}

// src/ui/screens/terminal.ts
var TerminalState = class {
  pendingColorLevel;
};
var TerminalScreen = class extends Controller {
  constructor(ctx, render, terminalState) {
    super(ctx, render);
    this.terminalState = terminalState;
  }
  terminalState;
  selected = 0;
  renderScreen(width) {
    const fields = terminalMenuFields(this.ctx.state.store.settings);
    return [
      this.render.line(
        this.render.menuTitle(
          "Terminal Options",
          "Configure terminal width behavior and color level"
        ),
        width
      ),
      this.render.line(this.ctx.theme.dim(TERMINAL_MENU_HINT), width),
      ...fields.map((field, index) => this.render.menuLine(index === this.selected, field, width))
    ];
  }
  handleInput(data) {
    if (matchesKey9(data, Key9.up))
      this.selected = wrap(this.selected - 1, TERMINAL_MENU_ACTIONS.length);
    else if (matchesKey9(data, Key9.down))
      this.selected = wrap(this.selected + 1, TERMINAL_MENU_ACTIONS.length);
    else if (matchesKey9(data, Key9.left)) this.adjust(-1);
    else if (matchesKey9(data, Key9.right) || matchesKey9(data, Key9.enter)) this.adjust(1);
  }
  adjust(delta) {
    if (terminalMenuAction(this.selected) === "width-mode") {
      this.ctx.state.store.settings.terminal.widthMode = nextTerminalWidthMode(
        this.ctx.state.store.settings,
        delta
      );
      this.ctx.emitChange();
      return;
    }
    const settings = this.ctx.state.store.settings;
    const next = nextTerminalColorLevel(settings, delta);
    if (next !== settings.terminal.colorLevel && hasCustomAnsiColors(this.ctx.state.store.lines)) {
      this.terminalState.pendingColorLevel = next;
      this.ctx.show("confirm-color-level");
      return;
    }
    settings.terminal.colorLevel = next;
    this.ctx.emitChange();
  }
};
var ColorLevelConfirmScreen = class extends Controller {
  constructor(ctx, render, terminalState) {
    super(ctx, render);
    this.terminalState = terminalState;
  }
  terminalState;
  renderScreen(width) {
    return [
      this.render.line(this.ctx.theme.warning(COLOR_LEVEL_CONFIRM_WARNING), width),
      this.render.line(colorLevelConfirmValueLabel(this.terminalState.pendingColorLevel), width),
      this.render.line(this.ctx.theme.dim(COLOR_LEVEL_CONFIRM_HINT), width)
    ];
  }
  handleInput(data) {
    const action = colorLevelConfirmAction(
      data,
      matchesKey9(data, Key9.escape),
      matchesKey9(data, Key9.enter)
    );
    if (action === "cancel") {
      this.terminalState.pendingColorLevel = void 0;
      this.ctx.show("terminal");
      return;
    }
    if (action === "confirm") {
      if (this.terminalState.pendingColorLevel)
        this.ctx.state.store.settings.terminal.colorLevel = this.terminalState.pendingColorLevel;
      resetCustomAnsiColors(this.ctx.state.store.lines);
      this.terminalState.pendingColorLevel = void 0;
      this.ctx.show("terminal");
      this.ctx.emitChange();
    }
  }
};

// src/ui/screens/widget-list.ts
import { Key as Key10, matchesKey as matchesKey10 } from "@earendil-works/pi-tui";
var HINT4 = "\u2191/\u2193 select \u2022 enter options \u2022 a add \u2022 c clone \u2022 w/s move \u2022 d delete \u2022 space toggle \u2022 r raw \u2022 esc back";
var COLOR_HINT = "\u2191/\u2193 select \u2022 pgup/pgdn jump \u2022 enter colors \u2022 esc back";
var WidgetListScreen = class extends Controller {
  constructor(ctx, render, colors) {
    super(ctx, render);
    this.colors = colors;
  }
  colors;
  renderScreen(width) {
    const line = this.ctx.currentLine();
    const visibleCount = this.ctx.visibleRowCount();
    const { start, end } = scrollWindow(line.length, this.ctx.state.selectedWidget, visibleCount);
    const visible = line.slice(start, end);
    const lines = [
      this.render.line(
        this.render.menuTitle(
          `${this.colors ? "Edit widget colors" : "Edit widgets"} / Line ${this.ctx.state.selectedLine + 1}`,
          this.colors ? "Select a widget to edit its colors" : "Select a widget to edit its options, or add/remove/reorder widgets"
        ),
        width
      ),
      this.render.line(this.ctx.theme.dim(this.colors ? COLOR_HINT : HINT4), width),
      this.render.line(this.ctx.theme.dim(this.countLabel(line.length, start, end)), width)
    ];
    if (line.length === 0)
      lines.push(
        this.render.line(this.ctx.theme.warning("Empty line. Press a to add a widget."), width)
      );
    visible.forEach((widget2, offset) => {
      const index = start + offset;
      const text = this.colors ? this.colorItemLabel(index, widget2) : this.itemLabel(index, widget2);
      lines.push(this.render.menuLine(index === this.ctx.state.selectedWidget, text, width));
    });
    return lines;
  }
  handleInput(data) {
    const line = this.ctx.currentLine();
    if (matchesKey10(data, Key10.up))
      this.ctx.state.selectedWidget = wrap(
        this.ctx.state.selectedWidget - 1,
        Math.max(1, line.length)
      );
    else if (matchesKey10(data, Key10.down))
      this.ctx.state.selectedWidget = wrap(
        this.ctx.state.selectedWidget + 1,
        Math.max(1, line.length)
      );
    else if (matchesKey10(data, Key10.pageUp)) this.page(line.length, -1);
    else if (matchesKey10(data, Key10.pageDown)) this.page(line.length, 1);
    else if (this.colors && matchesKey10(data, Key10.enter)) this.ctx.show("edit-colors");
    else if (!this.colors) this.handleEditListInput(data);
  }
  countLabel(total, start, end) {
    const range = total === 0 ? "0-0" : `${start + 1}-${end}`;
    return `${total} widget(s), showing ${range}`;
  }
  itemLabel(index, widget2) {
    const enabled = widget2.enabled ? this.ctx.theme.success("on ") : this.ctx.theme.dim("off");
    const indexPad = index < 9 ? " " : "";
    const options = this.ctx.theme.dim(formatWidgetOptions(widget2));
    return `${enabled} ${index + 1}.${indexPad} ${registry.spec(widget2.type).label} ${options}`;
  }
  colorItemLabel(index, widget2) {
    const enabled = widget2.enabled ? this.ctx.theme.success("on ") : this.ctx.theme.dim("off");
    const indexPad = index < 9 ? " " : "";
    const options = this.ctx.theme.dim(formatWidgetColorOptions(widget2));
    return `${enabled} ${index + 1}.${indexPad} ${registry.spec(widget2.type).label} ${options}`;
  }
  handleEditListInput(data) {
    if (data === "a") this.ctx.show("add-widget");
    else if (matchesKey10(data, Key10.enter) || data === "e") this.ctx.show("edit-widget");
    else if (data === "c") this.cloneCurrentWidget();
    else if (data === "w") this.moveWidget(-1);
    else if (data === "s") this.moveWidget(1);
    else if (data === "d") this.deleteCurrentWidget();
    else if (matchesKey10(data, Key10.space)) this.toggleCurrentWidget();
    else if (data === "r") this.toggleCurrentWidgetRaw();
  }
  page(length, delta) {
    this.ctx.state.selectedWidget = pageSelection(
      this.ctx.state.selectedWidget,
      length,
      this.ctx.visibleRowCount(),
      delta
    );
  }
  moveWidget(delta) {
    const next = moveWidget(this.ctx.currentLine(), this.ctx.state.selectedWidget, delta);
    if (next === this.ctx.state.selectedWidget) return;
    this.ctx.state.selectedWidget = next;
    this.ctx.emitChange();
  }
  cloneCurrentWidget() {
    const next = cloneSelectedWidget(
      this.ctx.currentLine(),
      this.ctx.state.selectedWidget,
      (widget2) => registry.cloneWidget(widget2)
    );
    if (next === this.ctx.state.selectedWidget) return;
    this.ctx.state.selectedWidget = next;
    this.ctx.emitChange();
  }
  deleteCurrentWidget() {
    const line = this.ctx.currentLine();
    const previousLength = line.length;
    this.ctx.state.selectedWidget = deleteSelectedWidget(line, this.ctx.state.selectedWidget);
    if (line.length === previousLength) return;
    this.ctx.emitChange();
  }
  toggleCurrentWidget() {
    if (!toggleWidgetEnabled(this.ctx.currentWidget())) return;
    this.ctx.emitChange();
  }
  toggleCurrentWidgetRaw() {
    if (!toggleWidgetRaw(this.ctx.currentWidget())) return;
    this.ctx.emitChange();
  }
};

// src/ui/theme.ts
function createUiTheme(getTheme) {
  return {
    accent: (text) => getTheme().fg("accent", text),
    dim: (text) => getTheme().fg("dim", text),
    muted: (text) => getTheme().fg("muted", text),
    success: (text) => getTheme().fg("success", text),
    warning: (text) => getTheme().fg("warning", text),
    error: (text) => getTheme().fg("error", text),
    bold: (text) => getTheme().bold(text),
    selected: (text) => {
      const theme = getTheme();
      return theme.bg("selectedBg", theme.fg("accent", text));
    },
    border: (text, color = "border") => getTheme().fg(color, text),
    previewTitle: (text) => {
      const theme = getTheme();
      return theme.fg("accent", theme.bold(text));
    },
    configStateLabel: (state, label) => {
      const theme = getTheme();
      if (state === "saved") return theme.fg("accent", label);
      if (state === "dirty") return theme.bold(theme.fg("warning", label));
      if (state === "saving") return theme.fg("dim", label);
      if (state === "error") return theme.bold(theme.fg("error", label));
      return "";
    }
  };
}

// src/ui/screen.ts
var StatuslineConfigScreen = class {
  constructor(config, previewData, getExtensionStatuses, requestRender, getTerminalRows, props) {
    this.previewData = previewData;
    this.getExtensionStatuses = getExtensionStatuses;
    this.requestRender = requestRender;
    this.getTerminalRows = getTerminalRows;
    this.props = props;
    this.state = createScreenState(WidgetStore.fromConfig(cloneConfig(config)));
    this.lifecycle = new ConfigLifecycle(config);
    this.theme = createUiTheme(props.getTheme);
    this.screenRender = new ScreenRender(this.theme);
    this.overlayRender = new OverlayRender(this.theme, this.screenRender);
    this.screenContext = this.createScreenContext();
    this.screenController = new ScreenController(this.screenContext);
    this.registerScreens();
    this.animationTimer = setInterval(this.requestRender, RETRO_FRAME_INTERVAL_MS);
  }
  previewData;
  getExtensionStatuses;
  requestRender;
  getTerminalRows;
  props;
  state;
  lifecycle;
  theme;
  screenRender;
  overlayRender;
  screenContext;
  screenController;
  saving = false;
  animationTimer;
  render(width) {
    return this.overlayRender.render({
      width,
      terminalRows: this.getTerminalRows(),
      activeLineCount: this.getActiveLineCount(),
      visibleRowCount: this.getVisibleRowCount(),
      store: this.state.store,
      previewData: this.previewData,
      getExtensionStatuses: this.getExtensionStatuses,
      theme: this.props.getTheme(),
      requestRender: this.requestRender,
      configStateText: this.lifecycle.label ? this.theme.configStateLabel(this.lifecycle.state, this.lifecycle.label) : "",
      body: this.screenController.renderScreen(width)
    });
  }
  invalidate() {
  }
  dispose() {
    clearInterval(this.animationTimer);
  }
  handleInput(data) {
    if (matchesKey11(data, Key11.ctrl("s"))) {
      void this.saveConfig(false);
      return;
    }
    if (this.state.view === "confirm-color-level" || this.state.view === "confirm-exit") {
      this.screenController.handleInput(data);
      return;
    }
    if (matchesKey11(data, Key11.escape)) {
      const target = escapeTarget(this.state.view);
      if (target === "close") this.requestExit();
      else this.show(target);
      return;
    }
    this.screenController.handleInput(data);
  }
  registerScreens() {
    const terminalState = new TerminalState();
    this.screenController.register("main", new MainScreen(this.screenContext, this.screenRender));
    this.screenController.register(
      "line-list",
      new LineListScreen(this.screenContext, this.screenRender, "Edit lines", "widget-list")
    );
    this.screenController.register(
      "color-line-list",
      new LineListScreen(this.screenContext, this.screenRender, "Edit colors", "color-widget-list")
    );
    this.screenController.register(
      "widget-list",
      new WidgetListScreen(this.screenContext, this.screenRender, false)
    );
    this.screenController.register(
      "color-widget-list",
      new WidgetListScreen(this.screenContext, this.screenRender, true)
    );
    this.screenController.register(
      "add-widget",
      new AddWidgetScreen(this.screenContext, this.screenRender)
    );
    this.screenController.register(
      "edit-widget",
      new EditWidgetScreen(this.screenContext, this.screenRender)
    );
    this.screenController.register(
      "edit-colors",
      new EditColorsScreen(this.screenContext, this.screenRender)
    );
    this.screenController.register(
      "terminal",
      new TerminalScreen(this.screenContext, this.screenRender, terminalState)
    );
    this.screenController.register(
      "confirm-color-level",
      new ColorLevelConfirmScreen(this.screenContext, this.screenRender, terminalState)
    );
    this.screenController.register(
      "confirm-exit",
      new ConfirmExitScreen(this.screenContext, this.screenRender)
    );
    this.screenController.register(
      "global",
      new GlobalScreen(this.screenContext, this.screenRender)
    );
    this.screenController.register(
      "extension-status-row",
      new ExtensionStatusRowScreen(this.screenContext, this.screenRender)
    );
  }
  createScreenContext() {
    return {
      state: this.state,
      theme: this.theme,
      getExtensionStatuses: this.getExtensionStatuses,
      currentLine: () => this.currentLine(),
      currentWidget: () => this.currentWidget(),
      visibleRowCount: () => this.getVisibleRowCount(),
      show: (view) => this.show(view),
      emitChange: () => this.emitChange(),
      save: (exitAfterSave) => void this.saveConfig(exitAfterSave),
      exitWithoutSaving: () => this.exitWithoutSaving()
    };
  }
  show(view) {
    this.state.view = view;
  }
  currentLine() {
    return this.state.store.lines[this.state.selectedLine] ?? this.state.store.lines[0] ?? [];
  }
  currentWidget() {
    return this.currentLine()[this.state.selectedWidget];
  }
  getVisibleRowCount() {
    return visibleRowCount(
      this.getTerminalRows(),
      CONFIG_UI_HEIGHT_RATIO,
      this.getActiveLineCount()
    );
  }
  getActiveLineCount() {
    return activeLineCount(this.state.store.lines);
  }
  requestExit() {
    if (!this.lifecycle.dirty) {
      this.closeWithResult(this.lifecycle.closeResult(false));
      return;
    }
    this.state.viewBeforeConfirmExit = this.state.view;
    this.show("confirm-exit");
  }
  exitWithoutSaving() {
    this.closeWithResult(this.lifecycle.closeResult(false));
  }
  async saveConfig(exitAfterSave) {
    if (this.saving) return;
    this.saving = true;
    this.lifecycle.beginSave();
    this.requestRender();
    try {
      const config = cloneConfig(this.state.store.toConfig());
      await this.props.onSave(config);
      this.lifecycle.markSaved(config);
      if (exitAfterSave) this.closeWithResult(this.lifecycle.closeResult(true));
    } catch {
      this.lifecycle.markSaveFailed();
    } finally {
      this.saving = false;
      this.requestRender();
    }
  }
  closeWithResult(result) {
    this.props.onChange(result.config);
    this.props.onClose(result);
  }
  emitChange() {
    this.lifecycle.markChanged();
    this.props.onChange(cloneConfig(this.state.store.toConfig()));
  }
};

// src/ui.ts
async function openStatuslineConfigUi(ctx, initialConfig, previewData, onChange, onSave, getExtensionStatuses) {
  let finalConfig = cloneConfig(initialConfig);
  return ctx.ui.custom(
    (tui, theme, _keybindings, done) => {
      const screen = new StatuslineConfigScreen(
        finalConfig,
        previewData,
        getExtensionStatuses,
        () => tui.requestRender(),
        () => tui.terminal.rows,
        {
          onChange(config) {
            finalConfig = cloneConfig(config);
            onChange(finalConfig);
            tui.requestRender();
          },
          async onSave(config) {
            finalConfig = cloneConfig(config);
            try {
              await onSave(finalConfig);
            } catch (error) {
              ctx.ui.notify(
                `Could not save pi-footer config: ${error instanceof Error ? error.message : String(error)}`,
                "error"
              );
              throw error;
            }
          },
          onClose(result) {
            done(result);
          },
          getTheme: () => theme
        }
      );
      return screen;
    },
    {
      overlay: true,
      overlayOptions: {
        anchor: "top-center",
        width: "100%",
        maxHeight: `${CONFIG_UI_HEIGHT_RATIO * 100}%`,
        margin: 0
      }
    }
  );
}

// src/index.ts
async function statuslineExtension(pi) {
  let config = await loadConfig();
  let widgetStore = WidgetStore.fromConfig(config);
  const eventWidgets = new EventWidgetValues();
  let liveTextVerbosity;
  let renderCurrentFooter;
  let getExtensionStatuses = () => EMPTY_EXTENSION_STATUSES;
  function apply(ctx) {
    if (!ctx.hasUI || !config.enabled) {
      ctx.ui.setFooter(void 0);
      ctx.ui.setStatus(STATUS_KEY, void 0);
      return;
    }
    ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("accent", "pi-footer"));
    ctx.ui.setFooter((tui, theme, footerData) => {
      getExtensionStatuses = () => footerData.getExtensionStatuses();
      renderCurrentFooter = () => tui.requestRender();
      const unsubscribeBranch = footerData.onBranchChange(() => tui.requestRender());
      return {
        dispose() {
          unsubscribeBranch();
          if (renderCurrentFooter) renderCurrentFooter = void 0;
          getExtensionStatuses = () => EMPTY_EXTENSION_STATUSES;
        },
        invalidate() {
        },
        render(width) {
          const data = collectStatuslineData(ctx, pi, footerData, eventWidgets.values, {
            config,
            requestRender: () => tui.requestRender(),
            textVerbosity: liveTextVerbosity
          });
          const lines = renderStatuslines(widgetStore, data, width, {
            getExtensionStatuses,
            theme,
            requestRender: () => tui.requestRender()
          });
          if (lines.length === 0) return [];
          const statuses = visibleExtensionStatusRowEntries(
            footerData.getExtensionStatuses(),
            config.extensionStatusRow.hiddenKeys,
            STATUS_KEY
          ).map((entry) => entry.value);
          const renderedLines = lines.map((line) => truncateToWidth6(line, width, "\u2026"));
          if (statuses.length === 0) return renderedLines;
          return [
            ...renderedLines,
            truncateToWidth6(theme.fg("dim", statuses.join(" ")), width, "\u2026")
          ];
        }
      };
    });
  }
  function replaceConfig(next) {
    config = next;
    widgetStore = WidgetStore.fromConfig(config);
  }
  async function setConfig(next, ctx) {
    replaceConfig(next);
    await saveConfig(config);
    apply(ctx);
  }
  pi.events.on(UPDATE_EVENT_WIDGET_EVENT, (payload) => {
    const changed = eventWidgets.update(payload);
    if (changed) renderCurrentFooter?.();
  });
  pi.on("before_provider_request", (event) => {
    const verbosity = readTextVerbosity(event.payload);
    if (verbosity !== void 0) liveTextVerbosity = verbosity;
  });
  pi.registerCommand("footer", {
    description: "Configure the pi statusline/footer",
    handler: async (args, ctx) => {
      const handled = await handleArgs(args, ctx, config, async (next) => setConfig(next, ctx));
      if (handled) return;
      const previewData = collectStatuslineData(
        ctx,
        pi,
        {
          getGitBranch: () => "main"
        },
        eventWidgets.values,
        {
          collectGit: true,
          git: await loadGitInfo(pi, ctx.cwd, "main"),
          textVerbosity: liveTextVerbosity
        }
      );
      const result = await openStatuslineConfigUi(
        ctx,
        config,
        previewData,
        (updated) => {
          replaceConfig(updated);
          apply(ctx);
        },
        async (updated) => setConfig(updated, ctx),
        getExtensionStatuses
      );
      replaceConfig(result.config);
      apply(ctx);
    }
  });
  pi.on("session_start", async (_event, ctx) => {
    replaceConfig(await loadConfig());
    apply(ctx);
  });
  pi.on("model_select", async (_event, ctx) => {
    liveTextVerbosity = void 0;
    apply(ctx);
  });
  pi.on("session_shutdown", (_event, ctx) => {
    ctx.ui.setFooter(void 0);
    ctx.ui.setStatus(STATUS_KEY, void 0);
  });
}
function collectStatuslineData(ctx, pi, footerData, eventWidgets, options = {}) {
  const contextUsage2 = ctx.getContextUsage();
  const collectGit = options.collectGit ?? (options.config ? hasEnabledGitWidgets(options.config) : true);
  return {
    model: ctx.model?.id,
    provider: ctx.model?.provider,
    sessionName: pi.getSessionName(),
    sessionId: ctx.sessionManager.getSessionId(),
    thinkingLevel: ctx.model?.reasoning ? pi.getThinkingLevel() : void 0,
    textVerbosity: getTextVerbosity(ctx.model, options.textVerbosity),
    git: options.git ?? (collectGit ? getGitInfo(pi, ctx.cwd, footerData.getGitBranch(), options.requestRender ?? (() => {
    })) : EMPTY_GIT_INFO),
    cwd: ctx.cwd,
    activeToolCount: pi.getActiveTools().length,
    usingSubscription: ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false,
    contextTokens: contextUsage2?.tokens ?? void 0,
    contextMaxTokens: contextUsage2?.contextWindow,
    metrics: collectSessionMetrics(ctx.sessionManager.getBranch()),
    turnMetrics: collectTurnMetrics(ctx.sessionManager.getEntries()),
    eventWidgets
  };
}
async function handleArgs(args, ctx, currentConfig, setConfig) {
  const [command, value] = args.trim().split(/\s+/, 2);
  if (!command) return false;
  if (command === "on" || command === "enable") {
    await setConfig({ ...currentConfig, enabled: true });
    ctx.ui.notify("pi-footer enabled", "info");
    return true;
  }
  if (command === "off" || command === "disable") {
    await setConfig({ ...currentConfig, enabled: false });
    ctx.ui.notify("pi-footer disabled", "info");
    return true;
  }
  if (command === "reset") {
    await setConfig(cloneConfig(DEFAULT_CONFIG));
    ctx.ui.notify("pi-footer reset to defaults", "info");
    return true;
  }
  if (command === "preset" && isPreset(value)) {
    await setConfig(configWithPreset(currentConfig, value));
    ctx.ui.notify(`pi-footer preset: ${value}`, "info");
    return true;
  }
  ctx.ui.notify(
    "Usage: /footer [on|off|reset|preset compact|default|powerline|powerline-bright|powerline-blocks|powerline-mono|git-heavy|pi-footer|demo|demo-standard]",
    "warning"
  );
  return true;
}
function getTextVerbosity(model, liveVerbosity) {
  if (!model || model.api !== "openai-codex-responses") return void 0;
  return liveVerbosity ?? "low";
}
function readTextVerbosity(payload) {
  if (!isRecord(payload)) return void 0;
  const text = payload.text;
  if (!isRecord(text)) return void 0;
  return typeof text.verbosity === "string" ? text.verbosity : void 0;
}
export {
  statuslineExtension as default
};
