public with sharing class SystemOptimizerController {

    @AuraEnabled(Cacheable=true)
    public static List<Allowed_Array__c> getAllowedArrays(String accountId) {
        List<Allowed_Array__c> allowedArrays = new List<Allowed_Array__c>();

        System.debug('Account Id:');
        System.debug(accountId);

        for (Site__c site: [SELECT Id, Account__c FROM Site__c WHERE Account__c = :accountId]) {
            System.debug('Site:');
            System.debug(site.Id);

            for (Allowed_Array__c allowedArray: [SELECT Id, Site__c, Name, Number_of_Panels__c, TSRF__c FROM Allowed_Array__c WHERE Site__c = :site.Id ORDER BY TSRF__c ASC]) {
                System.debug('Allowed array:');
                System.debug(allowedArray.Id);
                System.debug(allowedArray.Name);
                allowedArrays.add(allowedArray);
            }
        }

        return allowedArrays;
    }

    @AuraEnabled(Cacheable=true)
    public static Opportunity getOpportunityFields(String opportunityId){
        Opportunity opportunity = new Opportunity();

        opportunity = [
            SELECT
                Id,
                Production_Factor__C,
                Proposed_Weighted_TSRF__C,
                PF_Regional_Adjustment__C,
                Regional_Weighted_TSRF_Floor__c,
                Usage__c,
                Desired_Offset__c
            FROM 
                Opportunity 
            WHERE
                Id = :opportunityId
        ];

        return opportunity;
    }

    @AuraEnabled(Cacheable=true)
    public static string getSiteId(String accountId){
        Site__c site = [SELECT Id, Account__c FROM Site__c WHERE Account__c = :accountId LIMIT 1];

        return site.Id;
    }

    @AuraEnabled(Cacheable=true)
    public static List<PV_Modules__c> getPVModules() {
        List<PV_Modules__c> pvModules = [
            SELECT 
                Id,
                Manufacturer__c,
                PTC_Rating__c,
                Name,
                Wattage__c ,
                Active__c
            FROM 
                PV_Modules__c
            WHERE
                Active__c = True
            ORDER BY
                Name
            DESC 
        ];

        System.debug('PV Modules:');
        System.debug(pvModules);

        return pvModules;
    }

    @AuraEnabled
    public static String createOrUpdatePvSystem(String quoteId, Map<String, Object> changes){
        String soqlString = generateSoqlStringForUpdate('PV_System__c', 'Quote__r.Id', quoteId, changes);
 
        System.debug('createOrUpdatePvSystem soqlString:');
        System.debug(soqlString);
        PV_System__c[] existingPvSystemArr = Database.query(soqlString);
        PV_System__c pvSystem;

        System.debug(existingPvSystemArr);

        if(existingPvSystemArr.size() > 0) {
            System.debug('existingPvSystem');
            pvSystem = new PV_System__c();

            for (String key: changes.keySet()) {
                System.debug(key);
                System.debug(changes.get(key));
                if(key != 'Account__c') {
                    pvSystem.put(key, changes.get(key));
                }
            }
            pvSystem.put('Id', existingPvSystemArr[0].Id);
            System.debug(pvSystem);
 
            try {
                update pvSystem;
            } catch(DmlException e) {
                System.debug('error updating pv system');
                System.debug(e);
            }

            // delete arrays associated to pv system
            List<PV_Array__c> pvArrays = new List<PV_Array__c>();
        
            pvArrays = [
                SELECT
                    Id,
                    PV_System__r.Id
                FROM
                    PV_Array__c
                WHERE
                    PV_System__r.Id = :pvSystem.Id
            ];

            try {
                delete pvArrays;
                return pvSystem.Id;
            } catch(DmlException e) {
                System.debug('error deleting associated pv arrays');
                System.debug(e);
                throw e;
            }

        } else {
            System.debug('notExistingPvSystem');
            pvSystem = (PV_System__c)populateObjectForUpdate(new PV_System__c(), changes);

            try {
                insert pvSystem;
                return pvSystem.Id;
            } catch(DmlException e) {
                System.debug('error inserting new pv system');
                System.debug(e);
                throw e;
            }
        }
    }

    private static String generateSoqlStringForUpdate(String objectForUpdate, String matchField, String id, Map<String, Object> changes) {
        Integer keyCounter = 0;
        String soqlString = 'SELECT Id, ';
        for (String key : changes.keySet()) {
            keyCounter++;

            if(key != '')
            soqlString += key;

            if(keyCounter < changes.size()) {
                soqlString += ', ';
            } else {
                soqlString += ' ';
            }
        }
        soqlString += 'FROM ' + objectForUpdate + ' WHERE ' + matchField + ' = \'' + id + '\' FOR UPDATE';

        return soqlString;
    }

    private static SObject populateObjectForUpdate(SObject objectForUpdate, Map<String, Object> changes) {
        System.debug(objectForUpdate);
        for (String key: changes.keySet()) {
            System.debug(key);
            System.debug(changes.get(key));
            objectForUpdate.put(key, changes.get(key));
        }

        return objectForUpdate;
    }
}