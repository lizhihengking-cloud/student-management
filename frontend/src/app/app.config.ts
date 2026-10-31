import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { errorInterceptor } from './core/error.interceptor';
import { AuthService } from './core/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // XSRF: HttpClient echoes the XSRF-TOKEN cookie in X-XSRF-TOKEN on mutating requests by default.
    provideHttpClient(withInterceptors([errorInterceptor])),
    // Restore the session (page refresh) before the first navigation so route guards see the signed-in user.
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const auth = inject(AuthService);
        return () => auth.restore();
      },
    },
  ],
};
