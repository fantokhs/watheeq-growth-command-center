import clsx, { type ClassValue } from 'clsx';

/**
 * مساعد لدمج class names بشكل مشروط.
 * يستخدم في كل المكونات.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
