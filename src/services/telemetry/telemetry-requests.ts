export interface RegisterTelemetry {
    dimensions: {
    };
    edata: {
        mode: "online" | "offline";
    };
}

export interface AttendanceTelemetry {
    dimensions: {
        visitorId: string;
        visitorName: string;
        ideaId: string;
        ideaName: string;
        stallId: string;
        stallName: string;
    };
    edata: {
        type: "app";
        mode: "visit";
    };
}

export interface BuyIdeaTelemetry {
    dimensions: {
        stallId: string;
        stallName: string;
        ideaId: string;
        ideaName: string;
    };
    edata: {}
}

export interface FeedbackTelemetry {
    dimensions: {
        stallId: string;
        stallName: string;
        ideaId: string;
        ideaName: string;
    };
    edata: {
        rating: number,
        comment: string
    };
}