import type { Theme } from "@earendil-works/pi-coding-agent";

import type { ColorLevel } from "../colors.js";
import type { GetExtensionStatuses } from "../extension-statuses.js";
import type {
  IconMode,
  StatuslineData,
  WidgetEntry,
  WidgetOptions,
  WidgetStyle,
} from "../types.js";

export interface WidgetIconSet {
  emoji: string;
  nerd: string;
  text: string;
}

export type PropertyKind = "boolean" | "number" | "choice" | "text";

export interface ChoiceOption<TId extends string = string> {
  id: TId;
  label: string;
  list: string;
}

export type WidgetPropertyDefault = string | number | boolean;

// Edit-action discriminant for properties that open a dedicated editor flow. Extend as needed.
export type WidgetEditAction = "external-status-key";

export interface WidgetProperty {
  id: string;
  label: string;
  kind: PropertyKind;
  description: string;
  default: WidgetPropertyDefault;
  showWhen?: {
    property: string;
    equals: string | number | boolean;
  };
  options?: {
    min?: number;
    max?: number;
    choices?: readonly ChoiceOption[];
    label?: string;
    showInFields?: boolean;
    showInWidgets?: boolean;
    showInColors?: boolean;
    listProperty?: string;
    quoteValue?: boolean;
    editAction?: WidgetEditAction;
  };
}

export type WidgetBaseOption = "raw" | "hideWhenEmpty" | "hideWhenZero" | "text" | "icon";

export interface WidgetRenderOptions extends WidgetStyle {
  icons?: WidgetIconSet;
  preservedTrimStyles?: string;
  stripIncomingStyles?: boolean;
}

// The widget dependency set is the materialized snapshot (StatuslineData) plus the one live
// accessor that must never enter the snapshot — see F1 / pi live-accessor rule.
export type WidgetDependencyValues = StatuslineData & {
  getExtensionStatuses: GetExtensionStatuses | undefined;
};

export type WidgetDependency = keyof WidgetDependencyValues;

export interface BaseWidgetContext {
  iconMode: IconMode;
  minimalist: boolean;
  colorLevel: ColorLevel;
  theme?: Theme;
  requestRender?: () => void;
}

export type WidgetContext<TDeps extends readonly WidgetDependency[] = readonly []> =
  BaseWidgetContext & Pick<WidgetDependencyValues, TDeps[number]>;

export type WidgetInstanceOptions<TOptions extends object> = WidgetOptions & TOptions;

export interface Widget<TOptions extends object = {}> {
  readonly entry: WidgetEntry;
  readonly id: string;
  readonly type: WidgetEntry["type"];
  enabled: boolean;
  options: WidgetInstanceOptions<TOptions>;

  render(ctx: WidgetContext): string | undefined;
  toggle(enabled?: boolean): void;
  update(options: Partial<WidgetInstanceOptions<TOptions>>): void;
  toEntry(): WidgetEntry;
}

type BaseOptionsToObject<TBaseOptions extends readonly WidgetBaseOption[]> = Required<
  Pick<WidgetOptions, TBaseOptions[number]>
>;

type WidgetChoiceValue<TProperty> = TProperty extends {
  readonly kind: "choice";
  readonly options: { readonly choices: readonly (infer TChoice)[] };
}
  ? TChoice extends { readonly id: infer TId extends string }
    ? TId
    : string
  : string;

type WidgetPropertyValue<TProperty extends Pick<WidgetProperty, "kind">> =
  TProperty["kind"] extends "boolean"
    ? boolean
    : TProperty["kind"] extends "number"
      ? number
      : TProperty["kind"] extends "choice"
        ? WidgetChoiceValue<TProperty>
        : string;

type PropertiesToObject<TProperties extends readonly WidgetProperty[]> = {
  [TProperty in TProperties[number] as TProperty["id"]]: WidgetPropertyValue<TProperty>;
};

export type OptionsFor<TSpec extends Pick<WidgetSpec, "baseOptions" | "properties">> =
  WidgetOptions &
    BaseOptionsToObject<TSpec["baseOptions"]> &
    PropertiesToObject<TSpec["properties"]> &
    WidgetStyle;

export type ContextFor<TSpec extends Pick<WidgetSpec, "dependencies">> = BaseWidgetContext &
  Pick<WidgetDependencyValues, TSpec["dependencies"][number]>;

export interface TypedWidgetRenderArgs<
  TSpec extends Pick<WidgetSpec, "dependencies" | "baseOptions" | "properties">,
> {
  readonly ctx: ContextFor<TSpec>;
  readonly options: OptionsFor<TSpec>;
  readonly renderWidget: (
    value: string | undefined,
    renderOptions?: WidgetRenderOptions,
  ) => string | undefined;
}

export interface WidgetSpec<
  TType extends string = string,
  TCategory extends string = string,
  TDependencies extends readonly WidgetDependency[] = readonly WidgetDependency[],
  TBaseOptions extends readonly WidgetBaseOption[] = readonly WidgetBaseOption[],
  TProperties extends readonly WidgetProperty[] = readonly WidgetProperty[],
> {
  readonly type: TType;
  readonly label: string;
  readonly category: TCategory;
  readonly description: string;
  readonly dependencies: TDependencies;
  readonly baseOptions: TBaseOptions;
  readonly baseOptionDefaults?: Partial<WidgetOptions>;
  readonly properties: TProperties;
  readonly icons: WidgetIconSet;
  readonly defaultStyle: WidgetStyle;
  readonly createOptionDefaults?: () => Partial<WidgetOptions>;
  render(
    args: TypedWidgetRenderArgs<{
      readonly dependencies: TDependencies;
      readonly baseOptions: TBaseOptions;
      readonly properties: TProperties;
    }>,
  ): string | undefined;
}

export function defineWidget<
  const TType extends string,
  const TCategory extends string,
  const TDependencies extends readonly WidgetDependency[],
  const TBaseOptions extends readonly WidgetBaseOption[],
  const TProperties extends readonly WidgetProperty[],
>(
  spec: WidgetSpec<TType, TCategory, TDependencies, TBaseOptions, TProperties>,
): WidgetSpec<TType, TCategory, TDependencies, TBaseOptions, TProperties> {
  return spec;
}
