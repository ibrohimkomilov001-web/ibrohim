import { fetchSettings, updateSettings as apiUpdateSettings } from "@/lib/api/admin";

export type PlatformSettings = {
  [key: string]: any;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const data = await fetchSettings();
    return data || {};
  } catch {
    return {};
  }
}

export async function updatePlatformSettings(settings: PlatformSettings): Promise<void> {
  await apiUpdateSettings(settings);
}