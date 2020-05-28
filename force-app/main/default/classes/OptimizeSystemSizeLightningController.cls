public with sharing class OptimizeSystemSizeLightningController {

    @AuraEnabled(Cacheable=true)
    public static Opportunity getOpportunity(String opportunityId) {
        String userId = UserInfo.getUserId();

        System.debug('Opportunity Id:');
        System.debug(opportunityId);

        Opportunity opportunity = [
            SELECT 
                Array_1__c,
                Array_2__c,
                Array_3__c,
                Array_4__c,
                    
                Array_1_Number_of_Panels__c,
                Array_2_Number_of_Panels__c,
                Array_3_Number_of_Panels__c,
                Array_4_Number_of_Panels__c,            
                    
                Array_1_TSRF_Input__c,
                Array_2_TSRF_Input__c,
                Array_3_TSRF_Input__c,
                Array_4_TSRF_Input__c,
                    
                Production_Factor__c,
                Proposed_Weighted_TSRF__c,
                PF_Regional_Adjustment__c,
                Desired_Offset__c,
                Usage__c,
                Regional_Weighted_TSRF_Floor__c,
                Equipment_Selection__c
            FROM 
                Opportunity 
            WHERE 
                Id = :opportunityId
            LIMIT
                1
        ];

        System.debug('Opportunity:');
        System.debug(opportunity);

        return opportunity;
    }

    @AuraEnabled(Cacheable=true)
    public static PV_MODULES__C getPVModule(String equipmentSelection) {
        String userId = UserInfo.getUserId();

        System.debug('Equipment Selection:');
        System.debug(equipmentSelection);

        PV_MODULES__C pvModule = [
            SELECT 
                Id,
                Manufacturer__c,
                PTC_Rating__c,
                Name,
                Wattage__c 
            FROM 
                PV_MODULES__C
            WHERE 
                Name = :equipmentSelection 
            LIMIT 
                1
        ];

        System.debug('PV Module:');
        System.debug(pvModule);

        return pvModule;

    }
}