@isTest
public class SystemOptimizerControllerTest {

    // @isTest static void GetAppointments(){
    //     String userId = UserInfo.getUserId();

    //     Id oRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Venture Commercial').getRecordTypeId();
    //     Opportunity myOpportunity = new Opportunity(Name='Test Opportunity', StageName='Closed Won', Approved__c = true, CloseDate=System.Today(), RecordTypeid=oRecordTypeId);
    //     insert myOpportunity;

    //     Site_Assessment__c siteAssessment = new Site_Assessment__c(Opportunity__c=myOpportunity.id);
    //     insert siteAssessment;

    //     Event eventOne = new Event(OwnerId=userId, DurationInMinutes=60, ActivityDateTime=DateTime.newInstance(2019, 08, 29), WhatId=siteAssessment.id);
    //     Event eventTwo = new Event(OwnerId=userId, DurationInMinutes=60, ActivityDateTime=DateTime.newInstance(2019, 08, 27), WhatId=siteAssessment.id);
    //     insert eventOne;
    //     insert eventTwo;

    //     Test.startTest();
    //     List<Site_Assessment__c> appointments = SystemOptimizerTest.GetAppointments();
    //     Test.stopTest();

    //     system.assertEquals(appointments.size(), 2);
    // }
}