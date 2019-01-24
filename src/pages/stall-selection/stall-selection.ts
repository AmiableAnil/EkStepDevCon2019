import {Component, Inject} from '@angular/core';
import {App, IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {StallService} from '../../services/stall/stall-service';
import {StallQRScanPage} from '../stall-qr-scan/stall-qr-scan.component';
import {Stall} from '../../services/stall/Stall';
import {Idea} from '../../services/stall/Idea';

/**
 * Generated class for the StallSelectionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-stall-selection',
    templateUrl: 'stall-selection.html',
})
export class StallSelectionPage {

    stallForm: FormGroup;
    ideasResponse: Idea[] = [];
    stallResponse: Stall[] = [];
    private selectedStall?: Stall;
    private selectedIdea?: Idea;

    constructor(
        public app: App,
        public navCtrl: NavController,
        public navParams: NavParams,
        private fb: FormBuilder, @Inject('STALL_SERVICE') private stallService: StallService,
        private viewCtrl: ViewController) {
        this.initializeForm();
    }

    initializeForm() {
        this.stallForm = this.fb.group({
            stallName: [null, Validators.required],
            stallIdea: [null, Validators.required]
        });
    }

    ionViewDidLoad() {
        this.fetchStallDetails();
    }

    public onStallSelect(stall: Stall) {
        this.selectedStall = stall;

        this.stallService.getIdeas({code: stall.code}).then((data) => {
            this.ideasResponse = data.Stall.ideas;
        });

    }

    public onIdeaSelect(idea: Idea) {
        this.selectedIdea = idea;
    }

    onSubmit() {
        this.navCtrl.push(StallQRScanPage, {
            selectedStall: this.selectedStall,
            selectedIdea: this.selectedIdea
        });
        this.viewCtrl.dismiss();
    }

    private async fetchStallDetails() {
        this.stallResponse = await this.stallService.getStalls({Stall: {}});
    }
}
