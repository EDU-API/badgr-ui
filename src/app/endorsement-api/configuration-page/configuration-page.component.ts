/**
 * @license
 * Copyright Coinversable B.V. All Rights Reserved.
 *
 * Use of this source code is governed by a AGPLv3-style license that can be
 * found in the LICENSE file at https://coinversable.com/agplv3-license/
 * 
 * For more information about the Validana blockchain visit 
 * https://validana.io
 */

// Angular imports
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from '@angular/router';

// Badgr imports
import { BaseAuthenticatedRoutableComponent } from "../../common/pages/base-authenticated-routable.component";
import { SessionService } from '../../common/services/session.service';

// Blockchain imports
import { ValidanaBlockchainService } from '../validana/validanaBlockchain.service';


@Component({
    selector: 'validana-configuration-page',
    templateUrl: './configuration-page.component.html',
    styles: [
        'h2 { margin-top: 20px; margin-bottom: 15px; }',
        'form { margin-top: 20px; }',
        'p { margin-top: 10px; }',
        '.validana-footer { display: block; text-align: center; font-size: 12px; margin-bottom: 16px; }',
        'table { overflow-x: auto !important; display: block !important; }',
        'button[disabled] { background-color: #998d8e !important; }'],
    encapsulation: ViewEncapsulation.None
})
export class ConfigurationPage extends BaseAuthenticatedRoutableComponent implements OnInit {

    // Private key (WIF) input form element
    public wifEditForm: FormGroup;

    // Educational insitute input form element
    public eduEditForm: FormGroup;

    // Current educational institutes
    public eduInstitutes: {
        addr: string,
        name: string,
        parent: string | undefined,
        withdrawn: boolean,
        type: string
    }[];

    // Public address of the user (calculated if private key is set)
    public publicAddress: string;

    // Name associated with this public address (if known on blockchain)
    public publicName: string;

    // Role associated with this public address (if known on blockchain)
    public publicRole: string;

    // Are submitbuttons enabled?
    public btnsEnabled = true;

    /**
     * Create new blockchain configuration page
     * @param router The angular router
     * @param route The angular route
     * @param sessionService Badgr session service
     * @param validanaService Validana blockchain service
     * @param title Badgr title service
     */
    constructor(
        public router: Router,
		public route: ActivatedRoute,
        public sessionService: SessionService,
        public validanaService: ValidanaBlockchainService,        
		public title: Title) {
            super(router, route, sessionService);

            // Set page title
            title.setTitle("Blockchain Configuration - Badgr");

    }

}