import { PlatformLocation } from '@angular/common';
import { RoutingPaths } from '../enums/routing-paths.enum';

export const AppBaseHrefFactory = (platform: PlatformLocation) => {
  const { pathname } = platform;
  const routingPaths = Object.values(RoutingPaths);

  for (const path of routingPaths) {
    if (pathname.endsWith(path)) {
      return pathname.substring(0, pathname.lastIndexOf('/'));
    }
  }
  return pathname;
};
