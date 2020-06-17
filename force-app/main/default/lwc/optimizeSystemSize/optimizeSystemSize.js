/* eslint-disable no-console */
import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'

import getOpportunity from '@salesforce/apex/OptimizeSystemSizeLightningController.getOpportunity';
import getPVModule from '@salesforce/apex/OptimizeSystemSizeLightningController.getPVModule';

export default class OptimizeSystemSize extends LightningElement {
    @track opportunity;
    @track selectedPVModule;
    @track equipmentSelection = '';
    
    @track proposedOffset;

    @track maxNumArrays;
    @track maxNumPanels;
    @track currentNumPanels;

    @track error = false;
    @track generatingProposal = false;
    @track validProposal = false;
    @track notCalcedProposal = true;

    @api recordId;

    @wire(
        getOpportunity,
        {
            opportunityId: '$recordId'
        }
    )
    opportunityHandler({error, data}) {
        if (data) {
            console.log(JSON.stringify(data, undefined, 2));
            this.opportunity = Object.assign({}, data);

            this.proposedOffset = 0;
            this.maxNumArrays = 4;
            this.maxNumPanels = 0;
            this.currentNumPanels = 0;
            this.proposedOffset = {
                proposedOffset: 0,
                pvArrays: undefined,
                weightedTSRF: 0
            };

            this.mapPVModule();


        } else if (error) {
            console.log('Error getting opportunity data test change:');
            console.log(JSON.stringify(error, undefined, 2));
        }
    }

    generateProposal() {
        this.notCalcedProposal = false;
        this.generatingProposal = true;
        this.proposedOffsetObj = {
            proposedOffset: 0,
            pvArrays: this.mapPVArrays(),
            weightedTSRF: 0
        };

        if (this.checkInputValid()) {
            console.log(JSON.stringify('input valid', 0, 2));
            console.log('this.totalUsage:', this.totalUsage);

            this.proposedOffsetObj = this.generateProposedOffset(0, this.proposedOffsetObj); 

            this.validProposal = this.checkProposedOffsetValid();
        }

        this.generatingProposal = false;
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
            let inactivePVArrays = 0;
            let invalidTSRFValue = false;

            console.log(JSON.stringify('this.proposedOffsetObj.pvArrays', undefined, 2));
            console.log(JSON.stringify(this.proposedOffsetObj.pvArrays, undefined, 2));

            this.proposedOffsetObj.pvArrays
                .map(pvArray => {
                    if (pvArray.active == 'No' || (pvArray.active == 'Yes' && pvArray.numberOfPanels == 0)) {
                        inactivePVArrays += 1;
                    }
        
                    if (pvArray.active == 'Yes' && pvArray.numberOfPanels > 0 && (pvArray.tsrf <= 0 || pvArray.tsrf > 100 || pvArray.tsrf == undefined)) {
                        invalidTSRFValue = true;
                    }
                });

            if (inactivePVArrays > this.maxNumArrays) {
                // Show error
                this.showToast('error', 'No active arrays, please set at least one array to active with 1 or more panels');
                valid = false;
            }

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

    // Grab PV Module either from opportunity or default to LG Electronics 350, then map to PV Module object
    mapPVModule() {
        this.equipmentSelection = '';
        
        if(this.opportunity.Equipment_Selection__c != null) {
            this.equipmentSelection = this.opportunity.Equipment_Selection__c;
        } else {
            this.equipmentSelection = 'LG Electronics 350';
            this.opportunity.Equipment_Selection__C = this.equipmentSelection;
        }
        
        getPVModule({
            equipmentSelection: this.equipmentSelection 
        })
            .then(data => {
                this.selectedPVModule = data;
            })
            .catch(error => {
                this.error = true;
            });
    }

    // Loop through opportunity fields to generate list of pvArrays 
    mapPVArrays() {
        this.maxNumPanels = 0;
        this.currentNumPanels = 0;
        let pvArrays = [];

        for (let i = 0; i < this.maxNumArrays; i++) { 
            let pvArray = {
                arrayNumber: i + 1,
                active: this.opportunity[`Array_${i + 1}__c`],
                numberOfPanels: this.opportunity[`Array_${i + 1}_Number_of_Panels__c`],
                numberOfPanelsFieldName: `Array_${i + 1}_TSRF_Input__c`,
                tsrf: this.opportunity[`Array_${i + 1}_TSRF_Input__c`]
            }

            pvArrays.push(pvArray);

            console.log(JSON.stringify('in mapPVArrays()'))
            console.log(JSON.stringify(pvArray));
            if (pvArray.active == 'Yes') { 
                this.maxNumPanels += pvArray.numberOfPanels;
                this.currentNumPanels += pvArray.numberOfPanels;
            }
        }

        pvArrays.sort((a, b) =>
           a.tsrf - b.tsrf
        );

        return pvArrays;
    }

    generateProposedOffset(attemptNum, lpoToBeCopied) {
        let lastProposedOffsetObj = Object.assign({}, lpoToBeCopied);
        let totalProduction = 0;
        let proposedOffset = 0;
        let weightedTSRF = 0;
        let panelRemoved = false;

        let pvArrays = lpoToBeCopied.pvArrays.filter(pvArray => pvArray.active == 'Yes');

        pvArrays
            .forEach(pvArray => {
                if (attemptNum > 0 && panelRemoved != true && pvArray.numberOfPanels - 1 >= 0) {
                    pvArray.numberOfPanels -= 1;
                    this.currentNumPanels -= 1;   
                }

                // calc array tsrf prod factor
                let tsrfProductionFactor = (this.opportunity.Production_Factor__c * pvArray.tsrf) - this.opportunity.PF_Regional_Adjustment__c;

                // multiply tsrf prod factor by module wattage and array num panels, add to sum
                totalProduction += pvArray.numberOfPanels * this.selectedPVModule.Wattage__c * tsrfProductionFactor;

                // multiply array tsrf by array number of panels, add to sum
                weightedTSRF += pvArray.tsrf * pvArray.numberOfPanels;
            });

        // calc avg of weighted tsrf sum
        weightedTSRF = this.currentNumPanels > 0 ? weightedTSRF / this.currentNumPanels : 0;
        // divide calculated total prod by user input total usage
        proposedOffset = totalProduction / this.totalUsage;
        console.log('proposedOffset:', proposedOffset);

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
        if (this.validProposal) {
            
            this.proposedOffset.pvArrays.map(pvArray => {
                this.opportunity[pvArray.numberOfPanelsFieldName] = pvArray.numberOfPanels;
            });
            
            // update opportunity
            
            // success msg
            this.showToast('success', 'Successfully saved proposed offset');
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
     * NOTES:
     * 
     * Set equipment selection back to opportunity on dropdown selection
     * Equipment selection on change event
     */
}
