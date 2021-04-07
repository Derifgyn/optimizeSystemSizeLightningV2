@isTest
public class SystemOptimizerControllerTest {
    static Account configureAccount() {
        String userId = UserInfo.getUserId();

        Zip_Code__c zipCode = new Zip_Code__c(
        	NYC_Borough__c = 'Brooklyn',
            State__c = 'NY'
        );
        insert zipCode;
        
        Account acct = new Account(
            Zip_Code__c = zipCode.Id,
            Name = 'Test Acct',
            RecordTypeId = '01261000000REeEAAW'
        );
        insert acct;
        
        return acct;
    }

    @isTest static void getAllowedArraysOrderedByTSRF() {
        Account acct = configureAccount();

        Site__c site = new Site__c(
            Account__c = acct.Id
        );
        insert site;
        
        Allowed_Array__c allowedArrayOne = new Allowed_Array__c(
            Site__c = site.Id,
            Number_of_Panels__c = 20,
            TSRF__c = 75
        );
        insert allowedArrayOne;

        Allowed_Array__c allowedArrayTwo = new Allowed_Array__c(
            Site__c = site.Id,
            Number_of_Panels__c = 15,
            TSRF__c = 65
        );
        insert allowedArrayTwo;

        Test.startTest();
        List<Allowed_Array__c> allowedArrays = SystemOptimizerController.getAllowedArrays(acct.Id);
        Test.stopTest();

        system.assertEquals(allowedArrays.size(), 2);
        system.assertEquals(allowedArrays.get(0).TSRF__c, 65);
    }

    @isTest static void getSiteId() {
        Account acct = configureAccount();

        Site__c site = new Site__c(
            Account__c = acct.Id
        );
        insert site;

        Test.startTest();
        String siteId = SystemOptimizerController.getSiteId(acct.Id);
        Test.stopTest();

        system.assertEquals(siteId,  site.Id);
    }

    @isTest static void getOpportunityFields() {
        Account acct = configureAccount();

        Id oRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Venture Commercial').getRecordTypeId();
        Opportunity testOpportunity = new Opportunity(
            Name='Test Opportunity', 
            StageName='Closed Won', 
            Approved__c = true, 
            CloseDate = System.Today(), 
            RecordTypeid = oRecordTypeId,
            AccountId = acct.Id
        );
        insert testOpportunity;

        Test.startTest();
        Opportunity returnedOpportunity = SystemOptimizerController.getOpportunityFields(testOpportunity.Id);
        Test.stopTest();

        system.assertEquals(returnedOpportunity.Id, testOpportunity.Id);
    }

    @isTest static void onlyGetActivePvModules() {
        String userId = UserInfo.getUserId();

        PV_Modules__c pvModuleActive = new PV_Modules__c(
            Active__c = True,
        	Manufacturer__c = 'LG Electronics',
            PTC_Rating__c = 328,
            Name = 'CCC',
            Wattage__c = 350  
        );
        
        insert pvModuleActive;

        PV_Modules__c pvModuleInactive = new PV_Modules__c(
            Active__c = False,
        	Manufacturer__c = 'LG Electronics',
            PTC_Rating__c = 328,
            Name = 'BBB',
            Wattage__c = 350  
        );
        
        insert pvModuleInactive;

        Test.startTest();
        List<PV_Modules__c> pvModules = SystemOptimizerController.getPVModules();
        Test.stopTest();

        system.assertEquals(pvModules.size(), 1);
        system.assertEquals(pvModules.get(0).Name, 'CCC');
    }

    @isTest static void orderPvModulesByName() {
        String userId = UserInfo.getUserId();

        PV_Modules__c pvModuleB = new PV_Modules__c(
            Active__c = True,
        	Manufacturer__c = 'LG Electronics',
            PTC_Rating__c = 328,
            Name = 'BBB',
            Wattage__c = 350  
        );
        
        insert pvModuleB;

        PV_Modules__c pvModuleA = new PV_Modules__c(
            Active__c = True,
        	Manufacturer__c = 'LG Electronics',
            PTC_Rating__c = 328,
            Name = 'AAA',
            Wattage__c = 350  
        );
        
        insert pvModuleA;

        Test.startTest();
        List<PV_Modules__c> pvModules = SystemOptimizerController.getPVModules();
        Test.stopTest();

        system.assertEquals(pvModules.size(), 2);
        system.assertEquals(pvModules.get(0).Name, 'BBB');
        system.assertEquals(pvModules.get(1).Name, 'AAA');
    }

    @isTest static void createNewPVSystem() {
        String userId = UserInfo.getUserId();
        Account acct = configureAccount();

        PV_Modules__c pvModule = new PV_Modules__c(
            Active__c = True,
        	Manufacturer__c = 'LG Electronics',
            PTC_Rating__c = 328,
            Name = 'CCC',
            Wattage__c = 350  
        );
        insert pvModule;

        Id oRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Venture Commercial').getRecordTypeId();
        Opportunity testOpportunity = new Opportunity(
            Name='Test Opportunity', 
            StageName='Closed Won', 
            Approved__c = true, 
            CloseDate = System.Today(), 
            RecordTypeid = oRecordTypeId,
            AccountId = acct.Id
        );
        insert testOpportunity;

        Quote quote = new Quote(
            Name='Test Quote',
            OpportunityId = testOpportunity.Id,
            Finance__c = False
        );
        insert quote;

        Map<String, Object> changes = new Map<String, Object>();
        changes.put('PV_Modules__c', pvModule.Id);
        changes.put('Quote__c', quote.Id);
        changes.put('Account__c', acct.Id);
        changes.put('Weighted_TSRF__c', 50);

        Test.startTest();
        String pvSystemId = SystemOptimizerController.createOrUpdatePvSystem(quote.Id, changes);
        Test.stopTest();

        PV_System__c pvSystem = [SELECT Id FROM PV_System__c WHERE Id = :pvSystemId];
        system.assertEquals(pvSystem.Id, pvSystemId);
    }

    // @isTest static void updatePvSystem() {
    //     String userId = UserInfo.getUserId();
    //     Account acct = configureAccount();

    //     PV_Modules__c pvModule = new PV_Modules__c(
    //         Active__c = True,
    //     	Manufacturer__c = 'LG Electronics',
    //         PTC_Rating__c = 328,
    //         Name = 'CCC',
    //         Wattage__c = 350  
    //     );
    //     insert pvModule;

    //     Id oRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Venture Commercial').getRecordTypeId();
    //     Opportunity testOpportunity = new Opportunity(
    //         Name='Test Opportunity', 
    //         StageName='Closed Won', 
    //         Approved__c = true, 
    //         CloseDate = System.Today(), 
    //         RecordTypeid = oRecordTypeId,
    //         AccountId = acct.Id
    //     );
    //     insert testOpportunity;

    //     Quote quote = new Quote(
    //         Name='Test Quote',
    //         OpportunityId = testOpportunity.Id,
    //         Finance__c = False
    //     );
    //     insert quote;

    //     PV_System__c pvSystem = new PV_System__c(
    //         PV_Modules__c = pvModule.Id,
    //         Quote__c = quote.Id,
    //         Account__c = acct.Id,
    //         Weighted_TSRF__c = 50,
    //         Status__c = 'Proposed'
    //     );
    //     insert pvSystem;

    //     Map<String, Object> changes = new Map<String, Object>();
    //     changes.put('PV_Modules__c', pvModule.Id);
    //     changes.put('Quote__c', quote.Id);
    //     changes.put('Account__c', acct.Id);
    //     changes.put('Weighted_TSRF__c', 60);
    //     changes.put('Status__c', 'Proposed');

    //     Test.startTest();
    //     String pvSystemId = SystemOptimizerController.createOrUpdatePvSystem(quote.Id, changes);
        
    //     Test.stopTest();

    //     PV_System__c retreivedpvSystem = [SELECT Id, Weighted_TSRF__c FROM PV_System__c WHERE Id = :pvSystemId];
    //     system.assertEquals(retreivedpvSystem.Weighted_TSRF__c, 60);
    // }
}