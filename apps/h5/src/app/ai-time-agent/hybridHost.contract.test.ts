import type { HybridHostPlatform } from "@ai-code/shared-ui";
import { hybridHostPlatforms } from "@ai-code/shared-ui";

const expectedPlatforms = ["h5", "ios", "android"] as const;

hybridHostPlatforms satisfies readonly HybridHostPlatform[];
expectedPlatforms satisfies readonly HybridHostPlatform[];

const defaultHostPlatform: HybridHostPlatform = "ios";

defaultHostPlatform satisfies HybridHostPlatform;
