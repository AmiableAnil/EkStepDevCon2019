import {Loading, LoadingController, PopoverController} from 'ionic-angular';
import {Component, Inject} from '@angular/core';
import {StallService} from '../../services/stall/stall-service';
import {BoughtIdeas} from '../../services/stall/BoughtIdeas';
import {GetIdeasResponse} from '../../services/stall/responses';
import {Idea} from '../../services/stall/Idea';
import {Stall} from '../../services/stall/Stall';
import {TelemetryService} from '../../services/telemetry/telemetry-services';
import {RatingPopupComponent} from '../../components/rating-popup/rating-popup';
import {Subscription} from 'rxjs';
import {AppConfig} from '../../config/AppConfig';

@Component({
    selector: 'page-stall-list',
    templateUrl: 'stall-list.html',
})
export class StallListPage {
    stalls = [];
    ideasResponse?: GetIdeasResponse;
    storeOptions = {
        title: 'Select Store',
        cssClass: 'select-box'
    };
    private currentStall: Stall;
    private boughtIdeas: BoughtIdeas = {};
    private boughtIdeasSubscription: Subscription;

    constructor(
        @Inject('STALL_SERVICE') private stallService: StallService,
        @Inject('TELEMETRY_SERVICE') private telemetryService: TelemetryService,
        @Inject('APP_CONFIG') private config: AppConfig,
        private popCtrl: PopoverController,
        private loadingCtrl: LoadingController) {
    }

    ionViewWillEnter() {
        this.fetchBoughtIdeas();
    }

    ionViewDidLoad() {
        this.fetchStalls().then(() => {
            this.onStallSelect(this.stalls[0]);
        });

        this.fetchBoughtIdeas();
    }

    ionViewWillLeave() {
        this.boughtIdeasSubscription.unsubscribe();
    }

    public isIdeaBought(ideaCode: string): boolean {
        const key = `${this.currentStall.code}-${ideaCode}`;

        return this.boughtIdeas[key] && this.boughtIdeas[key].purchased;
    }

    public onBuyIdea(idea: Idea) {
        const loader = this.getLoader();
        loader.present();

        this.stallService.buyIdea({
            stallCode: this.currentStall.code,
            ideaCode: idea.code,
            details: {
                stallName: this.currentStall.name,
                ideaName: idea.name,
                desc: idea.description
            }
        }).then(async () => {
            await this.telemetryService.generateBuyIdeaTelemetry({
                dimensions: {
                    stallId: this.currentStall.code,
                    stallName: this.currentStall.name,
                    ideaId: idea.code,
                    ideaName: idea.name,
                },
                edata: {}
            })
        }).then(() => {
            loader.dismiss()
        })
    }

    public onStallSelect(stall: Stall) {
        if (stall.code !== "STA1") {
            const loader = this.getLoader();
            loader.present();
            this.stallService.getIdeas({code: stall.code}).then((data) => {
                this.currentStall = stall;
                this.ideasResponse = data;
            });
            loader.dismiss();
        } else {
            this.stallService.getIdeas({code: stall.code}).then((data) => {
                this.currentStall = stall;
                this.ideasResponse = data;
            });

        }

    }

    private async fetchStalls() {
        const loader = this.getLoader();
        loader.present();
        this.stalls = await this.stallService.getStalls({Stall: {}});
        loader.dismiss();
    }

    public onClickToAddFeedback(idea: Idea) {
        if (this.getRating(idea)) {
            return;
        }

        const popUp = this.popCtrl.create(RatingPopupComponent, {
            selectedStall: this.currentStall,
            selectedIdea: idea,
            cssClass: 'content-rating-alert'
        });
        popUp.present({
            ev: event
        });
    }

    public getRating(idea: Idea) {
        const key = `${this.currentStall.code}-${idea.code}`;
        console.log(key);

        if (this.boughtIdeas[key]) {
            console.log(this.boughtIdeas[key]);
            return this.boughtIdeas[key].rating;
        } else {
            return 0;
        }
    }

    private fetchBoughtIdeas() {
        this.boughtIdeasSubscription = this.stallService.getBoughtIdeas().subscribe((emit) => {
            this.boughtIdeas = emit;
        });
    }

    public getAvailableCoins(): any {
        const purchasedIdeas: number = Object.keys(this.boughtIdeas).length;
        return this.config.availableCoins - (purchasedIdeas * this.config.coinsPerIdea);
    }

    private getLoader(): Loading {
        return this.loadingCtrl.create({
            duration: 30000,
            spinner: 'crescent'
        });
    }
}
