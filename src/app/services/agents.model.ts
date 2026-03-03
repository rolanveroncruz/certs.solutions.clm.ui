export interface AgentDiscoveryRes {
  id: string;
  serviceName: string;
  ports: number[];
  certificateFound: boolean;
  commonName?: string;
  issuer?: string;
  expiresAt?: string; // ISO8601 string
}

export interface AgentInfoRes {
  id: string;
  hostname: string;
  ipAddress: string;
  os: string;
  kernelVersion?: string;
  cpuModel?: string;
  cpuCores?: number;
  totalMemoryBytes?: number;
  goOs?: string;
  status: 'online' | 'offline';
  lastSeen: string; // ISO8601 string
  discoveries: AgentDiscoveryRes[];
}
