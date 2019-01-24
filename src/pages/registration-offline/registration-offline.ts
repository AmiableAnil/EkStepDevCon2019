import { Component, Inject, NgZone } from '@angular/core';
import {
    NavController,
    PopoverController,
    Platform,
    ToastController,
    LoadingController, // Face API *****
    Loading
} from 'ionic-angular'; // Face API imports Platform, ToastController
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppPreferences } from '@ionic-native/app-preferences';
import { AppConfig } from '../../config/AppConfig';
import { UserService } from '../../services/user/user.service';
import { CreateUserResponse, GetUserResponse } from '../../services/user/response';
import { PreferenceKey } from '../../config/constants';
import { TabsPage } from '../tabs/tabs';
import { StallQRScanPage } from '../stall-qr-scan/stall-qr-scan.component';
import { TelemetryService } from '../../services/telemetry/telemetry-services';
import { ProfilePage } from '../profile/profile';

// Face API related imports *************
import { Camera, DestinationType, EncodingType, Direction } from '@ionic-native/camera';
import { Base64ToGallery } from '@ionic-native/base64-to-gallery';
import { Transfer, TransferObject } from '@ionic-native/transfer';
import { HTTP } from '@ionic-native/http';
import { StallSelectionPage } from '../stall-selection/stall-selection';

@Component({
    selector: 'page-registration-offline',
    templateUrl: 'registration-offline.html',
})
export class RegistrationOfflinePage {
    guestRegistrationForm: FormGroup;

    public orgList: string[] = [];
    private formCount: number = 0;
    private resetCountTimer: any;
    lastImage = null;
    devicePath: any;
    loading: any;

    constructor(private navCtrl: NavController,
        private formBuilder: FormBuilder,
        private appPreference: AppPreferences,
        public popoverCtrl: PopoverController,
        @Inject('APP_CONFIG') private config: AppConfig,
        @Inject('USER_SERVICE') private userService: UserService,
        @Inject('TELEMETRY_SERVICE') private telemetryService: TelemetryService,
        // Face API related injectors
        private camera: Camera,
        private platform: Platform,
        public base64ToGallery: Base64ToGallery,
        public toastCtrl: ToastController,
        private zone: NgZone,
        private http: HTTP,
        public loadingCtrl: LoadingController,
        private transfer: Transfer
    ) {
        this.orgList = this.config.orgList;
        this.guestRegistrationForm = this.formBuilder.group({
            visitCode: ['VIS', Validators.required],
            name: ['', Validators.required],
            org: ['', Validators.required]
        });
    }

    public async register() {
        const loader = await this.getLoader();
        await loader.present();
        const createUser = {
            Visitor: {
                code: this.guestRegistrationForm.get('visitCode').value,
                name: this.guestRegistrationForm.get('name').value,
                org: this.guestRegistrationForm.get('org').value,
            }
        };
        this.userService.updateUserProfile(createUser)
            .then(async (createUserResponse: CreateUserResponse) => {
                await this.appPreference.store(PreferenceKey.USER_CODE, createUserResponse.Visitor.code);
                await this.appPreference.store(PreferenceKey.USER_NAME, createUser.Visitor.name);
            })
            .then(() => {
                //     return this.navCtrl.setRoot(TabsPage);
                return this.telemetryService.generateRegisterTelemetry({
                    dimensions: {
                        visitorId: createUser.Visitor.code,
                        visitorName: createUser.Visitor.name
                    },
                    edata: {
                        mode: 'offline'
                    }
                });
            })
            // .then(() => {
            //     return this.appPreference.fetch(PreferenceKey.USER_CODE)
            //         .then((userCode: string) => this.userService.getUser({ code: userCode }))
            // })
            // .then(async (userResponse: GetUserResponse) => {
            //     this.uploadImage(createUser.Visitor.name); // Face APi call to upload file
            //     return this.telemetryService.generateRegisterTelemetry({
            //         dimensions: {
            //             visitorId: userResponse.Visitor.code,
            //             visitorName: userResponse.Visitor.name
            //         },
            //         edata: {
            //             mode: 'offline'
            //         }
            //     });
            // })
            .catch((e) => {
                console.error(e);
            })
        loader.dismiss();
    }

    onClickToNavigateToStallForm() {
        this.formCount++;
        if (this.formCount === 5) {
            clearTimeout(this.resetCountTimer);
            this.resetCountTimer = undefined;
            this.formCount = 0;

            const popover = this.popoverCtrl.create(ProfilePage);
            popover.present();

            popover.onDidDismiss(() => {
                this.navCtrl.push(StallSelectionPage, {});
            });
        }
        if (this.resetCountTimer) {
            clearTimeout(this.resetCountTimer);
            this.resetCountTimer = undefined;
        }
        this.resetCountTimer = setTimeout(() => {
            this.resetCountTimer = undefined;
            this.formCount = 0;
        }, 1000);
    }

    /// Face API changes **************
    public takePicture(confirmChange?: boolean) {

        if (confirmChange) {
            if (!confirm('Are you sure want to change your pic'))
                return false;
        }

        // Create options for the Camera Dialog
        var options = {
            quality: 40,
            sourceType: this.camera.PictureSourceType.CAMERA,
            saveToPhotoAlbum: false,
            correctOrientation: true,
            encodingType: EncodingType.JPEG,
            destinationType: DestinationType.DATA_URL,
            allowEdit: false,
            cameraDirection: Direction.BACK
        };

        this.loading = this.loadingCtrl.create({
            content: 'Uploading...',
        });
        this.loading.present();

        // Get the data of an image
        this.camera.getPicture(options).then((imagePath) => {
            // Special handling for Android library
            // if (this.platform.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
            // console.log('imagePath');
            // console.log(imagePath);
            // this.filePath.resolveNativePath(imagePath)
            // .then(filePath => {
            // let correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
            // let currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('?'));
            // this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
            // });
            // } else {
            this.zone.run(() => {
                this.lastImage = "data:image/png;base64," + imagePath;
                this.loading.dismissAll();
            });
            console.log("this.lastImage");
            console.log(this.lastImage);
            this.base64ToGallery.base64ToGallery(imagePath).then(
                res => {
                    this.devicePath = res;
                    console.log('Saved image to gallery ', res);
                    this.createFaceList();
                },
                err => console.log('Error saving image to gallery ', err)
            );
            // }
        }, (err) => {
            this.presentToast('Error while selecting image.');
            this.loading.dismissAll();
        });
    }

    private presentToast(text) {
        let toast = this.toastCtrl.create({
            message: text,
            duration: 3000,
            position: 'top'
        });
        toast.present();
    }
    private getLoader(): Loading {
        return this.loadingCtrl.create({
            duration: 30000,
            spinner: 'crescent'
        });
    }

    public getUploadURL(action, userName?): any {
        const faceListId = 'face-list-02';
        const listName = 'Tsting First List with FaceAPI';
        const user_name = userName || "User_Name";
        let body: any;
        let headers = {
            "Ocp-Apim-Subscription-Key": "8b90f80d68274ca1b3d48954d2e265d0"
        }
        let methodType: any = "post";
        let imgFilePath: any;
        let url: string = 'https://centralindia.api.cognitive.microsoft.com/face/v1.0/';
        switch (action) {
            case 'addFace':
                url = url + 'facelists/{faceListId}/persistedFaces?faceListId=' + faceListId + '&userData=' + user_name;
                imgFilePath = "file:///" + this.devicePath;
                headers["Content-Type"] = "application/octet-stream";
                break;
            case 'create':
                url = url + 'facelists/{faceListId}?faceListId=' + faceListId;
                body = {
                    name: listName
                };
                headers["Content-Type"] = "application/json";
                headers["Accept"] = "application/json";
                break;
            default:
                break;
        }
        return {
            url: url,
            body: body,
            methodType: methodType,
            headers: headers,
            imgFilePath: imgFilePath
        };

    }

    // Should be called only once for 1 faceListId
    public createFaceList() {
        var requestData = this.getUploadURL('create');
        console.log('request data');
        console.log(requestData);
        this.http.setDataSerializer('json');
        this.http.put(requestData.url, requestData.body, requestData.headers)
            .then(data => {

                console.log(data.status);
                console.log(data.data); // data received by server
                console.log(data.headers);

            })
            .catch(error => {

                console.log(error.status);
                console.log(error.error); // error message as string
                console.log(error.headers);

            });
    }

    public uploadImage(userName) {
        // Destination URL
        var requestData = this.getUploadURL('addFace', userName);
        console.log('URL: ', requestData.url);
        // File for Upload
        var targetPath = requestData.imgFilePath;
        console.log("target path", targetPath);

        // File name only
        var filename = "name_1020";

        var options = {
            fileKey: "file",
            fileName: filename,
            chunkedMode: false,
            mimeType: "application/octet-stream",
            params: requestData.params,
            headers: {
                "Content-Type": "application/octet-stream",
                "Ocp-Apim-Subscription-Key": "8b90f80d68274ca1b3d48954d2e265d0"
            }
        };

        console.log("options for upload");
        console.log(options);

        const fileTransfer: TransferObject = this.transfer.create();

        this.loading = this.loadingCtrl.create({
            content: 'Uploading...',
        });
        this.loading.present();

        // Use the FileTransfer to upload the image
        fileTransfer.upload(targetPath, requestData.url, options).then(data => {
            console.log('upload sucess');
            console.log(data);
            this.loading.dismissAll()
            this.presentToast('Image succesful uploaded.');
        }, err => {
            console.log('Upload error: ', err);
            this.loading.dismissAll()
            this.presentToast('Error while uploading file.');
        });
    }

    // ******************** Add after this block
    // *****************************************

}
