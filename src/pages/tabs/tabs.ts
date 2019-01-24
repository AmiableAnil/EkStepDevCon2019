import { UserIdeasPage } from './../user-ideas/user-ideas';
import { AboutAppuPage } from './../about-appu/about-appu';
import {Component} from '@angular/core';
import {HomePage} from '../home/home';
import { StallListPage } from '../stall-list/stall-list';

@Component({
    selector: 'page-tabs',
    templateUrl: 'tabs.html',
})
export class TabsPage {

    public homePage = HomePage;
    // public aboutAppuPage = AboutAppuPage;
    public userIdeaPage  = StallListPage; 
    constructor() {
    }

    ionViewDidLoad() {
    }
}
