import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
// import { StallQRScanPage } from '../stall-qr-scan/stall-qr-scan.component';
import {StallSelectionPage} from '../stall-selection/stall-selection';
import { RegistrationOfflinePage } from '../registration-offline/registration-offline';

@IonicPage()
@Component({
    selector: 'page-profile',
    templateUrl: 'profile.html',
})
export class ProfilePage {
    userCode: any;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public viewCtrl: ViewController) {
    }

    ionViewDidLoad() {
    }

    navigateToStallSelectionPage() {
        this.navCtrl.push(StallSelectionPage, {});
        this.viewCtrl.dismiss();
    }

    navigateToRegisterOfflinePage() {
        this.navCtrl.push(RegistrationOfflinePage, {});
        this.viewCtrl.dismiss();
    }
}
