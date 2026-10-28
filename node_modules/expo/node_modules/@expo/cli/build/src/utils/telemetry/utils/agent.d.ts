export type AgentTelemetryContext = {
    id: string;
    sessionId: string | undefined;
};
export declare function getAgentTelemetryContext(): AgentTelemetryContext | null;
