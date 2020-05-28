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
    @track pvArrays;

    @track error = false;

    @api recordId;

    @wire(
        getOpportunity,
        {
            opportunityId: '$recordId'
        }
    )
    opportunityHandler({error, data}) {
        console.log('in here 1259');

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
        this.mapPVArrays();

        if (this.checkInputValid()) {
            this.proposedOffsetObj = this.generateProposedOffset(0, this.proposedOffsetObj); 

            this.checkProposedOffsetValid();
        }
    }

    // Perform input validity check before offset generation, and show relevant messages
    checkInputValid() {
        let valid = true;

        if (this.totalUsage < 0) {
            // Show error
            valid = false;
        }

        if (this.desiredOffset <= 0) {
            // Show error
            valid = false;
        }

        if (this.desiredOffset > 110) {
            // Show warning
        }

        if (this.selectedPVModule == undefined || this.selectedPVModule.Name == '') {
            // Show error
            valid = false;
        }

        if (valid) {
            let inactivePVArrays = 0;
            let invalidTSRFValue = false;

            this.pvArrays
                .map(pvArray => {
                    if (pvArray.active == 'No' || (pvArray.active == 'Yes' && pvArray.numberOfPanels == 0)) {
                        inactivePVArrays += 1;
                    }
        
                    if (pvArray.active == 'Yes' && pvArray.numberOfPanels > 0 ** (pvArray.tsrf <= 0 || pvArray.tsrf > 100 || pvArray.tsrf == undefined)) {
                        invalidTSRFValue = true;
                    }
                });

            if (inactivePVArrays > this.maxNumArrays) {
                // Show error
                valid = false;
            }

            if (invalidTSRFValue) {
                // Show error
                valid = false;
            }
        }

        return valid;
    }

    // Perform proposed offset check before returning, and show relevant messages
    checkProposedOffsetValid() {
        if (this.proposedOffsetObj.proposedOffset == -1) {
            // Show error
            return false;
        }

        if (this.proposedOffsetObj.weightedTSRF < this.opportunity.Regional_Weighted_TSRF_Floor__c) {
            // Show warning
        }

        return true;
    }

    // Grab PV Module either from opportunity or default to LG Electronics 350, then map to PV Module object
    mapPVModule() {
        this.equipmentSelection = '';
        
        if(this.opportunity.Equipment_Selection__c != null) {
            console.log('equipment selection not null');
            this.equipmentSelection = this.opportunity.Equipment_Selection__c;
        } else {
            console.log('equipment selection defaulting to LG Electronics 350');
            this.equipmentSelection = 'LG Electronics 350';
            this.opportunity.Equipment_Selection__C = this.equipmentSelection;
        }
        
        getPVModule({
            equipmentSelection: this.equipmentSelection 
        })
            .then(data => {
                console.log(JSON.stringify(data, undefined, 2));
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
        this.pvArrays = [];

        for (let i = 0; i < this.maxNumArrays; i++) { 
            let pvArray = {
                arrayNumber: i + 1,
                active: this.opportunity[`Array_${i + 1}__c`],
                numberOfPanels: this.opportunity[`Array_${i + 1}_Number_of_Panels__c`],
                numberOfPanelsFieldName: `Array_${i + 1}_TSRF_Input__c`,
                tsrf: this.opportunity[`Array_${i + 1}_TSRF_Input__c`]
            }

            this.pvArrays.push(pvArray);

            if (pvArray.active == 'Yes') {
                this.maxNumPanels += pvArray.numberOfPanels;
                this.currentNumPanels += pvArray.currentNumPanels;
            }
        }

        this.pvArrays.sort((a, b) =>
           a.tsrf - b.tsrf
        );
    }

    generateProposedOffset(attemptNum, lastProposedOffsetObj) {
        let totalProduction = 0;
        let proposedOffset = 0;
        let weightedTSRF = 0;
        panelRemoved = false;

        this.pvArrays
            .filter(pvArray => pvArray.active == 'Yes')
            .map(pvArray => {
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
        if (this.checkProposedOffsetValid()) {
            // success msg

            this.pvArrays.map(pvArray => {
                this.opportunity[pvArray.numberOfPanelsFieldName] = pvArray.numberOfPanels;
            });

            // update opportunity

            // redirect if necessary
        }
    }

    cancel() {
        // redirect if necessary
    }


    /**
     * NOTES:
     * 
     * Set equipment selection back to opportunity on dropdown selection
     * Equipment selection on change event
     */
}
