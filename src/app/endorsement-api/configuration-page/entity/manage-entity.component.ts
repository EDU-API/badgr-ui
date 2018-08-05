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
import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Badgr imports
import { BaseAuthenticatedRoutableComponent } from "../../../common/pages/base-authenticated-routable.component";
import { MessageService } from '../../../common/services/message.service';
import { SessionService } from '../../../common/services/session.service';
import { markControlsDirty } from "../../../common/util/form-util";
import { ValidanaBlockchainService } from '../../validana/validanaBlockchain.service';



/**
 * Interface for the input form fields and types
 */
interface inputFormControls<T> {
    publicKey: T;
    publicName: T;
}

@Component({
    selector: 'validana-manage-entity',
    templateUrl: './manage-entity.component.html'
})
export class ManageEntityComponent extends BaseAuthenticatedRoutableComponent implements OnInit {

    // Input Form element
    private inputForm: FormGroup;

    // Boolean that indicates if submit buttons in this component are enabled
    protected submitEnabled = true;

    // Current educational entitys
    // These are queried from the blockchain on component load
    private eduEntities: {
        addr: string,
        name: string,
        parent: string | undefined,
        withdrawn: boolean,
        type: string
    }[];

    /**
     * Create a new entity component
     * This component manages new and existing entitys on the blockchain
     * 
     * @param router Angular Router
     * @param route Angular Activated Route
     * @param sessionService Badgr Session Service
     * @param formBuilder Angular Form Builder
     * @param messageService Badgr Message Service
     * @param validanaService Validana Blockchain Service
     */
    constructor(
        router: Router,
		route: ActivatedRoute,
        sessionService: SessionService,
		protected formBuilder: FormBuilder,
		protected messageService: MessageService,
        protected validanaService: ValidanaBlockchainService) {
            super(router, route, sessionService);

            // Setup form elements for managing entitys
            this.inputForm = this.formBuilder.group({

                // Public address of entity
                publicKey: [ '', [
                    
                    // Entity public address field is required
                    Validators.required,

                    // Public address field should contain public address
                    this.regexValidator(/^[13][1-9A-HJ-NP-Za-km-z]{26,35}/)
                ]],

                // Public name of entity
                publicName: [ '', [

                    // Entity public name field is required
                    Validators.required
                ]]
            } as inputFormControls<any[]>);

    }

    /**
     * Callback method once component is initialized
     */
    ngOnInit() {

        // Obtain educational entitys on the blockchain
        this.obtainEduEntitys();
    }

    /**
     * Submit the form
     * @param formState The form state to submit
     */
	protected submitForm(formState: inputFormControls<string>) {

        // Disable submit button in UI
        this.submitEnabled = false;
        
        // Obtain input public address and public name
        const pubKey = formState.publicKey;
        const pubName = formState.publicName;

        // Clear form for next input
        this.inputForm.controls.publicKey.reset();
        this.inputForm.controls.publicName.reset();

        // Show message to the user
        // ( Use setTimeout for Badgr async message bug )
        setTimeout(() => {
        this.messageService.reportMajorSuccess(
            'Your request to add '+pubName+' has been send to the blockhain.'
        ); } , 0);

        // Send educational entity information to the blockchain
        this.validanaService.setEducationalEntity(pubKey,pubName,true).then(() => {

            // Show message with success to user
            this.messageService.reportMajorSuccess(
                'Educational entity was accepted by the blockchain processor'
            );

            // Update list of educational entitys
            this.obtainEduEntitys();

            // Re-enable submit buttons
            this.submitEnabled = true;
        
        // Transaction could not be processed, something went wrong
        }).catch(() => {

            // Edu entity could not be added
            this.messageService.reportHandledError(
                'Entity could not be added to the blockchain. Please check your private key',
                undefined, true
            );

            // Re-enable submit buttons
            this.submitEnabled = true;
        });
    }

    /**
     * Obtain string indicating the withdrawn state of the entity
     * @param entity The entity to display the withdrawn state for
     */
    protected getEntityStatus(entity:any):string {
        if(this.validanaService.getLastKnownWithdrawn() === true) {
            return 'Disabled (Institute is withdrawn)';
        } else {
            return entity.withdrawn? 'Withdrawn' : 'Active';
        }
    }

    /**
     * Query the blockchian for currently active educational entitys
     */
    protected obtainEduEntitys() {

        // Query the Validana blockchain for institution addresses
        this.validanaService.query('entities', this.validanaService.getAddress() )
        .then((addresses:string[]) => {
            if( addresses ) {

                // Query the Validana blockchain for institution information
                this.validanaService.query('addrInfo', addresses).then((info:any[]) => {

                    // Store entity information
                    this.eduEntities = info;
                });
            }
        });
    }

    /**
     * Set the withdrawn state for an entity
     * @param entity The entity to update the withdrawn state for
     * @param isWithdrawn The new state for the entity
     */
    protected setWithdrawState(entity:{addr:string, name:string},isWithdrawn:boolean) {

        // Set UI button state
        this.submitEnabled = false;      
        
        this.validanaService.setEducationalEntity(entity.addr, entity.name, !isWithdrawn).then(() => {
            
            // Show message to user
            this.messageService.reportMajorSuccess(
                'Educational entity status updated on blockchain.'
            );

            // Update list of educational entitys
            this.obtainEduEntitys();

            // Set UI button state
            this.submitEnabled = true; 

        }).catch(() => {

            // Edu entity could not be added
            this.messageService.reportHandledError(
                'Could not update status of educational entity.',
                undefined, true
            );

            // Set UI button state
            this.submitEnabled = true; 
        });      
    }

    /**
     * Custom validator based on regular expressions
     * @param checkRE The regex to check the input against
     */
    protected regexValidator(checkRE: RegExp): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} => {
          const accepted = checkRE.test(control.value);
          return accepted ? null : {'regex': {value: control.value}} ;
        };
    }
    
    /**
     * Validate The input form
     */
	protected validateInputForm(ev) {
		if (! this.inputForm.valid) {
			ev.preventDefault();
			markControlsDirty(this.inputForm);
		}
    }

}