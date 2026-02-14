import { PlatformLocation } from '@angular/common';
import { RoutingPaths } from '../enums/routing-paths.enum';

import { AppBaseHrefFactory } from './app-base-href.service';

const PATHNAME = '/some/path';

describe('AppBaseHrefFactory', () => {
  let platformLocation: PlatformLocation;

  beforeEach(() => {
    platformLocation = {
      pathname: PATHNAME,
    } as PlatformLocation;
  });

  it('should return the base href when the pathname does not end with a routing path', () => {
    const baseHref = AppBaseHrefFactory(platformLocation);
    expect(baseHref).toEqual(PATHNAME);
  });

  it('should return the base href when the pathname ends with a routing path', () => {
    const baseHref = AppBaseHrefFactory({
      pathname: `${PATHNAME}/${RoutingPaths.AboutUs}`,
    } as PlatformLocation);
    expect(baseHref).toEqual(PATHNAME);
  });
});
