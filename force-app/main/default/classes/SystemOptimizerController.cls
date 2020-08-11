public with sharing class SystemOptimizerController {

    @AuraEnabled(Cacheable=true)
    public static List<Allowed_Array__c> getAllowedArrays(String accountId) {
        List<Allowed_Array__c> allowedArrays = new List<Allowed_Array__c>();

        System.debug('Account Id:');
        System.debug(accountId);

        for (Site__c site: [SELECT Id, Account__c FROM Site__c WHERE Account__c = :accountId]) {
            System.debug('Site:');
            System.debug(site.Id);

            for (Allowed_Array__c allowedArray: [SELECT Id, Site__c, Name, Number_of_Panels__c, TSRF__c FROM Allowed_Array__c WHERE Site__c = :site.Id ORDER BY TSRF__c DESC]) {
                System.debug('Allowed array:');
                System.debug(allowedArray.Id);
                System.debug(allowedArray.Name);
                allowedArrays.add(allowedArray);
            }
        }

        return allowedArrays;
    }

    @AuraEnabled(Cacheable=true)
    public static List<PV_Modules__c> getPVModules() {
        List<PV_Modules__c> pvModules = [
            SELECT 
                Id,
                Manufacturer__c,
                PTC_Rating__c,
                Name,
                Wattage__c 
            FROM 
                PV_Modules__c
            ORDER BY
                Name
            DESC 
        ];

        System.debug('PV Modules:');
        System.debug(pvModules);

        return pvModules;
    }

    @AuraEnabled
    public static void updateOpportunity(String opportunityId, Map<String, Object> changes) {

        System.debug(opportunityId);
        System.debug(changes);

        Integer keyCounter = 0;
        String soqlString = 'SELECT Id, ';
        for (String key : changes.keySet()) {
            keyCounter++;
            soqlString += key;

            if(keyCounter < changes.size()) {
                soqlString += ', ';
            } else {
                soqlString += ' ';
            }
        }
        soqlString += 'FROM Opportunity WHERE Id = \'' + opportunityId + '\' FOR UPDATE';
        
        Opportunity opportunityToUpdate = Database.query(soqlString);
        System.debug(opportunityToUpdate);
        for (String key: changes.keySet()) {
            System.debug(key);
            System.debug(changes.get(key));
            opportunityToUpdate.put(key, changes.get(key));
        }
        update opportunityToUpdate;
    }
}