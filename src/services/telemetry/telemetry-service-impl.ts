import {Inject, Injectable} from '@angular/core';
import {TelemetryService} from './telemetry-services';
import {Device} from '@ionic-native/device';
import {AttendanceTelemetry, BuyIdeaTelemetry, FeedbackTelemetry, RegisterTelemetry} from './telemetry-requests';
import {AppConfig} from '../../config/AppConfig';
import {Telemetry, Telemetry_IDs} from './base-telemetry';
import {TelemetryApiHandlerService} from '../api/telemetry-api-handler-service';
import {AppPreferences} from '@ionic-native/app-preferences';
import {PreferenceKey} from '../../config/constants';

@Injectable()
export class TelemetryServiceImpl implements TelemetryService {

    private static TELEMETRY_SYNC_ENDPOINT = '/v1/telemetry';

    constructor(private apiHandler: TelemetryApiHandlerService,
                private device: Device,
                private appPreferences: AppPreferences,
                @Inject('APP_CONFIG') private config: AppConfig) {
    }

    public async generateAttendanceTelemetry(request: AttendanceTelemetry): Promise<undefined> {
        await this.apiHandler.handle(
            this.config.telemetryBaseUrl + TelemetryServiceImpl.TELEMETRY_SYNC_ENDPOINT,
            {
                events: [
                    {
                        ...this.constructBaseTelemetry(),
                        eid: Telemetry_IDs.DC_START,
                        edata: request.edata,
                        dimensions: {
                            ...request.dimensions,
                            visitorId: request.dimensions.visitorId,
                            visitorName: request.dimensions.visitorName,
                            stallId: request.dimensions.stallId,
                            stallName: request.dimensions.stallName
                        }
                    } as Telemetry
                ]
            }
        );

        return;
    }

    public async generateBuyIdeaTelemetry(request: BuyIdeaTelemetry): Promise<undefined> {
        await this.apiHandler.handle(
            this.config.telemetryBaseUrl + TelemetryServiceImpl.TELEMETRY_SYNC_ENDPOINT,
            {
                events: [
                    {
                        ...this.constructBaseTelemetry(),
                        eid: Telemetry_IDs.DC_BUY,
                        edata: request.edata,
                        dimensions: {
                            ...request.dimensions,
                            visitorId: await this.appPreferences.fetch(PreferenceKey.USER_CODE),
                            visitorName: await this.appPreferences.fetch(PreferenceKey.USER_NAME)
                        }
                    } as Telemetry
                ]
            }
        );

        return;
    }

    public async generateFeedbackTelemetry(request: FeedbackTelemetry): Promise<undefined> {
        await this.apiHandler.handle(
            this.config.telemetryBaseUrl + TelemetryServiceImpl.TELEMETRY_SYNC_ENDPOINT,
            {
                events: [
                    {
                        ...this.constructBaseTelemetry(),
                        eid: Telemetry_IDs.DC_FEEDBCK,
                        edata: request.edata,
                        dimensions: {
                            ...request.dimensions,
                            visitorId: await this.appPreferences.fetch(PreferenceKey.USER_CODE),
                            visitorName: await this.appPreferences.fetch(PreferenceKey.USER_NAME)
                        }
                    } as Telemetry
                ]
            }
        );

        return;
    }

    public async generateRegisterTelemetry(request: RegisterTelemetry): Promise<undefined> {
        await this.apiHandler.handle(
            this.config.telemetryBaseUrl + TelemetryServiceImpl.TELEMETRY_SYNC_ENDPOINT,
            {
                events: [
                    {
                        ...this.constructBaseTelemetry(),
                        eid: Telemetry_IDs.DC_REGISTER,
                        edata: request.edata,
                        dimensions: {
                            ...request.dimensions,
                            visitorId: await this.appPreferences.fetch(PreferenceKey.USER_CODE),
                            visitorName: await this.appPreferences.fetch(PreferenceKey.USER_NAME)
                        }
                    } as Telemetry
                ]
            }
        );

        return;
    }

    private constructBaseTelemetry() {
        return {
            eid: null,
            ets: Date.now(),
            did: this.device.uuid,
            dimensions: null,
            edata: null
        }
    }
}