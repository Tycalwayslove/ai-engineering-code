export type HealthStatus = {
  status: "ok";
};

export type VersionInfo = {
  name: string;
  version: string;
};

export type FactoryCapabilityStatus = "ready" | "planned";

export type FactoryCapability = {
  id: string;
  label: string;
  source: string;
  status: FactoryCapabilityStatus;
  summary: string;
};

export type FactoryStatus = {
  name: string;
  status: "ready" | "degraded";
  version: string;
  capabilities: FactoryCapability[];
  nextActions: string[];
};
