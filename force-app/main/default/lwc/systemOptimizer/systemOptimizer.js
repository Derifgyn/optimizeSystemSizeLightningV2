/* eslint-disable array-callback-return */
/* eslint-disable no-else-return */
/* eslint-disable no-console */
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'

import getPVModules from '@salesforce/apex/SystemOptimizerController.getPVModules';
import getAllowedArrays from '@salesforce/apex/SystemOptimizerController.getAllowedArrays';
import getOpportunityFields from '@salesforce/apex/SystemOptimizerController.getOpportunityFields';
import createOrUpdatePvSystem from '@salesforce/apex/SystemOptimizerController.createOrUpdatePvSystem';
import createPvArray from '@salesforce/apex/SystemOptimizerController.createPvArray';

// import updateOpportunity from '@salesforce/apex/SystemOptimizerController.updateOpportunity';

// import ARRAY_1__C from '@salesforce/schema/Opportunity.Array_1__c';
// import ARRAY_2__C from '@salesforce/schema/Opportunity.Array_2__c';
// import ARRAY_3__C from '@salesforce/schema/Opportunity.Array_3__c';
// import ARRAY_4__C from '@salesforce/schema/Opportunity.Array_4__c';
        
// import ARRAY_1_NUMBER_OF_PANELS__C from '@salesforce/schema/Opportunity.Array_1_Number_of_Panels__c';
// import ARRAY_2_NUMBER_OF_PANELS__C from '@salesforce/schema/Opportunity.Array_2_Number_of_Panels__c';
// import ARRAY_3_NUMBER_OF_PANELS__C from '@salesforce/schema/Opportunity.Array_3_Number_of_Panels__c';
// import ARRAY_4_NUMBER_OF_PANELS__C from '@salesforce/schema/Opportunity.Array_4_Number_of_Panels__c';
        
// import ARRAY_1_TSRF_INPUT__C from '@salesforce/schema/Opportunity.Array_1_TSRF_Input__c';
// import ARRAY_2_TSRF_INPUT__C from '@salesforce/schema/Opportunity.Array_2_TSRF_Input__c';
// import ARRAY_3_TSRF_INPUT__C from '@salesforce/schema/Opportunity.Array_3_TSRF_Input__c';
// import ARRAY_4_TSRF_INPUT__C from '@salesforce/schema/Opportunity.Array_4_TSRF_Input__c';
        
// import PRODUCTION_FACTOR__C from '@salesforce/schema/Opportunity.Production_Factor__c';
// import PROPOSED_WEIGHTED_TSRF__C from '@salesforce/schema/Opportunity.Proposed_Weighted_TSRF__c';
// import PF_REGIONAL_ADJUSTMENT__C from '@salesforce/schema/Opportunity.PF_Regional_Adjustment__c';
// import DESIRED_OFFSET__C from '@salesforce/schema/Opportunity.Desired_Offset__c';
// import USAGE__C from '@salesforce/schema/Opportunity.Usage__c';
// import REGIONAL_WEIGHTED_TSRF_FLOOR__C from '@salesforce/schema/Opportunity.Regional_Weighted_TSRF_Floor__c';
// import EQUIPMENT_SELECTION__C from '@salesforce/schema/Opportunity.Equipment_Selection__c';

import ACCOUNTID from '@salesforce/schema/Quote.AccountId';
import OPPORTUNITYID from '@salesforce/schema/Quote.OpportunityId';

import PV_MODULES__C from '@salesforce/schema/PV_System__c.PV_Modules__c';
import QUOTE__C from '@salesforce/schema/PV_System__c.Quote__c';
import PARENT__ACCOUNT__C from '@salesforce/schema/PV_System__c.Parent_Account__c';

import ARRAY_SIZE__C from '@salesforce/schema/PV_Array__c.Array_Size__c';
import NUMBER_OF_PANELS__C from '@salesforce/schema/PV_Array__c.Number_of_Panels__c';
import SELECTED_EQUIPMENT__C from '@salesforce/schema/PV_Array__c.Selected_Equipment__c';
import TSRF__C from '@salesforce/schema/PV_Array__c.TSRF__c';
import PV_SYSTEM__C from '@salesforce/schema/PV_Array__c.PV_System__c';

export default class SystemOptimizer extends LightningElement {
    @track quote;
    @track allowedArrays;
    @track opportunity;
    
    @track pvModules;
    @track selectedPVModule;
    
    @track proposedOffset;

    @track maxNumArrays;
    @track maxNumPanels;
    @track currentNumPanels;

    @track error = false;
    @track generatingProposal = false;
    
    @track validProposal = false;
    @track invalidProposal = true;

    @track notCalcedProposal = true;

    @api recordId;

    @wire(
        getRecord,
        {
            recordId: '$recordId',
            fields: [
                ACCOUNTID,
                OPPORTUNITYID
                // PRODUCTION_FACTOR__C,
                // PROPOSED_WEIGHTED_TSRF__C,
                // PF_REGIONAL_ADJUSTMENT__C,
                // DESIRED_OFFSET__C,
                // USAGE__C,
                // REGIONAL_WEIGHTED_TSRF_FLOOR__C,
                // EQUIPMENT_SELECTION__C
            ]
        }
    )
    getQuote({error, data}) {
        if (data) {
            this.quote = {};
            Object.keys(data.fields).map((v, k) => {
                this.quote[v] = data.fields[v].value;
            });

            console.log('converted quote');
            console.log(JSON.stringify(this.quote, undefined, 2));

            this.proposedOffset = 0;
            this.maxNumArrays = 4;
            this.maxNumPanels = 0;
            this.currentNumPanels = 0;
            this.proposedOffset = {
                proposedOffset: 0,
                pvArrays: undefined,
                weightedTSRF: 0
            };

            // get related objects
            this.getAllowedArrays(this.quote.AccountId);
            this.getOpportunityFields(this.quote.OpportunityId);
        } else if (error) {
            console.log('Error getting quote data:');
            console.log(JSON.stringify(error, undefined, 2));
        }
    }

    @wire(
        getPVModules
    )
    getPVModules({error, data}) {
        if (data) {
            this.pvModulesLoaded = true;
            this.pvModules = data.map(pvModule => {
                return {
                    ...pvModule,
                    label: pvModule.Name,
                    value: pvModule.Id
                }
            });
        } else if (error) {
            console.log('Error getting pv module data:');
            console.log(JSON.stringify(error, undefined, 2));
        }
    }

    getOpportunityFields(opportunityId) {
        getOpportunityFields({
            opportunityId: opportunityId
        })
            .then(data => {
                console.log('got opportunity fields:');
                console.log(JSON.stringify(data));
                this.opportunity = data;
                this.template.querySelector(".totalUsage").value = this.opportunity.Usage__c;
                this.template.querySelector(".desiredOffset").value = this.opportunity.Desired_Offset__c;
            })
            .catch(error => {
                console.log('got error');
                this.error = true;
            });
    }
    
    getAllowedArrays(accountId) {
        getAllowedArrays({
            accountId: accountId
        })
            .then(data => {
                console.log('got allowed arrays:');
                console.log(JSON.stringify(data));
                this.allowedArrays = data;
                console.log('reducing allowed arrays');
                this.currentNumPanels = this.maxNumPanels = this.allowedArrays.reduce((a, b) => { return a + b.Number_of_Panels__c}, 0);
                console.log('reduced allowed arrays, this.currentNumPanels:');
                console.log(this.currentNumPanels);
            })
            .catch(error => {
                console.log('got error');
                this.error = true;
            });
    }

    handlePVModuleSelect(event) {
        console.log('handlePVModuleSelect');
        this.selectedPVModule = this.pvModules.find(pvArray => pvArray.Id === event.detail.value);
        this.template.querySelector('.equipmentSelection').value = event.detail.value;
        
        console.log(JSON.stringify(this.selectedPVModule, undefined, 2));
    }

    // Perform input validity check before offset generation, and show relevant messages
    checkInputValid() {
        let valid = true;

        console.log('totalUsage:', this.template.querySelector(".totalUsage").value);
        console.log('desiredOffset:', this.template.querySelector(".desiredOffset").value);

        this.totalUsage = this.template.querySelector(".totalUsage").value;
        this.desiredOffset = this.template.querySelector(".desiredOffset").value;

        if (!this.totalUsage || this.totalUsage < 0) {
            // Show error
            this.showToast('error', 'Total usage value needs to be greater than 0');
            valid = false;
        }

        if (!this.desiredOffset || this.desiredOffset <= 0) {
            // Show error
            this.showToast('error', 'Desired offset value needs to be between 0 and 100');
            valid = false;
        }

        if (this.desiredOffset > 110) {
            // Show warning
            this.showToast('warning', 'Desired offset > 100%, please make sure your entry is correct');
        }

        if (this.selectedPVModule == undefined || this.selectedPVModule.Name == '') {
            // Show error
            this.showToast('error', 'Equipment Selection needs to be chosen');
            valid = false;
        }

        if (valid) {
            // let inactivePVArrays = 0;
            let invalidTSRFValue = false;

            console.log(JSON.stringify('this.proposedOffsetObj.pvArrays', undefined, 2));
            console.log(JSON.stringify(this.proposedOffsetObj.pvArrays, undefined, 2));

            // this.proposedOffsetObj.pvArrays
            //     .map(pvArray => {
            //         if (pvArray.numberOfPanels > 0 && (pvArray.TSRF__c <= 0 || pvArray.TSRF__c > 100 || pvArray.TSRF__c === undefined)) {
            //             invalidTSRFValue = true;
            //         }
            //     });

            // if (inactivePVArrays > this.maxNumArrays) {
            //     // Show error
            //     this.showToast('error', 'No active arrays, please set at least one array to active with 1 or more panels');
            //     valid = false;
            // }

            if (invalidTSRFValue) {
                // Show error
                this.showToast('error', 'One or more arrays has an invalid TSRF value, must be between 0 and 100');
                valid = false;
            }
        }

        return valid;
    }

    // Perform proposed offset check before returning, and show relevant messages
    checkProposedOffsetValid() {
        if (this.proposedOffsetObj.proposedOffset == -1) {
            // Show error
            this.showToast('error', 'Desired offset could not be matched, please reconfigure and try again');
            return false;
        }

        if (this.proposedOffsetObj.weightedTSRF < this.opportunity.Regional_Weighted_TSRF_Floor__c) {
            // Show warning
            this.showToast('warning', `Warning, Weighted TSRF of ${this.proposedOffsetObj.weightedTSRF * 100} is below threshold of ${this.opportunity.Regional_Weighted_TSRF_Floor__c}`);
        }

        return true;
    }

    generateProposal() {
        console.log('generating proposal');
        console.log('this.allowedArrays');
        console.log(JSON.stringify(this.allowedArrays, 0, 2));
        this.notCalcedProposal = false;
        this.generatingProposal = true;
        this.proposedOffsetObj = {
            proposedOffset: 0,
            pvArrays: JSON.parse(JSON.stringify(this.allowedArrays)),
            weightedTSRF: 0
        };

        if (this.checkInputValid()) {
            console.log(JSON.stringify('input valid', 0, 2));
            console.log('this.totalUsage:', this.totalUsage);

            this.proposedOffsetObj = this.generateProposedOffset(0, this.proposedOffsetObj); 

            this.validProposal = this.checkProposedOffsetValid();
            this.invalidProposal = !this.validProposal;
        }

        this.generatingProposal = false;
    }

    generateProposedOffset(attemptNum, lpoToBeCopied) {
        console.log('---------------------------');
        console.log('generating proposed offset, attempt num:', attemptNum);

        let lastProposedOffsetObj = Object.assign({}, lpoToBeCopied);
        let totalProduction = 0;
        let proposedOffset = 0;
        let weightedTSRF = 0;
        let panelRemoved = false;

        // let pvArrays = lpoToBeCopied.pvArrays.filter(pvArray => pvArray.active == 'Yes' && pvArray.numberOfPanels > 0);
        let pvArrays = lpoToBeCopied.pvArrays;
        console.log('pvArraysLength:', pvArrays.length);
        console.log('this.opportunity.Production_Factor__c:', this.opportunity.Production_Factor__c)
        console.log('this.currentNumPanels: ', this.currentNumPanels);

        pvArrays
            .forEach(pvArray => {
                if (attemptNum > 0 && panelRemoved !== true && pvArray.Number_of_Panels__c - 1 >= 0) {
                    console.log(`removing panel from array with ${pvArray.TSRF__c} TSRF`);
                    pvArray.Number_of_Panels__c -= 1;
                    this.currentNumPanels -= 1;
                    panelRemoved = true;
                }

                // calc array tsrf prod factor
                let tsrfProductionFactor = (this.opportunity.Production_Factor__c * pvArray.TSRF__c) - this.opportunity.PF_Regional_Adjustment__c;

                // multiply tsrf prod factor by module wattage and array num panels, add to sum
                totalProduction += pvArray.Number_of_Panels__c * this.selectedPVModule.Wattage__c * tsrfProductionFactor;

                // multiply array tsrf by array number of panels, add to sum
                weightedTSRF += pvArray.TSRF__c * pvArray.Number_of_Panels__c;
            });

        // calc avg of weighted tsrf sum
        weightedTSRF = this.currentNumPanels > 0 ? weightedTSRF / this.currentNumPanels : 0;
        // divide calculated total prod by user input total usage
        proposedOffset = totalProduction / this.totalUsage;
        console.log('totalProduction:', totalProduction);
        console.log('this.totalUsage:', this.totalUsage);
        console.log('proposedOffset:', proposedOffset, ' = ', totalProduction, ' / ', this.totalUsage);

        if (attemptNum >= this.maxNumPanels) {
            return {
                proposedOffset: -1,
                pvArrays,
                weightedTSRF: -1
            };
        } else if (proposedOffset <= (this.desiredOffset / 100)) {
            let lessThanProposedOffsetVariance = Math.abs((this.desiredOffset / 100) - proposedOffset);
            let moreThanProposedOffsetVariance = Math.abs(lastProposedOffsetObj.proposedOffset - (this.desiredOffset / 100));

            return lessThanProposedOffsetVariance <= moreThanProposedOffsetVariance ? 
                {
                    proposedOffset,
                    pvArrays,
                    weightedTSRF
                } :
                lastProposedOffsetObj;
        } else {
            return this.generateProposedOffset(attemptNum + 1, {
                proposedOffset,
                pvArrays,
                weightedTSRF
            });
        }
    }

    save() {
        console.log('save kicked off');
        if (this.validProposal) {


            /**
             * create new pv system or update existing pv system with:
             *  - Selected equipment
             *  - Quote Id
             * for each pv array in proposed offset, create PV Array or update existing pv arrays with:
             *  - annual production
             *  - array size (wattage?)
             *  - number of panels
             *  - selected equipment
             *  - PV System Id
             *  - TSRF
             **/ 
            
            
            const pvSystemFields = {};
            pvSystemFields[PV_MODULES__C.fieldApiName] = this.selectedPVModule.Id;
            pvSystemFields[QUOTE__C.fieldApiName] = this.recordId;
            pvSystemFields[PARENT__ACCOUNT__C .fieldApiName] = this.quote.AccountId;

            createOrUpdatePvSystem({
                quoteId: this.recordId,
                changes: pvSystemFields
            })
                .then(pvSystemId => {
                    this.showToast('success', 'Successfully saved pv system');

                    this.proposedOffset.pvArrays.forEach(pvArray => {
                        const pvArrayFields = {};
                        pvArrayFields[ARRAY_SIZE__C] = pvArray.Wattage__c;
                        pvArrayFields[NUMBER_OF_PANELS__C] = pvArray.Number_of_Panels__c;
                        pvArrayFields[SELECTED_EQUIPMENT__C] = this.selectedPVModule.Id;
                        pvArrayFields[TSRF__C] = pvArray.TSRF__c;
                        pvArrayFields[PV_SYSTEM__C] = pvSystemId;

                        createPvArray({
                            changes: pvArrayFields
                        })
                            .then(pvArrayId => {
                                this.showToast('success', `Successfully saved pv array ${pvArrayId} associated with system`);
                            })
                            .catch((e) => {
                                console.log(JSON.stringify(e, undefined, 2));
                                this.showToast('error', 'Error creating pv array');
                            })
                    });
                })
                .catch((e) => {
                    console.log(JSON.stringify(e, undefined, 2));
                    this.showToast('error', 'Error creating or updating pv system');
                });

            

            // this.proposedOffsetObj.pvArrays.map(pvArray => {
            //     this.opportunity[pvArray.numberOfPanelsFieldName] = pvArray.numberOfPanels;
            // });
            
            // update opportunity
        //     const fields = {};
        //     fields[ARRAY_1_NUMBER_OF_PANELS.fieldApiName] = this.proposedOffsetObj.pvArrays[0].numberOfPanels;
        //     fields[ARRAY_2_NUMBER_OF_PANELS.fieldApiName] = this.proposedOffsetObj.pvArrays[1].numberOfPanels;
        //     fields[ARRAY_3_NUMBER_OF_PANELS.fieldApiName] = this.proposedOffsetObj.pvArrays[2].numberOfPanels;
        //     fields[ARRAY_4_NUMBER_OF_PANELS.fieldApiName] = this.proposedOffsetObj.pvArrays[3].numberOfPanels;
        //     fields[PROPOSED_WEIGHTED_TSRF.fieldApiName]   = this.proposedOffsetObj.proposedOffset;
            
        //     updateOpportunity({
        //         opportunityId: this.opportunityId,
        //         changes: fields
        //     })
        //         .then(() => {
        //             // success msg
        //             this.showToast('success', 'Successfully saved proposed offset');
        //         })
        //         .catch(error => {
        //             this.showToast('error', 'Error saving proposed offset');
        //         });
        }
    }

    showToast(variant, message) {
        const toast = new ShowToastEvent({
            title: variant.charAt(0).toUpperCase() + variant.slice(1),
            message,
            variant
        })
        this.dispatchEvent(toast);
    }

    /**
     * TODO:
     * - Active array checking?
     */
}
