import type { SiteManifest } from "@planning/entity-model";

export const TRIP_BANNER_WIDTH = 1200;
export const TRIP_BANNER_HEIGHT = 480;

export interface ManifestAsset {
  entityId: string;
  href: string;
  digest: string;
}

export function tripBannerSourcePath(entityId: string): string {
  return `content/entities/${entityId}/banner.jpg`;
}

export function tripBannerHref(basePath: string, entityId: string, digest: string): string {
  return `${basePath}assets/trip-banners/${entityId}-${digest.slice(0, 12)}.jpg`;
}

export function manifestAssets(manifest: SiteManifest): ManifestAsset[] {
  return manifest.entities
    .flatMap((entity) => {
      const banner = entity.viewModels.trip?.banner;
      return banner ? [{ entityId: entity.id, href: banner.src, digest: banner.digest }] : [];
    })
    .sort((left, right) => left.entityId.localeCompare(right.entityId, "en"));
}

export function jpegDimensions(bytes: Uint8Array):
  | {
      width: number;
      height: number;
    }
  | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++]!;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda || offset + 1 >= bytes.length) break;
    const length = (bytes[offset]! << 8) | bytes[offset + 1]!;
    if (length < 2 || offset + length > bytes.length) break;
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker,
      ) &&
      length >= 7
    ) {
      return {
        height: (bytes[offset + 3]! << 8) | bytes[offset + 4]!,
        width: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
      };
    }
    offset += length;
  }
  return undefined;
}
