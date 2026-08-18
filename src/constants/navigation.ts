export type NavigationIconName =
  | 'home'
  | 'workout'
  | 'routines'
  | 'progress'
  | 'library';

export const TAB_ITEMS = [
  { route: 'index', label: 'Home', icon: 'home' },
  { route: 'workout', label: 'Workout', icon: 'workout' },
  { route: 'routines', label: 'Routines', icon: 'routines' },
  { route: 'progress', label: 'Progress', icon: 'progress' },
  { route: 'library', label: 'Library', icon: 'library' },
] as const satisfies readonly {
  route: string;
  label: string;
  icon: NavigationIconName;
}[];
