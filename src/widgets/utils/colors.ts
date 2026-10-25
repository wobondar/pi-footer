import type { ColorName } from "../../colors.ts";

export function colorPair(
  fg: ColorName | undefined,
  bg: ColorName | undefined,
): { fg?: ColorName; bg?: ColorName } {
  return {
    ...(fg === undefined ? {} : { fg }),
    ...(bg === undefined ? {} : { bg }),
  };
}
