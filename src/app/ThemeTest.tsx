import { useThemeStore } from '@/store/useThemeStore';

export default function ThemeTest() {
  const global = useThemeStore(s => s.globalTheme);
  const active = useThemeStore(s => s.getEffectiveTheme('123'));
  return <div>{JSON.stringify(global)} - {JSON.stringify(active)}</div>;
}
