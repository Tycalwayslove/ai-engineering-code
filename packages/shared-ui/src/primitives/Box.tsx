import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

export type BoxProps<TElement extends ElementType = "div"> =
  HTMLAttributes<HTMLElement> & {
    as?: TElement;
    children?: ReactNode;
    style?: CSSProperties;
  };

export function Box<TElement extends ElementType = "div">({
  as,
  children,
  style,
  ...props
}: BoxProps<TElement>) {
  const Component = as ?? "div";

  return (
    <Component style={style} {...props}>
      {children}
    </Component>
  );
}
