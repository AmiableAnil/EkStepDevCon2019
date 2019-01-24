import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {NavController, NavParams, Platform, ToastController, ViewController} from 'ionic-angular';
import {QRScanner, QRScannerStatus} from '@ionic-native/qr-scanner';
import {AppPreferences} from '@ionic-native/app-preferences';
import {UserService} from '../../services/user/user.service';
import {TelemetryService} from '../../services/telemetry/telemetry-services';
import {Stall} from '../../services/stall/Stall';
import {Subscription} from 'rxjs';
import {Idea} from '../../services/stall/Idea';

;

@Component({
    templateUrl: './stall-qr-scan.component.html',
    selector: 'stall-qr-scan-page'
})
export class StallQRScanPage {

    public scanMessage?: string;
    public scanError?: string;

    private scannerSubscription: Subscription;

    @ViewChild('content', {read: ElementRef})
    private content: ElementRef;
    private backButtonFunc: any;

    constructor(private qrScanner: QRScanner,
                private platform: Platform,
                private navCtrl: NavController,
                private viewCtrl: ViewController,
                private toastCtrl: ToastController,
                private appPreference: AppPreferences,
                private navParams: NavParams,
                @Inject('TELEMETRY_SERVICE') private telemetryService: TelemetryService,
                @Inject('USER_SERVICE') private userService: UserService) {
    }

    ionViewDidLoad() {
        this.handleBackButton();
        this.openScanner();
    }

    showToast(msg: string, err?) {
        this.scanMessage = msg;
        this.scanError = JSON.stringify(err);
        // const toastOptions: ToastOptions = {
        //     message: msg,
        //     duration: 3000,
        //     position: 'middle',
        // };
        //
        // const toast = this.toastCtrl.create(toastOptions);
        //
        // console.log(msg);
        // toast.present();
    }

    private openScanner() {
        this.qrScanner.prepare()
            .then(async (status: QRScannerStatus) => {
                if (status.authorized) {
                    if (status.prepared) {
                        this.hideContentBG();

                        setTimeout(() => {
                            this.qrScanner.show();
                        }, 1000);

                        this.scannerSubscription = this.qrScanner.scan().subscribe((code: string) => {

                            this.markAttendance(code);

                            this.scannerSubscription.unsubscribe();
                            this.showContentBG();
                        });
                    }
                } else {
                    console.log('denied');
                }
            })
            .catch((e: any) => console.error(e));

    }

    private handleBackButton() {
        this.backButtonFunc = this.platform.registerBackButtonAction(() => {
            this.showContentBG();
            this.scannerSubscription.unsubscribe();
            this.qrScanner.destroy();
            this.viewCtrl.dismiss();
            this.backButtonFunc();
        }, 10);
    }

    private hideContentBG() {
        document.getElementById('ion-app').setAttribute('hidden', 'true');
    }

    private showContentBG() {
        document.getElementById('ion-app').removeAttribute('hidden');
    }

    private async markAttendance(code) {
        return this.userService.getUser({code})
            .then((visitorResponse) => {
                return this.telemetryService.generateAttendanceTelemetry({
                    dimensions: {
                        visitorId: visitorResponse.Visitor.code,
                        visitorName: visitorResponse.Visitor.name,
                        stallId: (this.navParams.data.selectedStall as Stall).code,
                        stallName: (this.navParams.data.selectedStall as Stall).name,
                        ideaId: (this.navParams.data.selectedIdea as Idea).code,
                        ideaName: (this.navParams.data.selectedIdea as Idea).name
                    },
                    edata: {
                        type: 'app',
                        mode: 'visit'
                    }
                });
            }).then(() => {
                this.showToast('Attendance Marked');
            }).catch((e) => {
                this.showToast('Failed to mark Attendance', e);
            });
    }
}