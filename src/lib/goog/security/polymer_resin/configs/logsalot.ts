import { Configuration, CONSOLE_LOGGING_REPORT_HANDLER } from '../sanitizer';
import { safeTypesBridge } from '../closure-bridge';

const config: Configuration = {
      allowedIdentifierPrefixes: [''],
      safeTypesBridge,
      reportHandler: CONSOLE_LOGGING_REPORT_HANDLER,
};

export default config;
