import { isPlatformBrowser } from "@angular/common";
import { PLATFORM_ID, inject } from "@angular/core";

export function isBrowser() {
  return isPlatformBrowser(inject(PLATFORM_ID));
}
