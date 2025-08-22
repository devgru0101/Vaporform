import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as health_service from "../../../../health/encore.service";

export async function health(params, opts) {
    const handler = (await import("../../../../health/health")).health;
    registerTestHandler({
        apiRoute: { service: "health", name: "health", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: health_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("health", "health", params, opts);
}

