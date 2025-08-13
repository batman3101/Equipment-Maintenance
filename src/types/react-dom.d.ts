declare module "react-dom" {
  import * as React from "react";

  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): React.ReactPortal;

  export function render(
    element: React.ReactElement,
    container: Element | null,
    callback?: () => void
  ): void;

  export function unmountComponentAtNode(container: Element | null): boolean;

  export function findDOMNode(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    componentOrElement: Element | React.Component<any, any> | null
  ): Element | Text | null;

  export const version: string;
}
