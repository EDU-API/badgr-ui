import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { EmailValidator } from "../common/validators/email.validator";
import { MessageService } from "../common/services/message.service";
import { SessionService } from "../common/services/session.service";
import { Title } from "@angular/platform-browser";
import { markControlsDirty } from "../common/util/form-util";

import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { BadgrApiFailure } from "../common/services/api-failure";
import {
	SocialAccountProviderInfo, ApiUserProfile, ApiUserProfileEmail,
	ApiUserProfileSocialAccount,
	socialAccountProviderInfoForSlug,
} from "../common/model/user-profile-api.model";
import { UserProfileManager } from "../common/services/user-profile-manager.service";
import { UserProfile, UserProfileEmail, UserProfileSocialAccount } from "../common/model/user-profile.model";
import { Subscription } from "rxjs/Subscription";
import { QueryParametersService } from "../common/services/query-parameters.service";

@Component({
	selector: 'userProfile',
	template: `
		<main *bgAwaitPromises="[profileLoaded, emailsLoaded]">
			<form-message></form-message>

			<header class="wrap wrap-light l-containerhorizontal l-heading">
				<nav>
					<h1 class="visuallyhidden">Breadcrumbs</h1>
					<ul class="breadcrumb">
						<li class="breadcrumb-x-current">Profile</li>
					</ul>
				</nav>

				<div class="heading">
					<div class="heading-x-text">
						<h1>
							{{ profile?.firstName }} {{ profile?.lastName}}
							<button class="heading-x-edit"
							        type="button"
							        [routerLink]="['/profile/edit']"
							>Edit
							</button>
						</h1>
					</div>
					<div class="heading-x-actions">
						<a [routerLink]="['../change-password']" class="button button-major">Change Password</a>
					</div>
				</div>
			</header>


			<div class="l-containerhorizontal l-containervertical l-childrenvertical wrap">

				<div class="l-childrenvertical l-headeredsection">
					<!-- Email Table -->
					<header>
						<h2 class="title title-is-smallmobile">Emails</h2>
					</header>
					<div class="table">
						<!-- table header -->
						<div class="table-x-thead">
							<div class="table-x-tr">
								<div class="table-x-th">Email Address</div>
								<div class="table-x-th">Status</div>
								<div class="table-x-th hidden hidden-is-desktop"><span class="visuallyhidden">Actions</span></div>
								<!-- Additional header for menu more column-->
								<div class="table-x-th hidden hidden-is-lessThen-desktop" scope="row">&nbsp;</div>
							</div>
						</div>
						<!-- End table header -->

						<!-- table body -->
						<div class="table-x-tbody hidden hidden-is-tablet">
							<form class="table-x-tr table-x-active"
							      [formGroup]="emailForm"
							      (ngSubmit)="onSubmit(emailForm.value)">

								<div class="table-x-th " scope="row">
									<div class="formfield l-childrenhorizontal">
										<bg-formfield-text [control]="emailForm.controls.email"
										                   [errorMessage]="'Please enter a valid email address'"
										                   placeholder="Member Email">
										</bg-formfield-text>
									</div>
								</div>

								<div class="table-x-td hidden hidden-is-desktop">&nbsp;</div>
								<!-- Additional header for menu more column-->
								<div class="table-x-th hidden hidden-is-lessThen-desktop" scope="row">&nbsp;</div>

								<div class="table-x-td">
									<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-right">
										<button type="submit"
										        class="button"
										        (click)="clickAddEmail($event)"
										        [disabled-when-requesting]="true">
											Add Email
										</button>
									</div>
								</div>
							</form>
						</div>
						<!-- end FORM -->

						<!-- table body -->
						<div class="table-x-tbody">
							<div class="table-x-tr" *ngFor="let email of emails">
								<div class="table-x-th" scope="row" [ngSwitch]="email.verified">
									<div class="l-childrenhorizontal">
										<span>{{ email.email }}</span> <span class="state state-pill state-is-pending"
										                                     *ngIf="email.primary">Primary</span>
									</div>
								</div>
								<div class="table-x-td">
									<div class="l-childrenhorizontal">
										<span *ngIf="email.verified">Verified</span>
										<span *ngIf="!email.verified">Pending</span>
									</div>
								</div>

								<div class="table-x-td table-x-actions hidden hidden-is-desktop">
									<div class="l-childrenhorizontal l-childrenhorizontal-right l-childrenhorizontal-stackmobile">
										<button class="button button-primaryghost"
										        [class.button-is-disabled]="email.primary"
										        (click)="clickConfirmRemove($event, email)"
										        [disabled-when-requesting]="true"
										>
											Remove
										</button>
										<button *ngIf="email.verified && !email.primary"
										        class="button button-primaryghost"
										        (click)="clickMakePrimary($event, email)"
										        [disabled-when-requesting]="true"
										>
											Make primary
										</button>
										<button *ngIf="!email.verified"
										        class="button button-primaryghost"
										        (click)="clickResendVerification($event, email)"
										        [disabled-when-requesting]="true"
										>
											Re-send Verification
										</button>
									</div>
								</div>

								<!-- -->
								<div class="table-x-td  pathwaydetail-x-menu menumore hidden hidden-is-lessThen-desktop"
								     [class.menumore-is-active]="menu.show"
								     [class.pathwaydetail-x-inactive]="isMoveInProgress"
								     #menu
								     (document:click)="(menu.clickedState ? (menu.clickedState = false) : (menu.show = false)) || true">

									<!-- TODO: Above is an awesome hack that hides the menu when clicking on the document... might want to replace with something more stable. -->
									<button type="button"
									        aria-controls="menumore1"
									        (click)="menu.show = ! menu.show;
								            menu.clickedState = menu.show;"
									>Toggle Menu
									</button>

									<ul [attr.aria-hidden]="! menu.show"
									    (click)="menu.show = false"
									>
										<li class="menumoreitem"
										    *ngIf="! isMoveInProgress"
										>
											<button aria-controls="menumore1"
											        class="button button-primaryghost"
											        [class.button-is-disabled]="email.primary"
											        (click)="clickConfirmRemove($event, email)"
											        [disabled-when-requesting]="true"
											>Remove
											</button>
										</li>
										<li class="menumoreitem">
											<button *ngIf="email.verified && !email.primary"
											        class="button button-primaryghost"
											        (click)="clickMakePrimary($event, email)"
											>Make primary
											</button>
										</li>
										<li class="menumoreitem">
											<button *ngIf="!email.verified"
											        class="button button-primaryghost"
											        (click)="clickResendVerification($event, email)"
											        [disabled-when-requesting]="true"
											>Re-send Verification
											</button>
										</li>
									</ul>
								</div>
								<!-- -->
							</div>
						</div>
						<!-- table body -->
					</div>

					<!-- Social Account Table -->
					<header>
						<h2 class="title title-is-smallmobile">Linked Accounts</h2>
					</header>
					<p *ngIf="socialAccounts.length == 0">
						Click one of the provider buttons below to allow you to log in to Badgr in the future using that service
						rather than your email and password.
					</p>
					<table class="table">
						<thead *ngIf="socialAccounts.length > 0">
							<tr>
								<th>Service</th>
								<th>Account</th>
								<th class="hidden hidden-is-desktop"><span class="visuallyhidden">Actions</span></th>
							</tr>
						</thead>

						<tbody>
							<tr *ngFor="let account of socialAccounts">
								<td class="l-childrenhorizontal table-x-actions">
									{{ account.providerInfo.name }}
								</td>
								<td class="l-childrenhorizontal table-x-actions">
									{{ account.fullLabel }}
								</td>
								<td>
									<div class="l-childrenhorizontal l-childrenhorizontal-right l-childrenhorizontal-stackmobile">
										<button class="button button-primaryghost"
										        (click)="unlinkAccount(account)"
										        [disabled-when-requesting]="true"
										>Unlink
										</button>
									</div>
								</td>
							</tr>
						</tbody>

						<tbody class="hidden hidden-is-tablet" *ngIf="sessionService.enabledExternalAuthProviders.length > 0">
							<td class="table-x-td" colspan="3">
								<section class="formfield">
									<label>Link an Account</label>

									<div class="formfield-x-buttongrid">
										<button *ngFor="let provider of sessionService.enabledExternalAuthProviders"
										        class="buttonauth buttonauth-{{ provider.slug }}"
										        type="button"
										        (click)="linkAccount(provider)"
										>{{ provider.name }}
										</button>
									</div>
								</section>
							</td>
						</tbody>
					</table>
				</div>
			</div>
		</main>
	`
})
export class ProfileComponent extends BaseAuthenticatedRoutableComponent implements OnInit, OnDestroy {
	emailForm: FormGroup;
	profile: UserProfile;
	emails: UserProfileEmail[];

	profileLoaded: Promise<any>;
	emailsLoaded: Promise<any>;

	newlyAddedSocialAccountId: string;

	private emailsSubscription: Subscription;

	constructor(
		router: Router,
		route: ActivatedRoute,
		sessionService: SessionService,
		protected formBuilder: FormBuilder,
		protected title: Title,
		protected messageService: MessageService,
		protected profileManager: UserProfileManager,
		protected dialogService: CommonDialogsService,
		protected paramService: QueryParametersService
) {
		super(router, route, sessionService);
		title.setTitle("Profile - Badgr");

		this.emailForm = this.formBuilder.group({
			'email': [
				'',
				Validators.compose([
					Validators.required,
					EmailValidator.validEmail
				])
			]
		});

		this.profileLoaded = this.profileManager.userProfilePromise.then(
			profile => {
				this.profile = profile;

				this.emailsSubscription = profile.emails.loaded$.subscribe(update => {
					const emails = profile.emails.entities;

					this.emails = emails.filter((e) => e.primary).concat(
						emails.filter((e) => e.verified && !e.primary).concat(
							emails.filter((e) => !e.verified)
						)
					);
				});
			},
			error => this.messageService.reportAndThrowError(
				"Failed to load userProfile", error
			)
		);

		this.emailsLoaded = this.profileManager.userProfilePromise
			.then(p => p.emails.loadedPromise);

		// Handle newly added social account
		this.newlyAddedSocialAccountId = paramService.queryStringValue("addedSocialAccountId", true);
	}

	get socialAccounts() {
		return this.profile && this.profile.socialAccounts.entities;
	}

	ngOnInit() {
		super.ngOnInit();

		// Handle auth errors (e.g. when linking a new social account)
		if (this.paramService.queryStringValue("authError", true)) {
			this.messageService.reportHandledError(this.paramService.queryStringValue("authError", true), null, true);
		}
		this.paramService.clearInitialQueryParams();
	}

	ngOnDestroy(): void {
		this.emailsSubscription.unsubscribe();
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Linked Accounts

	async unlinkAccount(socialAccount: UserProfileSocialAccount) {
		if (await this.dialogService.confirmDialog.openTrueFalseDialog({
			dialogTitle: `Unlink ${socialAccount.providerInfo.name}?`,
			dialogBody: `Are you sure you want to unlink the ${socialAccount.providerInfo.name} account ${socialAccount.fullLabel}) from your Badgr account? You may re-link in the future by clicking the ${socialAccount.providerInfo.name} button on this page.`,
			resolveButtonLabel: `Unlink ${socialAccount.providerInfo.name} account?`,
			rejectButtonLabel: "Cancel"
		})) {
			socialAccount.remove().then(
				() => this.messageService.reportMinorSuccess(`Removed ${socialAccount.fullLabel} from your account`),
				error => this.messageService.reportHandledError(`Failed to remove ${socialAccount.fullLabel} from your account: ${BadgrApiFailure.from(error).firstMessage}`),
			);
		}
	}

	linkAccount(info: SocialAccountProviderInfo) {
		this.sessionService.initiateAuthenticatedExternalAuth(info);
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Emails

	onSubmit(formState) {
		this.profile.addEmail(formState.email).then(
			email => {
				this.messageService.setMessage("New email is currently pending.", "success");
				const emailControl: FormControl = <FormControl>this.emailForm.controls[ 'email' ];

				emailControl.setValue('', { emitEvent: false });
				emailControl.setErrors(null, { emitEvent: false });
			},
			error => {
				this.messageService.reportHandledError(`Unable to add email: ${BadgrApiFailure.from(error).firstMessage}`);
			}
		);
	}

	clickAddEmail(ev: MouseEvent) {
		if (!this.emailForm.valid) {
			ev.preventDefault();
			markControlsDirty(this.emailForm);
		}
	}

	//initialed displayed remove button.
	clickConfirmRemove(ev: MouseEvent, email: UserProfileEmail) {
		if (email.primary) {
			ev.preventDefault();
		} else {
			this.dialogService.confirmDialog.openResolveRejectDialog({
				dialogTitle: "Delete Email",
				dialogBody: `All badges associated with this email address will be removed. Are you sure you want to delete email ${email.email}`,
				resolveButtonLabel: "Confirm remove",
				rejectButtonLabel: "Cancel"
			}).then(
				() => this.clickRemove(ev, email), //success - clicked confirm
				cancel => void 0 //fail - clicked cancel
			);
		}
	}

	clickRemove(ev: MouseEvent, email: UserProfileEmail) {
		email.remove().then(
			() => this.messageService.reportMinorSuccess(`You have successfully removed ${email.email}`),
			error => this.messageService.reportHandledError(`Unable to remove ${email.email}: ${BadgrApiFailure.from(error).firstMessage}`, error)
		);
	}

	clickMakePrimary(ev: MouseEvent, email: UserProfileEmail) {
		email.makePrimary().then(
			() => this.messageService.reportMajorSuccess(`${email.email} is now your primary email.`),
			error => this.messageService.reportAndThrowError(`Unable to set ${email.email} to primary email: ${BadgrApiFailure.from(error).firstMessage}`, error)
		);
	}

	clickResendVerification(ev: MouseEvent, email: UserProfileEmail) {
		email.resendVerificationEmail().then(
			() => this.messageService.reportMajorSuccess(`Confirmation re-sent to ${email.email}`),
			error => {
				if (error.response.status == 429){
					this.messageService.reportAndThrowError(`Failed to resend confirmation to ${email.email}: ${error.response._body}`, error);
				}
				else {
					this.messageService.reportAndThrowError(`Failed to resend confirmation to ${email.email}: ${BadgrApiFailure.from(error).firstMessage}`, error);
				}
			}
		);
	}
}
