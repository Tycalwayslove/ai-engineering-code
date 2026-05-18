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
  status: FactoryCapabilityStatus;
};

export type FactoryStatus = {
  name: string;
  status: "ready" | "degraded";
  version: string;
  capabilities: FactoryCapability[];
};
