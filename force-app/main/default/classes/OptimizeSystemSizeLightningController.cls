public with sharing class OptimizeSystemSizeLightningController {

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