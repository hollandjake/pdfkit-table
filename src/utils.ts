import { ExpandedSideDefinition, SideDefinition } from './types';

/**
 * Convert any side definition into a static structure
 *
 * @param sides The sides to convert
 * @param defaultDefinition The value to use when no definition is provided
 * @param transformer The transformation to apply to the sides once normalized
 */
export function normalizeSides<T = undefined, D extends T = T, O = T>(
  sides: SideDefinition<T>,
  defaultDefinition: SideDefinition<D> = undefined as D,
  transformer: (v: T | D) => O = v => v as never
): ExpandedSideDefinition<O> {
  if (sides === undefined) sides = defaultDefinition;
  if (typeof sides !== 'object' || sides === null) sides = [sides, sides, sides, sides];
  if (Array.isArray(sides)) {
    if (sides.length === 2) sides = { vertical: sides[0], horizontal: sides[1] };
    else sides = { top: sides[0], right: sides[1], bottom: sides[2], left: sides[3] };
  }

  if ('vertical' in sides && 'horizontal' in sides) {
    sides = { top: sides.vertical, right: sides.horizontal, bottom: sides.vertical, left: sides.horizontal };
  }

  if (!('top' in sides && 'right' in sides && 'bottom' in sides && 'left' in sides)) {
    sides = { top: sides, right: sides, bottom: sides, left: sides };
  }

  return {
    top: transformer(sides.top),
    right: transformer(sides.right),
    bottom: transformer(sides.bottom),
    left: transformer(sides.left),
  };
}
